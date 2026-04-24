# PatrolPrep — Project Context

> **Hackathon:** DevCon Edmonton (Edmonton Unlimited) — April 25, 2026
> **Hours:** 9:15 AM – 3:00 PM build · 4:30 PM final pitch
> **Team:** 5 (Manraj, Julien, Cristian, Oscar, Ali — Manraj leading + likely doing most)
> **Goal:** Win. Score 14+ on the 16-point rubric.

---

## 0. The TL;DR

**What we're building:** An adaptive practice exam for the Alberta Basic Security Training license. When a student gets a question wrong, instead of just showing the right answer, our app uses Bedrock to explain the **cultural and legal context** in the student's native language — then generates 3 more drill questions on that concept. Plus voice questions: speak in any language, get a spoken answer back.

**One-line pitch:** *"Other study tools translate the words. We translate the concepts. When a student fails 'reasonable grounds for detention,' we explain how Canadian legal reasoning works compared to their home country's — in their language — then drill them until it sticks."*

**Why it wins:**
1. Hits all 4 rubric categories meaningfully (most teams will hit 2-3)
2. Differentiated from the 5+ teams building "ChatGPT on top of the PDF"
3. Buildable on top of our already-deployed AWS infrastructure
4. Demo is 90 seconds and visually compelling
5. Real impact story — the actual reason students fail isn't language, it's cultural-legal context

---

## 1. Current State (where we are right now)

**Infrastructure already done and live:**
- AWS workshop account credentials configured as `hackathon` profile
- CDK stack `PatrolprepStack` deployed to **us-west-2** in the workshop AWS account
- 3 S3 buckets created (audio, photo, report)
- DynamoDB table `IncidentsTable` (will be reused)
- 4 Lambda stubs (`upload`, `process`, `list`, `get`) — currently returning placeholder data
- API Gateway live, returning `{"incidents":[],"stub":true}` from `/incidents`
- Frontend skeleton: Next.js + Tailwind + shadcn + IBM Plex fonts + dark theme + blue accent (#3B82F6)
- Smoke test working: localhost frontend successfully calls deployed API

**Still to do (rest of tonight + tomorrow morning):**
- Generate 30-question bank from manual
- Validate Bedrock prompts in 3 languages
- Implement explain Lambda with real Bedrock call
- Build question UI
- Build wrong-answer flow
- Add drill mode
- Add voice (Transcribe + Polly)
- Add multilingual support
- Polish + pitch

---

## 2. The Problem (use this in the pitch)

Alberta requires anyone working as a licensed security guard to complete Basic Security Training and pass a provincial proficiency exam. The course material is **only available in English**. Many of Alberta's 20,000+ security guards are newcomers to Canada — Filipino, South Asian, Latin American, and East African communities are heavily represented.

The naive theory: students fail because their English is weak. Translate the manual, problem solved.

**The real problem:** A Filipino student who's been speaking English for 10 years still fails the exam. Why? Because the exam tests **Canadian legal concepts** — "indictable offense," "Section 25 of the Criminal Code," "reasonable grounds," "use of force continuum," "Charter rights" — that don't have direct equivalents in their home country's legal system.

It's not a vocabulary problem. It's a **conceptual translation problem.**

A purely linguistic translation gives the student "indictable offense" → "delito procesable." That doesn't help. They need: *"In Canada, an indictable offense is the most serious category of crime — like murder or armed robbery — and the rules around when a security guard can detain someone are stricter for these. In Filipino law you might think of this as similar to but stricter than 'felony' charges under the Revised Penal Code."*

That's the gap PatrolPrep fills. We don't translate. We explain.

---

## 3. The Product

### 3.1 User personas

**Primary — Maria, 28, Filipina student**
- Took Basic Security Training course at NorQuest, finishing tomorrow
- Speaks fluent conversational English, reads slowly
- Failed the practice exam twice, license depends on passing
- Studies during evening commute on transit

**Secondary — Amrit, 35, Punjabi student**
- New to Canada (8 months), enrolled in private security training school
- Working as a part-time guard already on a temporary clearance
- Native Punjabi speaker, English is third language

### 3.2 Core user flow

```
[Open app]
    ↓
[Choose your language: English / Español / Tagalog / Punjabi]
    ↓
[Tap "Start Practice Exam"]
    ↓
[Question appears in English (because the real exam is in English)]
    ↓
[Multiple choice: 4 options]
    ↓
[User selects → Submit]
    │
    ├── CORRECT
    │   └── ✓ Brief check, "Next Question"
    │
    └── WRONG
        ├── Wrong option turns red, correct turns green
        ├── Panel slides up from bottom
        ├── Bedrock-generated explanation in user's language:
        │     - WHY this is the right answer
        │     - The cultural/legal context
        │     - Comparison to user's home country's framing
        ├── (Optional) Polly speaks the explanation
        ├── "Drill this concept" button → 3 generated similar questions
        └── "Continue" → next question

[After 10 questions] → Results screen with score + weak topics
```

### 3.3 Voice feature

Floating mic button on every question screen:
- Tap → modal opens with record button
- User asks any question in any language ("What's the difference between an indictable and summary offense?")
- Transcribe converts speech to text
- Bedrock answers in chosen language using manual as context
- Polly speaks the answer aloud
- Returns to the question

The wow moment in the demo. One mic button, one modal, that's it.

### 3.4 Feature scope

**MUST HAVE (P0) — without these we have no demo:**
- [ ] Practice exam: 10 questions from question bank
- [ ] Question bank: 30 realistic questions from the manual
- [ ] Wrong-answer flow: contextual explanation in user's language
- [ ] Language selector: English, Spanish, Tagalog, Punjabi
- [ ] "Drill this concept" → 3 generated similar questions
- [ ] Results screen with score + weak topics

**SHOULD HAVE (P1) — if on track by 1 PM:**
- [ ] Voice input for asking questions
- [ ] Polly text-to-speech for explanations
- [ ] Streaming text output (typewriter effect)
- [ ] Demo mode flag (`?demo=1`) for cached responses

**NICE TO HAVE (P2) — only if ahead at 2 PM:**
- [ ] Bookmarking questions
- [ ] Topic-specific practice mode
- [ ] PWA installable

**OUT OF SCOPE — do not build:**
- ❌ Authentication / user accounts (everyone is a guest)
- ❌ Multi-tenant orgs / instructor view
- ❌ Live group features
- ❌ Native iOS/Android apps
- ❌ Admin dashboards

---

## 4. Technical Architecture

### 4.1 High-level diagram

```
┌──────────────────────────────────────────────────────────────┐
│                  STUDENT APP (Next.js PWA)                    │
│         Mobile-first, runs on phone or laptop                 │
│  - Question UI                                                │
│  - Language selector                                          │
│  - Mic button (Web MediaRecorder API)                         │
│         Hosted on AWS Amplify                                 │
└───────────────┬──────────────────────────────────────────────┘
                │ HTTPS / fetch
                ▼
┌──────────────────────────────────────────────────────────────┐
│         AMAZON API GATEWAY (REST, us-west-2)                  │
│  POST /explain          (wrong answer → contextual reason)    │
│  POST /drill            (generate 3 similar questions)        │
│  POST /ask              (free-form voice/text question)       │
│  POST /transcribe       (speech to text via Transcribe)       │
│  POST /speak            (text to speech via Polly)            │
└───────────────┬──────────────────────────────────────────────┘
                │
    ┌───────────┼─────────────┬─────────────┬────────────┐
    ▼           ▼             ▼             ▼            ▼
┌─────────┐ ┌─────────┐ ┌─────────────┐ ┌─────────┐ ┌───────────┐
│ Lambdas │ │ DynamoDB│ │   Bedrock    │ │  Polly  │ │Transcribe │
│         │ │ (sessions│ │(Sonnet 3.5) │ │  (TTS)  │ │  (STT)    │
│         │ │ if time) │ │              │ │         │ │           │
└─────────┘ └─────────┘ └─────────────┘ └─────────┘ └───────────┘
                              ▲
                              │ retrieves manual context
                              │
                    ┌─────────────────┐
                    │       S3         │
                    │  Manual PDF      │
                    │  questions.json  │
                    └─────────────────┘
```

### 4.2 AWS services used

| Service | Purpose | Pitch reason |
|---|---|---|
| **Bedrock (Claude Sonnet 3.5)** | Generates contextual explanations + drill questions in any language | The brain |
| **Amazon Transcribe** | Speech-to-text for voice input | Multi-lingual mic |
| **Amazon Polly** | Text-to-speech for explanations in user's language | Voice answers, accessibility |
| **S3** | Stores manual PDF + question bank JSON | Manual is source of truth |
| **DynamoDB** | Session history (P2 only) | Fast lookups |
| **Lambda + API Gateway** | Serverless backend | Scalable, AWS-native |
| **Amplify Hosting** | Hosts the Next.js frontend | Same AWS account, single deploy |

**7 AWS services. Pitch as 6.**

### 4.3 Region

All resources in **us-west-2** (Oregon) — the workshop account's region. Bedrock model ID uses `us.` prefix:

```
us.anthropic.claude-sonnet-4-5-20250929-v1:0
```

(Verify exact ID in their console under Bedrock → Cross-region inference.)

**Note:** We're in us-west-2 not ca-central-1 because the workshop account requires it. Our pitch can still emphasize "AWS-native, deployed on AWS infrastructure with serverless scaling." Don't make data residency a centerpiece since we're not in Canada.

### 4.4 The question bank

JSON file in S3 OR bundled with the frontend:

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

**30 questions across 6 topics, 5 each:**
1. Use of Force
2. Lawful Detention and Citizen's Arrest
3. Charter Rights and Freedoms
4. Note-Taking and Incident Reporting
5. Patrol Procedures and Site Security
6. Emergency Response and First Aid

### 4.5 The Bedrock prompts

**PROMPT 1 — Contextual Explanation** (the most important one)

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
Keep total response under 150 words. No markdown, no preamble.

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

---

## 5. Visual Design Direction

### 5.1 Aesthetic

PatrolPrep is **a serious learning tool**, not a Duolingo clone. Students are adults preparing for a license that determines whether they can earn money. They want a tool that respects their intelligence and time.

References:
- Khan Academy (calm, focused)
- Anki (utilitarian, zero-distraction)
- Linear (restraint, precision)

NOT references:
- ~~Duolingo~~ (too playful, owl mascots)
- ~~Quizlet consumer~~ (chaotic)
- ~~Anything with confetti~~

### 5.2 Color tokens (already in globals.css)

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
  --correct:        #4ADE80;
  --incorrect:      #F87171;
}
```

### 5.3 Typography

- **Body:** IBM Plex Sans (already loaded)
- **Display:** IBM Plex Sans Condensed
- **Monospace:** IBM Plex Mono (timestamps, IDs)

Questions render at **17px with line-height 1.6** for reading comfort.

### 5.4 Key UI elements

**Question card (the hero):**
```
┌──────────────────────────────────────────────────────────┐
│ QUESTION 4 OF 10                              ●●●●○○○○○○ │
│                                                            │
│ Under Section 25 of the Criminal Code, a security         │
│ guard may use force only when:                             │
│                                                            │
│  ○ A) They believe a crime is being committed             │
│  ○ B) They have reasonable grounds and the force is       │
│       no more than necessary                              │
│  ○ C) They are protecting private property                │
│  ○ D) Their employer has authorized it                    │
│                                                            │
│  [   Submit Answer   ]                          🎤         │
└──────────────────────────────────────────────────────────┘
```

**Wrong answer reveal:**
- Wrong option → red flash (`--incorrect`)
- Correct option → green check (`--correct`)
- Panel slides UP from bottom with: explanation in user's language, "Drill this concept" button, "Continue" button
- If TTS enabled: explanation auto-plays via Polly

**Language selector:** top-right corner, globe icon dropdown:
- 🇨🇦 English
- 🇪🇸 Español
- 🇵🇭 Tagalog
- 🇮🇳 ਪੰਜਾਬੀ (Punjabi)

Saved to localStorage.

**Mic button:** floating bottom-right, 64px circle, accent blue, pulses when recording.

### 5.5 Wordmark

```
patrolprep.
```
Lowercase, IBM Plex Sans Condensed 600, period in accent blue.

---

## 6. Repo Structure

```
patrolprep/
├── PATROLPREP_PROJECT.md         ← this file
├── PATROLPREP_PATHWAY.md         ← step-by-step build guide
├── README.md
├── package.json
├── pnpm-workspace.yaml
├── .env.local                    ← NEXT_PUBLIC_API_URL points at workshop account
│
├── app/
│   ├── layout.tsx                ← fonts, dark bg
│   ├── globals.css               ← design tokens (blue accent)
│   ├── page.tsx                  ← landing
│   └── (study)/
│       ├── practice/page.tsx     ← main practice exam
│       └── results/page.tsx      ← end-of-session results
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
│   └── ui/                       ← shadcn primitives
│
├── lib/
│   ├── api.ts                    ← API Gateway client
│   ├── questions.ts              ← question bank loader
│   └── language.ts               ← language utilities
│
├── data/
│   └── questions.json            ← 30 questions (generated tonight)
│
├── public/
│   └── (manual PDF reference, not loaded at runtime)
│
└── infra/
    ├── bin/infra.ts              ← us-west-2 region
    ├── lib/infra-stack.ts        ← deployed
    └── lambdas/
        ├── explain.ts            ← contextual explanation (TO BUILD)
        ├── drill.ts              ← generate 3 similar questions (TO BUILD)
        ├── ask.ts                ← free-form voice question (TO BUILD)
        ├── transcribe.ts         ← speech to text (TO BUILD)
        └── speak.ts              ← text to speech via Polly (TO BUILD)
```

---

## 7. The Pitch (3 minutes — Manraj delivers)

### 7.1 Structure

**[0:00–0:25] The hook**

> "Show of hands — how many of you know someone who came to Canada and worked security at some point? *(pause)* In Alberta, over 20,000 licensed security guards work every day. A huge proportion are newcomers — Filipino, South Asian, Latin American. Every one of them had to pass a provincial licensing exam. The exam is in English. The pass rate among newcomers is brutal."

**[0:25–0:55] The misdiagnosis**

> "The obvious fix is: translate the manual. Wrong. We talked to instructors. The students who fail are not failing because of language. They're failing because of *concepts.* Words like 'indictable offense,' 'reasonable grounds,' 'Section 25 of the Criminal Code' — these don't have direct equivalents in their home country's legal system. A direct translation gives them the words but not the meaning."

**[0:55–1:50] The product (LIVE DEMO)**

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

> "Under the hood: the manual is stored in S3. When the student gets a question wrong, a Lambda calls Amazon Bedrock — Claude Sonnet 3.5 via cross-region inference. The contextual explanation streams back. Amazon Polly speaks it aloud in the student's language. Voice questions go through Amazon Transcribe. Six AWS services, all serverless, all on AWS native infrastructure."

**[2:30–2:55] The impact**

> "There are 20,000 security guards in Alberta. Hundreds of new students take this exam every month. The cost of failing? They can't work. We're not a translator. We're a concept bridge. Built on AWS in 6 hours. Imagine 6 weeks."

**[2:55–3:00] The close**

> "PatrolPrep. Pass the exam in your language, learn the concepts in any. Thank you."

### 7.2 Q&A prep

| Question | Answer |
|---|---|
| *How is this different from ChatGPT with the PDF?* | ChatGPT is reactive — you ask it questions. We're a structured exam prep tool with adaptive drill generation. Plus our explanations are culturally contextualized, not just translated. |
| *Where do your questions come from?* | We extracted 30 from the official Alberta Basic Security Training Participant Manual. In production we'd partner with training schools to source the actual exam blueprint. |
| *How accurate are the explanations?* | We constrain the LLM to the manual context for every response. Hallucination risk is low, and we always show the manual reference. |
| *What about data privacy?* | Audio recordings deleted after transcription. No user accounts means no PII to leak. |
| *What's the business model?* | B2B with private security training schools — they pay per student. Or a $5/month consumer SKU. |

### 7.3 The Killer Statement (memorize this)

If a judge cuts you off and asks one question — *"why are you different from the other 4 chatbot teams?"* — your answer:

> "They translate the words. We translate the concepts. A Filipino student can read 'indictable offense' translated into Tagalog and still not understand what it means in Canadian law. We explain the underlying concept and compare it to a legal framework they already know. That's what makes someone pass."

That sentence wins or loses the hackathon.

---

## 8. The Demo Script (memorize)

> *Opens app. Selects Tagalog from the language menu.*
>
> "I'm Maria. I'm taking Basic Security Training. I just want to pass the exam. Let me start a practice test."
>
> *Taps "Start Practice Exam." Question appears.*
>
> "Question 1: Under what conditions can a security guard use force? I'm going to pick C — protecting private property — because that feels right."
>
> *Submits. Wrong. Red on C, green on B. Panel slides up.*
>
> "I got it wrong. Now look — Bedrock is generating an explanation in Tagalog right now. *(audio plays)* It tells me Section 25 of the Criminal Code, what 'reasonable grounds' actually means, and crucially — it compares this to how Philippine law handles citizen's arrest, so I can ground it in something I know."
>
> "Now I tap 'Drill this concept.' *(taps button)* Bedrock is generating 3 more questions on Section 25 right now. *(questions appear)* I get to practice the same idea three more ways until it's locked in."
>
> "And one more thing — at any time, I can ask a question by voice. *(taps mic, asks in English)* 'What's the difference between an indictable and summary offense?' *(audio answer plays in Tagalog after 3 seconds)*"
>
> "That's PatrolPrep."

Duration: 75 seconds. Practice until it's muscle memory.

---

## 9. Risks & Contingencies

| Risk | Mitigation |
|---|---|
| Workshop account credentials expire mid-build | Refresh from workshop page. Re-run `aws configure set aws_session_token`. |
| Bedrock latency makes demo feel slow | Pre-bake responses for the demo question via `?demo=1` flag |
| Polly voice in Tagalog/Punjabi sounds robotic or doesn't exist | Polly has Spanish (Lupe). NO Tagalog/Punjabi voices. Show on-screen text in those languages, speak in English |
| Voice input fails on iPhone Safari | Test early. Fallback to text input field |
| Manual PDF extraction is messy | Generate questions tonight from the PDF using Claude.ai. If PDF is image-only, use Textract |
| Wi-Fi flakes during demo | Hotspot on phone. Pre-recorded video as last resort |
| Drill generator returns garbage JSON | Strip markdown fences. Fall back to "see related questions" link |

---

## 10. Definition of Winning

We win if at 4:30 PM judging we can:
1. Pitch the one-liner without stumbling
2. Live-demo the wrong-answer → contextual explanation → drill flow in under 90 seconds
3. Demo voice question in 1 language
4. Answer "what's different from ChatGPT?" in one crisp sentence
5. Show a UI that looks like a real product

If all 5 land, we win. If 4, we place.

---

*Last updated: April 24, 2026 (eve of hackathon, infrastructure live in workshop account us-west-2)*
*Owner: Manraj Singh Wazir*
