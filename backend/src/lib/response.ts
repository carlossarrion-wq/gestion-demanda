/**
 * Helpers para respuestas HTTP en API Gateway
 * 
 * Estos helpers estandarizan el formato de respuesta de todas las Lambda functions
 * y aseguran que los headers CORS estén configurados correctamente.
 */

export interface APIResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

/**
 * Headers CORS estándar para todas las respuestas
 */
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
};

/**
 * Respuesta exitosa
 * 
 * @param data - Datos a devolver en la respuesta
 * @param statusCode - Código HTTP (default: 200)
 * @param additionalHeaders - Headers adicionales opcionales
 */
export const successResponse = <T>(
  data: T,
  statusCode: number = 200,
  additionalHeaders?: Record<string, string>
): APIResponse => {
  return {
    statusCode,
    headers: {
      ...corsHeaders,
      ...additionalHeaders,
    },
    body: JSON.stringify({
      success: true,
      data,
    }),
  };
};

/**
 * Respuesta de error
 * 
 * @param message - Mensaje de error
 * @param statusCode - Código HTTP (default: 500)
 * @param error - Detalles adicionales del error (solo en desarrollo)
 * @param additionalHeaders - Headers adicionales opcionales
 */
export const errorResponse = (
  message: string,
  statusCode: number = 500,
  error?: any,
  additionalHeaders?: Record<string, string>
): APIResponse => {
  const errorBody: any = {
    success: false,
    error: {
      message,
      statusCode,
    },
  };

  // En desarrollo, incluir detalles adicionales del error
  if (process.env.NODE_ENV !== 'production' && error) {
    errorBody.error.details = error.message || error;
    if (error.stack) {
      errorBody.error.stack = error.stack;
    }
  }

  return {
    statusCode,
    headers: {
      ...corsHeaders,
      ...additionalHeaders,
    },
    body: JSON.stringify(errorBody),
  };
};

/**
 * Respuesta para solicitudes OPTIONS (preflight CORS)
 */
export const optionsResponse = (): APIResponse => {
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: '',
  };
};

/**
 * Respuesta de recurso creado
 * 
 * @param data - Datos del recurso creado
 * @param location - URL del nuevo recurso (opcional)
 */
export const createdResponse = <T>(
  data: T,
  location?: string
): APIResponse => {
  const headers = location ? { Location: location } : undefined;
  return successResponse(data, 201, headers);
};

/**
 * Respuesta sin contenido (para DELETE exitoso)
 */
export const noContentResponse = (): APIResponse => {
  return {
    statusCode: 204,
    headers: corsHeaders,
    body: '',
  };
};

/**
 * Respuesta de validación fallida
 * 
 * @param errors - Array de errores de validación
 */
export const validationErrorResponse = (
  errors: Array<{ field: string; message: string }>
): APIResponse => {
  return {
    statusCode: 400,
    headers: corsHeaders,
    body: JSON.stringify({
      success: false,
      error: {
        message: 'Validation failed',
        statusCode: 400,
        validationErrors: errors,
      },
    }),
  };
};

/**
 * Respuesta de recurso no encontrado
 * 
 * @param resource - Tipo de recurso (ej: "Project", "Resource")
 * @param id - ID del recurso
 */
export const notFoundResponse = (
  resource: string,
  id: string
): APIResponse => {
  return errorResponse(
    `${resource} with id '${id}' not found`,
    404
  );
};

/**
 * Respuesta de no autorizado
 * 
 * @param message - Mensaje de error (opcional)
 */
export const unauthorizedResponse = (
  message: string = 'Unauthorized'
): APIResponse => {
  return errorResponse(message, 401);
};

/**
 * Respuesta de prohibido
 * 
 * @param message - Mensaje de error (opcional)
 */
export const forbiddenResponse = (
  message: string = 'Forbidden'
): APIResponse => {
  return errorResponse(message, 403);
};
