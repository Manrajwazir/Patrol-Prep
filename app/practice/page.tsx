// app/practice/page.tsx — Move 1 (status bar), Move 9 (progress dots)
"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { QuestionCard } from "@/components/question/QuestionCard";
import { ExplanationPanel } from "@/components/question/ExplanationPanel";
import { LanguageSelector } from "@/components/language/LanguageSelector";
import { getRandomQuestion, type Question } from "@/lib/questions";
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
    const [answered, setAnswered] = useState<AnswerRecord[]>([]);
    const [seen, setSeen] = useState<string[]>([]);

    // Timer
    useEffect(() => {
        const id = setInterval(() => setElapsed(e => e + 1), 1000);
        return () => clearInterval(id);
    }, []);

    // Language sync
    useEffect(() => {
        setLang(getLanguage());
        const onLangChange = () => setLang(getLanguage());
        window.addEventListener("language-change", onLangChange);
        return () => window.removeEventListener("language-change", onLangChange);
    }, []);

    // First question
    useEffect(() => { setCurrent(getRandomQuestion()); }, []);

    const handleAnswered = (selected: number, isCorrect: boolean) => {
        setStudentAnswer(selected);
        setAnswered(prev => [...prev, { id: current!.id, correct: isCorrect, topic: current!.topic }]);
        if (isCorrect) {
            setTimeout(() => nextQuestion(), 1400);
        } else {
            // Cinematic reveal plays 800ms before panel appears
            setTimeout(() => setShowExplanation(true), 800);
        }
    };

    const nextQuestion = () => {
        if (questionNumber >= TOTAL) {
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

    if (!current) return (
        <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
            <span className="text-micro">LOADING SESSION…</span>
        </main>
    );

    // Move 9 — Progress dot state per position
    const dotState = (i: number): "correct" | "incorrect" | "current" | "upcoming" => {
        if (i < answered.length) return answered[i].correct ? "correct" : "incorrect";
        if (i === answered.length) return "current";
        return "upcoming";
    };

    return (
        <main className="min-h-screen bg-grid" style={{ background: "var(--bg-base)" }}>

            {/* ── Move 1: Status bar ── */}
            <header
                className="flex items-center justify-between px-5 sm:px-8 h-11"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
                {/* Left: wordmark */}
                <div className="font-display text-lg font-semibold tracking-tight flex-shrink-0">
                    patrolprep<span style={{ color: "var(--accent)" }}>.</span>
                </div>

                {/* Centre: metadata strip */}
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

                {/* Right: language selector */}
                <LanguageSelector />
            </header>

            {/* ── Move 9: Progress dots ── */}
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
            <div key={current.id}>
                <QuestionCard
                    question={current}
                    questionNumber={questionNumber}
                    totalQuestions={TOTAL}
                    onAnswered={handleAnswered}
                />
            </div>

            {/* ── Explanation panel ── */}
            <AnimatePresence>
                {showExplanation && studentAnswer !== null && (
                    <ExplanationPanel
                        question={current}
                        studentAnswer={studentAnswer}
                        onDrill={() => alert("Drill mode — TODO")}
                        onContinue={nextQuestion}
                    />
                )}
            </AnimatePresence>
        </main>
    );
}