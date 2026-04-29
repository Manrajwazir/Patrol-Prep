// infra/lambdas/ask.ts
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const bedrock = new BedrockRuntimeClient({ region: "ca-central-1" });
const s3 = new S3Client({ region: "ca-central-1" });

const HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
};

const SYSTEM_PROMPT = `You are a tutor for Alberta security guard students. Answer the student's
question using ONLY the provided manual context. If the manual doesn't cover
the question, say so honestly. Respond in the requested language.
Keep response under 100 words. Plain prose, no markdown.`;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const body = JSON.parse(event.body || "{}");
        const { question, language = "English" } = body;

        const bucket = process.env.MANUAL_BUCKET;
        const key = process.env.MANUAL_KEY;

        if (!bucket || !key) {
            throw new Error("MANUAL_BUCKET or MANUAL_KEY environment variable is not set.");
        }

        // Fetch manual from S3
        console.log(`Fetching ${key} from bucket ${bucket}...`);
        const s3Response = await s3.send(new GetObjectCommand({
            Bucket: bucket,
            Key: key
        }));

        const isPdf = key.toLowerCase().endsWith('.pdf');
        const format = isPdf ? "pdf" : "txt";

        const docBytes = await s3Response.Body?.transformToByteArray();
        if (!docBytes) throw new Error("Failed to read document bytes from S3");

        console.log(`Successfully loaded document (${docBytes.length} bytes)`);

        const response = await bedrock.send(new ConverseCommand({
            modelId: "us.anthropic.claude-sonnet-4-5-20250929-v1:0",
            system: [{ text: SYSTEM_PROMPT }],
            messages: [{
                role: "user",
                content: [
                    {
                        document: {
                            name: "manual",
                            format: format as any,
                            source: {
                                bytes: docBytes
                            }
                        }
                    },
                    { text: `Student question: ${question}\nTarget language: ${language}` }
                ]
            }],
            inferenceConfig: { maxTokens: 600, temperature: 0.3 },
        }));

        const answer = response.output?.message?.content?.[0]?.text || "";

        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({ answer, language }),
        };
    } catch (err: any) {
        console.error("ask error:", err);
        return {
            statusCode: 500,
            headers: HEADERS,
            body: JSON.stringify({ error: err.message }),
        };
    }
};