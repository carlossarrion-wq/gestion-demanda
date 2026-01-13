"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertInRange = exports.assertInOptions = exports.assertRequired = exports.handleError = exports.BusinessRuleError = exports.ForbiddenError = exports.UnauthorizedError = exports.ConflictError = exports.DatabaseError = exports.NotFoundError = exports.ValidationError = void 0;
class ValidationError extends Error {
    constructor(message, validationErrors) {
        super(message);
        this.statusCode = 400;
        this.name = 'ValidationError';
        this.validationErrors = validationErrors;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends Error {
    constructor(resource, id) {
        super(`${resource} with id '${id}' not found`);
        this.statusCode = 404;
        this.name = 'NotFoundError';
        this.resource = resource;
        this.id = id;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.NotFoundError = NotFoundError;
class DatabaseError extends Error {
    constructor(message, originalError) {
        super(message);
        this.statusCode = 500;
        this.name = 'DatabaseError';
        this.originalError = originalError;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.DatabaseError = DatabaseError;
class ConflictError extends Error {
    constructor(message, field) {
        super(message);
        this.statusCode = 409;
        this.name = 'ConflictError';
        this.field = field;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ConflictError = ConflictError;
class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized') {
        super(message);
        this.statusCode = 401;
        this.name = 'UnauthorizedError';
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends Error {
    constructor(message = 'Forbidden') {
        super(message);
        this.statusCode = 403;
        this.name = 'ForbiddenError';
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ForbiddenError = ForbiddenError;
class BusinessRuleError extends Error {
    constructor(message, rule) {
        super(message);
        this.statusCode = 422;
        this.name = 'BusinessRuleError';
        this.rule = rule;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.BusinessRuleError = BusinessRuleError;
const handleError = (error) => {
    console.error('Error occurred:', error);
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
    if (error.code) {
        return handlePrismaError(error);
    }
    return {
        statusCode: 500,
        message: 'Internal server error',
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined,
    };
};
exports.handleError = handleError;
const handlePrismaError = (error) => {
    switch (error.code) {
        case 'P2002':
            const field = error.meta?.target?.[0] || 'field';
            return {
                statusCode: 409,
                message: `A record with this ${field} already exists`,
                details: { field },
            };
        case 'P2025':
            return {
                statusCode: 404,
                message: 'Record not found',
            };
        case 'P2003':
            return {
                statusCode: 400,
                message: 'Invalid reference to related record',
            };
        case 'P2014':
            return {
                statusCode: 400,
                message: 'Required relation violation',
            };
        case 'P2000':
            return {
                statusCode: 400,
                message: 'Value too long for field',
            };
        case 'P2001':
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
const assertRequired = (value, fieldName) => {
    if (value === null || value === undefined || value === '') {
        throw new ValidationError(`${fieldName} is required`);
    }
};
exports.assertRequired = assertRequired;
const assertInOptions = (value, options, fieldName) => {
    if (!options.includes(value)) {
        throw new ValidationError(`${fieldName} must be one of: ${options.join(', ')}`);
    }
};
exports.assertInOptions = assertInOptions;
const assertInRange = (value, min, max, fieldName) => {
    if (value < min || value > max) {
        throw new ValidationError(`${fieldName} must be between ${min} and ${max}`);
    }
};
exports.assertInRange = assertInRange;
//# sourceMappingURL=errors.js.map