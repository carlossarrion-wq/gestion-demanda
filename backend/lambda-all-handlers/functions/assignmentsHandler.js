"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const prisma_1 = require("../lib/prisma");
const response_1 = require("../lib/response");
const errors_1 = require("../lib/errors");
const validators_1 = require("../lib/validators");
const handler = async (event) => {
    const method = event.httpMethod;
    const pathParameters = event.pathParameters || {};
    const assignmentId = pathParameters.id;
    try {
        if (method === 'OPTIONS') {
            return (0, response_1.optionsResponse)();
        }
        switch (method) {
            case 'GET':
                if (assignmentId) {
                    return await getAssignmentById(assignmentId);
                }
                else {
                    return await listAssignments(event.queryStringParameters || {});
                }
            case 'POST':
                return await createAssignment(event.body);
            case 'PUT':
                if (!assignmentId) {
                    return (0, response_1.errorResponse)('Assignment ID is required for update', 400);
                }
                return await updateAssignment(assignmentId, event.body);
            case 'DELETE':
                if (!assignmentId) {
                    return (0, response_1.errorResponse)('Assignment ID is required for delete', 400);
                }
                return await deleteAssignment(assignmentId);
            default:
                return (0, response_1.errorResponse)(`Method ${method} not allowed`, 405);
        }
    }
    catch (error) {
        console.error('Error in assignmentsHandler:', error);
        const { statusCode, message } = (0, errors_1.handleError)(error);
        return (0, response_1.errorResponse)(message, statusCode, error);
    }
};
exports.handler = handler;
async function listAssignments(queryParams) {
    const { projectId, resourceId, month, year, skillName } = queryParams;
    const assignments = await prisma_1.prisma.assignment.findMany({
        where: {
            ...(projectId && { projectId }),
            ...(resourceId && { resourceId }),
            ...(month && { month: parseInt(month, 10) }),
            ...(year && { year: parseInt(year, 10) }),
            ...(skillName && { skillName }),
        },
        include: {
            project: {
                select: {
                    id: true,
                    code: true,
                    title: true,
                    type: true,
                    priority: true,
                    status: true,
                },
            },
            resource: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                    email: true,
                    active: true,
                },
            },
        },
        orderBy: [
            { year: 'desc' },
            { month: 'desc' },
        ],
    });
    return (0, response_1.successResponse)({
        assignments,
        count: assignments.length,
    });
}
async function getAssignmentById(assignmentId) {
    try {
        (0, validators_1.validateUUID)(assignmentId, 'assignmentId');
    }
    catch (error) {
        if (error instanceof errors_1.ValidationError) {
            return (0, response_1.errorResponse)(error.message, 400);
        }
        throw error;
    }
    const assignment = await prisma_1.prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: {
            project: true,
            resource: {
                include: {
                    resourceSkills: true,
                },
            },
        },
    });
    if (!assignment) {
        throw new errors_1.NotFoundError('Assignment', assignmentId);
    }
    return (0, response_1.successResponse)(assignment);
}
async function createAssignment(body) {
    if (!body) {
        return (0, response_1.errorResponse)('Request body is required', 400);
    }
    const data = JSON.parse(body);
    if (!data.projectId) {
        return (0, response_1.errorResponse)('projectId is required', 400);
    }
    if (!data.title) {
        return (0, response_1.errorResponse)('title is required', 400);
    }
    const hasDate = !!data.date;
    const hasMonthYear = data.month && data.year;
    if (!hasDate && !hasMonthYear) {
        return (0, response_1.errorResponse)('Either date or (month and year) is required', 400);
    }
    if (!data.hours || data.hours <= 0) {
        return (0, response_1.errorResponse)('hours must be greater than 0', 400);
    }
    const project = await prisma_1.prisma.project.findUnique({
        where: { id: data.projectId },
    });
    if (!project) {
        return (0, response_1.errorResponse)(`Project with ID '${data.projectId}' not found`, 404);
    }
    let resource = null;
    if (data.resourceId) {
        resource = await prisma_1.prisma.resource.findUnique({
            where: { id: data.resourceId },
            include: {
                resourceSkills: true,
            },
        });
        if (!resource) {
            return (0, response_1.errorResponse)(`Resource with ID '${data.resourceId}' not found`, 404);
        }
        if (!resource.active) {
            return (0, response_1.errorResponse)('Cannot assign inactive resource to project', 400);
        }
        if (data.skillName) {
            const hasSkill = resource.resourceSkills.some((rs) => rs.skillName === data.skillName);
            if (!hasSkill) {
                throw new errors_1.BusinessRuleError(`Resource '${resource.name}' does not have the skill '${data.skillName}'`, 'RESOURCE_SKILL_MISMATCH');
            }
        }
        if (hasDate) {
            const assignmentDate = new Date(data.date);
            const existingDailyAssignments = await prisma_1.prisma.assignment.findMany({
                where: {
                    resourceId: data.resourceId,
                    date: assignmentDate,
                },
            });
            const assignedHoursToday = existingDailyAssignments.reduce((sum, assignment) => sum + Number(assignment.hours), 0);
            const dailyCapacity = 8;
            if (assignedHoursToday + data.hours > dailyCapacity) {
                throw new errors_1.BusinessRuleError(`Assignment would exceed daily resource capacity for ${assignmentDate.toISOString().split('T')[0]}. Available: ${dailyCapacity - assignedHoursToday} hours, Requested: ${data.hours} hours, Assigned: ${assignedHoursToday} hours`, 'DAILY_CAPACITY_EXCEEDED');
            }
        }
        else if (hasMonthYear) {
            const capacity = await prisma_1.prisma.capacity.findUnique({
                where: {
                    resourceId_month_year: {
                        resourceId: data.resourceId,
                        month: data.month,
                        year: data.year,
                    },
                },
            });
            const totalCapacity = capacity ? Number(capacity.totalHours) : resource.defaultCapacity;
            const existingAssignments = await prisma_1.prisma.assignment.findMany({
                where: {
                    resourceId: data.resourceId,
                    month: data.month,
                    year: data.year,
                },
            });
            const assignedHours = existingAssignments.reduce((sum, assignment) => sum + Number(assignment.hours), 0);
            if (assignedHours + data.hours > totalCapacity) {
                throw new errors_1.BusinessRuleError(`Assignment would exceed monthly resource capacity. Available: ${totalCapacity - assignedHours} hours, Requested: ${data.hours} hours`, 'CAPACITY_EXCEEDED');
            }
        }
    }
    const assignment = await prisma_1.prisma.assignment.create({
        data: {
            projectId: data.projectId,
            resourceId: data.resourceId || null,
            title: data.title,
            description: data.description || null,
            skillName: data.skillName || null,
            team: data.team || null,
            ...(hasDate && { date: new Date(data.date) }),
            ...(hasMonthYear && { month: data.month, year: data.year }),
            hours: data.hours,
        },
        include: {
            project: {
                select: {
                    id: true,
                    code: true,
                    title: true,
                },
            },
            resource: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                },
            },
        },
    });
    return (0, response_1.createdResponse)(assignment);
}
async function updateAssignment(assignmentId, body) {
    try {
        (0, validators_1.validateUUID)(assignmentId, 'assignmentId');
    }
    catch (error) {
        if (error instanceof errors_1.ValidationError) {
            return (0, response_1.errorResponse)(error.message, 400);
        }
        throw error;
    }
    if (!body) {
        return (0, response_1.errorResponse)('Request body is required', 400);
    }
    const data = JSON.parse(body);
    const existingAssignment = await prisma_1.prisma.assignment.findUnique({
        where: { id: assignmentId },
    });
    if (!existingAssignment) {
        throw new errors_1.NotFoundError('Assignment', assignmentId);
    }
    if (data.resourceId) {
        const resource = await prisma_1.prisma.resource.findUnique({
            where: { id: data.resourceId },
            include: {
                resourceSkills: true,
            },
        });
        if (!resource) {
            return (0, response_1.errorResponse)(`Resource with ID '${data.resourceId}' not found`, 404);
        }
        if (!resource.active) {
            return (0, response_1.errorResponse)('Cannot assign inactive resource to project', 400);
        }
        if (data.skillName) {
            const hasSkill = resource.resourceSkills.some((rs) => rs.skillName === data.skillName);
            if (!hasSkill) {
                throw new errors_1.BusinessRuleError(`Resource '${resource.name}' does not have the skill '${data.skillName}'`, 'RESOURCE_SKILL_MISMATCH');
            }
        }
    }
    const updatedAssignment = await prisma_1.prisma.assignment.update({
        where: { id: assignmentId },
        data: {
            ...(data.title && { title: data.title }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.skillName !== undefined && { skillName: data.skillName }),
            ...(data.month && { month: data.month }),
            ...(data.year && { year: data.year }),
            ...(data.hours && { hours: data.hours }),
            ...(data.resourceId !== undefined && { resourceId: data.resourceId }),
        },
        include: {
            project: {
                select: {
                    id: true,
                    code: true,
                    title: true,
                },
            },
            resource: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                },
            },
        },
    });
    return (0, response_1.successResponse)(updatedAssignment);
}
async function deleteAssignment(assignmentId) {
    try {
        (0, validators_1.validateUUID)(assignmentId, 'assignmentId');
    }
    catch (error) {
        if (error instanceof errors_1.ValidationError) {
            return (0, response_1.errorResponse)(error.message, 400);
        }
        throw error;
    }
    const existingAssignment = await prisma_1.prisma.assignment.findUnique({
        where: { id: assignmentId },
    });
    if (!existingAssignment) {
        throw new errors_1.NotFoundError('Assignment', assignmentId);
    }
    await prisma_1.prisma.assignment.delete({
        where: { id: assignmentId },
    });
    return (0, response_1.noContentResponse)();
}
//# sourceMappingURL=assignmentsHandler.js.map