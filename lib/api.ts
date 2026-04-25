// lib/api.ts
// Step 16 — add ?demo=1 mode with pre-baked responses for guaranteed demo speed.
const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

function isDemoMode(): boolean {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("demo") === "1";
}

// Pre-baked explain responses by language.
// Used when ?demo=1 is in the URL — no Bedrock call, responds in ~800ms.
const DEMO_EXPLAIN: Record<string, string> = {
    English:
        "The correct answer is B. Under Section 25 of the Criminal Code, a security guard can only use force when they have reasonable grounds and the force is no more than necessary. 'Believing a crime is being committed' alone is not sufficient — you need both reasonable grounds AND proportional force. Think of it as a two-key lock: both keys must turn. Rule of thumb: if you're unsure whether force is justified, it probably isn't.",
    Spanish:
        "La respuesta correcta es B. Según la Sección 25 del Código Penal de Canadá, un guardia de seguridad sólo puede usar la fuerza cuando tiene motivos razonables Y la fuerza no es mayor de lo necesario. A diferencia de algunos marcos de América Latina, en Canadá la ley exige que ambas condiciones se cumplan simultáneamente. Regla de oro: si dudas si la fuerza está justificada, probablemente no lo está.",
    Tagalog:
        "Ang tamang sagot ay B. Ayon sa Seksyon 25 ng Criminal Code ng Canada, ang isang security guard ay maaari lamang gumamit ng puwersa kapag mayroon silang makatwirang dahilan AT ang puwersa ay hindi higit sa kinakailangan. Hindi tulad ng ilang sitwasyon sa Pilipinas kung saan ang pagprotekta ng ari-arian ay maaaring maging dahilan, sa Canada kailangan mong matugunan ang dalawang kondisyon. Tandaan: dalawang susi ang kailangan para buksan ang pintuan.",
    Punjabi:
        "ਸਹੀ ਜਵਾਬ B ਹੈ। ਕੈਨੇਡਾ ਦੇ ਕ੍ਰਿਮੀਨਲ ਕੋਡ ਦੀ ਧਾਰਾ 25 ਦੇ ਅਨੁਸਾਰ, ਇੱਕ ਸੁਰੱਖਿਆ ਗਾਰਡ ਸਿਰਫ਼ ਉਦੋਂ ਹੀ ਤਾਕਤ ਵਰਤ ਸਕਦਾ ਹੈ ਜਦੋਂ ਉਸ ਕੋਲ ਵਾਜਬ ਕਾਰਨ ਹੋਣ ਅਤੇ ਤਾਕਤ ਲੋੜ ਤੋਂ ਵੱਧ ਨਾ ਹੋਵੇ। ਯਾਦ ਰੱਖੋ: ਦੋ ਸ਼ਰਤਾਂ ਦੋਵੇਂ ਪੂਰੀਆਂ ਹੋਣੀਆਂ ਚਾਹੀਦੀਆਂ ਹਨ।",
};

// Pre-baked drill questions (3) for demo mode
const DEMO_DRILL = {
    questions: [
        {
            question: "A security guard observes someone shoplifting. Under what conditions can they use force to detain the person?",
            options: [
                "Any time they witness a crime being committed",
                "When they have reasonable grounds and use only necessary force",
                "When their employer's policy permits physical intervention",
                "Only if the police have been called first",
            ],
            correctAnswer: 1,
            explanation: "Section 25 requires both reasonable grounds AND proportional force. Witnessing a crime alone is not sufficient.",
        },
        {
            question: "A security guard chases a fleeing suspect and tackles them to the ground. The suspect had only stolen a $5 item. This action is:",
            options: [
                "Justified because the guard witnessed the theft",
                "Justified because the suspect was fleeing",
                "Not justified because the force was not proportional to the situation",
                "Justified if the employer authorized physical interventions",
            ],
            correctAnswer: 2,
            explanation: "Force must be no more than necessary. Tackling someone over a $5 theft is disproportionate and likely unlawful.",
        },
        {
            question: "Which of the following best describes the 'reasonable grounds' standard in Section 25?",
            options: [
                "A subjective feeling that something is wrong",
                "An objective belief based on facts a reasonable person would accept",
                "Any suspicion that a crime has been or will be committed",
                "Confirmation from a supervisor that force is authorized",
            ],
            correctAnswer: 1,
            explanation: "Reasonable grounds is an objective standard — what a reasonable person with the same information would believe, not just a gut feeling.",
        },
    ],
};

// Pre-baked ask response for demo
const DEMO_ASK: Record<string, string> = {
    English:
        "An indictable offence is the most serious category of crime in Canada — similar to a felony in the US — and includes offences like murder, robbery, and assault causing bodily harm. A summary conviction offence is less serious and is handled more quickly in court, with lower maximum penalties. For security guards, the distinction matters because the rules around citizen's arrest differ depending on the severity of the offence.",
    Spanish:
        "Un delito procesable (indictable offence) es la categoría más grave en Canadá, similar a un 'delito grave' en América Latina. Un delito de procedimiento sumario (summary offence) es menos grave y se resuelve más rápidamente. Para un guardia de seguridad, esta distinción es importante porque las reglas sobre detención ciudadana varían según la gravedad del delito.",
    Tagalog:
        "Ang indictable offence ay ang pinaka-seryosong kategorya ng krimen sa Canada — katulad ng felony. Ang summary offence ay mas magaan at niresolba nang mas mabilis sa korte. Para sa mga security guard, mahalaga ang pagkakaiba na ito dahil nag-iiba ang mga panuntunan sa citizen's arrest depende sa seryosidad ng krimen.",
    Punjabi:
        "Indictable offence ਕੈਨੇਡਾ ਵਿੱਚ ਸਭ ਤੋਂ ਗੰਭੀਰ ਅਪਰਾਧਾਂ ਦੀ ਸ਼੍ਰੇਣੀ ਹੈ। Summary offence ਘੱਟ ਗੰਭੀਰ ਹੈ। ਸੁਰੱਖਿਆ ਗਾਰਡਾਂ ਲਈ, ਇਹ ਫ਼ਰਕ ਜ਼ਰੂਰੀ ਹੈ ਕਿਉਂਕਿ citizen's arrest ਦੇ ਨਿਯਮ ਅਪਰਾਧ ਦੀ ਗੰਭੀਰਤਾ 'ਤੇ ਨਿਰਭਰ ਕਰਦੇ ਹਨ।",
};

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
        if (isDemoMode()) {
            await new Promise(r => setTimeout(r, 900));
            const lang = payload.language as keyof typeof DEMO_EXPLAIN;
            return {
                explanation: DEMO_EXPLAIN[lang] ?? DEMO_EXPLAIN.English,
                language: payload.language,
                latencyMs: 900,
            };
        }
        const res = await fetch(`${BASE}/explain`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        return res.json();
    },

    async drill(payload: { question: string; concept: string; manualExcerpt: string }) {
        if (isDemoMode()) {
            await new Promise(r => setTimeout(r, 1100));
            return DEMO_DRILL;
        }
        const res = await fetch(`${BASE}/drill`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        return res.json();
    },

    async ask(payload: { question: string; language: string }) {
        if (isDemoMode()) {
            await new Promise(r => setTimeout(r, 800));
            const lang = payload.language as keyof typeof DEMO_ASK;
            return { answer: DEMO_ASK[lang] ?? DEMO_ASK.English, language: payload.language };
        }
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