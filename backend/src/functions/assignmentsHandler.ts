import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { prisma } from '../lib/prisma';
import { successResponse, errorResponse, createdResponse, noContentResponse, optionsResponse } from '../lib/response';
import { handleError, NotFoundError, ValidationError, BusinessRuleError } from '../lib/errors';
import { validateUUID } from '../lib/validators';

/**
 * Lambda Handler para operaciones CRUD de Asignaciones/Tareas
 * Maneja: GET (list/single), POST (create), PUT (update), DELETE
 * 
 * Reglas de negocio importantes:
 * - Un recurso solo puede ser asignado a un skill que posee (si se especifica skillName)
 * - Las horas asignadas no pueden exceder la capacidad disponible del recurso (si se especifica resourceId)
 * - Las tareas pueden existir sin recurso asignado (resourceId nullable)
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const method = event.httpMethod;
  const pathParameters = event.pathParameters || {};
  const assignmentId = pathParameters.id;

  try {
    // Handle OPTIONS request for CORS preflight
    if (method === 'OPTIONS') {
      return optionsResponse();
    }

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

      case 'PUT':
        // PUT /assignments/{id} - Actualizar asignación
        if (!assignmentId) {
          return errorResponse('Assignment ID is required for update', 400);
        }
        return await updateAssignment(assignmentId, event.body);

      case 'DELETE':
        // DELETE /assignments/{id} - Eliminar asignación individual
        // DELETE /assignments?projectId=X - Eliminar todas las asignaciones de un proyecto
        if (assignmentId) {
          return await deleteAssignment(assignmentId);
        } else if (event.queryStringParameters?.projectId) {
          return await deleteProjectAssignments(event.queryStringParameters.projectId);
        } else {
          return errorResponse('Assignment ID or projectId query parameter is required for delete', 400);
        }

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
 * GET /assignments - Listar asignaciones/tareas con filtros opcionales
 */
async function listAssignments(queryParams: Record<string, string | undefined>): Promise<APIGatewayProxyResult> {
  const { projectId, resourceId, month, year, skillName } = queryParams;

  const assignments = await prisma.assignment.findMany({
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

  return successResponse({
    assignments,
    count: assignments.length,
  });
}

/**
 * GET /assignments/{id} - Obtener asignación/tarea por ID
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
      project: true,
      resource: {
        include: {
          resourceSkills: true,
        },
      },
    },
  });

  if (!assignment) {
    throw new NotFoundError('Assignment', assignmentId);
  }

  return successResponse(assignment);
}

/**
 * POST /assignments - Crear nueva asignación/tarea
 * 
 * Soporta dos modos:
 * - Asignación diaria (date): Para tracking diario de horas por tarea
 * - Asignación mensual (month/year): Sistema legacy para estimaciones mensuales
 * 
 * Valida reglas de negocio:
 * 1. Si se especifica resourceId y skillName, el recurso debe tener ese skill
 * 2. Si se especifica resourceId, las horas asignadas no deben exceder la capacidad disponible
 * 3. El título es obligatorio
 * 4. Debe especificar date O (month + year)
 */
async function createAssignment(body: string | null): Promise<APIGatewayProxyResult> {
  if (!body) {
    return errorResponse('Request body is required', 400);
  }

  const data = JSON.parse(body);

  // Validar datos básicos
  if (!data.projectId) {
    return errorResponse('projectId is required', 400);
  }
  if (!data.title) {
    return errorResponse('title is required', 400);
  }
  
  // Verificar que tenga date O (month + year)
  const hasDate = !!data.date;
  const hasMonthYear = data.month && data.year;
  
  if (!hasDate && !hasMonthYear) {
    return errorResponse('Either date or (month and year) is required', 400);
  }
  
  if (!data.hours || data.hours <= 0) {
    return errorResponse('hours must be greater than 0', 400);
  }

  // Verificar que el proyecto exista
  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
  });

  if (!project) {
    return errorResponse(`Project with ID '${data.projectId}' not found`, 404);
  }

  // Si se especifica resourceId, verificar que el recurso exista y esté activo
  let resource = null;
  if (data.resourceId) {
    resource = await prisma.resource.findUnique({
      where: { id: data.resourceId },
      include: {
        resourceSkills: true,
      },
    });

    if (!resource) {
      return errorResponse(`Resource with ID '${data.resourceId}' not found`, 404);
    }

    if (!resource.active) {
      return errorResponse('Cannot assign inactive resource to project', 400);
    }

    // REGLA DE NEGOCIO: Si se especifica skillName, verificar que el recurso tenga ese skill
    if (data.skillName) {
      const hasSkill = resource.resourceSkills.some(
        (rs: any) => rs.skillName === data.skillName
      );

      if (!hasSkill) {
        throw new BusinessRuleError(
          `Resource '${resource.name}' does not have the skill '${data.skillName}'`,
          'RESOURCE_SKILL_MISMATCH'
        );
      }
    }

    // VALIDACIÓN DE CAPACIDAD
    if (hasDate) {
      // Para asignaciones diarias, validar capacidad por día
      const assignmentDate = new Date(data.date);
      
      // Calcular horas ya asignadas ese día específico
      const existingDailyAssignments = await prisma.assignment.findMany({
        where: {
          resourceId: data.resourceId,
          date: assignmentDate,
        },
      });

      const assignedHoursToday = existingDailyAssignments.reduce(
        (sum: number, assignment: any) => sum + Number(assignment.hours),
        0
      );

      // Capacidad por defecto diaria: 8 horas (puede ser configurable)
      const dailyCapacity = 8; // TODO: Obtener de configuración o tabla de capacidad diaria
      
      // REGLA DE NEGOCIO: Verificar que no se exceda la capacidad diaria
      if (assignedHoursToday + data.hours > dailyCapacity) {
        throw new BusinessRuleError(
          `Assignment would exceed daily resource capacity for ${assignmentDate.toISOString().split('T')[0]}. Available: ${dailyCapacity - assignedHoursToday} hours, Requested: ${data.hours} hours, Assigned: ${assignedHoursToday} hours`,
          'DAILY_CAPACITY_EXCEEDED'
        );
      }
    } else if (hasMonthYear) {
      // Para asignaciones mensuales (legacy), validar capacidad mensual
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

      // REGLA DE NEGOCIO: Verificar que no se exceda la capacidad mensual
      if (assignedHours + data.hours > totalCapacity) {
        throw new BusinessRuleError(
          `Assignment would exceed monthly resource capacity. Available: ${totalCapacity - assignedHours} hours, Requested: ${data.hours} hours`,
          'CAPACITY_EXCEEDED'
        );
      }
    }
  }

  // Crear asignación/tarea
  const assignment = await prisma.assignment.create({
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

  return createdResponse(assignment);
}

/**
 * PUT /assignments/{id} - Actualizar asignación/tarea
 */
async function updateAssignment(assignmentId: string, body: string | null): Promise<APIGatewayProxyResult> {
  // Validar UUID
  try {
    validateUUID(assignmentId, 'assignmentId');
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

  // Verificar que la asignación exista
  const existingAssignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
  });

  if (!existingAssignment) {
    throw new NotFoundError('Assignment', assignmentId);
  }

  // Si se especifica resourceId, verificar que el recurso exista y esté activo
  if (data.resourceId) {
    const resource = await prisma.resource.findUnique({
      where: { id: data.resourceId },
      include: {
        resourceSkills: true,
      },
    });

    if (!resource) {
      return errorResponse(`Resource with ID '${data.resourceId}' not found`, 404);
    }

    if (!resource.active) {
      return errorResponse('Cannot assign inactive resource to project', 400);
    }

    // REGLA DE NEGOCIO: Si se especifica skillName, verificar que el recurso tenga ese skill
    if (data.skillName) {
      const hasSkill = resource.resourceSkills.some(
        (rs: any) => rs.skillName === data.skillName
      );

      if (!hasSkill) {
        throw new BusinessRuleError(
          `Resource '${resource.name}' does not have the skill '${data.skillName}'`,
          'RESOURCE_SKILL_MISMATCH'
        );
      }
    }
  }

  // Actualizar asignación
  const updatedAssignment = await prisma.assignment.update({
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

  return successResponse(updatedAssignment);
}

/**
 * DELETE /assignments?projectId=X - Eliminar todas las asignaciones de un proyecto
 * Útil para operación "replace all" del modal de tareas
 */
async function deleteProjectAssignments(projectId: string): Promise<APIGatewayProxyResult> {
  console.log('Deleting all assignments for project:', projectId);
  
  // Contar cuántas asignaciones tiene el proyecto
  const count = await prisma.assignment.count({
    where: { projectId },
  });
  
  console.log('Found', count, 'assignments to delete');
  
  // Eliminar todas las asignaciones del proyecto
  const result = await prisma.assignment.deleteMany({
    where: { projectId },
  });
  
  console.log('Deleted', result.count, 'assignments');
  
  return successResponse({
    message: `Deleted ${result.count} assignments from project`,
    deletedCount: result.count,
  });
}

/**
 * DELETE /assignments/{id} - Eliminar asignación individual
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
