import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { prisma } from '../lib/prisma';
import { successResponse, errorResponse, createdResponse, noContentResponse } from '../lib/response';
import { handleError, NotFoundError, ValidationError } from '../lib/errors';
import { validateProjectData, validateUUID } from '../lib/validators';

/**
 * Lambda Handler para operaciones CRUD de Proyectos
 * Maneja: GET (list/single), POST (create), PUT (update), DELETE
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const method = event.httpMethod;
  const pathParameters = event.pathParameters || {};
  const projectId = pathParameters.id;

  // Handle OPTIONS preflight request for CORS
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
    // Extract user team from headers
    const userTeam = event.headers['x-user-team'] || event.headers['X-User-Team'];
    console.log('User team from headers:', userTeam);

    switch (method) {
      case 'GET':
        if (projectId) {
          // GET /projects/{id} - Obtener proyecto por ID
          return await getProjectById(projectId);
        } else {
          // GET /projects - Listar todos los proyectos filtrados por equipo
          console.log('Calling listProjects with userTeam:', userTeam);
          return await listProjects(event.queryStringParameters || {}, userTeam);
        }

      case 'POST':
        // POST /projects - Crear nuevo proyecto
        return await createProject(event.body);

      case 'PUT':
        // PUT /projects/{id} - Actualizar proyecto
        if (!projectId) {
          return errorResponse('Project ID is required for update', 400);
        }
        return await updateProject(projectId, event.body);

      case 'DELETE':
        // DELETE /projects/{id} - Eliminar proyecto
        if (!projectId) {
          return errorResponse('Project ID is required for delete', 400);
        }
        return await deleteProject(projectId);

      default:
        return errorResponse(`Method ${method} not allowed`, 405);
    }
  } catch (error) {
    console.error('Error in projectsHandler:', error);
    const { statusCode, message } = handleError(error);
    return errorResponse(message, statusCode, error);
  }
};

/**
 * GET /projects - Listar proyectos con filtros opcionales
 */
async function listProjects(queryParams: Record<string, string | undefined>, userTeam?: string): Promise<APIGatewayProxyResult> {
  const { type, status, domain, priority } = queryParams;

  const projects = await prisma.project.findMany({
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

  // Calcular totales por proyecto
  const projectsWithTotals = projects.map((project: any) => {
    const totalHours = project.projectSkillBreakdowns.reduce(
      (sum: number, breakdown: any) => sum + Number(breakdown.hours),
      0
    );
    const assignedHours = project.assignments.reduce(
      (sum: number, assignment: any) => sum + Number(assignment.hours),
      0
    );

    return {
      ...project,
      totalCommittedHours: totalHours,
      totalAssignedHours: assignedHours,
      assignedResourcesCount: new Set(project.assignments.map((a: any) => a.resourceId)).size,
    };
  });

  return successResponse({
    projects: projectsWithTotals,
    count: projectsWithTotals.length,
  });
}

/**
 * GET /projects/{id} - Obtener proyecto por ID
 */
async function getProjectById(projectId: string): Promise<APIGatewayProxyResult> {
  // Validar UUID
  try {
    validateUUID(projectId, 'projectId');
  } catch (error) {
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400);
    }
    throw error;
  }

  const project = await prisma.project.findUnique({
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
    throw new NotFoundError('Project', projectId);
  }

  // Calcular métricas del proyecto
  const totalCommittedHours = project.projectSkillBreakdowns.reduce(
    (sum: number, breakdown: any) => sum + Number(breakdown.hours),
    0
  );
  const totalAssignedHours = project.assignments.reduce(
    (sum: number, assignment: any) => sum + Number(assignment.hours),
    0
  );
  const assignedResourcesCount = new Set(project.assignments.map((a: any) => a.resourceId)).size;

  return successResponse({
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

/**
 * POST /projects - Crear nuevo proyecto
 */
async function createProject(body: string | null): Promise<APIGatewayProxyResult> {
  if (!body) {
    return errorResponse('Request body is required', 400);
  }

  const data = JSON.parse(body);

  // Validar datos del proyecto
  try {
    validateProjectData(data);
  } catch (error) {
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400, { errors: error.validationErrors });
    }
    throw error;
  }

  // Verificar que el código no exista
  const existingProject = await prisma.project.findUnique({
    where: { code: data.code },
  });

  if (existingProject) {
    return errorResponse(`Project with code '${data.code}' already exists`, 409);
  }

  // Crear proyecto
  const project = await prisma.project.create({
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

  return createdResponse(project);
}

/**
 * PUT /projects/{id} - Actualizar proyecto
 */
async function updateProject(projectId: string, body: string | null): Promise<APIGatewayProxyResult> {
  // Validar UUID
  try {
    validateUUID(projectId, 'projectId');
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

  // Validar datos del proyecto (permitir campos opcionales en update)
  try {
    validateProjectData(data);
  } catch (error) {
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400, { errors: error.validationErrors });
    }
    throw error;
  }

  // Verificar que el proyecto exista
  const existingProject = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!existingProject) {
    throw new NotFoundError('Project', projectId);
  }

  // Si se está actualizando el código, verificar que no exista otro proyecto con ese código
  if (data.code && data.code !== existingProject.code) {
    const projectWithCode = await prisma.project.findUnique({
      where: { code: data.code },
    });

    if (projectWithCode) {
      return errorResponse(`Project with code '${data.code}' already exists`, 409);
    }
  }

  // Actualizar proyecto
  const updatedProject = await prisma.project.update({
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

  return successResponse(updatedProject);
}

/**
 * DELETE /projects/{id} - Eliminar proyecto
 */
async function deleteProject(projectId: string): Promise<APIGatewayProxyResult> {
  // Validar UUID
  try {
    validateUUID(projectId, 'projectId');
  } catch (error) {
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400);
    }
    throw error;
  }

  // Verificar que el proyecto exista (sin incluir relaciones)
  const existingProject = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!existingProject) {
    throw new NotFoundError('Project', projectId);
  }

  // Eliminar proyecto (cascade eliminará skill breakdowns y assignments automáticamente)
  await prisma.project.delete({
    where: { id: projectId },
  });

  return noContentResponse();
}
