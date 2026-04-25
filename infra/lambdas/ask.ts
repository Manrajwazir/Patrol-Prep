// infra/lambdas/ask.ts
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrock = new BedrockRuntimeClient({ region: "us-west-2" });

const HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
};

const SYSTEM_PROMPT = `You are a tutor for Alberta security guard students. Answer the student's
question using ONLY the provided manual context. If the manual doesn't cover
the question, say so honestly. Respond in the requested language.
Keep response under 100 words. Plain prose, no markdown.`;

// Static manual context covering the most exam-relevant topics.
// This gives Bedrock grounding without needing full RAG for the hackathon.
const MANUAL_CONTEXT = `
Section 25 of the Criminal Code: Every one who is required or authorized by law to do anything 
in the administration or enforcement of the law is, if he acts on reasonable grounds, justified 
in doing what he is required or authorized to do and in using as much force as is necessary for 
that purpose. Section 26: Every one who is authorized by law to use force is criminally 
responsible for any excess thereof.

Section 494 Criminal Code — Arrest without warrant: Any one may arrest without warrant a person 
whom he finds committing an indictable offence. An indictable offence is a serious offence such 
as break and enter or theft over $5,000. A summary conviction offence is a less serious offence. 
After making a citizen's arrest, you must forthwith deliver the person to a peace officer.

Charter of Rights: Section 8 — right to be secure against unreasonable search or seizure. 
Section 9 — right not to be arbitrarily detained or imprisoned. Section 10 — on arrest or 
detention, the right to be informed promptly of reasons and to retain and instruct counsel 
without delay.

As a security professional, you have no more or no fewer rights than any other citizen. Your 
primary duty is to safeguard the people and property you have been assigned to protect. Wherever 
possible, do not make an arrest yourself — call the police and be a good witness.

Reasonable grounds: facts and information available in a given situation that would lead the 
average person to conclude a criminal act has occurred.
`.trim();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const body = JSON.parse(event.body || "{}");
        const { question, language = "English" } = body;

        const userMessage = `
Student question: ${question}
Relevant manual section: ${MANUAL_CONTEXT}
Target language: ${language}
`.trim();

        const response = await bedrock.send(new ConverseCommand({
            modelId: "us.anthropic.claude-sonnet-4-5-20250929-v1:0",
            system: [{ text: SYSTEM_PROMPT }],
            messages: [{ role: "user", content: [{ text: userMessage }] }],
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