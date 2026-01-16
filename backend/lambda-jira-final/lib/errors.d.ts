export declare class ValidationError extends Error {
    readonly statusCode = 400;
    readonly validationErrors?: Array<{
        field: string;
        message: string;
    }>;
    constructor(message: string, validationErrors?: Array<{
        field: string;
        message: string;
    }>);
}
export declare class NotFoundError extends Error {
    readonly statusCode = 404;
    readonly resource: string;
    readonly id: string;
    constructor(resource: string, id: string);
}
export declare class DatabaseError extends Error {
    readonly statusCode = 500;
    readonly originalError?: any;
    constructor(message: string, originalError?: any);
}
export declare class ConflictError extends Error {
    readonly statusCode = 409;
    readonly field?: string;
    constructor(message: string, field?: string);
}
export declare class UnauthorizedError extends Error {
    readonly statusCode = 401;
    constructor(message?: string);
}
export declare class ForbiddenError extends Error {
    readonly statusCode = 403;
    constructor(message?: string);
}
export declare class BusinessRuleError extends Error {
    readonly statusCode = 422;
    readonly rule: string;
    constructor(message: string, rule: string);
}
export interface ErrorHandlerResult {
    statusCode: number;
    message: string;
    details?: any;
}
export declare const handleError: (error: any) => ErrorHandlerResult;
export declare const assertRequired: (value: any, fieldName: string) => void;
export declare const assertInOptions: (value: any, options: any[], fieldName: string) => void;
export declare const assertInRange: (value: number, min: number, max: number, fieldName: string) => void;
//# sourceMappingURL=errors.d.ts.map