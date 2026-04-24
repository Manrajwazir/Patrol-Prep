// infra/lambdas/get.ts
// GET /incidents/{id} → returns one incident's full detail.

import type { APIGatewayProxyHandler } from "aws-lambda";

export const handler: APIGatewayProxyHandler = async (event) => {
    const id = event.pathParameters?.id;

    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ id, stub: true }),
    };
};