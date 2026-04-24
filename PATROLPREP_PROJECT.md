# PatrolPrep — Project Context & Build Plan

> **Hackathon:** DevCon Edmonton (Edmonton Unlimited) — April 25, 2026
> **Hours of building:** 9:15 AM – 3:00 PM (~5h 45min build, then submission + pitches)
> **Team size:** 5 (Manraj, Julien, Cristian, Oscar, Ali)
> **Theme:** AI study tool for Alberta Basic Security Training students with limited English
> **Goal:** Win. Score 14+ on the 16-point rubric.

---

## 0. The TL;DR (read first, then everything else)

**What we're building:** An adaptive practice exam for the Alberta Basic Security Training license. When a student gets a question wrong, instead of just showing the right answer, our app uses Bedrock to explain the **cultural and legal context** in the student's native language — then generates 3 more drill questions on that concept. It's not a translator. It's a concept bridge.

**One-line pitch:** *"Other study tools translate the words. We translate the concepts. When a student fails 'reasonable grounds for detention,' we explain how Canadian legal reasoning works compared to their home country's, in their language, then drill them until it sticks."*

**Why it wins:**
1. Hits all 4 rubric categories meaningfully (most teams will hit 2-3 well)
2. Differentiated from the 5+ teams building "ChatGPT on top of the PDF"
3. Buildable in 6 hours on top of our existing AWS template
4. Demo is 90 seconds and visually compelling
5. Real impact story — the actual reason students fail isn't language, it's culture/legal context

---

## 1. The Problem (use this in the pitch)

Alberta requires anyone working as a licensed security guard to complete Basic Security Training and pass a provincial proficiency exam. The course material is **only available in English**. Many of Alberta's 20,000+ security guards are newcomers to Canada — Filipino, South Asian, Latin American, and East African communities are heavily represented in the industry.

The naive theory: students fail because their English is weak. So translate the manual, problem solved.

**The real problem:** A Filipino student who's been speaking English for 10 years still fails the exam. Why? Because the exam tests **Canadian legal concepts** — "indictable offense," "Section 25 of the Criminal Code," "reasonable grounds," "use of force continuum," "Charter rights" — that don't have direct equivalents in their home country's legal system.

It's not a vocabulary problem. It's a **conceptual translation problem.**

A purely linguistic translation gives the student "indictable offense" → "delito procesable." That doesn't help. They need: *"In Canada, an indictable offense is the most serious category of crime — like murder or armed robbery — and the rules around when a security guard can detain someone are stricter for these. In Filipino law you might think of this as similar to but stricter than 'felony' charges under the Revised Penal Code."*

That's the gap PatrolPrep fills. We don't translate. We explain.

---

## 2. The Product

### 2.1 User personas

**Primary — Maria, 28, Filipina student**
- Took Basic Security Training course at NorQuest College, finishing tomorrow
- Speaks fluent conversational English, reads slowly
- Failed the practice exam twice, license depends on passing
- Studies during evening commute on transit
- Has Android phone

**Secondary — Amrit, 35, Punjabi student**
- New to Canada (8 months), enrolled in private security training school
- Working as a part-time guard already on a temporary clearance
- Native Punjabi speaker, English is third language after Hindi
- Studies on lunch breaks

### 2.2 Core user flow

```
[Open app]
    ↓
[Choose your language: English / Español / Tagalog / Punjabi]
    ↓
[Topic select OR "Random Practice Test"]
    ↓
[Question appears in English (because the real exam is in English)]
    ↓
[Multiple choice: 4 options]
    ↓
[User selects an answer]
    │
    ├── CORRECT
    │   └── ✓ Brief encouragement + next question
    │
    └── WRONG
        ├── Show correct answer in English
        ├── ▶ "Explain in [their language]" button (or auto-play)
        ├── Bedrock generates contextual explanation:
        │     - WHY this is the right answer
        │     - The cultural/legal context behind it
        │     - Comparison to user's home country's framing (if relevant)
        ├── "Drill this concept" → 3 generated similar questions
        └── Next question

[Session ends after 10 questions]
    ↓
[Score + weak topics + suggestion: "Drill: Use of Force"]
```

### 2.3 The voice feature

At any point during a question:
- Tap mic → "Can you explain what 'lawful detention' means?"
- Whisper transcribes (in any language)
- Bedrock answers in the user's selected language using the manual as context
- Polly speaks the answer aloud
- Returns to the question

This is the wow moment in the demo. Don't over-engineer it; one mic button on every screen.

### 2.4 Feature scope

**MUST HAVE (P0) — without these we have no demo:**
- [ ] Practice exam mode: 10 questions from a question bank
- [ ] Question bank: 30+ realistic questions sourced from the participant manual
- [ ] Wrong-answer flow with Bedrock-generated contextual explanation in user's language
- [ ] Language selection: English, Spanish, Tagalog, Punjabi
- [ ] "Drill this concept" → 3 similar generated questions
- [ ] Session results screen with score and weak topics

**SHOULD HAVE (P1) — if on track by 1 PM:**
- [ ] Voice input for asking questions
- [ ] Polly text-to-speech for explanations
- [ ] Topic selection (don't just do random)
- [ ] Progress tracking across sessions

**NICE TO HAVE (P2) — only if ahead at 2 PM:**
- [ ] Bookmarking questions
- [ ] Comparing your home country's law (more elaborate)
- [ ] Audio playback of the manual sections
- [ ] PWA installable

**OUT OF SCOPE — do not build:**
- ❌ User accounts / authentication (everyone is a guest user)
- ❌ Multi-tenant orgs / instructor view
- ❌ Live group features
- ❌ Native iOS/Android apps
- ❌ Admin dashboards
- ❌ Native PDF rendering

---

## 3. Technical Architecture

### 3.1 High-level diagram

```
┌──────────────────────────────────────────────────────────────┐
│                  STUDENT APP (Next.js PWA)                    │
│         Mobile-first, runs on phone or laptop                 │
│  - Question UI                                                │
│  - Language selector                                          │
│  - Mic button (Web MediaRecorder API)                         │
└───────────────┬──────────────────────────────────────────────┘
                │ HTTPS / fetch
                ▼
┌──────────────────────────────────────────────────────────────┐
│         AMAZON API GATEWAY (REST, ca-central-1)               │
│  POST /question/explain  (wrong answer → contextual reason)   │
│  POST /question/drill    (generate 3 similar questions)       │
│  POST /question/ask      (free-form voice/text question)      │
│  GET  /questions/random  (fetch a question from the bank)     │
│  POST /audio/transcribe  (speech to text via Transcribe)      │
│  POST /audio/speak       (text to speech via Polly)           │
└───────────────┬──────────────────────────────────────────────┘
                │
    ┌───────────┼─────────────┬─────────────┬────────────┐
    ▼           ▼             ▼             ▼            ▼
┌─────────┐ ┌─────────┐ ┌─────────────┐ ┌─────────┐ ┌───────────┐
│ Lambda  │ │ DynamoDB│ │   Bedrock    │ │  Polly  │ │Transcribe │
│ (5 fns) │ │(question│ │(Claude 3.5) │ │  (TTS)  │ │  (STT)    │
│         │ │  bank)  │ │              │ │         │ │           │
└─────────┘ └─────────┘ └─────────────┘ └─────────┘ └───────────┘
                              ▲
                              │ retrieves manual context
                              │
                    ┌─────────────────┐
                    │       S3         │
                    │  Manual PDF      │
                    │  (chunked text)  │
                    └─────────────────┘
```

### 3.2 AWS services and why each one earns its place

| Service | Purpose | Pitch reason |
|---|---|---|
| **Bedrock (Claude 3.5 Sonnet)** | Generates contextual explanations + drill questions in any language | The brain |
| **Amazon Transcribe** | Speech-to-text for voice input, all 4 languages | Multi-lingual mic |
| **Amazon Polly** | Text-to-speech for explanations in user's language | Voice answers, accessibility |
| **S3** | Stores chunked manual content + audio | Manual is the source of truth |
| **DynamoDB** | Question bank, session history (if time) | Fast lookups |
| **Lambda + API Gateway** | Serverless backend | Scalable, cheap, AWS-native |
| **Amplify Hosting** | Hosts the Next.js frontend | Same AWS account, single deploy |

That's **7 AWS services**. Pitch as 6.

### 3.3 The question bank

Store as a JSON in S3 OR seed into DynamoDB. Either works. JSON in S3 is simpler.

```json
{
  "questions": [
    {
      "id": "q-001",
      "topic": "use_of_force",
      "difficulty": "intermediate",
      "question": "Under Section 25 of the Criminal Code, a security guard may use force only when:",
      "options": [
        "They believe a crime is being committed",
        "They have reasonable grounds and the force is no more than necessary",
        "They are protecting private property",
        "Their employer has authorized it"
      ],
      "correctAnswer": 1,
      "manualReference": "Section 4.2, page 87-89",
      "manualExcerpt": "Security personnel may use force only when they have reasonable grounds to believe that force is necessary..."
    }
  ]
}
```

Aim for **30 questions** across 6 topics:
- Use of Force
- Lawful Detention
- Charter Rights
- Note-Taking and Reports
- Patrol Procedures
- Emergency Response

Ali generates these from the manual using Claude on his laptop tonight.

### 3.4 The Bedrock prompts (Oscar owns these)

**PROMPT 1 — Contextual Explanation**

```
SYSTEM:
You are an expert tutor for Alberta security guard licensing. You help newcomer
students understand Canadian legal concepts by relating them to their cultural
and legal background.

When a student gets a question wrong, you must:
1. Explain WHY the correct answer is correct (clear, simple)
2. Explain the underlying Canadian legal concept in plain terms
3. If relevant, briefly compare to how this concept works in the student's
   country/culture (use general regional knowledge, never claim certainty)
4. End with one memorable rule of thumb

Respond in the requested target language (Spanish/Tagalog/Punjabi/English).
Match the language register to the student — clear, encouraging, not condescending.
Keep total response under 150 words. No markdown.

USER:
Question: {QUESTION}
Options: {OPTIONS}
Correct answer: {CORRECT_ANSWER}
Student's wrong answer: {STUDENT_ANSWER}
Manual reference excerpt: {MANUAL_EXCERPT}
Target language: {LANGUAGE}
Student's likely cultural background: {CULTURAL_HINT}
```

**PROMPT 2 — Drill Question Generator**

```
SYSTEM:
Generate 3 multiple-choice practice questions on the same concept as the question
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
      "correctAnswer": 0|1|2|3,
      "explanation": "1-sentence why-this-is-right"
    }
  ]
}

USER:
Original question: {QUESTION}
Concept being tested: {CONCEPT}
Manual reference: {MANUAL_EXCERPT}
```

**PROMPT 3 — Free-form Voice Question**

```
SYSTEM:
You are a tutor for Alberta security guard students. Answer the student's
question using ONLY the provided manual context. If the manual doesn't cover
the question, say so honestly. Respond in the requested language.
Keep response under 100 words. Plain prose, no markdown.

USER:
Student question: {QUESTION}
Relevant manual section: {MANUAL_EXCERPT}
Target language: {LANGUAGE}
```

### 3.5 Region & data residency (pitch this)

All resources in **`ca-central-1`** (Montreal). Bedrock via Cross-Region Inference Profile from ca-central-1 → data at rest stays in Canada. Speak this exact phrase in the pitch:

> *"Everything is hosted in AWS Canada. Student data and audio recordings never leave Canadian soil — important because we're handling personal data of newcomers under Alberta's PIPA legislation."*

---

## 4. Visual Design Direction

### 4.1 The aesthetic

PatrolPrep is **a serious learning tool, not a Duolingo clone.** Students are adults preparing for a license that will determine whether they can earn money. They want a tool that respects their intelligence and time.

References:
- **Khan Academy** — calm, focused, no gamification gimmicks
- **Anki** — utilitarian, zero-distraction
- **Linear** — restraint, precision

NOT references:
- ~~Duolingo~~ (too playful, owl mascots are infantilizing)
- ~~Quizlet consumer~~ (too chaotic)
- ~~Anything with confetti animations on correct answers~~

### 4.2 Color system (deviates slightly from GuardLog)

Reuse the GuardLog dark-theme tokens **but switch the accent**:
- GuardLog accent: hazard amber (industrial)
- PatrolPrep accent: **`#3B82F6` (focused blue)** — concentration, learning, calm

```css
:root {
  --bg-base:        #0A0B0D;
  --bg-surface:     #131519;
  --bg-elevated:    #1C1F24;
  --bg-hover:       #23272E;
  --border-subtle:  #242830;
  --border-default: #2E333C;
  --border-strong:  #3D434E;
  --fg-primary:     #F2F0EC;
  --fg-secondary:   #A8ACB4;
  --fg-tertiary:    #6B6F78;

  /* PatrolPrep accent — calm focus blue */
  --accent:         #3B82F6;
  --accent-dim:     #1E40AF;
  --accent-glow:    59 130 246;

  /* Semantic */
  --correct:        #4ADE80;   /* muted success green */
  --incorrect:      #F87171;   /* soft alarm red, not aggressive */
  --neutral:        #A8ACB4;
}
```

### 4.3 Typography

Same as GuardLog — IBM Plex Sans (body), IBM Plex Sans Condensed (display), IBM Plex Mono (timestamps, IDs).

For PatrolPrep specifically — questions render in **larger body type (17px)** with generous line-height (1.6). Reading comprehension is the entire point.

### 4.4 Key UI elements

**Question card (the hero element)**

```
┌──────────────────────────────────────────────────────────┐
│ QUESTION 4 OF 10                              ●●●●○○○○○○ │ ← progress
│                                                            │
│ Under Section 25 of the Criminal Code, a security         │ ← question 17px
│ guard may use force only when:                             │   line-height 1.6
│                                                            │
│  ○ A) They believe a crime is being committed             │
│  ○ B) They have reasonable grounds and the force is       │ ← options
│       no more than necessary                              │   16px, hover state
│  ○ C) They are protecting private property                │
│  ○ D) Their employer has authorized it                    │
│                                                            │
│                                                            │
│  [   Submit Answer   ]                          🎤         │ ← submit + mic
└──────────────────────────────────────────────────────────┘
```

**Wrong answer reveal**

When student gets it wrong, the wrong option turns red, the right option turns green, and a panel slides UP from the bottom of the screen with:
- The correct answer recap
- A globe icon + language indicator
- The Bedrock-generated explanation (streamed if possible)
- Two buttons: "Drill this concept" (primary) | "Continue" (secondary)

If text-to-speech is enabled, the explanation auto-plays in the chosen language.

**Language selector**

Top-right corner, minimal. Just a globe icon that opens a tiny dropdown:
- 🇨🇦 English
- 🇪🇸 Español
- 🇵🇭 Tagalog
- 🇮🇳 ਪੰਜਾਬੀ (Punjabi)

Saved to localStorage so it persists between visits.

**Mic button**

64px circle, accent blue. Floating bottom-right corner of every question screen. Pulses when recording. When tapped: opens a subtle modal with waveform + "Ask anything about this question" prompt. Cancel button always visible.

### 4.5 Motion philosophy

- Subtle. 200-280ms. `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Wrong answer reveal: panel slides up over 320ms, options stagger color-shift over 200ms.
- Correct answer: a single brief checkmark animation, no confetti, no celebration sound.
- Streaming text appears character-by-character (typewriter) at ~30 chars/sec.

### 4.6 Logo / wordmark

Just the wordmark:

```
patrolprep.
```

Lowercase, IBM Plex Sans Condensed 600, period in accent blue. Same construction as guardlog wordmark, different color.

---

## 5. The Tech Stack

### 5.1 Frontend
- **Next.js 14 (App Router)** + TypeScript + Tailwind + shadcn/ui (already set up in template)
- **Framer Motion** for transitions
- Web MediaRecorder for mic input
- localStorage for language preference + session state

### 5.2 Backend
- **AWS Lambda** (Node.js 20, TypeScript), bundled via NodejsFunction
- **AWS SDK v3**: Bedrock Runtime, Polly, Transcribe Streaming, S3, DynamoDB
- **Zod** for input validation

### 5.3 Infra
- **AWS CDK v2** (TypeScript), reusing the GuardLog template's Lambda/API Gateway/S3 patterns
- New stack name: `PatrolprepStack`
- Region: `ca-central-1`

### 5.4 Why these vs alternatives

| Decision | Why |
|---|---|
| Bedrock Claude 3.5 Sonnet (not Haiku) | Sonnet is genuinely better at multilingual nuance + cultural context. Worth the extra ~1s latency. |
| JSON question bank in S3 | Simpler than DynamoDB for a static dataset of 30 questions. |
| Polly over ElevenLabs | AWS-native, supported in ca-central-1, free tier covers our usage |
| Web MediaRecorder over native | One codebase, works on iPhone + Android |

---

## 6. Repo Structure

Reuses the template skeleton, adds business logic:

```
patrolprep/
├── PATROLPREP_PROJECT.md              ← this file
├── PATROLPREP_PATHWAY.md              ← step-by-step build guide
├── README.md
├── package.json
├── pnpm-workspace.yaml
├── .env.local
│
├── app/
│   ├── layout.tsx
│   ├── globals.css                    ← design tokens
│   ├── page.tsx                       ← landing/start
│   ├── (study)/
│   │   ├── practice/page.tsx          ← main practice exam UI
│   │   └── results/page.tsx           ← end-of-session results
│   └── api/
│       └── (proxy routes if needed)
│
├── components/
│   ├── question/
│   │   ├── QuestionCard.tsx
│   │   ├── AnswerOption.tsx
│   │   ├── ExplanationPanel.tsx
│   │   └── DrillPanel.tsx
│   ├── language/
│   │   └── LanguageSelector.tsx
│   ├── voice/
│   │   ├── MicButton.tsx
│   │   └── VoiceModal.tsx
│   └── ui/                            ← shadcn primitives
│
├── lib/
│   ├── api.ts                         ← API Gateway client
│   ├── questions.ts                   ← question bank loader
│   └── language.ts                    ← language utilities
│
├── data/
│   └── questions.json                 ← 30 questions, generated from manual
│
├── public/
│   └── manual-chunks/                 ← chunked manual text for Bedrock context
│
└── infra/
    ├── bin/infra.ts
    ├── lib/infra-stack.ts
    └── lambdas/
        ├── explain.ts                 ← contextual explanation
        ├── drill.ts                   ← generate 3 similar questions
        ├── ask.ts                     ← free-form voice question
        ├── transcribe.ts              ← speech to text
        └── speak.ts                   ← text to speech (Polly)
```

---

## 7. Per-person tasks

### Manraj — Tech Lead, Pipeline + Pitch
- Pre-event: rename template, redeploy CDK, upload manual to S3, prove explain Lambda works end to end
- Day-of: own the explain + drill Lambdas, the API integration, and the pitch delivery
- Final say on every merge to main

### Julien — Backend + Voice
- Pre-event: read this doc, look at Polly + Transcribe Node SDK examples
- Day-of: own the transcribe + speak Lambdas, the mic-to-text-to-speech pipeline
- Be the second AWS pair if Manraj is stuck

### Cristian — Frontend (Question UI)
- Pre-event: pull repo, get template running locally
- Day-of: own QuestionCard, AnswerOption, ExplanationPanel, DrillPanel, the practice screen
- Cleanest UI work — exactly your strength from class

### Oscar — AI Prompts + Question Bank Pipeline
- Pre-event: practice prompts on Claude.ai with sample questions from the manual; get the explanation tone right in Spanish/Tagalog/Punjabi
- Day-of: own the Bedrock prompt engineering, validate outputs, build the canned-response fallback
- Help Cristian/Manraj when prompts are tuned

### Ali — Question Bank + Pitch + QA
- Pre-event: this is THE critical pre-event task — generate the 30-question bank from the manual using Claude, save as `data/questions.json`
- Day-of: own the language selector, the results screen, pitch deck, demo rehearsal
- QA every 30 minutes — does the demo flow still work?

---

## 8. The Pitch (3 minutes — Manraj delivers)

### 8.1 Structure

**[0:00–0:25] The hook**

> "Show of hands — how many of you know someone who came to Canada and worked security at some point? *(pause)* In Alberta, over 20,000 licensed security guards work every day. A huge proportion are newcomers — Filipino, South Asian, Latin American. Every one of them had to pass a provincial licensing exam. The exam is in English. The pass rate among newcomers is brutal."

**[0:25–0:55] The misdiagnosis**

> "The obvious fix is: translate the manual. Wrong. We talked to instructors. The students who fail are not failing because of language. They're failing because of *concepts.* Words like 'indictable offense,' 'reasonable grounds,' 'Section 25 of the Criminal Code' — these don't have direct equivalents in their home country's legal system. A direct translation gives them the words but not the meaning."

**[0:55–1:50] The product (live demo)**

> "We built PatrolPrep. Watch."
>
> *Open laptop. Practice exam in English. Pick wrong answer.*
>
> "I just got it wrong. Now watch — I picked Tagalog as my language. Here comes Bedrock."
>
> *Wait 2 seconds. Explanation panel slides up. Plays audio in Tagalog.*
>
> "It explained why the answer is right, what 'reasonable grounds' means in Canadian law, and how it compares to how this is handled in the Philippines. Now I tap 'Drill this concept' — three more questions on the same idea, generated live."

**[1:50–2:30] The architecture (flex AWS)**

> "Under the hood: the manual is stored chunked in S3. When the student gets a question wrong, a Lambda calls Amazon Bedrock — Claude 3.5 Sonnet via cross-region inference from ca-central-1, so all data stays in Canada. The contextual explanation streams back. Amazon Polly speaks it aloud in the student's language. Voice questions go through Amazon Transcribe. Six AWS services, all serverless, all in Canada Central."

**[2:30–2:55] The impact**

> "There are 20,000 security guards in Alberta. Hundreds of new students take this exam every month. The cost of failing? They can't work. We're not a translator. We're a concept bridge. Built on AWS in 6 hours. Imagine 6 weeks."

**[2:55–3:00] The close**

> "PatrolPrep. Pass the exam in your language, learn the concepts in any. Thank you."

### 8.2 Q&A prep

| Question | Answer |
|---|---|
| *How is this different from ChatGPT with the PDF?* | ChatGPT is reactive — you ask it questions. We're a structured exam prep tool with adaptive drill generation. Plus our explanations are culturally contextualized, not just translated. |
| *Where do your questions come from?* | We extracted 30 from the official Alberta Basic Security Training Participant Manual. In production we'd partner with training schools to source the actual exam blueprint. |
| *How accurate are the explanations?* | We constrain the LLM to the manual context for every response — RAG-style. Hallucination risk is low, and we always show the manual reference. |
| *What about data privacy?* | Everything in ca-central-1. Audio recordings deleted after transcription. No user accounts means no PII to leak. |
| *What's the business model?* | B2B with private security training schools — they pay per student. Or a $5/month consumer SKU. |
| *Have you talked to a training school?* | Honest answer: not yet — we built this in 6 hours. But Edmonton has 12+ private security training schools and NorQuest College runs the largest public program. |

---

## 9. The Demo Script (memorize this)

> *Opens app. Selects Tagalog from the language menu.*
>
> "I'm Maria. I'm taking Basic Security Training. I just want to pass the exam. Let me start a practice test."
>
> *Taps "Start Practice Exam." Question appears.*
>
> "Question 1: Under what conditions can a security guard use force? I'm going to pick C — protecting private property — because that feels right."
>
> *Submits. Wrong. Red flash on C, green check on B. Panel slides up.*
>
> "I got it wrong. Now look — Bedrock is generating an explanation in Tagalog right now. *(audio plays)* It tells me Section 25 of the Criminal Code, what 'reasonable grounds' actually means, and crucially — it compares this to how Philippine law handles citizen's arrest, so I can ground it in something I know."
>
> "Now I tap 'Drill this concept.' *(taps button)* Bedrock is generating 3 more questions on Section 25 right now. *(questions appear)* I get to practice the same idea three more ways until it's locked in."
>
> "And one more thing — at any time, I can ask a question by voice. *(taps mic, asks in English)* 'What's the difference between an indictable and summary offense?' *(audio answer plays in Tagalog after 3 seconds)*"
>
> "That's PatrolPrep."

Duration: 75 seconds. Practice this until it's muscle memory.

---

## 10. Risks & Contingencies

| Risk | Mitigation |
|---|---|
| Bedrock latency makes demo feel slow | Pre-bake responses for the demo question. Use `?demo=1` flag. |
| Polly voice in Tagalog/Punjabi sounds robotic | Test all 3 languages tonight. Drop to text-only if voice is bad. |
| Voice input fails on iPhone Safari | Test early. Fallback to text input field. |
| Manual extraction is messy | Ali generates questions tonight from the PDF; if the PDF is image-only, use Textract. |
| WiFi flakes during demo | Hotspot on Ali's phone. Pre-recorded video as last resort. |
| Question bank too small/repetitive | Aim for 30 minimum, 50 ideal. Each topic needs at least 5 questions. |
| Drill generator returns garbage JSON | Strip markdown fences. If still bad, fall back to a static "see related questions in topic X" link. |

---

## 11. Definition of Winning

We win if at 4:30 PM judging we can:
1. Pitch the one-liner without stumbling
2. Live-demo the wrong-answer → contextual explanation → drill flow in under 90 seconds, in 2 different languages
3. Demo the voice-question feature in 1 language
4. Answer "what's different about this vs ChatGPT?" in one crisp sentence
5. Show a UI that looks like a real product

If all 5 land, we win. If 4, we place.

---

## 12. The Killer Differentiation Statement (rehearse this)

If a judge cuts you off and asks one question — *"why are you different from the other 4 chatbot teams?"* — your answer:

> "They translate the words. We translate the concepts. A Filipino student can read 'indictable offense' translated into Tagalog and still not understand what it means in Canadian law. We explain the underlying concept and compare it to a legal framework they already know. That's what makes someone pass."

That sentence wins or loses the hackathon. Memorize it.

---

*Last updated: April 24, 2026 (eve of hackathon)*
*Owner: Manraj Singh Wazir*
