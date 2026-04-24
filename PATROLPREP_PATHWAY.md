# PatrolPrep — Pathway (Start to Finish)

> One continuous build plan. Doesn't matter if you're doing it tonight or tomorrow. Pick up at whichever step you're on. Every step has clear "done when" criteria.
>
> **Where you are right now:** Infrastructure deployed to workshop AWS account in us-west-2. API Gateway live, returning stub data. Frontend skeleton works. Question bank not generated yet. No Bedrock integration yet. No real product UI yet.
>
> **Where you need to be:** A polished, demoable PatrolPrep at 3:00 PM April 25 with the wrong-answer → contextual explanation → drill flow working in 3 languages, plus voice questions.

---

## How to use this doc

Each step has:
- **What** — the outcome
- **How** — the approach + any code stubs
- **Done when** — a testable success criterion

When using Antigravity or Claude Code to implement: paste the entire step (What/How/Done when) as the prompt. Include the relevant section of `PATROLPREP_PROJECT.md` for context.

---

## STEP 0 — Workshop credentials refresh (do this FIRST every session)

Workshop AWS credentials expire every 4-8 hours. Before doing anything else in any session:

1. Open the workshop credentials page
2. Copy the new Access Key, Secret Key, Session Token
3. Update your CLI:

```powershell
aws configure set aws_access_key_id NEW_KEY --profile hackathon
aws configure set aws_secret_access_key NEW_SECRET --profile hackathon
aws configure set aws_session_token NEW_TOKEN --profile hackathon
```

4. Verify:
```powershell
aws sts get-caller-identity --profile hackathon
```

If it returns the workshop account ID, you're good. If it errors, re-grab credentials.

**Done when:** `aws sts get-caller-identity --profile hackathon` returns the workshop account info.

---

# ═══════════════════════════════════════════════════════════
# PHASE 1 — Question Bank + Bedrock Validation (~90 min)
# ═══════════════════════════════════════════════════════════

This is the highest-leverage work. The product fails without good questions and validated prompts.

## STEP 1 — Generate the 30-question bank

**What:** A `data/questions.json` file with 30 realistic Alberta security training exam questions covering 6 topics (5 each).

**How:**
1. Download the Alberta Basic Security Training Participant Manual PDF from the link organizers sent
2. Open Claude.ai (web UI)
3. Attach the PDF
4. Paste this prompt:

```
You are generating a question bank for an Alberta Basic Security Training
exam prep tool. From the attached participant manual, generate 30 multiple
choice questions covering these 6 topics evenly (5 each):

1. Use of Force (Section 25 of Criminal Code)
2. Lawful Detention and Citizen's Arrest
3. Charter Rights and Freedoms
4. Note-Taking and Incident Reporting
5. Patrol Procedures and Site Security
6. Emergency Response and First Aid

For each question:
- Test a meaningful concept, not trivia
- 4 options, exactly one correct
- Include the manual page reference where possible
- Include a 1-2 sentence excerpt from the manual that supports the answer
- Aim for the difficulty of an actual provincial proficiency exam

Return ONLY a valid JSON object in this schema:
{
  "questions": [
    {
      "id": "q-001",
      "topic": "use_of_force",
      "difficulty": "intermediate",
      "question": "string",
      "options": ["A","B","C","D"],
      "correctAnswer": 0,
      "manualReference": "Section X.Y, page N",
      "manualExcerpt": "string"
    }
  ]
}

No markdown, no preamble, just the JSON.
```

5. Copy Claude's response, save to `data/questions.json`:
```powershell
mkdir D:\projects\Patrol-Prep\data
# Save the JSON to data/questions.json
```

6. Manually QA 5 random questions against the manual. Fix any factual errors.

**Done when:** `data/questions.json` exists with at least 30 questions, JSON parses cleanly, 5 random QA'd questions are factually correct.

---

## STEP 2 — Upload manual to S3

**What:** The PDF lives in S3 so Lambdas can reference it.

**How:**

```powershell
# Find your bucket names
aws s3 ls --profile hackathon

# Pick one of the patrolprepstack buckets, upload the PDF
aws s3 cp "C:\path\to\manual.pdf" s3://YOUR-BUCKET-NAME/manual/manual.pdf --profile hackathon

# Verify
aws s3 ls s3://YOUR-BUCKET-NAME/manual/ --profile hackathon
```

Save the bucket name somewhere — you'll reference it from Lambdas.

**Done when:** `aws s3 ls s3://YOUR-BUCKET-NAME/manual/` shows `manual.pdf`.

---

## STEP 3 — Validate Bedrock prompts (3 languages)

**What:** Confirm all 3 prompts produce good output in English, Spanish, Tagalog, Punjabi via Claude.ai before wiring them into Lambdas.

**How:**

For each of the 3 prompts in PROJECT §4.5, do this in Claude.ai:

**Test 1 — Contextual Explanation (the most important):**

Paste prompt 1 with this fill-in:
```
Question: "Under Section 25 of the Criminal Code, a security guard may use force only when:"
Options: ["They believe a crime is being committed", "They have reasonable grounds and the force is no more than necessary", "They are protecting private property", "Their employer has authorized it"]
Correct answer: B
Student's wrong answer: C
Manual reference excerpt: "Security personnel may use force only when they have reasonable grounds to believe that force is necessary to prevent harm or to lawfully detain a person."
Target language: Tagalog
Student's likely cultural background: Filipino
```

Run it. Then run again with `Target language: Spanish`, then `Punjabi`, then `English`.

Look for:
- Legal explanation is correct
- Cultural comparison makes sense (Philippine law for Tagalog, etc.)
- Language is natural, not robotic translation
- Under 150 words
- Encouraging tone

**Test 2 — Drill Generator:**

Run prompt 2 on a Use of Force question. Verify:
- Returns valid JSON (no markdown)
- 3 distinct questions on the same concept
- Each has 4 options with exactly 1 correct

**Test 3 — Voice Question:**

Ask: "What's the difference between an indictable offense and a summary offense?" Request Tagalog. Verify the answer is grounded in the manual.

**Save your final prompts to a notes file `prompts.md` in the repo root.** They're what you'll paste into Lambdas.

**Done when:** All 3 prompts produce solid output in all 4 languages. You have final prompt versions saved.

---

# ═══════════════════════════════════════════════════════════
# PHASE 2 — Backend Lambdas (~2 hours)
# ═══════════════════════════════════════════════════════════

## STEP 4 — Build the Explain Lambda

**What:** `POST /explain` accepts a question + wrong answer + language, returns Bedrock-generated contextual explanation.

**How:**

Edit `infra/lambdas/process.ts` (rename to `explain.ts` if you want, or just repurpose):

```typescript
// infra/lambdas/explain.ts
import type { APIGatewayProxyHandler } from "aws-lambda";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrock = new BedrockRuntimeClient({ region: "us-west-2" });

const SYSTEM_PROMPT = `[paste your validated prompt 1 from prompts.md]`;

export const handler: APIGatewayProxyHandler = async (event) => {
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
      modelId: "us.anthropic.claude-sonnet-4-5-20250929-v1:0", // verify exact ID in their console
      system: [{ text: SYSTEM_PROMPT }],
      messages: [{ role: "user", content: [{ text: userMessage }] }],
      inferenceConfig: { maxTokens: 800, temperature: 0.3 }
    }));

    const explanation = response.output?.message?.content?.[0]?.text || "";

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ explanation, language, latencyMs: Date.now() }),
    };
  } catch (err: any) {
    console.error("explain error:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
```

Update `infra/lib/infra-stack.ts` to:
- Add a new route `POST /explain` mapped to this Lambda (or repurpose existing process Lambda)
- Make sure the Lambda has `bedrock:InvokeModel` and `bedrock:Converse` permissions (already in the stack from before)

Deploy:
```powershell
cd infra
$env:AWS_PROFILE="hackathon"
cdk deploy
```

Test:
```powershell
curl -X POST https://YOUR-API/prod/explain `
  -H "Content-Type: application/json" `
  -d '{"question":"Under what conditions...","options":["A","B","C","D"],"correctAnswer":1,"studentAnswer":2,"manualExcerpt":"...","language":"Tagalog","culturalHint":"Filipino"}'
```

**Done when:** curl returns a clean Tagalog explanation in 3-5 seconds.

---

## STEP 5 — Build the Drill Lambda

**What:** `POST /drill` returns 3 generated similar questions on the same concept.

**How:**

Create `infra/lambdas/drill.ts`:

```typescript
// infra/lambdas/drill.ts
import type { APIGatewayProxyHandler } from "aws-lambda";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrock = new BedrockRuntimeClient({ region: "us-west-2" });

const SYSTEM_PROMPT = `[paste your validated prompt 2 from prompts.md]`;

export const handler: APIGatewayProxyHandler = async (event) => {
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
    // Strip markdown fences just in case
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(clean);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(parsed),
    };
  } catch (err: any) {
    console.error("drill error:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
```

Add to CDK stack: new route `POST /drill` mapped to this Lambda. Deploy.

Test similarly to STEP 4.

**Done when:** curl to `/drill` returns valid JSON with 3 questions.

---

## STEP 6 — Build the Voice Lambdas (Transcribe + Polly)

**What:** `POST /transcribe` (audio blob → text) and `POST /speak` (text → MP3 audio).

**How:**

For Transcribe — use streaming for low latency, OR async for simplicity. Pick async if you want to ship faster:

```typescript
// infra/lambdas/transcribe.ts
import type { APIGatewayProxyHandler } from "aws-lambda";
import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } from "@aws-sdk/client-transcribe";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const transcribe = new TranscribeClient({ region: "us-west-2" });
const s3 = new S3Client({ region: "us-west-2" });

export const handler: APIGatewayProxyHandler = async (event) => {
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

    // poll for completion
    while (true) {
      await new Promise(r => setTimeout(r, 1500));
      const res = await transcribe.send(new GetTranscriptionJobCommand({ TranscriptionJobName: jobName }));
      if (res.TranscriptionJob?.TranscriptionJobStatus === "COMPLETED") {
        const uri = res.TranscriptionJob.Transcript!.TranscriptFileUri!;
        const data = await fetch(uri).then(r => r.json());
        return {
          statusCode: 200,
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ text: data.results.transcripts[0].transcript }),
        };
      }
      if (res.TranscriptionJob?.TranscriptionJobStatus === "FAILED") {
        throw new Error("Transcribe failed");
      }
    }
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
```

For Polly:

```typescript
// infra/lambdas/speak.ts
import type { APIGatewayProxyHandler } from "aws-lambda";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";

const polly = new PollyClient({ region: "us-west-2" });

const VOICE_BY_LANG: Record<string, string> = {
  English: "Joanna",
  Spanish: "Lupe",
  Tagalog: "Joanna",  // Polly doesn't have Tagalog, fall back to English
  Punjabi: "Joanna",  // same
};

export const handler: APIGatewayProxyHandler = async (event) => {
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
    for await (const chunk of response.AudioStream as any) chunks.push(chunk);
    const audioBase64 = Buffer.concat(chunks).toString("base64");

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ audioBase64, contentType: "audio/mpeg" }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
```

Add Polly + Transcribe permissions to the CDK stack (already in there from before — verify). Add new routes for `/transcribe` and `/speak`. Deploy.

**Done when:** Both endpoints work via curl.

**Note on Polly languages:** Polly does NOT support Tagalog or Punjabi. For those languages, Polly speaks in English while the screen displays the text in the target language. Be honest about this in the demo: "Polly handles voice in supported languages — for Tagalog and Punjabi we display the text prominently."

---

## STEP 7 — Build the Ask Lambda (free-form voice question)

**What:** `POST /ask` takes a question + language, returns Bedrock answer using manual context.

**How:**

```typescript
// infra/lambdas/ask.ts
import type { APIGatewayProxyHandler } from "aws-lambda";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrock = new BedrockRuntimeClient({ region: "us-west-2" });

const SYSTEM_PROMPT = `[paste your validated prompt 3 from prompts.md]`;

// For now use a static excerpt that covers most common topics.
// Better: chunk the manual and do real RAG. For hackathon scope, static is fine.
const MANUAL_CONTEXT = `[paste 1-2 paragraphs covering use of force, detention, charter rights]`;

export const handler: APIGatewayProxyHandler = async (event) => {
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
      inferenceConfig: { maxTokens: 600, temperature: 0.3 }
    }));

    const answer = response.output?.message?.content?.[0]?.text || "";

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ answer, language }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
```

Add `/ask` route to CDK stack. Deploy.

**Done when:** curl to `/ask` with a question returns a 3-paragraph answer in the requested language.

---

# ═══════════════════════════════════════════════════════════
# PHASE 3 — Frontend (~3 hours)
# ═══════════════════════════════════════════════════════════

## STEP 8 — API client

**What:** `lib/api.ts` with all the methods the UI needs.

**How:**

```typescript
// lib/api.ts
const BASE = process.env.NEXT_PUBLIC_API_URL!;

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
```

**Done when:** Each method has a corresponding Lambda endpoint live.

---

## STEP 9 — Question loader

**What:** `lib/questions.ts` to load and serve random questions.

**How:**

```typescript
// lib/questions.ts
import questions from "@/data/questions.json";

export interface Question {
  id: string;
  topic: string;
  difficulty: string;
  question: string;
  options: string[];
  correctAnswer: number;
  manualReference: string;
  manualExcerpt: string;
}

export function getAllQuestions(): Question[] {
  return questions.questions as Question[];
}

export function getRandomQuestion(exclude: string[] = []): Question {
  const all = getAllQuestions().filter(q => !exclude.includes(q.id));
  return all[Math.floor(Math.random() * all.length)];
}

export function getQuestionsByTopic(topic: string): Question[] {
  return getAllQuestions().filter(q => q.topic === topic);
}
```

**Done when:** Importing `getRandomQuestion()` returns a real question.

---

## STEP 10 — Language utilities + selector

**What:** `lib/language.ts` and `components/language/LanguageSelector.tsx`.

**How:**

```typescript
// lib/language.ts
export type Language = "English" | "Spanish" | "Tagalog" | "Punjabi";

export const LANGUAGES: { code: Language; label: string; flag: string; transcribeCode: string; cultural: string }[] = [
  { code: "English",  label: "English",      flag: "🇨🇦", transcribeCode: "en-US",  cultural: "general" },
  { code: "Spanish",  label: "Español",      flag: "🇪🇸", transcribeCode: "es-US",  cultural: "Latin American" },
  { code: "Tagalog",  label: "Tagalog",       flag: "🇵🇭", transcribeCode: "tl-PH",  cultural: "Filipino" },
  { code: "Punjabi",  label: "ਪੰਜਾਬੀ",        flag: "🇮🇳", transcribeCode: "pa-IN",  cultural: "South Asian" },
];

export function getLanguage(): Language {
  if (typeof window === "undefined") return "English";
  return (localStorage.getItem("patrolprep-lang") as Language) || "English";
}

export function setLanguage(lang: Language) {
  localStorage.setItem("patrolprep-lang", lang);
}
```

```typescript
// components/language/LanguageSelector.tsx
"use client";
import { useState, useEffect } from "react";
import { LANGUAGES, getLanguage, setLanguage, type Language } from "@/lib/language";

export function LanguageSelector() {
  const [current, setCurrent] = useState<Language>("English");
  const [open, setOpen] = useState(false);

  useEffect(() => { setCurrent(getLanguage()); }, []);

  const handleChange = (lang: Language) => {
    setLanguage(lang);
    setCurrent(lang);
    setOpen(false);
    window.dispatchEvent(new Event("language-change"));
  };

  const currentLang = LANGUAGES.find(l => l.code === current)!;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-sm transition-colors"
      >
        <span>{currentLang.flag}</span>
        <span>{currentLang.label}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg overflow-hidden shadow-xl z-50">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleChange(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-[var(--bg-hover)] ${
                lang.code === current ? "text-[var(--accent)]" : ""
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Done when:** Language selector renders top-right of practice page, selecting a language persists across reloads.

---

## STEP 11 — Question UI components

**What:** `QuestionCard`, `AnswerOption`, `ExplanationPanel` components.

**How:**

```typescript
// components/question/AnswerOption.tsx
"use client";
import { motion } from "framer-motion";

interface Props {
  letter: "A" | "B" | "C" | "D";
  text: string;
  selected: boolean;
  onSelect: () => void;
  state?: "default" | "correct" | "incorrect";
  disabled?: boolean;
}

export function AnswerOption({ letter, text, selected, onSelect, state = "default", disabled }: Props) {
  const stateStyles = {
    default: selected
      ? "border-[var(--accent)] bg-[var(--accent)]/10"
      : "border-[var(--border-default)] hover:bg-[var(--bg-hover)]",
    correct: "border-[var(--correct)] bg-[var(--correct)]/10",
    incorrect: "border-[var(--incorrect)] bg-[var(--incorrect)]/10",
  };

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.99 }}
      onClick={() => !disabled && onSelect()}
      disabled={disabled}
      className={`w-full flex items-start gap-4 p-4 rounded-lg border transition-all text-left ${stateStyles[state]} ${disabled ? "cursor-default" : "cursor-pointer"}`}
    >
      <span className="font-mono text-sm text-[var(--fg-tertiary)] mt-0.5">{letter}</span>
      <span className="text-[15px] leading-relaxed">{text}</span>
    </motion.button>
  );
}
```

```typescript
// components/question/QuestionCard.tsx
"use client";
import { useState } from "react";
import { AnswerOption } from "./AnswerOption";
import type { Question } from "@/lib/questions";

interface Props {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onAnswered: (selected: number, isCorrect: boolean) => void;
}

export function QuestionCard({ question, questionNumber, totalQuestions, onAnswered }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    onAnswered(selected, selected === question.correctAnswer);
  };

  const getOptionState = (index: number) => {
    if (!submitted) return "default" as const;
    if (index === question.correctAnswer) return "correct" as const;
    if (index === selected) return "incorrect" as const;
    return "default" as const;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-micro text-[var(--fg-tertiary)] mb-6">
        Question {questionNumber} of {totalQuestions}
      </div>

      <h2 className="text-[17px] leading-relaxed mb-8">{question.question}</h2>

      <div className="space-y-3 mb-8">
        {question.options.map((opt, i) => (
          <AnswerOption
            key={i}
            letter={["A", "B", "C", "D"][i] as any}
            text={opt}
            selected={selected === i}
            onSelect={() => setSelected(i)}
            state={getOptionState(i)}
            disabled={submitted}
          />
        ))}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={selected === null}
          className="w-full py-3 rounded-lg bg-[var(--accent)] text-white font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--accent-dim)] transition-colors"
        >
          Submit Answer
        </button>
      )}
    </div>
  );
}
```

```typescript
// components/question/ExplanationPanel.tsx
"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { getLanguage, LANGUAGES } from "@/lib/language";
import type { Question } from "@/lib/questions";

interface Props {
  question: Question;
  studentAnswer: number;
  onDrill: () => void;
  onContinue: () => void;
}

export function ExplanationPanel({ question, studentAnswer, onDrill, onContinue }: Props) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const lang = getLanguage();
    const culturalHint = LANGUAGES.find(l => l.code === lang)?.cultural || "general";

    api.explain({
      question: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
      studentAnswer,
      manualExcerpt: question.manualExcerpt,
      language: lang,
      culturalHint,
    }).then(res => {
      setExplanation(res.explanation);
      setLoading(false);
    });
  }, [question, studentAnswer]);

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      transition={{ type: "spring", damping: 30, stiffness: 200 }}
      className="fixed bottom-0 left-0 right-0 bg-[var(--bg-elevated)] border-t border-[var(--border-default)] p-6 max-h-[60vh] overflow-y-auto"
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-micro text-[var(--accent)] mb-3">EXPLANATION · {getLanguage()}</div>

        {loading ? (
          <div className="space-y-2">
            <div className="h-4 bg-[var(--bg-surface)] rounded animate-pulse" />
            <div className="h-4 bg-[var(--bg-surface)] rounded animate-pulse w-3/4" />
            <div className="h-4 bg-[var(--bg-surface)] rounded animate-pulse w-5/6" />
          </div>
        ) : (
          <p className="text-[15px] leading-relaxed text-[var(--fg-primary)] mb-6">{explanation}</p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onDrill}
            disabled={loading}
            className="flex-1 py-3 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-dim)] disabled:opacity-30"
          >
            Drill this concept
          </button>
          <button
            onClick={onContinue}
            disabled={loading}
            className="flex-1 py-3 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] disabled:opacity-30"
          >
            Continue
          </button>
        </div>
      </div>
    </motion.div>
  );
}
```

**Done when:** All 3 components render. The visual hierarchy looks like a real product (compare to Linear).

---

## STEP 12 — Practice page

**What:** `app/(study)/practice/page.tsx` — the main exam screen.

**How:**

```typescript
// app/(study)/practice/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QuestionCard } from "@/components/question/QuestionCard";
import { ExplanationPanel } from "@/components/question/ExplanationPanel";
import { LanguageSelector } from "@/components/language/LanguageSelector";
import { getRandomQuestion, type Question } from "@/lib/questions";

const TOTAL = 10;

export default function PracticePage() {
  const router = useRouter();
  const [questionNumber, setQuestionNumber] = useState(1);
  const [current, setCurrent] = useState<Question | null>(null);
  const [studentAnswer, setStudentAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answered, setAnswered] = useState<{ id: string; correct: boolean; topic: string }[]>([]);
  const [seen, setSeen] = useState<string[]>([]);

  useEffect(() => {
    setCurrent(getRandomQuestion());
  }, []);

  const handleAnswered = (selected: number, isCorrect: boolean) => {
    setStudentAnswer(selected);
    setAnswered(prev => [...prev, { id: current!.id, correct: isCorrect, topic: current!.topic }]);

    if (isCorrect) {
      // Show brief check, then auto-advance
      setTimeout(() => nextQuestion(), 1200);
    } else {
      setShowExplanation(true);
    }
  };

  const nextQuestion = () => {
    if (questionNumber >= TOTAL) {
      // Save session and go to results
      sessionStorage.setItem("patrolprep-results", JSON.stringify(answered));
      router.push("/results");
      return;
    }
    setShowExplanation(false);
    setStudentAnswer(null);
    setSeen(prev => [...prev, current!.id]);
    setCurrent(getRandomQuestion([...seen, current!.id]));
    setQuestionNumber(prev => prev + 1);
  };

  if (!current) return <div>Loading...</div>;

  return (
    <main className="min-h-screen bg-[var(--bg-base)]">
      <header className="flex justify-between items-center p-4 border-b border-[var(--border-subtle)]">
        <div className="font-display text-xl font-semibold">
          patrolprep<span style={{ color: "var(--accent)" }}>.</span>
        </div>
        <LanguageSelector />
      </header>

      <QuestionCard
        question={current}
        questionNumber={questionNumber}
        totalQuestions={TOTAL}
        onAnswered={handleAnswered}
      />

      {showExplanation && studentAnswer !== null && (
        <ExplanationPanel
          question={current}
          studentAnswer={studentAnswer}
          onDrill={() => alert("Drill mode — TODO")}
          onContinue={nextQuestion}
        />
      )}
    </main>
  );
}
```

**Done when:** Visiting `/practice` shows a question, you can answer, wrong answers trigger the explanation panel with real Bedrock output.

---

## STEP 13 — Landing page + results page

**What:** Simple landing with a "Start Practice Exam" button + a results page showing score and weak topics.

**How:**

```typescript
// app/page.tsx (replace the smoke test)
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-display text-6xl font-semibold tracking-tight mb-4">
          patrolprep<span style={{ color: "var(--accent)" }}>.</span>
        </h1>
        <p className="text-[var(--fg-secondary)] mb-12 max-w-md mx-auto leading-relaxed">
          Pass the Alberta security guard exam in your language. Learn the concepts in any.
        </p>
        <Link
          href="/practice"
          className="inline-block px-8 py-3 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-dim)] transition-colors"
        >
          Start Practice Exam
        </Link>
      </div>
    </main>
  );
}
```

```typescript
// app/(study)/results/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ResultsPage() {
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    const data = sessionStorage.getItem("patrolprep-results");
    if (data) setResults(JSON.parse(data));
  }, []);

  const correct = results.filter(r => r.correct).length;
  const total = results.length;

  // Weak topics
  const byTopic = results.reduce((acc, r) => {
    if (!acc[r.topic]) acc[r.topic] = { correct: 0, total: 0 };
    acc[r.topic].total += 1;
    if (r.correct) acc[r.topic].correct += 1;
    return acc;
  }, {} as Record<string, { correct: number; total: number }>);

  const weak = Object.entries(byTopic)
    .filter(([_, v]: any) => v.correct / v.total < 0.6)
    .map(([k]) => k);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-micro text-[var(--fg-tertiary)] mb-2">SESSION RESULTS</div>
        <h1 className="font-display text-5xl font-semibold mb-8">
          {correct} / {total}
        </h1>

        {weak.length > 0 && (
          <div className="mb-8 p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)]">
            <div className="text-micro text-[var(--fg-tertiary)] mb-2">PRACTICE MORE</div>
            <ul className="space-y-1">
              {weak.map(topic => (
                <li key={topic} className="text-sm">{topic.replace(/_/g, " ")}</li>
              ))}
            </ul>
          </div>
        )}

        <Link
          href="/practice"
          className="block w-full text-center py-3 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-dim)]"
        >
          Try Again
        </Link>
      </div>
    </main>
  );
}
```

**Done when:** Completing 10 questions navigates to results page showing real score.

---

## STEP 14 — Drill mode

**What:** When user clicks "Drill this concept," show 3 generated questions in a mini-session.

**How:**

Create `components/question/DrillPanel.tsx` similar to `ExplanationPanel`. On mount, calls `api.drill(...)` to fetch 3 generated questions. Renders them as a simplified `QuestionCard` sequence. After the 3rd, shows "Back to Practice" button.

Wire it up in the practice page: replace `onDrill={() => alert(...)}` with logic that opens the drill panel.

**Done when:** Wrong answer → click "Drill this concept" → 3 fresh AI-generated questions → answer all 3 → return to main practice.

---

# ═══════════════════════════════════════════════════════════
# PHASE 4 — Voice + Polish (~2 hours)
# ═══════════════════════════════════════════════════════════

## STEP 15 — Mic button + voice modal

**What:** Floating mic button bottom-right of practice page. Tap → modal with record → transcribe → ask Bedrock → Polly → autoplay answer.

**How:**

```typescript
// components/voice/MicButton.tsx
"use client";
import { useState } from "react";
import { VoiceModal } from "./VoiceModal";

export function MicButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-[var(--accent)] text-white text-2xl shadow-lg hover:scale-105 transition-transform"
        aria-label="Ask a question"
      >
        🎤
      </button>
      {open && <VoiceModal onClose={() => setOpen(false)} />}
    </>
  );
}
```

```typescript
// components/voice/VoiceModal.tsx
"use client";
import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { getLanguage, LANGUAGES } from "@/lib/language";

export function VoiceModal({ onClose }: { onClose: () => void }) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/mp4";
    const recorder = new MediaRecorder(stream, { mimeType: mime });
    chunksRef.current = [];
    recorder.ondataavailable = e => chunksRef.current.push(e.data);
    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      setProcessing(true);
      const blob = new Blob(chunksRef.current);
      const buf = await blob.arrayBuffer();
      const base64 = Buffer.from(buf).toString("base64");
      const lang = getLanguage();
      const transcribeCode = LANGUAGES.find(l => l.code === lang)!.transcribeCode;

      const transcribed = await api.transcribe(base64, transcribeCode);
      const ask = await api.ask({ question: transcribed.text, language: lang });
      const speak = await api.speak(ask.answer, lang);

      setAnswer(ask.answer);
      const audio = new Audio(`data:audio/mpeg;base64,${speak.audioBase64}`);
      audio.play();
      setProcessing(false);
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
  };

  const stop = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[var(--bg-elevated)] rounded-xl p-8 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="font-display text-xl mb-2">Ask Anything</h3>
        <p className="text-sm text-[var(--fg-secondary)] mb-6">In {getLanguage()}</p>

        {!processing && !answer && (
          <button
            onClick={recording ? stop : start}
            className={`w-full py-4 rounded-lg font-medium ${
              recording ? "bg-[var(--incorrect)]" : "bg-[var(--accent)]"
            } text-white`}
          >
            {recording ? "Stop Recording" : "Start Recording"}
          </button>
        )}

        {processing && (
          <div className="text-center py-6">
            <div className="text-sm text-[var(--fg-secondary)]">Processing...</div>
          </div>
        )}

        {answer && (
          <div>
            <div className="text-micro text-[var(--accent)] mb-2">ANSWER</div>
            <p className="text-sm leading-relaxed mb-4">{answer}</p>
            <button onClick={onClose} className="w-full py-2 rounded-lg bg-[var(--bg-surface)]">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
```

Add `<MicButton />` to practice page layout. Test on phone.

**Done when:** Tap mic, record a question, get a spoken answer back within 10 seconds.

---

## STEP 16 — Demo mode flag

**What:** `?demo=1` URL param uses pre-baked responses for guaranteed demo speed.

**How:**

In `lib/api.ts`, wrap the `explain` function:

```typescript
const DEMO_RESPONSES: Record<string, string> = {
  "Tagalog-q-001": "Tama ang sagot na B. Ayon sa Section 25 ng Criminal Code...", // pre-baked
  "Spanish-q-001": "La respuesta correcta es B. Según la Sección 25 del Código Penal...",
  "English-q-001": "The correct answer is B. Under Section 25 of the Criminal Code...",
  // etc
};

export const api = {
  async explain(payload: any) {
    const url = new URL(window.location.href);
    if (url.searchParams.get("demo") === "1") {
      const key = `${payload.language}-${payload.question.substring(0, 10)}`;
      const cached = DEMO_RESPONSES[key];
      if (cached) {
        await new Promise(r => setTimeout(r, 800)); // fake "real" delay
        return { explanation: cached, language: payload.language };
      }
    }
    // ... normal fetch
  },
  // ...
};
```

Pre-bake responses for 1-2 demo questions in all 3 non-English languages.

**Done when:** `localhost:3000/practice?demo=1` works flawlessly with WiFi off.

---

## STEP 17 — Polish pass

UI polish — go through every screen with fresh eyes:

- Spacing consistent? (4, 8, 12, 16, 24 grid)
- Typography correct? (display for headings, body for prose, mono for IDs)
- Loading states? (skeletons, not spinners)
- Hover states? (subtle bg-hover transition)
- Mobile responsive? (test at 375px width)
- Empty states? (what does the app look like with no data?)
- Error states? (what if the Bedrock call fails?)

**Done when:** Nothing looks half-finished.

---

# ═══════════════════════════════════════════════════════════
# PHASE 5 — Demo Prep (~1 hour)
# ═══════════════════════════════════════════════════════════

## STEP 18 — Backup video

Record 90-second screen capture of perfect demo flow. Save MP4 to demo laptop desktop. Test playback offline.

## STEP 19 — Pitch rehearsal

Manraj does the full pitch + demo at least 3 times. Time it. Cut anything over 3 minutes. Record once on phone, review playback for filler words.

## STEP 20 — Equipment check

- Laptops + chargers
- Phones + chargers
- HDMI dongle
- Hotspot ready
- Headphones (test Polly audio without disturbing)
- Pitch slides exported as PDF (no internet dependency)
- Backup video on desktop

---

## STEP 21 — Submit (3:00 PM SHARP)

- Push final code to GitHub
- Submit via the form Edmonton Unlimited gave you
- Include: GitHub URL, Live URL, team names, project description (use one-liner from PROJECT §0)

---

# ═══════════════════════════════════════════════════════════
# DECISION TREES
# ═══════════════════════════════════════════════════════════

**If Bedrock is slow during demo** → switch to `?demo=1`. "Cached for speed."

**If Wi-Fi fails** → hotspot. Or backup video.

**If voice doesn't work** → skip it during demo. "Voice is supported, happy to show offline."

**If teammate stuck 30+ min** → pair or reassign. Never block.

**If ahead at 1:30 PM** → polish, don't add features.

**If behind at 12:30 PM** → cut in this order:
1. Voice (drop entirely, text-only Q&A)
2. Drill mode (just show "drill coming soon")
3. Multilingual (English + Spanish only)
4. Results screen (skip, go straight to "thanks for trying")

The minimum viable demo: question → wrong answer → contextual explanation in Spanish. Everything else is polish.

---

# THE ONE RULE

Ship one thing that wows. Don't build three things that kinda work.

Every step has "done when." If you can't say what done means, you're not on the right thing. Stop. Figure it out. Then start.

---

*Last updated: April 24, 2026 (eve of hackathon, infrastructure live)*
