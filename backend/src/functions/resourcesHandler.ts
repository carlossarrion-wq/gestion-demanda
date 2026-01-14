import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { prisma } from '../lib/prisma';
import { successResponse, errorResponse, createdResponse, optionsResponse } from '../lib/response';
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

  // Handle OPTIONS preflight request for CORS
  if (method === 'OPTIONS') {
    return optionsResponse();
  }

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
  const { active, skill, team } = queryParams;

  const resources = await prisma.resource.findMany({
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

  // Auto-generar código si no se proporciona
  if (!data.code) {
    // Generar código a partir del nombre: primeras letras + número único
    const nameParts = data.name.trim().split(' ');
    const initials = nameParts.map((part: string) => part.charAt(0).toUpperCase()).join('');
    const timestamp = Date.now().toString().slice(-4); // últimos 4 dígitos del timestamp
    data.code = `${initials}${timestamp}`;
  }

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
  let finalCode = data.code;
  let existingResource = await prisma.resource.findUnique({
    where: { code: finalCode },
  });

  // Si existe, añadir sufijo numérico
  let suffix = 1;
  while (existingResource) {
    finalCode = `${data.code}${suffix}`;
    existingResource = await prisma.resource.findUnique({
      where: { code: finalCode },
    });
    suffix++;
  }

  // Crear recurso con skills si se proporcionan
  const resource = await prisma.resource.create({
    data: {
      code: finalCode,
      name: data.name,
      email: data.email || null,
      team: data.team,
      defaultCapacity: data.defaultCapacity || 160, // Default según DEFINICIONES.md
      active: data.active !== undefined ? data.active : true,
      // Crear skills asociadas si se proporcionan
      ...(data.skills && data.skills.length > 0 && {
        resourceSkills: {
          create: data.skills.map((skill: any) => ({
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

  // Para actualizaciones, solo validar los campos proporcionados
  // No requerir campos obligatorios si no se están actualizando
  const errors: Array<{ field: string; message: string }> = [];

  // Validar name si se proporciona
  if (data.name !== undefined) {
    if (!data.name || data.name.trim() === '') {
      errors.push({ field: 'name', message: 'Resource name cannot be empty' });
    } else if (data.name.length > 255) {
      errors.push({ field: 'name', message: 'Resource name must be 255 characters or less' });
    }
  }

  // Validar email si se proporciona
  if (data.email !== undefined && data.email !== null && data.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }
    if (data.email.length > 255) {
      errors.push({ field: 'email', message: 'Email must be 255 characters or less' });
    }
  }

  // Validar team si se proporciona
  if (data.team !== undefined) {
    const VALID_TEAMS = ['darwin', 'mulesoft', 'sap', 'saplcorp'];
    if (!VALID_TEAMS.includes(data.team)) {
      errors.push({
        field: 'team',
        message: `Team must be one of: ${VALID_TEAMS.join(', ')}`
      });
    }
  }

  // Validar defaultCapacity si se proporciona
  if (data.defaultCapacity !== undefined) {
    if (data.defaultCapacity < 0) {
      errors.push({ field: 'defaultCapacity', message: 'Default capacity must be non-negative' });
    }
    if (data.defaultCapacity > 744) {
      errors.push({ field: 'defaultCapacity', message: 'Default capacity exceeds maximum hours in a month' });
    }
  }

  if (errors.length > 0) {
    return errorResponse('Validation failed', 400, { errors });
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

  // Si se proporcionan skills, actualizar la relación
  console.log('Skills in request:', data.skills, 'Type:', typeof data.skills, 'Is Array:', Array.isArray(data.skills));
  
  if (data.skills !== undefined) {
    console.log('Skills detected, updating...');
    
    // Eliminar skills existentes
    const deleteResult = await prisma.resourceSkill.deleteMany({
      where: { resourceId: resourceId },
    });
    console.log('Deleted existing skills:', deleteResult.count);

    // Crear nuevos skills si hay alguno
    if (Array.isArray(data.skills) && data.skills.length > 0) {
      console.log('Creating new skills:', data.skills);
      const createResult = await prisma.resourceSkill.createMany({
        data: data.skills.map((skillName: string) => ({
          resourceId: resourceId,
          skillName: skillName,
          proficiency: null,
        })),
      });
      console.log('Created skills:', createResult.count);
    } else {
      console.log('No skills to create (empty array or not an array)');
    }
  } else {
    console.log('No skills in request data');
  }

  // Actualizar recurso
  const updatedResource = await prisma.resource.update({
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

  return successResponse(updatedResource);
}
