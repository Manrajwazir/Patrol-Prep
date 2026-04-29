// infra/lambdas/transcribe.ts
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } from "@aws-sdk/client-transcribe";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

interface TranscribeResult {
    results: {
        transcripts: { transcript: string }[];
    };
}

const transcribe = new TranscribeClient({ region: "ca-central-1" });
const s3 = new S3Client({ region: "ca-central-1" });

const HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const body = JSON.parse(event.body || "{}");
        const { audioBase64, languageCode = "en-US" } = body;

        const buffer = Buffer.from(audioBase64, "base64");
        const key = `voice-input/${Date.now()}.webm`;

        await s3.send(new PutObjectCommand({
            Bucket: process.env.AUDIO_BUCKET!,
            Key: key,
            Body: buffer,
            ContentType: "audio/webm",
        }));

        const jobName = `vc-${Date.now()}`;
        await transcribe.send(new StartTranscriptionJobCommand({
            TranscriptionJobName: jobName,
            Media: { MediaFileUri: `s3://${process.env.AUDIO_BUCKET}/${key}` },
            LanguageCode: languageCode as any,
            MediaFormat: "webm",
        }));

        // Poll for completion
        while (true) {
            await new Promise(r => setTimeout(r, 1500));
            const res = await transcribe.send(new GetTranscriptionJobCommand({
                TranscriptionJobName: jobName,
            }));
            const status = res.TranscriptionJob?.TranscriptionJobStatus;
            if (status === "COMPLETED") {
                const uri = res.TranscriptionJob!.Transcript!.TranscriptFileUri!;
                const data = await fetch(uri).then(r => r.json()) as TranscribeResult;
                return {
                    statusCode: 200,
                    headers: HEADERS,
                    body: JSON.stringify({ text: data.results.transcripts[0].transcript }),
                };
            }
            if (status === "FAILED") {
                throw new Error("Transcribe job failed");
            }
        }
    } catch (err: any) {
        console.error("transcribe error:", err);
        return {
            statusCode: 500,
            headers: HEADERS,
            body: JSON.stringify({ error: err.message }),
        };
    }
};