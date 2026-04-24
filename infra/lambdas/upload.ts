// infra/lambdas/upload.ts
// POST /upload → returns a presigned S3 URL so the frontend can
// upload audio directly to S3 without needing AWS credentials.
//
// On April 25 this generates a real presigned URL. For now, returns a stub.

import type { APIGatewayProxyHandler } from "aws-lambda";

export const handler: APIGatewayProxyHandler = async (event) => {
    console.log("upload lambda triggered", event.body);

    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
            url: "https://example.com/placeholder-presigned-url",
            key: "placeholder-key",
            message: "stub response — implemented on April 25",
        }),
    };
};