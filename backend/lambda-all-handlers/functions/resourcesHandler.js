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
    const resourceId = pathParameters.id;
    if (method === 'OPTIONS') {
        return (0, response_1.optionsResponse)();
    }
    try {
        switch (method) {
            case 'GET':
                if (resourceId) {
                    return await getResourceById(resourceId);
                }
                else {
                    return await listResources(event.queryStringParameters || {});
                }
            case 'POST':
                return await createResource(event.body);
            case 'PUT':
                if (!resourceId) {
                    return (0, response_1.errorResponse)('Resource ID is required for update', 400);
                }
                return await updateResource(resourceId, event.body);
            default:
                return (0, response_1.errorResponse)(`Method ${method} not allowed`, 405);
        }
    }
    catch (error) {
        console.error('Error in resourcesHandler:', error);
        const { statusCode, message } = (0, errors_1.handleError)(error);
        return (0, response_1.errorResponse)(message, statusCode, error);
    }
};
exports.handler = handler;
async function listResources(queryParams) {
    const { active, skill, team } = queryParams;
    const resources = await prisma_1.prisma.resource.findMany({
        where: {
            ...(active !== undefined && { active: active === 'true' }),
            ...(team && { team }),
            ...(skill && {
                resourceSkills: {
                    some: {
                        skillName: skill,
                    },
                },
            }),
        },
        include: {
            resourceSkills: {
                select: {
                    skillName: true,
                    proficiency: true,
                },
            },
            assignments: {
                select: {
                    id: true,
                    projectId: true,
                    month: true,
                    year: true,
                    hours: true,
                },
            },
            capacities: {
                select: {
                    id: true,
                    month: true,
                    year: true,
                    totalHours: true,
                },
            },
        },
        orderBy: {
            name: 'asc',
        },
    });
    const resourcesWithMetrics = resources.map((resource) => {
        const totalAssignedHours = resource.assignments.reduce((sum, assignment) => sum + Number(assignment.hours), 0);
        return {
            ...resource,
            skillsCount: resource.resourceSkills.length,
            totalAssignedHours,
            activeProjectsCount: new Set(resource.assignments.map((a) => a.projectId)).size,
        };
    });
    return (0, response_1.successResponse)({
        resources: resourcesWithMetrics,
        count: resourcesWithMetrics.length,
    });
}
async function getResourceById(resourceId) {
    try {
        (0, validators_1.validateUUID)(resourceId, 'resourceId');
    }
    catch (error) {
        if (error instanceof errors_1.ValidationError) {
            return (0, response_1.errorResponse)(error.message, 400);
        }
        throw error;
    }
    const resource = await prisma_1.prisma.resource.findUnique({
        where: { id: resourceId },
        include: {
            resourceSkills: {
                select: {
                    skillName: true,
                    proficiency: true,
                },
            },
            assignments: {
                include: {
                    project: {
                        select: {
                            id: true,
                            code: true,
                            title: true,
                            type: true,
                            priority: true,
                        },
                    },
                },
                orderBy: [
                    { year: 'desc' },
                    { month: 'desc' },
                ],
            },
            capacities: {
                orderBy: [
                    { year: 'desc' },
                    { month: 'desc' },
                ],
            },
        },
    });
    if (!resource) {
        throw new errors_1.NotFoundError('Resource', resourceId);
    }
    const totalAssignedHours = resource.assignments.reduce((sum, assignment) => sum + Number(assignment.hours), 0);
    const activeProjectsCount = new Set(resource.assignments.map((a) => a.projectId)).size;
    return (0, response_1.successResponse)({
        ...resource,
        metrics: {
            totalAssignedHours,
            activeProjectsCount,
            skillsCount: resource.resourceSkills.length,
        },
    });
}
async function createResource(body) {
    if (!body) {
        return (0, response_1.errorResponse)('Request body is required', 400);
    }
    const data = JSON.parse(body);
    if (!data.code) {
        const nameParts = data.name.trim().split(' ');
        const initials = nameParts.map((part) => part.charAt(0).toUpperCase()).join('');
        const timestamp = Date.now().toString().slice(-4);
        data.code = `${initials}${timestamp}`;
    }
    try {
        (0, validators_1.validateResourceData)(data);
    }
    catch (error) {
        if (error instanceof errors_1.ValidationError) {
            return (0, response_1.errorResponse)(error.message, 400, { errors: error.validationErrors });
        }
        throw error;
    }
    let finalCode = data.code;
    let existingResource = await prisma_1.prisma.resource.findUnique({
        where: { code: finalCode },
    });
    let suffix = 1;
    while (existingResource) {
        finalCode = `${data.code}${suffix}`;
        existingResource = await prisma_1.prisma.resource.findUnique({
            where: { code: finalCode },
        });
        suffix++;
    }
    const resource = await prisma_1.prisma.resource.create({
        data: {
            code: finalCode,
            name: data.name,
            email: data.email || null,
            team: data.team,
            defaultCapacity: data.defaultCapacity || 160,
            active: data.active !== undefined ? data.active : true,
            ...(data.skills && data.skills.length > 0 && {
                resourceSkills: {
                    create: data.skills.map((skill) => ({
                        skillName: skill.name || skill.skillName,
                        proficiency: skill.proficiency || null
                    }))
                }
            })
        },
        include: {
            resourceSkills: {
                select: {
                    skillName: true,
                    proficiency: true
                }
            }
        }
    });
    return (0, response_1.createdResponse)(resource);
}
async function updateResource(resourceId, body) {
    try {
        (0, validators_1.validateUUID)(resourceId, 'resourceId');
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
        (0, validators_1.validateResourceData)(data);
    }
    catch (error) {
        if (error instanceof errors_1.ValidationError) {
            return (0, response_1.errorResponse)(error.message, 400, { errors: error.validationErrors });
        }
        throw error;
    }
    const existingResource = await prisma_1.prisma.resource.findUnique({
        where: { id: resourceId },
    });
    if (!existingResource) {
        throw new errors_1.NotFoundError('Resource', resourceId);
    }
    if (data.code && data.code !== existingResource.code) {
        const resourceWithCode = await prisma_1.prisma.resource.findUnique({
            where: { code: data.code },
        });
        if (resourceWithCode) {
            return (0, response_1.errorResponse)(`Resource with code '${data.code}' already exists`, 409);
        }
    }
    const updatedResource = await prisma_1.prisma.resource.update({
        where: { id: resourceId },
        data: {
            ...(data.code && { code: data.code }),
            ...(data.name && { name: data.name }),
            ...(data.email !== undefined && { email: data.email }),
            ...(data.team && { team: data.team }),
            ...(data.defaultCapacity !== undefined && { defaultCapacity: data.defaultCapacity }),
            ...(data.active !== undefined && { active: data.active }),
        },
        include: {
            resourceSkills: {
                select: {
                    skillName: true,
                    proficiency: true,
                },
            },
        },
    });
    return (0, response_1.successResponse)(updatedResource);
}
//# sourceMappingURL=resourcesHandler.js.map