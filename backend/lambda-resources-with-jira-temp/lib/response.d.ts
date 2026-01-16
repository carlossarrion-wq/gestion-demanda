export interface APIResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}
export declare const successResponse: <T>(data: T, statusCode?: number, additionalHeaders?: Record<string, string>) => APIResponse;
export declare const errorResponse: (message: string, statusCode?: number, error?: any, additionalHeaders?: Record<string, string>) => APIResponse;
export declare const optionsResponse: () => APIResponse;
export declare const createdResponse: <T>(data: T, location?: string) => APIResponse;
export declare const noContentResponse: () => APIResponse;
export declare const validationErrorResponse: (errors: Array<{
    field: string;
    message: string;
}>) => APIResponse;
export declare const notFoundResponse: (resource: string, id: string) => APIResponse;
export declare const unauthorizedResponse: (message?: string) => APIResponse;
export declare const forbiddenResponse: (message?: string) => APIResponse;
//# sourceMappingURL=response.d.ts.map