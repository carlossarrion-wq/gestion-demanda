"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forbiddenResponse = exports.unauthorizedResponse = exports.notFoundResponse = exports.validationErrorResponse = exports.noContentResponse = exports.createdResponse = exports.optionsResponse = exports.errorResponse = exports.successResponse = void 0;
const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,x-user-team',
};
const successResponse = (data, statusCode = 200, additionalHeaders) => {
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
exports.successResponse = successResponse;
const errorResponse = (message, statusCode = 500, error, additionalHeaders) => {
    const errorBody = {
        success: false,
        error: {
            message,
            statusCode,
        },
    };
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
exports.errorResponse = errorResponse;
const optionsResponse = () => {
    return {
        statusCode: 200,
        headers: corsHeaders,
        body: '',
    };
};
exports.optionsResponse = optionsResponse;
const createdResponse = (data, location) => {
    const headers = location ? { Location: location } : undefined;
    return (0, exports.successResponse)(data, 201, headers);
};
exports.createdResponse = createdResponse;
const noContentResponse = () => {
    return {
        statusCode: 204,
        headers: corsHeaders,
        body: '',
    };
};
exports.noContentResponse = noContentResponse;
const validationErrorResponse = (errors) => {
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
exports.validationErrorResponse = validationErrorResponse;
const notFoundResponse = (resource, id) => {
    return (0, exports.errorResponse)(`${resource} with id '${id}' not found`, 404);
};
exports.notFoundResponse = notFoundResponse;
const unauthorizedResponse = (message = 'Unauthorized') => {
    return (0, exports.errorResponse)(message, 401);
};
exports.unauthorizedResponse = unauthorizedResponse;
const forbiddenResponse = (message = 'Forbidden') => {
    return (0, exports.errorResponse)(message, 403);
};
exports.forbiddenResponse = forbiddenResponse;
//# sourceMappingURL=response.js.map