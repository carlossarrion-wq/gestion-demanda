/**
 * Validadores específicos del dominio de negocio
 * 
 * Estos validadores implementan las reglas de negocio definidas en DEFINICIONES.md
 * y aseguran la integridad de los datos según los requisitos del sistema.
 */

import { ValidationError } from './errors';

/**
 * Tipos de proyecto válidos según DEFINICIONES.md
 */
export const PROJECT_TYPES = ['Proyecto', 'Evolutivo'] as const;
export type ProjectType = typeof PROJECT_TYPES[number];

/**
 * Prioridades de proyecto válidas según DEFINICIONES.md
 */
export const PROJECT_PRIORITIES = ['muy-alta', 'alta', 'media', 'baja', 'muy-baja'] as const;
export type ProjectPriority = typeof PROJECT_PRIORITIES[number];

/**
 * Estados del ciclo de vida del proyecto según DEFINICIONES.md
 */
export const PROJECT_STATUSES = [
  'Idea',
  'Conceptualización',
  'Diseño Detallado',
  'Viabilidad Técnico-Económica',
  'Construcción y Pruebas / Desarrollo',
  'Implantación',
  'Finalizado'
] as const;
export type ProjectStatus = typeof PROJECT_STATUSES[number];

/**
 * Skills disponibles según DEFINICIONES.md
 */
export const SKILLS = [
  'PM',
  'Conceptualización',
  'Análisis',
  'Construcción',
  'QA',
  'General',
  'Diseño',
  'Project Management'
] as const;
export type SkillName = typeof SKILLS[number];

/**
 * Dominios funcionales según DEFINICIONES.md
 */
export const DOMAINS = [
  'Atención',
  'Facturación y Cobros',
  'Integración',
  'Datos',
  'Ventas | Contratación y SW',
  'Operación de Sistemas y Ciberseguridad'
] as const;
export type DomainName = typeof DOMAINS[number];

/**
 * Niveles de proficiencia para skills
 */
export const PROFICIENCY_LEVELS = ['junior', 'mid', 'senior'] as const;
export type ProficiencyLevel = typeof PROFICIENCY_LEVELS[number];

/**
 * Capacidad por defecto de un recurso (horas/mes) según DEFINICIONES.md
 */
export const DEFAULT_CAPACITY_HOURS = 160;

/**
 * Interfaz para datos de proyecto a validar
 */
export interface ProjectData {
  code: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  startDate?: Date | string;
  endDate?: Date | string;
  statusId?: string;
  domainId?: string;
}

/**
 * Interfaz para datos de recurso a validar
 */
export interface ResourceData {
  code: string;
  name: string;
  email?: string;
  defaultCapacity?: number;
  active?: boolean;
}

/**
 * Interfaz para datos de asignación a validar
 */
export interface AssignmentData {
  projectId: string;
  resourceId: string;
  skillId: string;
  month: number;
  year: number;
  hours: number;
}

/**
 * Interfaz para datos de capacidad a validar
 */
export interface CapacityData {
  resourceId: string;
  month: number;
  year: number;
  totalHours: number;
}

/**
 * Valida los datos de un proyecto
 * 
 * @param data - Datos del proyecto a validar
 * @throws ValidationError si los datos no son válidos
 */
export const validateProjectData = (data: Partial<ProjectData>): void => {
  const errors: Array<{ field: string; message: string }> = [];

  // Validar campos requeridos
  if (!data.code) {
    errors.push({ field: 'code', message: 'Project code is required' });
  } else if (data.code.length > 50) {
    errors.push({ field: 'code', message: 'Project code must be 50 characters or less' });
  }

  if (!data.title) {
    errors.push({ field: 'title', message: 'Project title is required' });
  } else if (data.title.length > 255) {
    errors.push({ field: 'title', message: 'Project title must be 255 characters or less' });
  }

  // Validar tipo de proyecto
  if (data.type && !PROJECT_TYPES.includes(data.type as ProjectType)) {
    errors.push({
      field: 'type',
      message: `Project type must be one of: ${PROJECT_TYPES.join(', ')}`
    });
  }

  // Validar prioridad
  if (data.priority && !PROJECT_PRIORITIES.includes(data.priority as ProjectPriority)) {
    errors.push({
      field: 'priority',
      message: `Project priority must be one of: ${PROJECT_PRIORITIES.join(', ')}`
    });
  }

  // Validar fechas
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    
    if (isNaN(start.getTime())) {
      errors.push({ field: 'startDate', message: 'Invalid start date format' });
    }
    
    if (isNaN(end.getTime())) {
      errors.push({ field: 'endDate', message: 'Invalid end date format' });
    }
    
    if (start > end) {
      errors.push({ field: 'endDate', message: 'End date must be after start date' });
    }
  }

  if (errors.length > 0) {
    throw new ValidationError('Project validation failed', errors);
  }
};

/**
 * Valida los datos de un recurso
 * 
 * @param data - Datos del recurso a validar
 * @throws ValidationError si los datos no son válidos
 */
export const validateResourceData = (data: Partial<ResourceData>): void => {
  const errors: Array<{ field: string; message: string }> = [];

  // Validar campos requeridos
  if (!data.code) {
    errors.push({ field: 'code', message: 'Resource code is required' });
  } else if (data.code.length > 50) {
    errors.push({ field: 'code', message: 'Resource code must be 50 characters or less' });
  }

  if (!data.name) {
    errors.push({ field: 'name', message: 'Resource name is required' });
  } else if (data.name.length > 255) {
    errors.push({ field: 'name', message: 'Resource name must be 255 characters or less' });
  }

  // Validar email si se proporciona
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }
    if (data.email.length > 255) {
      errors.push({ field: 'email', message: 'Email must be 255 characters or less' });
    }
  }

  // Validar capacidad por defecto
  if (data.defaultCapacity !== undefined) {
    if (data.defaultCapacity < 0) {
      errors.push({ field: 'defaultCapacity', message: 'Default capacity must be non-negative' });
    }
    if (data.defaultCapacity > 744) { // Máximo horas en un mes (31 días * 24 horas)
      errors.push({ field: 'defaultCapacity', message: 'Default capacity exceeds maximum hours in a month' });
    }
  }

  if (errors.length > 0) {
    throw new ValidationError('Resource validation failed', errors);
  }
};

/**
 * Valida los datos de una asignación
 * 
 * @param data - Datos de la asignación a validar
 * @throws ValidationError si los datos no son válidos
 */
export const validateAssignmentData = (data: Partial<AssignmentData>): void => {
  const errors: Array<{ field: string; message: string }> = [];

  // Validar campos requeridos
  if (!data.projectId) {
    errors.push({ field: 'projectId', message: 'Project ID is required' });
  }

  if (!data.resourceId) {
    errors.push({ field: 'resourceId', message: 'Resource ID is required' });
  }

  if (!data.skillId) {
    errors.push({ field: 'skillId', message: 'Skill ID is required' });
  }

  // Validar mes (1-12)
  if (data.month === undefined) {
    errors.push({ field: 'month', message: 'Month is required' });
  } else if (data.month < 1 || data.month > 12) {
    errors.push({ field: 'month', message: 'Month must be between 1 and 12' });
  }

  // Validar año
  if (data.year === undefined) {
    errors.push({ field: 'year', message: 'Year is required' });
  } else if (data.year < 2000 || data.year > 2100) {
    errors.push({ field: 'year', message: 'Year must be between 2000 and 2100' });
  }

  // Validar horas
  if (data.hours === undefined) {
    errors.push({ field: 'hours', message: 'Hours is required' });
  } else if (data.hours < 0) {
    errors.push({ field: 'hours', message: 'Hours must be non-negative' });
  } else if (data.hours > 744) { // Máximo horas en un mes
    errors.push({ field: 'hours', message: 'Hours exceeds maximum hours in a month' });
  }

  if (errors.length > 0) {
    throw new ValidationError('Assignment validation failed', errors);
  }
};

/**
 * Valida los datos de capacidad
 * 
 * @param data - Datos de capacidad a validar
 * @throws ValidationError si los datos no son válidos
 */
export const validateCapacityData = (data: Partial<CapacityData>): void => {
  const errors: Array<{ field: string; message: string }> = [];

  // Validar campos requeridos
  if (!data.resourceId) {
    errors.push({ field: 'resourceId', message: 'Resource ID is required' });
  }

  // Validar mes (1-12)
  if (data.month === undefined) {
    errors.push({ field: 'month', message: 'Month is required' });
  } else if (data.month < 1 || data.month > 12) {
    errors.push({ field: 'month', message: 'Month must be between 1 and 12' });
  }

  // Validar año
  if (data.year === undefined) {
    errors.push({ field: 'year', message: 'Year is required' });
  } else if (data.year < 2000 || data.year > 2100) {
    errors.push({ field: 'year', message: 'Year must be between 2000 and 2100' });
  }

  // Validar horas totales
  if (data.totalHours === undefined) {
    errors.push({ field: 'totalHours', message: 'Total hours is required' });
  } else if (data.totalHours < 0) {
    errors.push({ field: 'totalHours', message: 'Total hours must be non-negative' });
  } else if (data.totalHours > 744) { // Máximo horas en un mes
    errors.push({ field: 'totalHours', message: 'Total hours exceeds maximum hours in a month' });
  }

  if (errors.length > 0) {
    throw new ValidationError('Capacity validation failed', errors);
  }
};

/**
 * Valida que un UUID tenga el formato correcto
 * 
 * @param uuid - UUID a validar
 * @param fieldName - Nombre del campo (para el mensaje de error)
 * @throws ValidationError si el UUID no es válido
 */
export const validateUUID = (uuid: string, fieldName: string): void => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    throw new ValidationError(`${fieldName} must be a valid UUID`);
  }
};

/**
 * Valida parámetros de query para paginación
 * 
 * @param page - Número de página
 * @param limit - Límite de resultados por página
 * @returns Objeto con page y limit validados
 */
export const validatePaginationParams = (
  page?: string | number,
  limit?: string | number
): { page: number; limit: number } => {
  const parsedPage = typeof page === 'string' ? parseInt(page, 10) : (page || 1);
  const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : (limit || 50);

  if (isNaN(parsedPage) || parsedPage < 1) {
    throw new ValidationError('Page must be a positive integer');
  }

  if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    throw new ValidationError('Limit must be between 1 and 100');
  }

  return { page: parsedPage, limit: parsedLimit };
};
