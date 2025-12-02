/**
 * Lambda Handler: Capacity Management
 * 
 * Gestiona la capacidad de recursos (horas disponibles por mes/año).
 * 
 * Endpoints:
 * - GET /capacity - Lista registros de capacidad con filtros
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
    const id = pathParameters.id;

    switch (method) {
      case 'GET':
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
      skill: {
        select: {
          id: true,
          name: true,
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
      skill: assignment.skill,
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
