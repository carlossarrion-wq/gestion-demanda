"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const prisma_1 = require("../lib/prisma");
const response_1 = require("../lib/response");
const validators_1 = require("../lib/validators");
const errors_1 = require("../lib/errors");
const handler = async (event) => {
    console.log('Capacity Handler - Event:', JSON.stringify(event, null, 2));
    if (event.httpMethod === 'OPTIONS') {
        return (0, response_1.optionsResponse)();
    }
    try {
        const method = event.httpMethod;
        const pathParameters = event.pathParameters || {};
        const path = event.path || '';
        const id = pathParameters.id;
        const userTeam = event.headers['x-user-team'] || event.headers['X-User-Team'];
        switch (method) {
            case 'GET':
                if (path.includes('/overview')) {
                    if (!userTeam) {
                        return (0, response_1.errorResponse)('x-user-team header is required', 400);
                    }
                    return await getCapacityOverview(userTeam, event.queryStringParameters || {});
                }
                if (id) {
                    return await getCapacityById(id);
                }
                return await listCapacity(event.queryStringParameters || {});
            case 'PUT':
                return await upsertCapacity(event.body);
            default:
                return (0, response_1.errorResponse)(`Method ${method} not allowed`, 405);
        }
    }
    catch (error) {
        const errorResult = (0, errors_1.handleError)(error);
        return (0, response_1.errorResponse)(errorResult.message, errorResult.statusCode, errorResult.details);
    }
};
exports.handler = handler;
const getCapacityOverview = async (userTeam, queryParams) => {
    const year = queryParams.year ? parseInt(queryParams.year) : new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const resources = await prisma_1.prisma.resource.findMany({
        where: {
            team: userTeam,
            active: true
        },
        include: {
            resourceSkills: {
                select: {
                    skillName: true,
                    proficiency: true
                }
            },
            capacities: {
                where: {
                    year
                },
                orderBy: {
                    month: 'asc'
                }
            },
            assignments: {
                where: {
                    year
                },
                include: {
                    project: {
                        select: {
                            id: true,
                            code: true,
                            title: true,
                            type: true
                        }
                    }
                },
                orderBy: [
                    { month: 'asc' }
                ]
            }
        },
        orderBy: {
            name: 'asc'
        }
    });
    const resourcesWithMetrics = resources.map((resource) => {
        const capacityByMonth = resource.capacities.reduce((acc, cap) => {
            acc[cap.month] = Number(cap.totalHours);
            return acc;
        }, {});
        const assignmentsByMonth = resource.assignments.reduce((acc, assignment) => {
            if (!acc[assignment.month]) {
                acc[assignment.month] = [];
            }
            acc[assignment.month].push({
                projectId: assignment.project.id,
                projectCode: assignment.project.code,
                projectTitle: assignment.project.title,
                projectType: assignment.project.type,
                skillName: assignment.skillName,
                hours: Number(assignment.hours)
            });
            return acc;
        }, {});
        const monthlyData = [];
        for (let month = 1; month <= 12; month++) {
            const totalHours = capacityByMonth[month] || resource.defaultCapacity;
            const assignments = assignmentsByMonth[month] || [];
            const committedHours = assignments.reduce((sum, a) => sum + a.hours, 0);
            const availableHours = totalHours - committedHours;
            const utilizationRate = totalHours > 0 ? (committedHours / totalHours) * 100 : 0;
            monthlyData.push({
                month,
                totalHours,
                committedHours,
                availableHours,
                utilizationRate: Math.round(utilizationRate),
                assignments
            });
        }
        const futureMonths = monthlyData.filter(m => m.month >= currentMonth);
        const avgUtilization = futureMonths.length > 0
            ? Math.round(futureMonths.reduce((sum, m) => sum + m.utilizationRate, 0) / futureMonths.length)
            : 0;
        const hasFutureAssignment = futureMonths.some(m => m.committedHours > 0);
        return {
            id: resource.id,
            code: resource.code,
            name: resource.name,
            email: resource.email,
            defaultCapacity: resource.defaultCapacity,
            skills: resource.resourceSkills.map((rs) => ({
                name: rs.skillName,
                proficiency: rs.proficiency
            })),
            monthlyData,
            avgUtilization,
            hasFutureAssignment
        };
    });
    const totalResources = resourcesWithMetrics.length;
    const resourcesWithAssignment = resourcesWithMetrics.filter(r => r.hasFutureAssignment).length;
    const resourcesWithoutAssignment = totalResources - resourcesWithAssignment;
    const currentMonthUtilization = resourcesWithMetrics.length > 0
        ? Math.round(resourcesWithMetrics.reduce((sum, r) => {
            const currentMonthData = r.monthlyData.find(m => m.month === currentMonth);
            return sum + (currentMonthData?.utilizationRate || 0);
        }, 0) / resourcesWithMetrics.length)
        : 0;
    const futureUtilization = resourcesWithMetrics.length > 0
        ? Math.round(resourcesWithMetrics.reduce((sum, r) => {
            const futureMonths = r.monthlyData.filter(m => m.month > currentMonth);
            const avgFuture = futureMonths.length > 0
                ? futureMonths.reduce((s, m) => s + m.utilizationRate, 0) / futureMonths.length
                : 0;
            return sum + avgFuture;
        }, 0) / resourcesWithMetrics.length)
        : 0;
    const monthlyAggregated = [];
    for (let month = 1; month <= 12; month++) {
        const totalCommitted = resourcesWithMetrics.reduce((sum, r) => {
            const monthData = r.monthlyData.find(m => m.month === month);
            return sum + (monthData?.committedHours || 0);
        }, 0);
        const totalAvailable = resourcesWithMetrics.reduce((sum, r) => {
            const monthData = r.monthlyData.find(m => m.month === month);
            return sum + (monthData?.availableHours || 0);
        }, 0);
        monthlyAggregated.push({
            month,
            committedHours: totalCommitted,
            availableHours: totalAvailable
        });
    }
    const skillsAvailability = {};
    resourcesWithMetrics.forEach((resource) => {
        const skillCount = resource.skills.length;
        if (skillCount === 0)
            return;
        resource.skills.forEach((skill) => {
            if (!skillsAvailability[skill.name]) {
                skillsAvailability[skill.name] = { current: 0, future: 0 };
            }
            const currentMonthData = resource.monthlyData.find((m) => m.month === currentMonth);
            if (currentMonthData) {
                const skillData = skillsAvailability[skill.name];
                if (skillData) {
                    skillData.current += currentMonthData.availableHours / skillCount;
                }
            }
            const futureMonths = resource.monthlyData.filter((m) => m.month > currentMonth);
            const futureAvailable = futureMonths.reduce((sum, m) => sum + m.availableHours, 0);
            const skillData = skillsAvailability[skill.name];
            if (skillData) {
                skillData.future += futureAvailable / skillCount;
            }
        });
    });
    const skillOrder = ['Project Management', 'Análisis', 'Diseño', 'Construcción', 'QA', 'General'];
    const skillsData = skillOrder
        .filter(skillName => skillsAvailability[skillName])
        .map(skillName => {
        const skillData = skillsAvailability[skillName];
        return {
            skill: skillName,
            currentMonth: Math.round(skillData.current),
            futureMonths: Math.round(skillData.future)
        };
    });
    return (0, response_1.successResponse)({
        year,
        currentMonth,
        kpis: {
            totalResources,
            resourcesWithAssignment,
            resourcesWithoutAssignment,
            avgUtilization: {
                current: currentMonthUtilization,
                future: futureUtilization
            }
        },
        charts: {
            monthlyComparison: monthlyAggregated,
            skillsAvailability: skillsData
        },
        resources: resourcesWithMetrics
    });
};
const listCapacity = async (queryParams) => {
    const { resourceId, month, year, page, limit } = queryParams;
    const pagination = (0, validators_1.validatePaginationParams)(page, limit);
    const where = {};
    if (resourceId) {
        try {
            (0, validators_1.validateUUID)(resourceId, 'resourceId');
        }
        catch (error) {
            throw error;
        }
        where.resourceId = resourceId;
    }
    if (month) {
        const monthNum = parseInt(month, 10);
        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            return (0, response_1.errorResponse)('Month must be between 1 and 12', 400);
        }
        where.month = monthNum;
    }
    if (year) {
        const yearNum = parseInt(year, 10);
        if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
            return (0, response_1.errorResponse)('Year must be between 2000 and 2100', 400);
        }
        where.year = yearNum;
    }
    const [capacities, total] = await Promise.all([
        prisma_1.prisma.capacity.findMany({
            where,
            include: {
                resource: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        active: true,
                    },
                },
            },
            skip: (pagination.page - 1) * pagination.limit,
            take: pagination.limit,
            orderBy: [
                { year: 'desc' },
                { month: 'desc' },
                { resource: { name: 'asc' } },
            ],
        }),
        prisma_1.prisma.capacity.count({ where }),
    ]);
    const capacitiesWithMetrics = await Promise.all(capacities.map(async (capacity) => {
        const assignedHours = await prisma_1.prisma.assignment.aggregate({
            where: {
                resourceId: capacity.resourceId,
                month: capacity.month,
                year: capacity.year,
            },
            _sum: {
                hours: true,
            },
        });
        const totalHours = Number(capacity.totalHours);
        const assigned = Number(assignedHours._sum.hours || 0);
        return {
            ...capacity,
            totalHours,
            assignedHours: assigned,
            availableHours: totalHours - assigned,
            utilizationPercentage: totalHours > 0
                ? Math.round((assigned / totalHours) * 100)
                : 0,
        };
    }));
    return (0, response_1.successResponse)({
        capacities: capacitiesWithMetrics,
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total,
            totalPages: Math.ceil(total / pagination.limit),
        },
    });
};
const getCapacityById = async (id) => {
    try {
        (0, validators_1.validateUUID)(id, 'id');
    }
    catch (error) {
        throw error;
    }
    const capacity = await prisma_1.prisma.capacity.findUnique({
        where: { id },
        include: {
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
    });
    if (!capacity) {
        throw new errors_1.NotFoundError('Capacity', id);
    }
    const assignments = await prisma_1.prisma.assignment.findMany({
        where: {
            resourceId: capacity.resourceId,
            month: capacity.month,
            year: capacity.year,
        },
        include: {
            project: {
                select: {
                    id: true,
                    code: true,
                    title: true,
                },
            },
        },
    });
    const assignedHours = assignments.reduce((sum, assignment) => sum + Number(assignment.hours), 0);
    const totalHours = Number(capacity.totalHours);
    const availableHours = totalHours - assignedHours;
    const utilizationPercentage = totalHours > 0
        ? Math.round((assignedHours / totalHours) * 100)
        : 0;
    return (0, response_1.successResponse)({
        ...capacity,
        totalHours,
        assignedHours,
        availableHours,
        utilizationPercentage,
        assignments: assignments.map((assignment) => ({
            id: assignment.id,
            project: assignment.project,
            skillName: assignment.skillName,
            hours: Number(assignment.hours),
        })),
    });
};
const upsertCapacity = async (body) => {
    if (!body) {
        return (0, response_1.errorResponse)('Request body is required', 400);
    }
    const data = JSON.parse(body);
    try {
        (0, validators_1.validateCapacityData)(data);
        (0, validators_1.validateUUID)(data.resourceId, 'resourceId');
    }
    catch (error) {
        throw error;
    }
    const resource = await prisma_1.prisma.resource.findUnique({
        where: { id: data.resourceId },
    });
    if (!resource) {
        throw new errors_1.NotFoundError('Resource', data.resourceId);
    }
    if (!resource.active) {
        throw new errors_1.BusinessRuleError('Cannot set capacity for inactive resource', 'INACTIVE_RESOURCE');
    }
    const assignedHours = await prisma_1.prisma.assignment.aggregate({
        where: {
            resourceId: data.resourceId,
            month: data.month,
            year: data.year,
        },
        _sum: {
            hours: true,
        },
    });
    const totalAssignedHours = Number(assignedHours._sum.hours || 0);
    if (data.totalHours < totalAssignedHours) {
        throw new errors_1.BusinessRuleError(`Cannot set capacity to ${data.totalHours} hours. Resource already has ${totalAssignedHours} hours assigned for ${data.month}/${data.year}`, 'CAPACITY_BELOW_ASSIGNED');
    }
    const capacity = await prisma_1.prisma.capacity.upsert({
        where: {
            resourceId_month_year: {
                resourceId: data.resourceId,
                month: data.month,
                year: data.year,
            },
        },
        update: {
            totalHours: data.totalHours,
        },
        create: {
            resourceId: data.resourceId,
            month: data.month,
            year: data.year,
            totalHours: data.totalHours,
        },
        include: {
            resource: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                },
            },
        },
    });
    const totalHours = Number(capacity.totalHours);
    return (0, response_1.successResponse)({
        ...capacity,
        totalHours,
        assignedHours: totalAssignedHours,
        availableHours: totalHours - totalAssignedHours,
        utilizationPercentage: totalHours > 0
            ? Math.round((totalAssignedHours / totalHours) * 100)
            : 0,
    }, 200);
};
//# sourceMappingURL=capacityHandler.js.map