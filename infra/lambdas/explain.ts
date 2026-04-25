// infra/lambdas/explain.ts
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrock = new BedrockRuntimeClient({ region: "us-west-2" });

const HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
};

const SYSTEM_PROMPT = `You are an expert tutor for Alberta security guard licensing. You help newcomer
students understand Canadian legal concepts by relating them to their cultural
and legal background.

When a student gets a question wrong, you must:
1. Explain WHY the correct answer is correct (clear, simple)
2. Explain the underlying Canadian legal concept in plain terms
3. If relevant, briefly compare to how this concept works in the student's
   country/culture (use general regional knowledge, never claim certainty)
4. End with one memorable rule of thumb
5. Do not use any markdown formatting including asterisks, bold, or bullet points.

Respond in the requested target language (Spanish/Tagalog/Punjabi/English).
Match the language register to the student — clear, encouraging, not condescending.
Keep total response under 150 words. No markdown, no preamble.`;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const body = JSON.parse(event.body || "{}");
        const { question, options, correctAnswer, studentAnswer, manualExcerpt, language, culturalHint } = body;

        const userMessage = `
Question: ${question}
Options: ${JSON.stringify(options)}
Correct answer: ${options[correctAnswer]}
Student's wrong answer: ${options[studentAnswer]}
Manual reference excerpt: ${manualExcerpt}
Target language: ${language}
Student's likely cultural background: ${culturalHint || "newcomer to Canada"}
`.trim();

        const response = await bedrock.send(new ConverseCommand({
            modelId: "us.anthropic.claude-sonnet-4-5-20250929-v1:0",
            system: [{ text: SYSTEM_PROMPT }],
            messages: [{ role: "user", content: [{ text: userMessage }] }],
            inferenceConfig: { maxTokens: 800, temperature: 0.3 }
        }));

        const explanation = response.output?.message?.content?.[0]?.text || "";

        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({ explanation, language, latencyMs: Date.now() }),
        };
    } catch (err: any) {
        console.error("explain error:", err);
        return {
            statusCode: 500,
            headers: HEADERS,
            body: JSON.stringify({ error: err.message }),
        };
    }
};