# PatrolPrep — Pathway (Tonight + Hackathon Day)

> **Tonight (April 24):** Fork the GuardLog template, redeploy, prep the question bank, validate the Bedrock prompts.
> **Tomorrow (April 25):** 6 hours to ship a polished, demoable product.
> **Submission:** 3:00 PM. **Pitches:** 4:30 PM.

---

# ─────────────────────────────────────────────────────────────
# TONIGHT — Friday April 24 (~3 hours)
# ─────────────────────────────────────────────────────────────

> The goal tonight is to walk in tomorrow with all infrastructure deployed, the question bank ready, and the prompts validated. Zero surprises in the morning.

## TONIGHT.1 — Fork the template (20 min)

```powershell
cd D:\projects
robocopy guardlog-starter patrolprep /E /XD node_modules .next cdk.out .git
cd patrolprep
```

Open in VS Code. Find-and-replace across the entire workspace (`Ctrl+Shift+H`):

| Find | Replace | Match case |
|---|---|---|
| `GuardlogStack` | `PatrolprepStack` | ✅ |
| `guardlog` | `patrolprep` | (case-insensitive) |
| `Guardlog` | `Patrolprep` | ✅ |
| `GUARDLOG` | `PATROLPREP` | ✅ |

**Important:** also rename:
- `guardlog-api` (in `infra/lib/infra-stack.ts`) → `patrolprep-api`
- The CSS accent color in `app/globals.css` — change `--accent: #F59E0B` to `--accent: #3B82F6` (focus blue) and `--accent-glow: 245 158 11` to `--accent-glow: 59 130 246`

Initialize fresh git:

```powershell
git init
git branch -M main
```

## TONIGHT.2 — Reinstall and redeploy (30 min)

```powershell
pnpm install
cd infra
pnpm install
$env:AWS_PROFILE="guardlog"
cdk synth     # confirms it compiles
cdk deploy    # creates the new PatrolprepStack alongside GuardlogStack
```

The deploy takes 3-5 min. When done, **save the API Gateway URL** from the output.

Update `.env.local` in the project root with the new URL:

```
NEXT_PUBLIC_API_URL=https://NEW-URL.execute-api.ca-central-1.amazonaws.com/prod
```

Test it:

```powershell
$env:AWS_PROFILE="guardlog"
curl https://NEW-URL.execute-api.ca-central-1.amazonaws.com/prod/incidents
```

Should return `{"incidents":[],"stub":true}` — confirms the new stack works exactly like the old one.

## TONIGHT.3 — Upload the manual to S3 (15 min)

Download the Alberta Basic Security Training Participant Manual PDF from the link the organizers sent. Save locally.

Upload to your audio bucket (we'll repurpose it):

```powershell
aws s3 cp "C:\path\to\manual.pdf" s3://YOUR-AUDIO-BUCKET/manual/manual.pdf --profile guardlog
```

Verify:

```powershell
aws s3 ls s3://YOUR-AUDIO-BUCKET/manual/ --profile guardlog
```

You should see `manual.pdf` listed.

## TONIGHT.4 — Generate the question bank (60 min) — Ali owns, Manraj backstops

This is the highest-leverage prep task. The quality of the demo is bottlenecked by the question quality.

**Step 1:** Open the manual PDF in your browser.

**Step 2:** Open Claude.ai (the web UI, not your CLI tools).

**Step 3:** Paste this prompt and attach the PDF:

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

**Step 4:** Save Claude's response as `data/questions.json` in the patrolprep repo:

```powershell
mkdir data
# paste JSON into data/questions.json
```

**Step 5:** Manually QA 5 random questions against the manual. Fix any factual errors. This 30 minutes is the difference between a great demo and an embarrassing one — don't skip QA.

## TONIGHT.5 — Validate Bedrock prompts (40 min) — Oscar owns

Open Claude.ai. Test each of the 3 prompts from `PATROLPREP_PROJECT.md` Section 3.4 with REAL question data:

**Test 1: Contextual Explanation**

Pick a Use of Force question. Run the explanation prompt requesting **Tagalog**. Then **Spanish**. Then **Punjabi**. Look for:
- Is the legal explanation correct?
- Does the cultural comparison make sense?
- Is the language natural (not robotic translation)?
- Is it under 150 words?
- Does it stay encouraging, not condescending?

If any output is bad, iterate the prompt. Save 3 final versions you're confident in (one per language).

**Test 2: Drill Generator**

Run it on a Use of Force question. Verify:
- Returns valid JSON (no markdown fences)
- 3 distinct questions on the same concept
- Each has 4 options with exactly 1 correct
- Difficulty is reasonable

**Test 3: Free-form Voice Question**

Ask: "What's the difference between an indictable offense and a summary offense?" Request Tagalog. Verify the answer is grounded in the manual.

**Save your final prompts to a notes file.** They're the IP.

## TONIGHT.6 — Light frontend prep (15 min) — Cristian

Just make sure the template still runs locally with the new accent color:

```powershell
cd patrolprep
pnpm dev
```

Open http://localhost:3000. Verify the period in "guardlog." (or now "patrolprep.") shows in **blue** (#3B82F6), not amber. If still amber, check `app/globals.css` and `app/page.tsx`.

That's it for tonight. **Sleep.**

## TONIGHT.7 — Pre-pack the demo kit (15 min) — Ali

- 2× laptops + chargers
- 2× phones + chargers
- HDMI dongle
- Hotspot on phone, unlimited data plan confirmed
- Headphones (for the team to test Polly audio without disturbing others)
- Notebook + pens
- Snacks, water bottles
- Government ID for venue check-in
- Reply "Confirmed" to the organizers' email

---

## End-of-tonight checklist

- [ ] PatrolPrep repo exists, renamed clean from GuardLog template
- [ ] CDK redeployed as `PatrolprepStack`, API Gateway URL saved in `.env.local`
- [ ] Manual PDF in S3 at `s3://YOUR-BUCKET/manual/manual.pdf`
- [ ] `data/questions.json` exists with 30+ realistic questions
- [ ] 5 questions QA'd against the manual (no factual errors)
- [ ] All 3 Bedrock prompts validated in Spanish, Tagalog, Punjabi
- [ ] Final prompt versions saved
- [ ] Frontend runs locally with blue accent
- [ ] Demo kit packed
- [ ] Email confirmed

If all 9 are checked, you sleep great. If any are unchecked, finish them before bed.

---

# ─────────────────────────────────────────────────────────────
# HACKATHON DAY — Saturday April 25
# ─────────────────────────────────────────────────────────────

> **Doors:** 8:30 AM · **Hacking starts:** 9:15 AM · **Submission:** 3:00 PM · **Pitches:** 4:30 PM

## Schedule overview

| Time | Block | Theme |
|---|---|---|
| 8:30–9:00 | Arrival, breakfast, sign-in | |
| 9:00–9:15 | Welcome, instructions | |
| **9:15–9:30** | **Standup + role kickoff** | (15 min, no code) |
| 9:30–11:00 | **Block 1: Foundation** | core flow end-to-end |
| 11:00–12:00 | **Block 2: Core features** | drill + voice |
| 12:00–12:30 | LUNCH (working) | |
| 12:30–2:00 | **Block 3: Polish + multilingual** | all 3 languages working |
| 2:00–3:00 | **Block 4: Demo-proofing** | freeze, rehearse, fix |
| 3:00 | **SUBMISSION DEADLINE** | |
| 3:00–4:30 | Round 1 pitches + waiting | |
| 4:30 | **FINAL PITCH** | |

---

## Standup (9:15–9:30)

Read this doc together. Confirm everyone has:
- Cloned the patrolprep repo
- `pnpm install` complete in root and `infra/`
- AWS credentials configured (Manraj + Julien)
- Their assignment from PROJECT §7

Branches:
- `feat/manraj-backend`
- `feat/julien-voice`
- `feat/cristian-question-ui`
- `feat/oscar-prompts`
- `feat/ali-results-and-pitch`

Manraj: only person who merges to main until lunch.

---

# ═══════════════════════════════════════════════════════════
# BLOCK 1 — Foundation (9:30 AM – 11:00 AM) · 1h 30min
# ═══════════════════════════════════════════════════════════

**Goal: Question appears, user picks wrong answer, Bedrock returns explanation in English. End-to-end flow live.**

## [MANRAJ] T1.1 — Explain Lambda (real implementation)

**What:** `POST /explain` accepts a question + wrong answer + language, returns Bedrock-generated contextual explanation.

**How:**
- Edit `infra/lambdas/explain.ts` (rename from `process.ts` if needed, or add new)
- Use the validated prompt from TONIGHT.5
- Call Bedrock Claude 3.5 Sonnet via `global.anthropic.claude-sonnet-4-5-...` profile
- Strip markdown fences from response
- Return `{ explanation: string, language: string, latencyMs: number }`
- CORS headers, 30-second timeout

**Done when:** `curl -X POST $API/explain -d '{question:..., wrongAnswer:..., language:"en"}'` returns a clean explanation in 3-5 seconds.

## [JULIEN] T1.2 — Question loader

**What:** `GET /questions/random` returns one random question from the bank.

**How:**
- Bank lives in `data/questions.json` — bundled with the Lambda
- Or simpler: return from frontend directly, skip the Lambda for this. Static JSON in `public/data/questions.json` works fine.

**Done when:** Frontend can call `fetch('/data/questions.json')` and get the array.

## [CRISTIAN] T1.3 — Question screen UI

**What:** `app/(study)/practice/page.tsx` renders one question with 4 selectable options + a Submit button.

**How:**
- Match the spec in PROJECT §4.4
- Use shadcn `<Button>` and a custom radio-style for options
- Selected state: blue border on the option
- Disabled until an option is selected
- On submit, set local state `submitted: true`

**Done when:** Page renders a question, user can select an option, Submit becomes active.

## [OSCAR] T1.4 — Wire Submit to Explain Lambda

**What:** When user submits a wrong answer, call `/explain`, show the explanation panel.

**How:**
- After Submit: compare to `correctAnswer`
- If correct: brief checkmark, "Next Question" button
- If wrong: show ExplanationPanel sliding up
- Inside ExplanationPanel: loading spinner → call `api.explain(question, wrongAnswer, currentLanguage)` → render the streamed text

**Done when:** Wrong answer triggers a real Bedrock call and the explanation appears within 5 seconds.

## [ALI] T1.5 — Wire questions.json to UI

**What:** Instead of hardcoded mock, load real questions from the bank.

**How:**
- Add `lib/questions.ts` with `loadQuestions()` and `getRandomQuestion()`
- Import into the practice page
- On mount, load all 30; on each "Next" click, advance to a new random one

**Done when:** Refreshing the practice page shows different real questions from the manual.

### Block 1 checkpoint (10:55)

- Manraj: explain Lambda live ✅
- Cristian: question UI working ✅
- Oscar: wrong answer → explanation flow live in ENGLISH ✅
- Ali: real questions loading ✅

If yes, you've already shipped a working MVP. Time to make it impressive.

---

# ═══════════════════════════════════════════════════════════
# BLOCK 2 — Core Features (11:00 AM – 12:00 PM) · 1h
# ═══════════════════════════════════════════════════════════

**Goal: Drill mode works. Voice question works. Multilingual support added.**

## [MANRAJ] T2.1 — Drill Lambda

**What:** `POST /drill` returns 3 generated similar questions.

**How:**
- New Lambda `infra/lambdas/drill.ts`
- Use Drill prompt from PROJECT §3.4
- Force JSON output, parse, return as array
- ~5 second latency tolerable

**Done when:** Wrong answer flow has a "Drill this concept" button that returns 3 new questions to practice immediately.

## [CRISTIAN] T2.2 — Drill UI

**What:** New panel that takes over the screen when user clicks "Drill." User answers 3 questions in a mini-session.

**How:**
- Reuse QuestionCard, render in sequence
- Track score: "2 of 3 correct"
- After all 3, return to main practice flow

**Done when:** Full drill loop works smoothly.

## [JULIEN] T2.3 — Voice Lambdas (Transcribe + Polly)

**What:** Two Lambdas: `POST /audio/transcribe` (audio blob → text) and `POST /audio/speak` (text + language → audio MP3).

**How:**
- Transcribe: use **Streaming Transcribe** for low latency. Or async if streaming is too complex — async is simpler, still <10s for 5-second audio clips
- Polly: synchronous, returns base64 MP3
- Polly voice IDs:
  - English: `Joanna`
  - Spanish: `Lupe`
  - Tagalog: NOT supported by Polly — use Bedrock to translate to English text, speak in English. Be honest about this in the demo.
  - Punjabi: NOT supported — same fallback
- For Tagalog/Punjabi: render the text on screen prominently. Speech is a wow but reading is the actual accessibility.

**Done when:** Voice question records, transcribes, Bedrock answers, Polly speaks back in English (Spanish if user chose Spanish).

## [JULIEN] T2.4 — Mic Button + Modal

**What:** Floating mic button on every question screen. Tap → modal opens with record button → user speaks → answer plays.

**How:**
- `components/voice/MicButton.tsx` and `VoiceModal.tsx`
- Use Web MediaRecorder
- After stop: blob → presigned S3 PUT (or send directly to Lambda as base64) → transcribe → ask Lambda → Polly → autoplay

**Done when:** Tap mic, ask a question out loud, answer plays back within 10 seconds.

## [OSCAR] T2.5 — Multilingual support

**What:** Wire the language selector. Every API call passes `language` parameter. Bedrock prompts use that language.

**How:**
- `LanguageSelector.tsx` — dropdown with 4 options, persist to localStorage
- A `useLanguage()` hook
- All `api.*` calls accept and pass `language`
- Test all 3 non-English: Spanish, Tagalog, Punjabi

**Done when:** Switching language and getting a wrong answer produces an explanation in that language.

## [ALI] T2.6 — Results screen

**What:** After 10 questions, show: score, weak topics, encouragement to drill weak areas.

**How:**
- `app/(study)/results/page.tsx`
- Pass session state via URL params or React Context
- Show: "8/10. Strongest: Charter Rights. Practice more: Use of Force."

**Done when:** Completing 10 questions takes you to a results page with real data.

### Block 2 checkpoint (11:55)

- Drill flow works ✅
- Voice works (English at minimum) ✅
- All 3 languages work for explanations ✅
- Results screen exists ✅

**Eat lunch. Real lunch. 20 minutes. Phones away.**

---

# ═══════════════════════════════════════════════════════════
# BLOCK 3 — Polish + Multilingual (12:30 – 2:00 PM) · 1h 30min
# ═══════════════════════════════════════════════════════════

**Goal: It looks like a real product. Multilingual is rock solid. Demo flow is buttery smooth.**

## [CRISTIAN] T3.1 — Polish question UI

- Question card hover/select micro-animations (Framer Motion 200ms)
- Wrong answer reveal: stagger color shifts on options (200ms each)
- Explanation panel slide-up animation
- Loading states everywhere (skeleton or pulse, not spinners)

## [OSCAR] T3.2 — Streaming explanation text

If Bedrock streaming is set up, render the explanation character-by-character (typewriter effect ~30 chars/sec). If not, show as a clean fade-in.

## [JULIEN] T3.3 — Polly voice tuning

- Test Spanish (Lupe) sounds good — adjust SSML if rate is off
- For Tagalog/Punjabi: fallback to English audio, but text is prominently rendered in the target language
- Cache audio responses for the demo questions to ensure speed

## [MANRAJ] T3.4 — Demo mode flag

- `?demo=1` URL param triggers pre-baked responses
- Pre-bake the Use of Force question's explanation in all 4 languages
- Pre-bake the drill response for that question
- Pre-bake the voice question answer ("difference between indictable and summary")
- This is the bulletproof fallback if Bedrock is slow during pitch

**Done when:** `?demo=1` URL works flawlessly even with Wi-Fi off (cached locally).

## [ALI] T3.5 — Pitch deck final

- 5 slides matching PROJECT §8 structure
- Slide 1: hook ("20,000 guards")
- Slide 2: misdiagnosis ("translate the words → wrong")
- Slide 3: live demo placeholder
- Slide 4: architecture diagram (clean version of §3.1)
- Slide 5: ask + close

Export to PDF. Test the projector cable.

## [ALI] T3.6 — Demo rehearsal #1

Manraj does the full pitch + demo. Ali times it. Identify any drag, fumble, or unclear moment. Repeat once more.

### Block 3 checkpoint (1:55)

- UI looks polished ✅
- All 3 languages tested in real demo flow ✅
- Demo mode works offline ✅
- Pitch deck final ✅
- Manraj has rehearsed at least twice ✅

---

# ═══════════════════════════════════════════════════════════
# BLOCK 4 — Demo-Proofing (2:00 PM – 3:00 PM) · 1h
# ═══════════════════════════════════════════════════════════

**Goal: Lock everything down. Submit on time. Be ready to pitch.**

## T4.1 — FEATURE FREEZE (2:00 sharp)

No new features. Only:
- Bug fixes for the demo flow
- Visual polish
- Rehearsal

## T4.2 — Backup video (Manraj, 20 min)

Record a 90-second screen capture of the perfect demo flow:
- Open practice exam
- Get a question wrong
- See explanation in Tagalog
- Tap "Drill"
- Use voice mic
- Show results screen

Save as MP4 on demo laptop desktop. **Test playback offline.**

## T4.3 — Submission (Manraj, by 2:50 PM)

- Push final code to GitHub (public repo)
- Submit via the form Edmonton Unlimited gave us
- Include:
  - GitHub link
  - Live URL (Amplify)
  - Team member names
  - Project description (use the one-liner from §0)

**Done at 2:55. Set a phone alarm for 2:45 as warning.**

## T4.4 — Final rehearsal (Manraj + Ali, 2:50–3:00)

One last full pitch + demo. Time it. Should be 3:00–3:15. If over 3:30, cut something.

---

# ═══════════════════════════════════════════════════════════
# BLOCK 5 — Round 1 Pitches & Final Presentation (3:00 PM onwards)
# ═══════════════════════════════════════════════════════════

## 3:00–4:30 — Round 1 pitches + waiting

You may pitch in this round to a smaller judging panel. Use the same 3-minute pitch. After pitching, watch other teams briefly to scout — but mostly stay focused on your own demo.

DO NOT touch code after 3:00 unless something is broken in the demo. If you absolutely must:
- Only Manraj or Julien
- One commit max
- Test it 3 times before stepping away

## 4:30 — FINAL PRESENTATION

**Setup (start 5 min before your slot):**
- Demo laptop on the projector
- App open in tab 1
- Pitch slides open in tab 2
- Backup video open in tab 3
- Notifications disabled
- Volume up (Polly audio matters)
- Phone on Do Not Disturb

**Pitch:**
- Manraj delivers
- Ali operates the laptop if Manraj needs both hands
- Cristian/Julien/Oscar quiet during pitch — alive during Q&A

**Q&A:**
- Manraj answers unless it's a deep technical question
- For technical Q&A, look at the relevant track owner ("Julien — voice pipeline?")
- If you don't know the answer, say "Great question — we'd want to validate that with real users before committing to an answer." Better than bullshitting.

## 5:30 — Awards 🏆

Stay until the end. Refund depends on it. Plus you want to be in the room when they call your team.

---

# DECISION TREES

## If Bedrock fails / is slow during pitch
Switch to `?demo=1` URL. Speak through it like nothing happened. "Let me show you the cached version for speed."

## If Wi-Fi fails
Use Ali's hotspot. Or play the backup video: "WiFi is being WiFi — here's the recording."

## If voice doesn't work in the demo
Skip it. Don't fight broken tech on stage. "Voice is also supported — happy to show offline."

## If a teammate stuck at 30+ min
Pair with Manraj. Reassign if needed. Never let one person block.

## If ahead at 1:30 PM
- Don't add features. Polish.
- Add 5 more pre-seeded test sessions to results page so demo looks data-rich
- Add bookmarking
- Record a second backup video from a different angle

## If behind at 12:30 PM
Sacrifice in this order:
1. Voice input → drop, focus on text + language buttons
2. Polly speech → text-only explanations
3. Drill mode → just show "drill coming soon" button
4. Multilingual → English + Spanish only

The minimum viable demo: question → wrong answer → contextual explanation in Spanish. Everything else is polish.

---

# THE ONE RULE

**Every task in this doc has "what / how / done when." If you can't say what done means, you're not on the right thing. Stop. Figure it out. Then start.**

You have all the infrastructure. You have the team. You have the differentiating idea. You have the prompts validated. You have 6 hours.

Ship one thing that wows. Don't build three things that kinda work.

---

*Last updated: April 24, 2026 (eve of hackathon)*
