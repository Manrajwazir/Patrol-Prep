// components/question/QuestionCard.tsx
"use client";
import { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { AnswerOption } from "./AnswerOption";
import type { Question } from "@/lib/questions";

const EASE = [0.2, 0.8, 0.2, 1] as const;

const TOPIC: Record<string, { color: string; label: string; ref: string }> = {
    use_of_force:          { color: "var(--topic-use_of_force)",          label: "Use of Force",      ref: "§25 Criminal Code" },
    lawful_detention:      { color: "var(--topic-lawful_detention)",      label: "Lawful Detention",  ref: "Citizen's Arrest" },
    charter_rights:        { color: "var(--topic-charter_rights)",        label: "Charter Rights",    ref: "Constitution Act 1982" },
    note_taking_reporting: { color: "var(--topic-note_taking_reporting)", label: "Note-Taking",       ref: "Incident Reporting" },
    patrol_procedures:     { color: "var(--topic-patrol_procedures)",     label: "Patrol Procedures", ref: "Site Security" },
    emergency_response:    { color: "var(--topic-emergency_response)",    label: "Emergency Response",ref: "First Aid" },
};

function parseRef(ref: string) {
    const sec  = ref?.match(/[Ss]ection\s+([\d.]+)/)?.[1] ?? "";
    const page = ref?.match(/[Pp]age\s+(\d+)/)?.[1] ?? "";
    return { sec, page };
}

interface Props {
    question: Question;
    questionNumber: number;
    totalQuestions: number;
    onAnswered: (selected: number, isCorrect: boolean) => void;
}

export function QuestionCard({ question, questionNumber, totalQuestions, onAnswered }: Props) {
    const [selected, setSelected]   = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [wasWrong, setWasWrong]   = useState(false);

    const topic         = TOPIC[question.topic] ?? { color: "var(--accent)", label: question.topic, ref: "" };
    const { sec, page } = parseRef(question.manualReference ?? "");

    const handleSubmit = () => {
        if (selected === null) return;
        const correct = selected === question.correctAnswer;
        setSubmitted(true);
        if (!correct) setWasWrong(true);
        onAnswered(selected, correct);
    };

    const optionState = (i: number): "default" | "correct" | "incorrect" => {
        if (!submitted) return "default";
        if (i === question.correctAnswer) return "correct";
        if (i === selected)               return "incorrect";
        return "default";
    };

    return (
        <>
            {/* Dim overlay (cinematic Move 5) */}
            <AnimatePresence>
                {wasWrong && (
                    <motion.div
                        className="fixed inset-0 pointer-events-none z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: EASE }}
                        style={{ background: "rgba(0,0,0,0.28)" }}
                    />
                )}
            </AnimatePresence>

            {/* ── Centred card with number watermark behind ── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="relative z-20 w-full max-w-4xl mx-auto px-5 sm:px-8 py-10"
            >
                {/* Giant number — absolute, centred, behind content */}
                <div
                    className="absolute inset-0 flex items-start justify-center pointer-events-none select-none overflow-hidden"
                    style={{ zIndex: 0, paddingTop: 24 }}
                >
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={questionNumber}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 0.055, y: 0 }}
                            exit={{ opacity: 0, y: -24 }}
                            transition={{ duration: 0.25, ease: EASE }}
                            className="font-display font-semibold leading-none"
                            style={{
                                fontSize: "clamp(140px, 30vw, 240px)",
                                color: "var(--fg-primary)",
                            }}
                        >
                            {String(questionNumber).padStart(2, "0")}
                        </motion.span>
                    </AnimatePresence>
                </div>

                {/* Card content — above the watermark */}
                <div
                    className="relative"
                    style={{
                        zIndex: 1,
                        paddingLeft: 20,
                        borderLeft: `3px solid ${topic.color}`,
                    }}
                >
                    {/* Topic label + manual ref tag */}
                    <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                            <span className="text-micro" style={{ color: topic.color }}>
                                {topic.label}
                            </span>
                            <span style={{ color: "var(--border-strong)" }}>·</span>
                            <span className="text-micro">{topic.ref}</span>
                        </div>

                        {sec && (
                            <span
                                className="font-mono text-micro px-2 py-1 rounded-sm flex-shrink-0"
                                style={{
                                    background: "var(--bg-surface)",
                                    border: "1px solid var(--border-subtle)",
                                    color: "var(--fg-tertiary)",
                                }}
                                title="Source: Alberta Basic Security Training Participant Manual"
                            >
                                §{sec}{page ? ` · pg ${page}` : ""}
                            </span>
                        )}
                    </div>

                    {/* Question text */}
                    <h2
                        className="text-[22px] leading-[1.6] mb-10 font-normal"
                        style={{ color: "var(--fg-primary)" }}
                    >
                        {question.question}
                    </h2>

                    {/* Options */}
                    <LayoutGroup>
                        <div
                            className="rounded-xl overflow-hidden mb-8"
                            style={{
                                border: "1px solid var(--border-subtle)",
                                background: "var(--bg-surface)",
                            }}
                        >
                            {question.options.map((opt, i) => (
                                <AnswerOption
                                    key={i}
                                    index={i}
                                    letter={["A", "B", "C", "D"][i] as "A" | "B" | "C" | "D"}
                                    text={opt}
                                    selected={selected === i}
                                    onSelect={() => !submitted && setSelected(i)}
                                    state={optionState(i)}
                                    disabled={submitted}
                                    cinematic={wasWrong}
                                />
                            ))}
                        </div>
                    </LayoutGroup>

                    {/* Submit */}
                    {!submitted && (
                        <motion.button
                            whileHover={{ opacity: selected !== null ? 0.9 : 1 }}
                            whileTap={{ scale: selected !== null ? 0.98 : 1 }}
                            onClick={handleSubmit}
                            disabled={selected === null}
                            className="w-full py-5 rounded-xl text-white font-semibold text-lg tracking-wide transition-all duration-200"
                            style={{
                                background: selected !== null ? "var(--accent)" : "var(--border-default)",
                                boxShadow: selected !== null
                                    ? "0 0 20px rgba(var(--accent-glow),.2), 0 4px 12px rgba(0,0,0,.3)"
                                    : "none",
                                cursor: selected !== null ? "pointer" : "not-allowed",
                                opacity: selected !== null ? 1 : 0.35,
                            }}
                        >
                            SUBMIT ANSWER
                        </motion.button>
                    )}

                    {/* Correct flash */}
                    {submitted && selected === question.correctAnswer && (
                        <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 py-3 px-4 rounded-xl"
                            style={{
                                background: "rgba(74,222,128,.08)",
                                border: "1px solid rgba(74,222,128,.15)",
                                color: "var(--correct)",
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M4 9l3.5 3.5L14 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="text-micro" style={{ color: "var(--correct)" }}>CORRECT</span>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </>
    );
}