// infra/lambdas/drill.ts
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrock = new BedrockRuntimeClient({ region: "ca-central-1" });

const HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
};

const SYSTEM_PROMPT = `Generate 3 multiple-choice practice questions on the same concept as the question
the student just got wrong. Each question must:
- Test the same underlying concept from a different angle
- Have 4 options, exactly one correct
- Be appropriate for Alberta Basic Security Training
- Stay grounded in the manual reference provided

Return ONLY valid JSON. No markdown, no prose preamble.

Schema:
{
  "questions": [
    {
      "question": "string",
      "options": ["string","string","string","string"],
      "correctAnswer": 0,
      "explanation": "1-sentence why-this-is-right"
    }
  ]
}`;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const body = JSON.parse(event.body || "{}");
        const { question, concept, manualExcerpt } = body;

        const userMessage = `
Original question: ${question}
Concept being tested: ${concept}
Manual reference: ${manualExcerpt}
`.trim();

        const response = await bedrock.send(new ConverseCommand({
            modelId: "us.anthropic.claude-sonnet-4-5-20250929-v1:0",
            system: [{ text: SYSTEM_PROMPT }],
            messages: [{ role: "user", content: [{ text: userMessage }] }],
            inferenceConfig: { maxTokens: 1500, temperature: 0.5 }
        }));

        const text = response.output?.message?.content?.[0]?.text || "{}";
        const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(clean);

        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify(parsed),
        };
    } catch (err: any) {
        console.error("drill error:", err);
        return {
            statusCode: 500,
            headers: HEADERS,
            body: JSON.stringify({ error: err.message }),
        };
    }
};