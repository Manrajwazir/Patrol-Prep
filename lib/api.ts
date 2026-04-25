// lib/api.ts
const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export const api = {
    async explain(payload: {
        question: string;
        options: string[];
        correctAnswer: number;
        studentAnswer: number;
        manualExcerpt: string;
        language: string;
        culturalHint?: string;
    }) {
        const res = await fetch(`${BASE}/explain`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        return res.json();
    },

    async drill(payload: { question: string; concept: string; manualExcerpt: string }) {
        const res = await fetch(`${BASE}/drill`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        return res.json();
    },

    async ask(payload: { question: string; language: string }) {
        const res = await fetch(`${BASE}/ask`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        return res.json();
    },

    async transcribe(audioBase64: string, languageCode: string) {
        const res = await fetch(`${BASE}/transcribe`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioBase64, languageCode }),
        });
        return res.json();
    },

    async speak(text: string, language: string) {
        const res = await fetch(`${BASE}/speak`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, language }),
        });
        return res.json();
    },
};