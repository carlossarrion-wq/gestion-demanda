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
    const projectId = pathParameters.id;
    if (method === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,x-user-team',
            },
            body: '',
        };
    }
    try {
        const userTeam = event.headers['x-user-team'] || event.headers['X-User-Team'];
        console.log('User team from headers:', userTeam);
        switch (method) {
            case 'GET':
                if (projectId) {
                    return await getProjectById(projectId);
                }
                else {
                    console.log('Calling listProjects with userTeam:', userTeam);
                    return await listProjects(event.queryStringParameters || {}, userTeam);
                }
            case 'POST':
                return await createProject(event.body);
            case 'PUT':
                if (!projectId) {
                    return (0, response_1.errorResponse)('Project ID is required for update', 400);
                }
                return await updateProject(projectId, event.body);
            case 'DELETE':
                if (!projectId) {
                    return (0, response_1.errorResponse)('Project ID is required for delete', 400);
                }
                return await deleteProject(projectId);
            default:
                return (0, response_1.errorResponse)(`Method ${method} not allowed`, 405);
        }
    }
    catch (error) {
        console.error('Error in projectsHandler:', error);
        const { statusCode, message } = (0, errors_1.handleError)(error);
        return (0, response_1.errorResponse)(message, statusCode, error);
    }
};
exports.handler = handler;
async function listProjects(queryParams, userTeam) {
    const { type, status, domain, priority } = queryParams;
    const projects = await prisma_1.prisma.project.findMany({
        where: {
            ...(type && { type }),
            ...(status && { status: parseInt(status, 10) }),
            ...(domain && { domain: parseInt(domain, 10) }),
            ...(priority && { priority }),
            ...(userTeam && { team: userTeam }),
        },
        include: {
            projectSkillBreakdowns: {
                select: {
                    id: true,
                    skillName: true,
                    month: true,
                    year: true,
                    hours: true,
                },
                orderBy: [
                    { year: 'asc' },
                    { month: 'asc' },
                ],
            },
            assignments: {
                select: {
                    id: true,
                    resourceId: true,
                    skillName: true,
                    month: true,
                    year: true,
                    hours: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    const projectsWithTotals = projects.map((project) => {
        const totalHours = project.projectSkillBreakdowns.reduce((sum, breakdown) => sum + Number(breakdown.hours), 0);
        const assignedHours = project.assignments.reduce((sum, assignment) => sum + Number(assignment.hours), 0);
        return {
            ...project,
            totalCommittedHours: totalHours,
            totalAssignedHours: assignedHours,
            assignedResourcesCount: new Set(project.assignments.map((a) => a.resourceId)).size,
        };
    });
    return (0, response_1.successResponse)({
        projects: projectsWithTotals,
        count: projectsWithTotals.length,
    });
}
async function getProjectById(projectId) {
    try {
        (0, validators_1.validateUUID)(projectId, 'projectId');
    }
    catch (error) {
        if (error instanceof errors_1.ValidationError) {
            return (0, response_1.errorResponse)(error.message, 400);
        }
        throw error;
    }
    const project = await prisma_1.prisma.project.findUnique({
        where: { id: projectId },
        include: {
            projectSkillBreakdowns: {
                select: {
                    id: true,
                    skillName: true,
                    month: true,
                    year: true,
                    hours: true,
                },
                orderBy: [
                    { year: 'asc' },
                    { month: 'asc' },
                ],
            },
            assignments: {
                include: {
                    resource: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: [
                    { year: 'asc' },
                    { month: 'asc' },
                ],
            },
        },
    });
    if (!project) {
        throw new errors_1.NotFoundError('Project', projectId);
    }
    const totalCommittedHours = project.projectSkillBreakdowns.reduce((sum, breakdown) => sum + Number(breakdown.hours), 0);
    const totalAssignedHours = project.assignments.reduce((sum, assignment) => sum + Number(assignment.hours), 0);
    const assignedResourcesCount = new Set(project.assignments.map((a) => a.resourceId)).size;
    return (0, response_1.successResponse)({
        ...project,
        metrics: {
            totalCommittedHours,
            totalAssignedHours,
            assignedResourcesCount,
            completionPercentage: totalCommittedHours > 0
                ? Math.round((totalAssignedHours / totalCommittedHours) * 100)
                : 0,
        },
    });
}
async function createProject(body) {
    if (!body) {
        return (0, response_1.errorResponse)('Request body is required', 400);
    }
    const data = JSON.parse(body);
    try {
        (0, validators_1.validateProjectData)(data);
    }
    catch (error) {
        if (error instanceof errors_1.ValidationError) {
            return (0, response_1.errorResponse)(error.message, 400, { errors: error.validationErrors });
        }
        throw error;
    }
    const existingProject = await prisma_1.prisma.project.findUnique({
        where: { code: data.code },
    });
    if (existingProject) {
        return (0, response_1.errorResponse)(`Project with code '${data.code}' already exists`, 409);
    }
    const project = await prisma_1.prisma.project.create({
        data: {
            code: data.code,
            title: data.title,
            description: data.description || null,
            type: data.type && data.type.trim() !== '' ? data.type : null,
            priority: data.priority,
            startDate: data.startDate ? new Date(data.startDate) : null,
            endDate: data.endDate ? new Date(data.endDate) : null,
            status: data.status,
            domain: data.domain,
            team: data.team,
        },
    });
    return (0, response_1.createdResponse)(project);
}
async function updateProject(projectId, body) {
    try {
        (0, validators_1.validateUUID)(projectId, 'projectId');
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
    try {
        (0, validators_1.validateProjectData)(data);
    }
    catch (error) {
        if (error instanceof errors_1.ValidationError) {
            return (0, response_1.errorResponse)(error.message, 400, { errors: error.validationErrors });
        }
        throw error;
    }
    const existingProject = await prisma_1.prisma.project.findUnique({
        where: { id: projectId },
    });
    if (!existingProject) {
        throw new errors_1.NotFoundError('Project', projectId);
    }
    if (data.code && data.code !== existingProject.code) {
        const projectWithCode = await prisma_1.prisma.project.findUnique({
            where: { code: data.code },
        });
        if (projectWithCode) {
            return (0, response_1.errorResponse)(`Project with code '${data.code}' already exists`, 409);
        }
    }
    const updatedProject = await prisma_1.prisma.project.update({
        where: { id: projectId },
        data: {
            ...(data.code && { code: data.code }),
            ...(data.title && { title: data.title }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.type && { type: data.type }),
            ...(data.priority && { priority: data.priority }),
            ...(data.startDate !== undefined && {
                startDate: data.startDate ? new Date(data.startDate) : null
            }),
            ...(data.endDate !== undefined && {
                endDate: data.endDate ? new Date(data.endDate) : null
            }),
            ...(data.status && { status: data.status }),
            ...(data.domain && { domain: data.domain }),
            ...(data.team && { team: data.team }),
        },
    });
    return (0, response_1.successResponse)(updatedProject);
}
async function deleteProject(projectId) {
    try {
        (0, validators_1.validateUUID)(projectId, 'projectId');
    }
    catch (error) {
        if (error instanceof errors_1.ValidationError) {
            return (0, response_1.errorResponse)(error.message, 400);
        }
        throw error;
    }
    const existingProject = await prisma_1.prisma.project.findUnique({
        where: { id: projectId },
    });
    if (!existingProject) {
        throw new errors_1.NotFoundError('Project', projectId);
    }
    await prisma_1.prisma.project.delete({
        where: { id: projectId },
    });
    return (0, response_1.noContentResponse)();
}
//# sourceMappingURL=projectsHandler.js.map