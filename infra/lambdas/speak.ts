// infra/lambdas/speak.ts
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";

const polly = new PollyClient({ region: "ca-central-1" });

const HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
};

// Polly does not support Tagalog or Punjabi voices.
// For those languages the explanation text is shown on screen in the target language
// but spoken in English. This is disclosed honestly in the demo.
const VOICE_BY_LANG: Record<string, string> = {
    English: "Joanna",
    Spanish: "Lupe",
    "Français": "Lea",
    French: "Lea",
    Tagalog: "Joanna",
    Punjabi: "Joanna",
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const body = JSON.parse(event.body || "{}");
        const { text, language = "English" } = body;
        const voiceId = VOICE_BY_LANG[language] || "Joanna";

        const response = await polly.send(new SynthesizeSpeechCommand({
            Text: text,
            VoiceId: voiceId as any,
            OutputFormat: "mp3",
            Engine: "neural",
        }));

        const chunks: Uint8Array[] = [];
        for await (const chunk of response.AudioStream as any) {
            chunks.push(chunk);
        }
        const audioBase64 = Buffer.concat(chunks).toString("base64");

        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({ audioBase64, contentType: "audio/mpeg" }),
        };
    } catch (err: any) {
        console.error("speak error:", err);
        return {
            statusCode: 500,
            headers: HEADERS,
            body: JSON.stringify({ error: err.message }),
        };
    }
};