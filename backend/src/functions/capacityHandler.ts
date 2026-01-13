/**
 * Lambda Handler: Capacity Management
 * 
 * Gestiona la capacidad de recursos con vista agregada por semanas.
 * 
 * Endpoints:
 * - GET /capacity - Lista registros de capacidad con filtros
 * - GET /capacity/overview - Vista general de capacidad por equipo (para dashboard)
 * - GET /capacity/{id} - Obtiene un registro de capacidad por ID
 * - PUT /capacity - Actualiza o crea capacidad para un recurso/mes/año
 * 
 * Reglas de Negocio:
 * - La capacidad por defecto es 160 horas/mes (DEFINICIONES.md)
 * - La capacidad puede variar por mes (vacaciones, festivos, etc.)
 * - No se puede asignar más horas de las disponibles en la capacidad
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { prisma } from '../lib/prisma';
import {
  successResponse,
  errorResponse,
  optionsResponse,
} from '../lib/response';
import {
  validateCapacityData,
  validateUUID,
  validatePaginationParams,
} from '../lib/validators';
import { handleError, NotFoundError, BusinessRuleError } from '../lib/errors';

/**
 * Handler principal para operaciones de capacidad
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Capacity Handler - Event:', JSON.stringify(event, null, 2));

  // Manejar preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return optionsResponse();
  }

  try {
    const method = event.httpMethod;
    const pathParameters = event.pathParameters || {};
    const path = event.path || '';
    const id = pathParameters.id;

    // Extraer team del header
    const userTeam = event.headers['x-user-team'] || event.headers['X-User-Team'];

    switch (method) {
      case 'GET':
        // GET /capacity/overview - Vista general para dashboard
        if (path.includes('/overview')) {
          if (!userTeam) {
            return errorResponse('x-user-team header is required', 400);
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
        return errorResponse(`Method ${method} not allowed`, 405);
    }
  } catch (error: any) {
    const errorResult = handleError(error);
    return errorResponse(
      errorResult.message,
      errorResult.statusCode,
      errorResult.details
    );
  }
};

/**
 * GET /capacity/overview
 * Vista general de capacidad por equipo con datos agregados por semanas
 * 
 * Query Parameters:
 * - year: Año a consultar (default: año actual)
 * 
 * Retorna:
 * - KPIs: recursos registrados, con/sin asignación, ratio de ocupación
 * - Gráficos: horas comprometidas vs disponibles, horas por perfil
 * - Matriz: recursos con capacidad semanal y asignaciones
 */
const getCapacityOverview = async (
  userTeam: string,
  queryParams: Record<string, string | undefined>
): Promise<APIGatewayProxyResult> => {
  const year = queryParams.year ? parseInt(queryParams.year) : new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // 1. Obtener todos los recursos del equipo con sus skills
  const resources = await prisma.resource.findMany({
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
        include: {
          project: {
            select: {
              id: true,
              code: true,
              title: true,
              type: true
            }
          }
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  // 2. Calcular métricas por recurso y por mes
  const resourcesWithMetrics = resources.map((resource: any) => {
    // Crear mapa de capacidad por mes
    const capacityByMonth = resource.capacities.reduce((acc: Record<number, number>, cap: any) => {
      acc[cap.month] = Number(cap.totalHours);
      return acc;
    }, {} as Record<number, number>);

    // Crear mapa de asignaciones por mes (soporta tanto date como month/year)
    const assignmentsByMonth = resource.assignments.reduce((acc: Record<number, any[]>, assignment: any) => {
      let month: number;
      let assignmentYear: number;
      
      if (assignment.date) {
        // Asignación diaria - extraer mes y año del date
        const assignmentDate = new Date(assignment.date);
        month = assignmentDate.getMonth() + 1; // JavaScript months are 0-indexed
        assignmentYear = assignmentDate.getFullYear();
      } else if (assignment.month && assignment.year) {
        // Asignación legacy - usar month/year directamente
        month = assignment.month;
        assignmentYear = assignment.year;
      } else {
        // Skip assignments without valid date info
        return acc;
      }
      
      // Solo incluir asignaciones del año solicitado
      if (assignmentYear !== year) {
        return acc;
      }
      
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month]!.push({
        projectId: assignment.project.id,
        projectCode: assignment.project.code,
        projectTitle: assignment.project.title,
        projectType: assignment.project.type,
        skillName: assignment.skillName,
        hours: Number(assignment.hours)
      });
      return acc;
    }, {} as Record<number, any[]>);

    // Calcular horas comprometidas y disponibles por mes
    const monthlyData = [];
    for (let month = 1; month <= 12; month++) {
      const totalHours = capacityByMonth[month] || resource.defaultCapacity;
      const assignments = assignmentsByMonth[month] || [];
      const committedHours = assignments.reduce((sum: number, a: any) => sum + a.hours, 0);
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

    // Calcular ratio de ocupación promedio (mes actual y futuros)
    const futureMonths = monthlyData.filter(m => m.month >= currentMonth);
    const avgUtilization = futureMonths.length > 0
      ? Math.round(futureMonths.reduce((sum, m) => sum + m.utilizationRate, 0) / futureMonths.length)
      : 0;

    // Determinar si tiene asignación a futuro
    const hasFutureAssignment = futureMonths.some(m => m.committedHours > 0);

    return {
      id: resource.id,
      code: resource.code,
      name: resource.name,
      email: resource.email,
      defaultCapacity: resource.defaultCapacity,
      skills: resource.resourceSkills.map((rs: any) => ({
        name: rs.skillName,
        proficiency: rs.proficiency
      })),
      monthlyData,
      avgUtilization,
      hasFutureAssignment
    };
  });

  // 3. Calcular KPIs
  const totalResources = resourcesWithMetrics.length;
  const resourcesWithAssignment = resourcesWithMetrics.filter(r => r.hasFutureAssignment).length;
  const resourcesWithoutAssignment = totalResources - resourcesWithAssignment;

  // Ratio de ocupación medio (mes actual y futuros)
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

  // 4. Datos para gráfico "Horas Comprometidas vs Disponibles"
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

  // 5. Datos para gráfico "Horas potenciales disponibles por perfil"
  const skillsAvailability: Record<string, { current: number; future: number }> = {};
  
  resourcesWithMetrics.forEach((resource: any) => {
    const skillCount = resource.skills.length;
    if (skillCount === 0) return;

    resource.skills.forEach((skill: any) => {
      if (!skillsAvailability[skill.name]) {
        skillsAvailability[skill.name] = { current: 0, future: 0 };
      }

      // Mes actual
      const currentMonthData = resource.monthlyData.find((m: any) => m.month === currentMonth);
      if (currentMonthData) {
        const skillData = skillsAvailability[skill.name];
        if (skillData) {
          skillData.current += currentMonthData.availableHours / skillCount;
        }
      }

      // Meses futuros
      const futureMonths = resource.monthlyData.filter((m: any) => m.month > currentMonth);
      const futureAvailable = futureMonths.reduce((sum: number, m: any) => sum + m.availableHours, 0);
      const skillData = skillsAvailability[skill.name];
      if (skillData) {
        skillData.future += futureAvailable / skillCount;
      }
    });
  });

  // Ordenar skills según especificación
  const skillOrder = ['Project Management', 'Análisis', 'Diseño', 'Construcción', 'QA', 'General'];
  const skillsData = skillOrder
    .filter(skillName => skillsAvailability[skillName])
    .map(skillName => {
      const skillData = skillsAvailability[skillName]!;
      return {
        skill: skillName,
        currentMonth: Math.round(skillData.current),
        futureMonths: Math.round(skillData.future)
      };
    });

  // 6. Retornar respuesta completa
  return successResponse({
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

/**
 * GET /capacity
 * Lista registros de capacidad con filtros opcionales
 * 
 * Query Parameters:
 * - resourceId: Filtrar por recurso específico
 * - month: Filtrar por mes (1-12)
 * - year: Filtrar por año
 * - page: Número de página (default: 1)
 * - limit: Resultados por página (default: 50, max: 100)
 */
const listCapacity = async (
  queryParams: Record<string, string | undefined>
): Promise<APIGatewayProxyResult> => {
  const { resourceId, month, year, page, limit } = queryParams;

  // Validar paginación
  const pagination = validatePaginationParams(page, limit);

  // Construir filtros
  const where: any = {};

  if (resourceId) {
    try {
      validateUUID(resourceId, 'resourceId');
    } catch (error: any) {
      throw error;
    }
    where.resourceId = resourceId;
  }

  if (month) {
    const monthNum = parseInt(month, 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return errorResponse('Month must be between 1 and 12', 400);
    }
    where.month = monthNum;
  }

  if (year) {
    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      return errorResponse('Year must be between 2000 and 2100', 400);
    }
    where.year = yearNum;
  }

  // Obtener registros con paginación
  const [capacities, total] = await Promise.all([
    prisma.capacity.findMany({
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
    prisma.capacity.count({ where }),
  ]);

  // Calcular horas asignadas para cada registro de capacidad
  const capacitiesWithMetrics = await Promise.all(
    capacities.map(async (capacity: any) => {
      const assignedHours = await prisma.assignment.aggregate({
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
        utilizationPercentage:
          totalHours > 0
            ? Math.round((assigned / totalHours) * 100)
            : 0,
      };
    })
  );

  return successResponse({
    capacities: capacitiesWithMetrics,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  });
};

/**
 * GET /capacity/{id}
 * Obtiene un registro de capacidad por ID con métricas detalladas
 */
const getCapacityById = async (id: string): Promise<APIGatewayProxyResult> => {
  try {
    validateUUID(id, 'id');
  } catch (error: any) {
    throw error;
  }

  const capacity = await prisma.capacity.findUnique({
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
    throw new NotFoundError('Capacity', id);
  }

  // Obtener asignaciones para este período
  const assignments = await prisma.assignment.findMany({
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

  // Calcular métricas
  const assignedHours = assignments.reduce(
    (sum: number, assignment: any) => sum + Number(assignment.hours),
    0
  );
  const totalHours = Number(capacity.totalHours);
  const availableHours = totalHours - assignedHours;
  const utilizationPercentage =
    totalHours > 0
      ? Math.round((assignedHours / totalHours) * 100)
      : 0;

  return successResponse({
    ...capacity,
    totalHours,
    assignedHours,
    availableHours,
    utilizationPercentage,
    assignments: assignments.map((assignment: any) => ({
      id: assignment.id,
      project: assignment.project,
      skillName: assignment.skillName,
      hours: Number(assignment.hours),
    })),
  });
};

/**
 * PUT /capacity
 * Actualiza o crea un registro de capacidad (upsert)
 * 
 * Body:
 * {
 *   "resourceId": "uuid",
 *   "month": 1-12,
 *   "year": 2024,
 *   "totalHours": 160
 * }
 * 
 * Reglas de Negocio:
 * - Si ya existe un registro para ese recurso/mes/año, se actualiza
 * - Si no existe, se crea uno nuevo
 * - No se puede reducir la capacidad por debajo de las horas ya asignadas
 */
const upsertCapacity = async (
  body: string | null
): Promise<APIGatewayProxyResult> => {
  if (!body) {
    return errorResponse('Request body is required', 400);
  }

  const data = JSON.parse(body);

  // Validar datos
  try {
    validateCapacityData(data);
    validateUUID(data.resourceId, 'resourceId');
  } catch (error: any) {
    throw error;
  }

  // Verificar que el recurso existe y está activo
  const resource = await prisma.resource.findUnique({
    where: { id: data.resourceId },
  });

  if (!resource) {
    throw new NotFoundError('Resource', data.resourceId);
  }

  if (!resource.active) {
    throw new BusinessRuleError(
      'Cannot set capacity for inactive resource',
      'INACTIVE_RESOURCE'
    );
  }

  // Verificar horas ya asignadas en este período
  const assignedHours = await prisma.assignment.aggregate({
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

  // Validar que la nueva capacidad no sea menor que las horas asignadas
  if (data.totalHours < totalAssignedHours) {
    throw new BusinessRuleError(
      `Cannot set capacity to ${data.totalHours} hours. Resource already has ${totalAssignedHours} hours assigned for ${data.month}/${data.year}`,
      'CAPACITY_BELOW_ASSIGNED'
    );
  }

  // Upsert: actualizar si existe, crear si no existe
  const capacity = await prisma.capacity.upsert({
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
  
  return successResponse(
    {
      ...capacity,
      totalHours,
      assignedHours: totalAssignedHours,
      availableHours: totalHours - totalAssignedHours,
      utilizationPercentage:
        totalHours > 0
          ? Math.round((totalAssignedHours / totalHours) * 100)
          : 0,
    },
    200
  );
};
