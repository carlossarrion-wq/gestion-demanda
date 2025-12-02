import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { prisma } from '../lib/prisma';
import { successResponse, errorResponse, createdResponse } from '../lib/response';
import { handleError, NotFoundError, ValidationError } from '../lib/errors';
import { validateResourceData, validateUUID } from '../lib/validators';

/**
 * Lambda Handler para operaciones CRUD de Recursos
 * Maneja: GET (list/single), POST (create), PUT (update)
 * 
 * Nota: Los recursos NO se eliminan físicamente, solo se marcan como inactivos
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const method = event.httpMethod;
  const pathParameters = event.pathParameters || {};
  const resourceId = pathParameters.id;

  try {
    switch (method) {
      case 'GET':
        if (resourceId) {
          // GET /resources/{id} - Obtener recurso por ID
          return await getResourceById(resourceId);
        } else {
          // GET /resources - Listar todos los recursos
          return await listResources(event.queryStringParameters || {});
        }

      case 'POST':
        // POST /resources - Crear nuevo recurso
        return await createResource(event.body);

      case 'PUT':
        // PUT /resources/{id} - Actualizar recurso
        if (!resourceId) {
          return errorResponse('Resource ID is required for update', 400);
        }
        return await updateResource(resourceId, event.body);

      default:
        return errorResponse(`Method ${method} not allowed`, 405);
    }
  } catch (error) {
    console.error('Error in resourcesHandler:', error);
    const { statusCode, message } = handleError(error);
    return errorResponse(message, statusCode, error);
  }
};

/**
 * GET /resources - Listar recursos con filtros opcionales
 */
async function listResources(queryParams: Record<string, string | undefined>): Promise<APIGatewayProxyResult> {
  const { active, skill } = queryParams;

  const resources = await prisma.resource.findMany({
    where: {
      ...(active !== undefined && { active: active === 'true' }),
      ...(skill && {
        resourceSkills: {
          some: {
            skill: {
              name: skill,
            },
          },
        },
      }),
    },
    include: {
      resourceSkills: {
        include: {
          skill: {
            select: {
              id: true,
              name: true,
            },
          },
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

  // Calcular métricas por recurso
  const resourcesWithMetrics = resources.map((resource: any) => {
    const totalAssignedHours = resource.assignments.reduce(
      (sum: number, assignment: any) => sum + Number(assignment.hours),
      0
    );

    return {
      ...resource,
      skillsCount: resource.resourceSkills.length,
      totalAssignedHours,
      activeProjectsCount: new Set(resource.assignments.map((a: any) => a.projectId)).size,
    };
  });

  return successResponse({
    resources: resourcesWithMetrics,
    count: resourcesWithMetrics.length,
  });
}

/**
 * GET /resources/{id} - Obtener recurso por ID
 */
async function getResourceById(resourceId: string): Promise<APIGatewayProxyResult> {
  // Validar UUID
  try {
    validateUUID(resourceId, 'resourceId');
  } catch (error) {
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400);
    }
    throw error;
  }

  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    include: {
      resourceSkills: {
        include: {
          skill: true,
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
          skill: {
            select: {
              id: true,
              name: true,
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
    throw new NotFoundError('Resource', resourceId);
  }

  // Calcular métricas del recurso
  const totalAssignedHours = resource.assignments.reduce(
    (sum: number, assignment: any) => sum + Number(assignment.hours),
    0
  );
  const activeProjectsCount = new Set(resource.assignments.map((a: any) => a.projectId)).size;

  return successResponse({
    ...resource,
    metrics: {
      totalAssignedHours,
      activeProjectsCount,
      skillsCount: resource.resourceSkills.length,
    },
  });
}

/**
 * POST /resources - Crear nuevo recurso
 */
async function createResource(body: string | null): Promise<APIGatewayProxyResult> {
  if (!body) {
    return errorResponse('Request body is required', 400);
  }

  const data = JSON.parse(body);

  // Validar datos del recurso
  try {
    validateResourceData(data);
  } catch (error) {
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400, { errors: error.validationErrors });
    }
    throw error;
  }

  // Verificar que el código no exista
  const existingResource = await prisma.resource.findUnique({
    where: { code: data.code },
  });

  if (existingResource) {
    return errorResponse(`Resource with code '${data.code}' already exists`, 409);
  }

  // Crear recurso
  const resource = await prisma.resource.create({
    data: {
      code: data.code,
      name: data.name,
      email: data.email || null,
      defaultCapacity: data.defaultCapacity || 160, // Default según DEFINICIONES.md
      active: data.active !== undefined ? data.active : true,
    },
  });

  return createdResponse(resource);
}

/**
 * PUT /resources/{id} - Actualizar recurso
 */
async function updateResource(resourceId: string, body: string | null): Promise<APIGatewayProxyResult> {
  // Validar UUID
  try {
    validateUUID(resourceId, 'resourceId');
  } catch (error) {
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400);
    }
    throw error;
  }

  if (!body) {
    return errorResponse('Request body is required', 400);
  }

  const data = JSON.parse(body);

  // Validar datos del recurso (permitir campos opcionales en update)
  try {
    validateResourceData(data);
  } catch (error) {
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400, { errors: error.validationErrors });
    }
    throw error;
  }

  // Verificar que el recurso exista
  const existingResource = await prisma.resource.findUnique({
    where: { id: resourceId },
  });

  if (!existingResource) {
    throw new NotFoundError('Resource', resourceId);
  }

  // Si se está actualizando el código, verificar que no exista otro recurso con ese código
  if (data.code && data.code !== existingResource.code) {
    const resourceWithCode = await prisma.resource.findUnique({
      where: { code: data.code },
    });

    if (resourceWithCode) {
      return errorResponse(`Resource with code '${data.code}' already exists`, 409);
    }
  }

  // Actualizar recurso
  const updatedResource = await prisma.resource.update({
    where: { id: resourceId },
    data: {
      ...(data.code && { code: data.code }),
      ...(data.name && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.defaultCapacity !== undefined && { defaultCapacity: data.defaultCapacity }),
      ...(data.active !== undefined && { active: data.active }),
    },
    include: {
      resourceSkills: {
        include: {
          skill: true,
        },
      },
    },
  });

  return successResponse(updatedResource);
}
