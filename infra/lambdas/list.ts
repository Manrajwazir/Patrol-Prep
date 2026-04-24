// infra/lambdas/list.ts
// GET /incidents → returns all incidents for the supervisor dashboard.

import type { APIGatewayProxyHandler } from "aws-lambda";

export const handler: APIGatewayProxyHandler = async () => {
    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ incidents: [], stub: true }),
    };
};