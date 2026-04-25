// components/question/DrillPanel.tsx
// Step 14 — Drill mode. Calls POST /drill, renders 3 AI-generated questions
// in a mini-session, then returns user to the main practice flow.
"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import type { Question } from "@/lib/questions";

const EASE = [0.2, 0.8, 0.2, 1] as const;

interface DrillQuestion {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

interface Props {
    /** The original question the student got wrong */
    sourceQuestion: Question;
    /** Called when drill session is complete */
    onComplete: () => void;
}

export function DrillPanel({ sourceQuestion, onComplete }: Props) {
    const [drillQuestions, setDrillQuestions] = useState<DrillQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [results, setResults] = useState<boolean[]>([]);
    const [done, setDone] = useState(false);

    // Fetch 3 drill questions on mount
    useEffect(() => {
        api.drill({
            question: sourceQuestion.question,
            concept: sourceQuestion.topic.replace(/_/g, " "),
            manualExcerpt: sourceQuestion.manualExcerpt,
        })
            .then(res => {
                const qs = res.questions ?? res;
                if (Array.isArray(qs) && qs.length > 0) {
                    setDrillQuestions(qs.slice(0, 3));
                } else {
                    setError(true);
                }
                setLoading(false);
            })
            .catch(() => {
                setError(true);
                setLoading(false);
            });
    }, [sourceQuestion]);

    const current = drillQuestions[currentIndex];

    const handleSelect = (i: number) => {
        if (submitted) return;
        setSelected(i);
    };

    const handleSubmit = () => {
        if (selected === null || !current) return;
        setSubmitted(true);
        setResults(prev => [...prev, selected === current.correctAnswer]);
    };

    const handleNext = () => {
        if (currentIndex >= drillQuestions.length - 1) {
            setDone(true);
            return;
        }
        setCurrentIndex(prev => prev + 1);
        setSelected(null);
        setSubmitted(false);
    };

    const optionState = (i: number): "default" | "correct" | "incorrect" => {
        if (!submitted) return "default";
        if (i === current.correctAnswer) return "correct";
        if (i === selected) return "incorrect";
        return "default";
    };

    const letterColor = (i: number) => {
        const s = optionState(i);
        if (s === "correct")   return "var(--correct)";
        if (s === "incorrect") return "var(--incorrect)";
        if (selected === i)    return "var(--accent)";
        return "var(--fg-tertiary)";
    };

    const ghostBtn: React.CSSProperties = {
        background: "transparent",
        border: "1px solid var(--border-default)",
        color: "var(--fg-secondary)",
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        padding: "8px 18px",
        borderRadius: 8,
        cursor: "pointer",
        transition: "background 0.15s",
    };

    return (
        <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 180 }}
            className="fixed inset-0 z-50 overflow-y-auto"
            style={{ background: "var(--bg-base)" }}
        >
            {/* Header strip */}
            <div
                className="flex items-center justify-between px-5 sm:px-8 h-12"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
                <div className="flex items-center gap-2">
                    <span className="text-micro" style={{ color: "var(--accent)" }}>DRILL MODE</span>
                    <span style={{ color: "var(--border-strong)" }}>·</span>
                    <span className="text-micro">
                        {sourceQuestion.topic.replace(/_/g, " ").toUpperCase()}
                    </span>
                </div>

                {/* Drill progress dots */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        {Array.from({ length: 3 }).map((_, i) => {
                            const color =
                                i < results.length
                                    ? results[i] ? "var(--correct)" : "var(--incorrect)"
                                    : i === currentIndex && !done
                                    ? "var(--accent)"
                                    : "var(--border-default)";
                            return (
                                <div
                                    key={i}
                                    className="rounded-full transition-all duration-300"
                                    style={{
                                        width:  i === currentIndex && !done ? 10 : 7,
                                        height: i === currentIndex && !done ? 10 : 7,
                                        background: i >= results.length && !(i === currentIndex && !done)
                                            ? "transparent" : color,
                                        border: i >= results.length
                                            ? `1px solid ${color}` : "none",
                                    }}
                                />
                            );
                        })}
                    </div>
                    <span className="text-micro">
                        {done ? "COMPLETE" : `${currentIndex + 1} / 3`}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-5 sm:px-8 py-10">

                {/* Loading state */}
                {loading && (
                    <div className="flex flex-col items-center gap-4 pt-20">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-2 h-2 rounded-full animate-pulse"
                                style={{ background: "var(--accent)" }}
                            />
                            <span className="text-micro">GENERATING DRILL QUESTIONS…</span>
                        </div>
                        <div className="w-full max-w-md space-y-3 mt-6">
                            <div className="skeleton h-4 w-full" />
                            <div className="skeleton h-4 w-5/6" />
                            <div className="skeleton h-4 w-4/6" />
                        </div>
                    </div>
                )}

                {/* Error state */}
                {error && (
                    <div className="flex flex-col items-center gap-4 pt-20">
                        <p className="text-sm" style={{ color: "var(--fg-secondary)" }}>
                            Could not generate drill questions. The concept will be covered again later.
                        </p>
                        <button
                            style={{ ...ghostBtn, borderColor: "var(--accent)", color: "var(--accent)" }}
                            onClick={onComplete}
                        >
                            BACK TO PRACTICE
                        </button>
                    </div>
                )}

                {/* Done — summary */}
                {done && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: EASE }}
                        className="flex flex-col items-center pt-16"
                    >
                        <span className="text-micro mb-4">DRILL COMPLETE</span>
                        <div className="font-display text-5xl font-semibold mb-2">
                            {results.filter(Boolean).length}
                            <span style={{ color: "var(--fg-tertiary)" }}> / 3</span>
                        </div>
                        <p className="text-sm mb-8" style={{ color: "var(--fg-secondary)" }}>
                            {sourceQuestion.topic.replace(/_/g, " ")}
                        </p>
                        <button
                            style={{ ...ghostBtn, borderColor: "var(--accent)", color: "var(--accent)" }}
                            onClick={onComplete}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(var(--accent-glow),.06)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                        >
                            BACK TO PRACTICE →
                        </button>
                    </motion.div>
                )}

                {/* Active question */}
                {!loading && !error && !done && current && (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25, ease: EASE }}
                        >
                            {/* Drill question text */}
                            <h2
                                className="text-[20px] leading-[1.6] mb-8 font-normal"
                                style={{ color: "var(--fg-primary)" }}
                            >
                                {current.question}
                            </h2>

                            {/* Options */}
                            <div
                                className="rounded-xl overflow-hidden mb-8"
                                style={{
                                    border: "1px solid var(--border-subtle)",
                                    background: "var(--bg-surface)",
                                }}
                            >
                                {current.options.map((opt, i) => (
                                    <div
                                        key={i}
                                        className="relative"
                                        style={{
                                            borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)",
                                        }}
                                    >
                                        {/* Selected bar */}
                                        {selected === i && !submitted && (
                                            <motion.div
                                                layoutId="drill-bar"
                                                className="absolute left-0 top-0 bottom-0"
                                                style={{ width: 2, background: "var(--accent)" }}
                                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            />
                                        )}

                                        {/* Correct bar after submit */}
                                        {submitted && i === current.correctAnswer && (
                                            <motion.div
                                                className="absolute left-0 top-0 bottom-0"
                                                style={{ width: 3, background: "var(--correct)", transformOrigin: "top" }}
                                                initial={{ scaleY: 0 }}
                                                animate={{ scaleY: 1 }}
                                                transition={{ duration: 0.2, ease: EASE }}
                                            />
                                        )}

                                        <button
                                            onClick={() => handleSelect(i)}
                                            disabled={submitted}
                                            className="w-full flex items-center text-left transition-all duration-150"
                                            style={{
                                                padding: "18px 16px",
                                                cursor: submitted ? "default" : "pointer",
                                                opacity: submitted && optionState(i) === "default" ? 0.4 : 1,
                                            }}
                                            onMouseEnter={e => {
                                                if (!submitted) e.currentTarget.style.background = "rgba(var(--accent-glow), 0.04)";
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = "transparent";
                                            }}
                                        >
                                            <div
                                                className="flex-shrink-0 font-mono transition-colors duration-200"
                                                style={{
                                                    width: 48,
                                                    fontSize: 20,
                                                    lineHeight: 1,
                                                    color: letterColor(i),
                                                    fontWeight: selected === i || submitted ? 600 : 400,
                                                }}
                                            >
                                                {["A", "B", "C", "D"][i]}
                                            </div>
                                            <span
                                                className="flex-1 text-[16px] leading-relaxed"
                                                style={{
                                                    color:
                                                        optionState(i) === "correct"   ? "var(--correct)"   :
                                                        optionState(i) === "incorrect" ? "var(--incorrect)" :
                                                                                         "var(--fg-primary)",
                                                }}
                                            >
                                                {opt}
                                            </span>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Explanation after submit */}
                            {submitted && current.explanation && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-8 p-4 rounded-xl"
                                    style={{
                                        background: "rgba(74,222,128,.05)",
                                        border: "1px solid rgba(74,222,128,.12)",
                                    }}
                                >
                                    <p className="text-sm leading-relaxed" style={{ color: "var(--fg-secondary)" }}>
                                        {current.explanation}
                                    </p>
                                </motion.div>
                            )}

                            {/* Actions */}
                            {!submitted ? (
                                <button
                                    onClick={handleSubmit}
                                    disabled={selected === null}
                                    className="w-full py-4 rounded-xl text-white font-semibold text-base tracking-wide transition-all duration-200"
                                    style={{
                                        background: selected !== null ? "var(--accent)" : "var(--border-default)",
                                        boxShadow: selected !== null
                                            ? "0 0 16px rgba(var(--accent-glow),.2)"
                                            : "none",
                                        cursor: selected !== null ? "pointer" : "not-allowed",
                                        opacity: selected !== null ? 1 : 0.35,
                                    }}
                                >
                                    SUBMIT
                                </button>
                            ) : (
                                <button
                                    onClick={handleNext}
                                    className="w-full py-4 rounded-xl font-semibold text-base tracking-wide transition-all duration-200"
                                    style={{
                                        background: "var(--bg-surface)",
                                        border: "1px solid var(--border-default)",
                                        color: "var(--fg-primary)",
                                        cursor: "pointer",
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                                >
                                    {currentIndex >= drillQuestions.length - 1 ? "SEE RESULTS" : "NEXT QUESTION →"}
                                </button>
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </motion.div>
    );
}
