# PatrolPrep 🛡️

> **Adaptive exam prep for Alberta security guard licensing — built for newcomers to Canada.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![AWS CDK](https://img.shields.io/badge/AWS_CDK-v2-orange?logo=amazon-aws)](https://aws.amazon.com/cdk/)
[![Bedrock](https://img.shields.io/badge/Amazon_Bedrock-Claude_3.5-blue)](https://aws.amazon.com/bedrock/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

# Live Link - https://main.dbd58ta7792dk.amplifyapp.com/

---

## The Problem

Alberta requires every licensed security guard to pass a provincial exam. The course material is **English-only**. Yet the majority of security guards in Alberta are newcomers — Filipino, South Asian, Latin American, and East African communities make up a huge portion of the workforce.

The naive fix is translation. **The real problem is conceptual.** Words like "indictable offense," "Section 25 of the Criminal Code," and "Charter rights" don't exist in most other countries' legal frameworks. A direct translation gives students the words but not the meaning.

**PatrolPrep bridges that gap.** We don't translate. We explain — in the student's language, using their home country's legal system as a reference point.

---

## What It Does

### 🎯 Adaptive Practice Exams
10-question exams that adaptively weight toward your weakest topics. Fisher-Yates shuffled answer options prevent pattern memorization.

### 🧠 AI Concept Bridge
Get a question wrong? Instead of just showing the correct answer, PatrolPrep:
1. Explains **why** the Canadian answer is correct
2. Compares it to the legal framework of the student's **specific home country**
3. Generates 3 drill questions to reinforce the concept

### 🌍 Decoupled Language + Country
Students pick their **interface language** (English, Français, Español, Tagalog, Punjabi) AND their **home country** (Canada, Philippines, India, Colombia, DR Congo, Senegal, etc.) independently. This means a French-speaking student from Senegal gets explanations comparing Canadian law to Senegalese law — in French.

### 🎙️ Voice Q&A (IDP-powered)
A floating mic lets students ask any question out loud. The system:
- Transcribes speech with **Amazon Transcribe**
- Reads the full security manual PDF using **Amazon Bedrock Intelligent Document Processing (IDP)** — the raw PDF is passed directly to Claude 3.5 Sonnet's vision engine, no chunking required
- Speaks the answer back using **Amazon Polly** (native language voices)

### 📊 Dashboard & History
Topic proficiency bars, AI-generated study recommendations, and a full session history with exam review — see exactly which answer you chose vs the correct answer.

---

## Architecture

```
┌──────────────────────────────────────────┐
│         Next.js App (Amplify Hosting)    │
│  - Adaptive engine    - Voice Q&A modal  │
│  - Concept Bridge UI  - Session history  │
└──────────────────┬───────────────────────┘
                   │ HTTPS
                   ▼
┌──────────────────────────────────────────┐
│    Amazon API Gateway  (ca-central-1)    │
│  /explain  /drill  /ask  /transcribe  /speak │
└──┬──────┬───────┬──────────┬────────────┘
   │      │       │          │
   ▼      ▼       ▼          ▼
Bedrock  S3    Transcribe  Polly
(Claude  (PDF   (STT)      (TTS)
3.5)     IDP)
```

### AWS Services

| Service                                | Purpose                                                               |
| -------------------------------------- | --------------------------------------------------------------------- |
| **Amazon Bedrock** (Claude 3.5 Sonnet) | AI explanations, drill generation, Voice Q&A answers                  |
| **Amazon Bedrock IDP**                 | Native PDF parsing — raw manual passed as document block              |
| **Amazon Transcribe**                  | Speech-to-text for Voice Q&A                                          |
| **Amazon Polly**                       | Text-to-speech (Lea for French, Lupe for Spanish, Joanna for English) |
| **Amazon S3**                          | Stores audio recordings and `manual/manual.pdf`                       |
| **AWS Lambda**                         | 5 serverless functions — explain, drill, ask, transcribe, speak       |
| **Amazon API Gateway**                 | REST API routing to Lambdas                                           |
| **AWS Amplify**                        | Frontend hosting with CI/CD                                           |
| **AWS CDK**                            | Infrastructure as code                                                |

---

## Local Development

### Prerequisites
- Node.js 20+
- pnpm (`npm i -g pnpm`)
- AWS CLI configured
- AWS CDK (`npm i -g aws-cdk`)

### Setup

```bash
# Clone and install
git clone https://github.com/Manrajwazir/Patrol-Prep.git
cd Patrol-Prep
pnpm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your API Gateway URL and region
```

### `.env.local`
```env
NEXT_PUBLIC_API_URL=https://YOUR_API_GATEWAY_ID.execute-api.ca-central-1.amazonaws.com/prod/
NEXT_PUBLIC_AWS_REGION=ca-central-1
```

### Run locally
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Demo mode:** Add `?demo=1` to any URL for instant cached responses — no AWS calls, perfect for presentations.

---

## Infrastructure Deployment

```bash
cd infra
pnpm install

# Bootstrap CDK (first time only per region)
npx cdk bootstrap --profile YOUR_AWS_PROFILE

# Deploy
npx cdk deploy --profile YOUR_AWS_PROFILE
```

After deploy, copy the `ApiUrl` from the outputs into your `.env.local`.

### Upload the Manual

Upload your security manual to S3:
- Bucket: from `AudioBucketName` in CDK outputs  
- Key: `manual/manual.pdf`

The Voice Q&A Lambda will use Bedrock IDP to read the PDF directly.

### Lambda Environment Variables

After deploying, set these on the `AskLambda` function:

| Variable        | Value               |
| --------------- | ------------------- |
| `MANUAL_BUCKET` | Your S3 bucket name |
| `MANUAL_KEY`    | `manual/manual.pdf` |

---

## Project Structure

```
Patrol-Prep/
├── app/
│   ├── page.tsx                  ← Landing & onboarding
│   ├── dashboard/page.tsx        ← Proficiency, history, AI recs
│   ├── practice/page.tsx         ← Adaptive exam engine
│   ├── study/page.tsx            ← AI Study Guide
│   ├── results/page.tsx          ← End-of-session results
│   └── history/[id]/page.tsx     ← Detailed exam review
│
├── components/
│   ├── question/
│   │   ├── QuestionCard.tsx      ← Answer logic, Fisher-Yates shuffle
│   │   ├── ExplanationPanel.tsx  ← Concept Bridge (country-aware)
│   │   └── DrillPanel.tsx        ← Drill question generator
│   └── voice/
│       ├── MicButton.tsx         ← Floating mic trigger
│       └── VoiceModal.tsx        ← Voice Q&A modal
│
├── lib/
│   ├── api.ts                    ← API client + ?demo=1 mock responses
│   ├── language.ts               ← Language & Country configurations
│   ├── student.ts                ← localStorage state manager
│   └── questions.ts              ← Adaptive engine & question bank
│
├── data/
│   ├── topics.ts                 ← 6 core manual topics
│   └── concept-bridge.ts         ← Cultural bridge data
│
└── infra/
    ├── bin/infra.ts              ← CDK entry point (ca-central-1)
    ├── lib/infra-stack.ts        ← Full stack definition
    └── lambdas/
        ├── explain.ts            ← Wrong answer explanation
        ├── drill.ts              ← Drill question generation
        ├── ask.ts                ← Voice Q&A with IDP
        ├── transcribe.ts         ← Audio → text
        └── speak.ts              ← Text → audio (Polly)
```

---

## Supported Languages & Countries

**Interface Languages:** English, Français, Español, Tagalog, Punjabi

**Home Countries:** Canada, Philippines, India, Colombia, Mexico, DR Congo, Senegal, El Salvador, Ethiopia, Kenya, Nigeria, United Kingdom, United States

> Polly TTS is supported for English, French, and Spanish. Tagalog and Punjabi display text only (graceful fallback).

---

## Built With

- [Next.js 16](https://nextjs.org) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) + [Framer Motion](https://framer.com/motion)
- [AWS CDK v2](https://docs.aws.amazon.com/cdk/v2/guide/)
- [Amazon Bedrock](https://aws.amazon.com/bedrock/) — Claude 3.5 Sonnet
- [IBM Plex Sans](https://fonts.google.com/specimen/IBM+Plex+Sans) typeface

---

## License

MIT © 2026 PatrolPrep Team