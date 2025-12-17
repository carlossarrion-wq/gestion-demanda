import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { prisma } from '../lib/prisma';
import { successResponse, errorResponse } from '../lib/response';
import { handleError } from '../lib/errors';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const method = event.httpMethod;

  // Handle CORS preflight
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

    return errorResponse(`Method ${method} not allowed`, 405);
  } catch (error) {
    console.error('Error in statusesHandler:', error);
    const { statusCode, message } = handleError(error);
    return errorResponse(message, statusCode, error);
  }
};

async function listStatuses(): Promise<APIGatewayProxyResult> {
  const statuses = await prisma.status.findMany({
    select: {
      id: true,
      name: true,
      order: true,
    },
    orderBy: {
      order: 'asc',
    },
  });

  return successResponse(statuses);
}
