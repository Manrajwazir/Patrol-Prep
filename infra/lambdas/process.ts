// infra/lambdas/process.ts
// Triggered by S3 when a new audio file lands in the audio bucket.
// On April 25 this will:
//   1. Download audio from S3
//   2. Call Transcribe to convert to text
//   3. Call Bedrock (Claude) to structure it into an incident report
//   4. Optionally call Rekognition on attached photo
//   5. Generate PDF via pdf-lib
//   6. Write everything to DynamoDB + report bucket
//
// Stub for now — just logs and returns.

import type { S3Event } from "aws-lambda";

export const handler = async (event: S3Event) => {
    console.log("process lambda triggered", JSON.stringify(event, null, 2));

    for (const record of event.Records) {
        console.log(`new file: s3://${record.s3.bucket.name}/${record.s3.object.key}`);
    }

    return { statusCode: 200, body: "processed" };
};