"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const prisma_1 = require("../lib/prisma");
const response_1 = require("../lib/response");
const errors_1 = require("../lib/errors");
const handler = async (event) => {
    const method = event.httpMethod;
    if (method === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,x-user-team',
            },
            body: '',
        };
    }
    try {
        if (method === 'GET') {
            return await listStatuses();
        }
        return (0, response_1.errorResponse)(`Method ${method} not allowed`, 405);
    }
    catch (error) {
        console.error('Error in statusesHandler:', error);
        const { statusCode, message } = (0, errors_1.handleError)(error);
        return (0, response_1.errorResponse)(message, statusCode, error);
    }
};
exports.handler = handler;
async function listStatuses() {
    const statuses = await prisma_1.prisma.status.findMany({
        select: {
            id: true,
            name: true,
            order: true,
        },
        orderBy: {
            order: 'asc',
        },
    });
    return (0, response_1.successResponse)(statuses);
}
//# sourceMappingURL=statusesHandler.js.map