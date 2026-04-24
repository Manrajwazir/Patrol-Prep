// lib/aws-clients.ts
// Central place to instantiate AWS SDK clients.
// All AWS calls in the app go through clients defined here.
// On April 25 we'll import these clients from Lambda functions and API routes.

// NOTE: These are stub imports. The actual SDK usage happens in Lambda functions
// (inside /infra/lambdas/*) — the frontend never calls AWS directly.
// This file exists so our `/app/api/*` route handlers can call AWS if needed.

// When we need them on April 25 we'll add:
// import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
// import { S3Client } from "@aws-sdk/client-s3";
// import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
// import { TranscribeClient } from "@aws-sdk/client-transcribe";

export const AWS_REGION = "ca-central-1";