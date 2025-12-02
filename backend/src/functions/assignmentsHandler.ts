import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { prisma } from '../lib/prisma';
import { successResponse, errorResponse, createdResponse, noContentResponse } from '../lib/response';
import { handleError, NotFoundError, ValidationError, BusinessRuleError } from '../lib/errors';
import { validateAssignmentData, validateUUID } from '../lib/validators';

/**
 * Lambda Handler para operaciones CRUD de Asignaciones
 * Maneja: GET (list/single), POST (create), DELETE
 * 
 * Reglas de negocio importantes:
 * - Un recurso solo puede ser asignado a un skill que posee
 * - Las horas asignadas no pueden exceder la capacidad disponible del recurso
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const method = event.httpMethod;
  const pathParameters = event.pathParameters || {};
  const assignmentId = pathParameters.id;

  try {
    switch (method) {
      case 'GET':
        if (assignmentId) {
          // GET /assignments/{id} - Obtener asignación por ID
          return await getAssignmentById(assignmentId);
        } else {
          // GET /assignments - Listar asignaciones con filtros
          return await listAssignments(event.queryStringParameters || {});
        }

      case 'POST':
        // POST /assignments - Crear nueva asignación
        return await createAssignment(event.body);

      case 'DELETE':
        // DELETE /assignments/{id} - Eliminar asignación
        if (!assignmentId) {
          return errorResponse('Assignment ID is required for delete', 400);
        }
        return await deleteAssignment(assignmentId);

      default:
        return errorResponse(`Method ${method} not allowed`, 405);
    }
  } catch (error) {
    console.error('Error in assignmentsHandler:', error);
    const { statusCode, message } = handleError(error);
    return errorResponse(message, statusCode, error);
  }
};

/**
 * GET /assignments - Listar asignaciones con filtros opcionales
 */
async function listAssignments(queryParams: Record<string, string | undefined>): Promise<APIGatewayProxyResult> {
  const { projectId, resourceId, month, year } = queryParams;

  const assignments = await prisma.assignment.findMany({
    where: {
      ...(projectId && { projectId }),
      ...(resourceId && { resourceId }),
      ...(month && { month: parseInt(month, 10) }),
      ...(year && { year: parseInt(year, 10) }),
    },
    include: {
      project: {
        select: {
          id: true,
          code: true,
          title: true,
          type: true,
          priority: true,
          status: {
            select: {
              id: true,
              name: true,
            },
          },
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
  });

  return successResponse({
    assignments,
    count: assignments.length,
  });
}

/**
 * GET /assignments/{id} - Obtener asignación por ID
 */
async function getAssignmentById(assignmentId: string): Promise<APIGatewayProxyResult> {
  // Validar UUID
  try {
    validateUUID(assignmentId, 'assignmentId');
  } catch (error) {
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400);
    }
    throw error;
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      project: {
        include: {
          status: true,
          domain: true,
        },
      },
      resource: {
        include: {
          resourceSkills: {
            include: {
              skill: true,
            },
          },
        },
      },
      skill: true,
    },
  });

  if (!assignment) {
    throw new NotFoundError('Assignment', assignmentId);
  }

  return successResponse(assignment);
}

/**
 * POST /assignments - Crear nueva asignación
 * 
 * Valida reglas de negocio:
 * 1. El recurso debe tener el skill requerido
 * 2. Las horas asignadas no deben exceder la capacidad disponible
 */
async function createAssignment(body: string | null): Promise<APIGatewayProxyResult> {
  if (!body) {
    return errorResponse('Request body is required', 400);
  }

  const data = JSON.parse(body);

  // Validar datos de la asignación
  try {
    validateAssignmentData(data);
  } catch (error) {
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400, { errors: error.validationErrors });
    }
    throw error;
  }

  // Verificar que el proyecto exista
  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
  });

  if (!project) {
    return errorResponse(`Project with ID '${data.projectId}' not found`, 404);
  }

  // Verificar que el recurso exista y esté activo
  const resource = await prisma.resource.findUnique({
    where: { id: data.resourceId },
    include: {
      resourceSkills: {
        where: { skillId: data.skillId },
      },
    },
  });

  if (!resource) {
    return errorResponse(`Resource with ID '${data.resourceId}' not found`, 404);
  }

  if (!resource.active) {
    return errorResponse('Cannot assign inactive resource to project', 400);
  }

  // REGLA DE NEGOCIO: Verificar que el recurso tenga el skill requerido
  if (resource.resourceSkills.length === 0) {
    throw new BusinessRuleError(
      `Resource '${resource.name}' does not have the required skill for this assignment`,
      'RESOURCE_SKILL_MISMATCH'
    );
  }

  // Verificar que el skill exista
  const skill = await prisma.skill.findUnique({
    where: { id: data.skillId },
  });

  if (!skill) {
    return errorResponse(`Skill with ID '${data.skillId}' not found`, 404);
  }

  // Verificar capacidad disponible del recurso para ese mes/año
  const capacity = await prisma.capacity.findUnique({
    where: {
      resourceId_month_year: {
        resourceId: data.resourceId,
        month: data.month,
        year: data.year,
      },
    },
  });

  // Si no existe capacidad definida, usar la capacidad por defecto del recurso
  const totalCapacity = capacity ? Number(capacity.totalHours) : resource.defaultCapacity;

  // Calcular horas ya asignadas en ese mes/año
  const existingAssignments = await prisma.assignment.findMany({
    where: {
      resourceId: data.resourceId,
      month: data.month,
      year: data.year,
    },
  });

  const assignedHours = existingAssignments.reduce(
    (sum: number, assignment: any) => sum + Number(assignment.hours),
    0
  );

  // REGLA DE NEGOCIO: Verificar que no se exceda la capacidad
  if (assignedHours + data.hours > totalCapacity) {
    throw new BusinessRuleError(
      `Assignment would exceed resource capacity. Available: ${totalCapacity - assignedHours} hours, Requested: ${data.hours} hours`,
      'CAPACITY_EXCEEDED'
    );
  }

  // Crear asignación
  const assignment = await prisma.assignment.create({
    data: {
      projectId: data.projectId,
      resourceId: data.resourceId,
      skillId: data.skillId,
      month: data.month,
      year: data.year,
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
      skill: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return createdResponse(assignment);
}

/**
 * DELETE /assignments/{id} - Eliminar asignación
 */
async function deleteAssignment(assignmentId: string): Promise<APIGatewayProxyResult> {
  // Validar UUID
  try {
    validateUUID(assignmentId, 'assignmentId');
  } catch (error) {
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400);
    }
    throw error;
  }

  // Verificar que la asignación exista
  const existingAssignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
  });

  if (!existingAssignment) {
    throw new NotFoundError('Assignment', assignmentId);
  }

  // Eliminar asignación
  await prisma.assignment.delete({
    where: { id: assignmentId },
  });

  return noContentResponse();
}
