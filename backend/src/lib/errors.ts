/**
 * Clases de error personalizadas y manejador de errores
 * 
 * Define errores específicos del dominio de negocio y proporciona
 * un manejador centralizado para convertir errores en respuestas HTTP.
 */

/**
 * Error de validación de datos
 */
export class ValidationError extends Error {
  public readonly statusCode = 400;
  public readonly validationErrors?: Array<{ field: string; message: string }>;

  constructor(message: string, validationErrors?: Array<{ field: string; message: string }>) {
    super(message);
    this.name = 'ValidationError';
    this.validationErrors = validationErrors;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error de recurso no encontrado
 */
export class NotFoundError extends Error {
  public readonly statusCode = 404;
  public readonly resource: string;
  public readonly id: string;

  constructor(resource: string, id: string) {
    super(`${resource} with id '${id}' not found`);
    this.name = 'NotFoundError';
    this.resource = resource;
    this.id = id;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error de base de datos
 */
export class DatabaseError extends Error {
  public readonly statusCode = 500;
  public readonly originalError?: any;

  constructor(message: string, originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
    this.originalError = originalError;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error de conflicto (ej: violación de constraint único)
 */
export class ConflictError extends Error {
  public readonly statusCode = 409;
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ConflictError';
    this.field = field;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error de autorización
 */
export class UnauthorizedError extends Error {
  public readonly statusCode = 401;

  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error de permisos insuficientes
 */
export class ForbiddenError extends Error {
  public readonly statusCode = 403;

  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error de regla de negocio
 * 
 * Ejemplos:
 * - Asignar más horas de las disponibles en la capacidad del recurso
 * - Asignar un recurso a un skill que no posee
 * - Fechas de proyecto inválidas
 */
export class BusinessRuleError extends Error {
  public readonly statusCode = 422;
  public readonly rule: string;

  constructor(message: string, rule: string) {
    super(message);
    this.name = 'BusinessRuleError';
    this.rule = rule;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Interfaz para el resultado del manejador de errores
 */
export interface ErrorHandlerResult {
  statusCode: number;
  message: string;
  details?: any;
}

/**
 * Manejador centralizado de errores
 * 
 * Convierte diferentes tipos de errores en un formato estándar
 * con el código HTTP apropiado.
 * 
 * @param error - Error a manejar
 * @returns Objeto con statusCode, message y detalles opcionales
 */
export const handleError = (error: any): ErrorHandlerResult => {
  console.error('Error occurred:', error);

  // Errores personalizados de la aplicación
  if (error instanceof ValidationError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      details: error.validationErrors,
    };
  }

  if (error instanceof NotFoundError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
    };
  }

  if (error instanceof ConflictError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      details: error.field ? { field: error.field } : undefined,
    };
  }

  if (error instanceof UnauthorizedError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
    };
  }

  if (error instanceof ForbiddenError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
    };
  }

  if (error instanceof BusinessRuleError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      details: { rule: error.rule },
    };
  }

  if (error instanceof DatabaseError) {
    return {
      statusCode: error.statusCode,
      message: 'Database operation failed',
      details: process.env.NODE_ENV !== 'production' ? error.originalError : undefined,
    };
  }

  // Errores de Prisma
  if (error.code) {
    return handlePrismaError(error);
  }

  // Error genérico
  return {
    statusCode: 500,
    message: 'Internal server error',
    details: process.env.NODE_ENV !== 'production' ? error.message : undefined,
  };
};

/**
 * Manejador específico para errores de Prisma
 * 
 * @param error - Error de Prisma
 * @returns Objeto con statusCode y message apropiados
 */
const handlePrismaError = (error: any): ErrorHandlerResult => {
  switch (error.code) {
    case 'P2002':
      // Violación de constraint único
      const field = error.meta?.target?.[0] || 'field';
      return {
        statusCode: 409,
        message: `A record with this ${field} already exists`,
        details: { field },
      };

    case 'P2025':
      // Registro no encontrado
      return {
        statusCode: 404,
        message: 'Record not found',
      };

    case 'P2003':
      // Violación de foreign key
      return {
        statusCode: 400,
        message: 'Invalid reference to related record',
      };

    case 'P2014':
      // Violación de relación requerida
      return {
        statusCode: 400,
        message: 'Required relation violation',
      };

    case 'P2000':
      // Valor demasiado largo para el campo
      return {
        statusCode: 400,
        message: 'Value too long for field',
      };

    case 'P2001':
      // Registro no encontrado en where condition
      return {
        statusCode: 404,
        message: 'Record not found',
      };

    default:
      return {
        statusCode: 500,
        message: 'Database error',
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined,
      };
  }
};

/**
 * Helper para validar que un valor no sea null o undefined
 * 
 * @param value - Valor a validar
 * @param fieldName - Nombre del campo (para el mensaje de error)
 * @throws ValidationError si el valor es null o undefined
 */
export const assertRequired = (value: any, fieldName: string): void => {
  if (value === null || value === undefined || value === '') {
    throw new ValidationError(`${fieldName} is required`);
  }
};

/**
 * Helper para validar que un valor esté dentro de un conjunto de opciones
 * 
 * @param value - Valor a validar
 * @param options - Array de opciones válidas
 * @param fieldName - Nombre del campo (para el mensaje de error)
 * @throws ValidationError si el valor no está en las opciones
 */
export const assertInOptions = (value: any, options: any[], fieldName: string): void => {
  if (!options.includes(value)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${options.join(', ')}`
    );
  }
};

/**
 * Helper para validar que un número esté en un rango
 * 
 * @param value - Valor a validar
 * @param min - Valor mínimo
 * @param max - Valor máximo
 * @param fieldName - Nombre del campo (para el mensaje de error)
 * @throws ValidationError si el valor está fuera del rango
 */
export const assertInRange = (value: number, min: number, max: number, fieldName: string): void => {
  if (value < min || value > max) {
    throw new ValidationError(
      `${fieldName} must be between ${min} and ${max}`
    );
  }
};
