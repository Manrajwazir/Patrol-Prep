// app/practice/page.tsx — Status bar, progress dots, drill mode
"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { QuestionCard } from "@/components/question/QuestionCard";
import { ExplanationPanel } from "@/components/question/ExplanationPanel";
import { DrillPanel } from "@/components/question/DrillPanel";
import { LanguageSelector } from "@/components/language/LanguageSelector";
import { MicButton } from "@/components/voice/MicButton";
import { addSession, isOnboarded, getWeakTopics } from "@/lib/student";
import { getAdaptiveQuestion, type Question } from "@/lib/questions";
import { getLanguage } from "@/lib/language";

const TOTAL = 10;

function formatElapsed(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
}

type AnswerRecord = { id: string; correct: boolean; topic: string };

export default function PracticePage() {
    const router = useRouter();

    // Session
    const sessionId = useMemo(
        () => Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, "0"),
        []
    );
    const [elapsed, setElapsed] = useState(0);
    const [lang, setLang] = useState<string>("English");

    // Question state
    const [questionNumber, setQuestionNumber] = useState(1);
    const [current, setCurrent] = useState<Question | null>(null);
    const [studentAnswer, setStudentAnswer] = useState<number | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [showDrill, setShowDrill] = useState(false);
    const [answered, setAnswered] = useState<AnswerRecord[]>([]);
    const [seen, setSeen] = useState<string[]>([]);
    const [weakTopicIds, setWeakTopicIds] = useState<string[]>([]);

    // Route guard
    useEffect(() => {
        if (!isOnboarded()) {
            router.replace("/");
        } else {
            const weak = getWeakTopics();
            setWeakTopicIds(weak.filter(w => w.accuracy < 0.6).map(w => w.topic));
        }
    }, [router]);

    // Timer
    useEffect(() => {
        const id = setInterval(() => setElapsed(e => e + 1), 1000);
        return () => clearInterval(id);
    }, []);

    // Language sync
    useEffect(() => {
        setLang(getLanguage());
        const handleLang = () => setLang(getLanguage());
        window.addEventListener("language-change", handleLang);
        return () => window.removeEventListener("language-change", handleLang);
    }, []);

    // Init first question
    useEffect(() => {
        if (!current) {
            setCurrent(getAdaptiveQuestion([], weakTopicIds));
        }
    }, [current, weakTopicIds]);

    const handleAnswered = (selected: number, isCorrect: boolean) => {
        setStudentAnswer(selected);
        // Build the new record synchronously so nextQuestion always has the full array
        const newAnswered = [...answered, { id: current!.id, correct: isCorrect, topic: current!.topic }];
        setAnswered(newAnswered);
        if (isCorrect) {
            setTimeout(() => nextQuestion(newAnswered), 1400);
        } else {
            setTimeout(() => setShowExplanation(true), 800);
        }
    };

    const nextQuestion = (latestAnswered?: AnswerRecord[]) => {
        const results = latestAnswered ?? answered;
        if (questionNumber >= TOTAL) {
            sessionStorage.setItem("patrolprep-results", JSON.stringify(results));
            
            // Save to student profile history
            addSession({
                id: sessionId,
                date: new Date().toISOString(),
                answers: results.map(r => ({ questionId: r.id, correct: r.correct, topic: r.topic })),
                score: results.filter(r => r.correct).length,
                total: TOTAL
            });

            router.push("/results");
            return;
        }
        setShowExplanation(false);
        setShowDrill(false);
        setStudentAnswer(null);
        setSeen(prev => [...prev, current!.id]);
        setCurrent(getAdaptiveQuestion([...seen, current!.id], weakTopicIds));
        setQuestionNumber(prev => prev + 1);
    };

    // Drill handlers
    const handleStartDrill = () => {
        setShowExplanation(false);
        setShowDrill(true);
    };

    const handleDrillComplete = () => {
        setShowDrill(false);
        nextQuestion();
    };

    if (!current) return (
        <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
            <span className="text-micro">LOADING SESSION…</span>
        </main>
    );

    // Progress dot state
    const dotState = (i: number): "correct" | "incorrect" | "current" | "upcoming" => {
        if (i < answered.length) return answered[i].correct ? "correct" : "incorrect";
        if (i === answered.length) return "current";
        return "upcoming";
    };

    return (
        <main className="min-h-screen bg-grid" style={{ background: "var(--bg-base)" }}>

            {/* ── Status bar ── */}
            <header
                className="flex items-center justify-between px-5 sm:px-8 h-11"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
                <div className="font-display text-lg font-semibold tracking-tight flex-shrink-0">
                    patrolprep<span style={{ color: "var(--accent)" }}>.</span>
                </div>

                <div className="hidden sm:flex items-center gap-0 font-mono text-micro overflow-hidden">
                    {[
                        `SESSION ${sessionId}`,
                        `QUESTION ${String(questionNumber).padStart(2, "0")} / ${TOTAL}`,
                        lang.toUpperCase(),
                        formatElapsed(elapsed),
                    ].map((seg, i, arr) => (
                        <span key={i} className="flex items-center">
                            <span style={{ color: "var(--fg-tertiary)" }}>{seg}</span>
                            {i < arr.length - 1 && (
                                <span className="mx-3" style={{ color: "var(--border-strong)" }}>·</span>
                            )}
                        </span>
                    ))}
                </div>

                <LanguageSelector />
            </header>

            {/* ── Progress dots ── */}
            <div
                className="flex items-center justify-center gap-1.5 py-3"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
                {Array.from({ length: TOTAL }).map((_, i) => {
                    const state = dotState(i);
                    const color =
                        state === "correct"   ? "var(--correct)"        :
                        state === "incorrect" ? "var(--incorrect)"      :
                        state === "current"   ? "var(--accent)"         :
                                               "var(--border-default)";
                    return (
                        <div
                            key={i}
                            className="rounded-full transition-all duration-300"
                            style={{
                                width:  state === "current" ? 12 : 8,
                                height: state === "current" ? 12 : 8,
                                background:  state === "upcoming" ? "transparent" : color,
                                border: state === "upcoming" || state === "current"
                                    ? `1px solid ${color}` : "none",
                                boxShadow: state === "current"
                                    ? `0 0 6px rgba(var(--accent-glow),.5)` : "none",
                            }}
                        />
                    );
                })}
            </div>

            {/* ── Question ── */}
            <div className="flex-1 flex flex-col relative w-full pt-6">
                <AnimatePresence mode="wait">
                    {!showExplanation && !showDrill && (
                        <motion.div
                            key={`q-${current.id}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 overflow-y-auto"
                        >
                            {weakTopicIds.includes(current.topic) && (
                                <div className="text-center mb-2">
                                    <span className="text-micro px-2 py-0.5 rounded" style={{ background: "rgba(var(--accent-glow), 0.15)", color: "var(--accent)", border: "1px solid rgba(var(--accent-glow), 0.3)" }}>
                                        ⚡ TARGETING WEAK AREA
                                    </span>
                                </div>
                            )}
                            <QuestionCard
                                question={current}
                                questionNumber={questionNumber}
                                totalQuestions={TOTAL}
                                onAnswered={handleAnswered}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Explanation panel ── */}
            <AnimatePresence>
                {showExplanation && studentAnswer !== null && (
                    <ExplanationPanel
                        question={current}
                        studentAnswer={studentAnswer}
                        onDrill={handleStartDrill}
                        onContinue={() => nextQuestion()}
                    />
                )}
            </AnimatePresence>

            {/* ── Drill panel ── */}
            <AnimatePresence>
                {showDrill && (
                    <DrillPanel
                        sourceQuestion={current}
                        onComplete={() => handleDrillComplete()}
                    />
                )}
            </AnimatePresence>

            {/* ── Floating mic button ── */}
            {!showDrill && <MicButton />}
        </main>
    );
}