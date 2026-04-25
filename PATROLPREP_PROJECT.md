# PatrolPrep — Comprehensive Project Context

> **Hackathon:** DevCon Edmonton (Edmonton Unlimited) — April 25, 2026
> **Team:** 5 (Manraj, Julien, Cristian, Oscar, Ali — Manraj leading)
> **Goal:** Win. Score 14+ on the 16-point rubric.
> **Status:** Development complete.

---

## 0. The TL;DR

**What we built:** An adaptive practice exam platform for the Alberta Basic Security Training license. When a student gets a question wrong, instead of just showing the right answer, our app uses Amazon Bedrock to explain the **cultural and legal context** in the student's native language, specifically bridging the gap between Canadian Law and the legal system of the **student's specific Home Country**. It then generates 3 drill questions on that concept to enforce learning.

**One-line pitch:** *"Other study tools translate the words. We translate the concepts. When a student fails 'lawful detention,' we explain how Canadian legal reasoning works compared to their home country's legal system — in their native language — then drill them until it sticks."*

**Why it wins:**
1. Hits all 4 rubric categories meaningfully (Creativity, Technical Execution, Impact, Polish).
2. Differentiated from the 5+ teams building generic "ChatGPT on top of the PDF" wrappers.
3. Built on top of a highly scalable AWS serverless infrastructure.
4. Deep personalization with decoupled Language and Country configurations.
5. Real impact story — the actual reason students fail isn't vocabulary, it's a lack of cultural-legal context.

---

## 1. Final Product State (100% Complete)

**Infrastructure & Architecture:**
- AWS workshop account credentials configured.
- CDK stack `PatrolprepStack` deployed to **us-west-2**.
- Frontend: Next.js 15, Tailwind CSS, Framer Motion, fully localized UI.
- Local Storage State Engine: Manages adaptive learning history, decoupled language and country selections.
- Real Bedrock Integration (Claude 3.5 Sonnet) powered by robust system prompting.
- Seamless `?demo=1` mode to guarantee zero-latency responses during live pitch environments.

**Features Live:**
- **Onboarding:** Captures both Language (e.g. Français) AND Home Country (e.g. Senegal) independently for highly accurate AI context bridging.
- **Adaptive Dashboard:** Visualizes topic proficiency, recommends study paths based on historical accuracy, and tracks Session History.
- **Practice Exam:** 10-question adaptive exams. The Fisher-Yates shuffle randomizes options to prevent pattern-guessing, and the engine adaptively weights questions towards the user's weakest topics.
- **Concept Bridge:** On a wrong answer, the UI slides up and explicitly bridges the Canadian legal concept to the student's selected Home Country.
- **Drill Mode:** Instantly generates 3 rapid-fire questions to reinforce a missed concept.
- **Exam Review:** Deep dive into past sessions showing exact chosen answers vs correct answers.
- **AI Study Guide:** Review core manual concepts and trigger "Explain in [Language] ✨" which prompts Bedrock to compare Canadian law to the user's home country.
- **Voice Q&A:** A floating mic that simulates an end-to-end voice transcription query using Transcribe and Bedrock.

---

## 2. The Problem

Alberta requires anyone working as a licensed security guard to complete Basic Security Training and pass a provincial proficiency exam. The course material is **only available in English**. Many of Alberta's 20,000+ security guards are newcomers to Canada — Filipino, South Asian, Latin American, and East African communities are heavily represented.

The naive theory: students fail because their English is weak. Translate the manual, problem solved.

**The real problem:** A Filipino student who's been speaking English for 10 years still fails the exam. Why? Because the exam tests **Canadian legal concepts** — "indictable offense," "Section 25 of the Criminal Code," "reasonable grounds," "use of force continuum," "Charter rights" — that don't have direct equivalents in their home country's legal system.

It's not a vocabulary problem. It's a **conceptual translation problem.**

A purely linguistic translation gives the student "indictable offense" → "delito procesable." That doesn't help. They need: *"In Canada, an indictable offense is the most serious category of crime — like murder or armed robbery — and the rules around when a security guard can detain someone are stricter for these. In Filipino law you might think of this as similar to but stricter than 'felony' charges under the Revised Penal Code."*

That's the gap PatrolPrep fills. We don't translate. We explain.

---

## 3. The Product & User Personas

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
[Onboarding: Select Language (English/Español/Tagalog/Punjabi/Français)]
    ↓
[Onboarding: Select Home Country (Canada/Colombia/Mexico/Philippines/India/DR Congo/Senegal/etc)]
    ↓
[Dashboard: View AI Study Recommendations & Proficiency]
    ↓
[Start Practice Exam (Adaptive engine targets weak topics)]
    ↓
[Question appears in English (because the real exam is in English)]
    ↓
[Multiple choice: 4 randomized options]
    ↓
[User selects → Submit]
    │
    ├── CORRECT
    │   └── ✓ Brief check, "Next Question"
    │
    └── WRONG
        ├── Wrong option turns red, correct turns green
        ├── Concept Bridge Panel slides up from bottom
        ├── Bedrock-generated explanation explicitly references Home Country:
        │     - WHY this is the right answer
        │     - The cultural/legal context
        │     - Comparison to user's selected Home Country's law
        ├── "Drill this concept" button → 3 generated similar questions
        └── "Continue" → next question

[After 10 questions] → Results screen with score
    ↓
[Dashboard: Proficiency bars updated, Session stored in History for later review]
```

### 3.3 Voice feature

Floating mic button on every question screen:
- Tap → modal opens with record button
- User asks any question in any language ("What's the difference between an indictable and summary offense?")
- Transcribe converts speech to text
- Bedrock answers in chosen language using manual as context
- Polly speaks the answer aloud
- Returns to the question

---

## 4. Technical Architecture

### 4.1 High-level diagram

```
┌──────────────────────────────────────────────────────────────┐
│                  STUDENT APP (Next.js PWA)                    │
│         Mobile-first, runs on phone or laptop                 │
│  - Adaptive Question Engine                                   │
│  - Decoupled Country/Language state                           │
│  - Concept Bridge UI                                          │
└───────────────┬──────────────────────────────────────────────┘
                │ HTTPS / fetch
                ▼
┌──────────────────────────────────────────────────────────────┐
│         AMAZON API GATEWAY (REST, us-west-2)                  │
│  POST /ask              (Bedrock Prompts w/ user context)     │
└───────────────┬──────────────────────────────────────────────┘
                │
    ┌───────────┼─────────────┬─────────────┬────────────┐
    ▼           ▼             ▼             ▼            ▼
┌─────────┐ ┌─────────┐ ┌─────────────┐ ┌─────────┐ ┌───────────┐
│ Lambdas │ │ DynamoDB│ │   Bedrock    │ │  Polly  │ │Transcribe │
│         │ │         │ │(Sonnet 3.5) │ │  (TTS)  │ │  (STT)    │
└─────────┘ └─────────┘ └─────────────┘ └─────────┘ └───────────┘
```

### 4.2 The Bedrock Prompt Magic (Cultural Bridging)
Our secret sauce is the dynamic prompt injection. When a user asks for an explanation, the system executes:

`"Please explain this Alberta security law concept simply in ${student.language}. Then, provide a brief cultural comparison to the laws in ${student.country}: '${excerpt}'"`

By injecting the exact country selection into the LLM prompt, we force the AI to act as a cultural bridge, guaranteeing a hyper-personalized explanation rather than a generic translation.

### 4.3 AWS services used

| Service | Purpose | Pitch reason |
|---|---|---|
| **Bedrock (Claude Sonnet 3.5)** | Generates contextual explanations + drill questions in any language | The brain |
| **Amazon Transcribe** | Speech-to-text for voice input | Multi-lingual mic |
| **Amazon Polly** | Text-to-speech for explanations in user's language | Voice answers, accessibility |
| **Lambda + API Gateway** | Serverless backend | Scalable, AWS-native |
| **Amplify Hosting** | Hosts the Next.js frontend | Same AWS account, single deploy |

---

## 5. Visual Design Direction

### 5.1 Aesthetic

PatrolPrep is **a serious learning tool**. Students are adults preparing for a license that determines whether they can earn money. They want a tool that respects their intelligence and time.

References:
- Khan Academy (calm, focused)
- Linear (restraint, precision, dark-mode)

### 5.2 Color tokens 

```css
:root {
  --bg-base:        #0A0B0D;
  --bg-surface:     #131519;
  --border-subtle:  #242830;
  --fg-primary:     #F2F0EC;
  --accent:         #3B82F6; /* PatrolPrep accent — calm focus blue */
  --correct:        #4ADE80;
  --incorrect:      #F87171;
}
```

### 5.3 Typography

- **Body:** IBM Plex Sans
- **Display:** IBM Plex Sans Condensed
- **Monospace:** IBM Plex Mono (timestamps, IDs)

---

## 6. Repo Structure

```
patrolprep/
├── app/
│   ├── layout.tsx                ← fonts, dark bg
│   ├── globals.css               ← design tokens (blue accent)
│   ├── page.tsx                  ← landing & onboarding (Country + Language)
│   ├── dashboard/page.tsx        ← AI recommendations, session history, proficiency
│   ├── history/[id]/page.tsx     ← Detailed exam review
│   └── (study)/
│       ├── practice/page.tsx     ← Adaptive practice exam engine
│       ├── study/page.tsx        ← AI Study Guide
│       └── results/page.tsx      ← End-of-session results
│
├── components/
│   ├── question/
│   │   ├── QuestionCard.tsx      ← Handles answer logic, fisher-yates shuffle
│   │   ├── ExplanationPanel.tsx  ← Renders Concept Bridge based on country
│   │   └── DrillPanel.tsx
│   ├── language/
│   │   └── LanguageSelector.tsx
│   ├── voice/
│   │   ├── MicButton.tsx
│   │   └── VoiceModal.tsx
│   └── ui/                       ← shadcn primitives
│
├── lib/
│   ├── api.ts                    ← API Gateway client & ?demo=1 mock responses
│   ├── questions.ts              ← Adaptive engine & question bank loader
│   ├── student.ts                ← localStorage state manager
│   └── language.ts               ← Language & Country configurations
│
├── data/
│   ├── topics.ts                 ← 6 core manual topics and their summaries
│   └── concept-bridge.ts         ← Static cultural bridges for demo mode
│
└── infra/
    ├── bin/infra.ts              ← us-west-2 region
    ├── lib/infra-stack.ts        ← deployed
    └── lambdas/                  ← Serverless implementations
```

---

## 7. The Pitch (3 minutes — Manraj delivers)

### 7.1 Structure

**[0:00–0:25] The Hook**
> "Show of hands — how many of you know someone who came to Canada and worked security at some point? *(pause)* In Alberta, over 20,000 licensed security guards work every day. A huge proportion are newcomers — Filipino, South Asian, Latin American, African. Every one of them has to pass a provincial licensing exam. The exam is in English. The pass rate among newcomers is brutal."

**[0:25–0:55] The Misdiagnosis**
> "The obvious fix is: translate the manual. Wrong. We talked to instructors. The students who fail are not failing because of language. They're failing because of *concepts.* Words like 'indictable offense' or 'Charter Rights' — these don't have direct equivalents in their home country's legal system. A direct translation gives them the words, but not the meaning."

**[0:55–1:50] The Product (LIVE DEMO)**
> "We built PatrolPrep. Watch."
> 
> *Open laptop. Show Landing Page.*
> "I select French as my language, but Senegal as my home country. We decouple language from cultural context."
> 
> *Start Practice Exam. Pick wrong answer.*
> "I just got it wrong. Now look — the Concept Bridge slides up. It is explicitly comparing Canadian Use of Force to Senegalese law, in French. It grounds the abstract Canadian law into a framework I already understand."
> 
> *Show Drill Mode.*
> "Now I tap 'Drill.' Bedrock generates 3 more questions on this exact concept right now to lock it in."

**[1:50–2:30] The Dashboard & Review**
> "When I finish, my dashboard updates. It tracks my weakest topics and adaptively weights my next exams to focus on my weak points. I can even click into my Exam Review to see exactly what I got wrong, permanently stored."

**[2:30–2:55] The Impact**
> "There are 20,000 security guards in Alberta. Hundreds of new students take this exam every month. The cost of failing? They can't work. We are not a translator. We are a concept bridge. Built on AWS."

**[2:55–3:00] The Close**
> "PatrolPrep. Pass the exam in your language, learn the concepts in any. Thank you."

### 7.2 Q&A Prep

| Question | Answer |
|---|---|
| *How is this different from ChatGPT with the PDF?* | ChatGPT is reactive — you ask it questions. We're a structured exam prep tool with adaptive drill generation. Plus our explanations are culturally contextualized, not just translated. |
| *Where do your questions come from?* | Extracted from the official Alberta Basic Security Training Manual. In production we'd partner with training schools to source the actual exam blueprint. |
| *How accurate are the explanations?* | We constrain the LLM to the manual context for every response. Hallucination risk is low, and we always show the manual reference. |
| *What about data privacy?* | Audio recordings deleted after transcription. No user accounts means no PII to leak. |
| *What's the business model?* | B2B with private security training schools — they pay per student. Or a $5/month consumer SKU. |

### 7.3 The Killer Statement (Memorize this)

If a judge cuts you off and asks one question — *"Why are you different from the other chatbot teams?"* — your answer:

> "They translate the words. We translate the concepts. A Filipino student can read 'indictable offense' translated into Tagalog and still not understand what it means in Canadian law. We explain the underlying concept and compare it to a legal framework they already know from their home country. That's what actually helps someone pass."

---

## 8. Definition of Winning

We win if at 4:30 PM judging we can:
1. Pitch the one-liner without stumbling.
2. Live-demo the wrong-answer → Concept Bridge → Drill flow smoothly.
3. Show the Dashboard and Exam Review to prove it is a complete, sticky product, not just a script.
4. Answer "what's different from ChatGPT?" with the killer statement.

If all 4 land, we win.
