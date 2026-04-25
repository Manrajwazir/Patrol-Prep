// components/question/ExplanationPanel.tsx
// Move 6 (split layout), Move 10 (micro labels everywhere)
"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { getLanguage, LANGUAGES, type Language, COUNTRIES, getCountry } from "@/lib/language";
import { BRIDGES } from "@/data/concept-bridge";
import type { Question } from "@/lib/questions";

const EASE = [0.2, 0.8, 0.2, 1] as const;

// Move 6 — cultural comparison by language
const CULTURAL: Record<Language, string> = {
    English:  "General Canadian legal context.",
    Spanish:  "Compared to Latin American legal frameworks — civil law tradition.",
    Tagalog:  "Compared to Philippine legal tradition — Revised Penal Code context.",
    Punjabi:  "Compared to South Asian legal concepts — IPC and customary law context.",
};

// Move 6 — key concept labels
const KEY_CONCEPT: Record<string, string> = {
    use_of_force:          "Use of Force\n§25 Criminal Code",
    lawful_detention:      "Lawful Detention\nCitizen's Arrest",
    charter_rights:        "Charter Rights\nConstitution Act, 1982",
    note_taking_reporting: "Note-Taking &\nIncident Reporting",
    patrol_procedures:     "Patrol Procedures\nSite Security",
    emergency_response:    "Emergency Response\nFirst Aid Protocols",
};

interface Props {
    question: Question;
    studentAnswer: number;
    onDrill: () => void;
    onContinue: () => void;
}

export function ExplanationPanel({ question, studentAnswer, onDrill, onContinue }: Props) {
    const [explanation, setExplanation] = useState<string | null>(null);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState(false);
    const [latencyMs, setLatencyMs]     = useState<number | null>(null);
    const startRef = useRef(Date.now());

    const lang        = getLanguage();
    const countryName = getCountry();
    const cultural    = LANGUAGES.find(l => l.code === lang)?.cultural ?? "general";
    const countryMeta = COUNTRIES.find(c => c.name === countryName);
    const concept     = KEY_CONCEPT[question.topic] ?? question.topic.replace(/_/g, " ");
    const cultureNote = CULTURAL[lang as Language] ?? CULTURAL.English;

    useEffect(() => {
        startRef.current = Date.now();
        api.explain({
            question:      question.question,
            options:       question.options,
            correctAnswer: question.correctAnswer,
            studentAnswer,
            manualExcerpt: question.manualExcerpt,
            language:      lang,
            culturalHint:  cultural,
        })
            .then(res => {
                setLatencyMs(Date.now() - startRef.current);
                setExplanation(res.explanation);
                setLoading(false);
            })
            .catch(() => {
                setError(true);
                setLoading(false);
            });
    }, [question, studentAnswer]);

    // Ghost button style
    const ghostBtn: React.CSSProperties = {
        background: "transparent",
        border: "1px solid var(--border-default)",
        color: "var(--fg-secondary)",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        padding: "6px 14px",
        borderRadius: 6,
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s",
    };

    return (
        <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 180 }}
            className="fixed bottom-0 left-0 right-0 z-40 max-h-[70vh] overflow-y-auto"
            style={{
                background: "var(--bg-elevated)",
                borderTop: "1px solid var(--border-default)",
                boxShadow: "0 -12px 40px rgba(0,0,0,.6)",
            }}
        >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-8 h-1 rounded-full" style={{ background: "var(--border-strong)" }} />
            </div>

            <div className="max-w-4xl mx-auto px-5 sm:px-8 pb-8">
                {/* ── Move 6: Header strip ── */}
                <div
                    className="flex items-center justify-between py-3 mb-5"
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-micro" style={{ color: "var(--incorrect)" }}>EXPLANATION</span>
                        <span style={{ color: "var(--border-strong)" }}>·</span>
                        <span className="text-micro">{lang.toUpperCase()}</span>
                        {latencyMs !== null && (
                            <>
                                <span style={{ color: "var(--border-strong)" }}>·</span>
                                <span className="font-mono text-micro">
                                    {(latencyMs / 1000).toFixed(1)}s
                                </span>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            style={ghostBtn}
                            onClick={onContinue}
                            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                        >
                            CONTINUE →
                        </button>
                        <button
                            style={{ ...ghostBtn, borderColor: "var(--accent)", color: "var(--accent)" }}
                            onClick={onDrill}
                            disabled={loading}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(var(--accent-glow),.06)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                        >
                            DRILL
                        </button>
                    </div>
                </div>

                {/* ── Move 6: Two-column body ── */}
                <div className="flex flex-col md:flex-row gap-6 md:gap-0">

                    {/* Left — explanation text (60%) */}
                    <div className="flex-1 md:pr-6">
                        {loading ? (
                            <div className="space-y-3">
                                <div className="skeleton h-4 w-full" />
                                <div className="skeleton h-4 w-5/6" />
                                <div className="skeleton h-4 w-full" />
                                <div className="skeleton h-4 w-4/6" />
                            </div>
                        ) : error ? (
                            <p className="text-sm" style={{ color: "var(--fg-secondary)" }}>
                                Could not load explanation. Check your connection.
                            </p>
                        ) : (
                            <p className="text-[15px] leading-[1.75]" style={{ color: "var(--fg-primary)" }}>
                                {explanation}
                            </p>
                        )}
                    </div>

                    {/* Right — structured metadata (40%) */}
                    <div
                        className="md:w-[38%] md:pl-6 flex flex-col gap-5"
                        style={{ borderLeft: "1px solid var(--border-subtle)" }}
                    >
                        {/* KEY CONCEPT */}
                        <div>
                            <div className="text-micro mb-1.5">KEY CONCEPT</div>
                            <p
                                className="text-sm font-medium leading-snug whitespace-pre-line"
                                style={{ color: "var(--fg-secondary)" }}
                            >
                                {concept}
                            </p>
                        </div>

                        {/* MANUAL REFERENCE */}
                        {question.manualReference && (
                            <div>
                                <div className="text-micro mb-1.5">MANUAL REFERENCE</div>
                                <p className="font-mono text-xs" style={{ color: "var(--fg-secondary)" }}>
                                    {question.manualReference}
                                </p>
                            </div>
                        )}

                        {/* CONCEPT BRIDGE */}
                        {(() => {
                            const bridge = BRIDGES[question.topic]?.[lang as Language];
                            if (!bridge) return null;
                            return (
                                <div className="mt-2 p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.15)", border: "1px solid var(--border-default)" }}>
                                    <div className="text-micro mb-3 flex items-center gap-2" style={{ color: "var(--accent)" }}>
                                        <span>🌉</span> CONCEPT BRIDGE
                                    </div>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <span className="font-semibold" style={{ color: "var(--fg-primary)" }}>🇨🇦 Canadian Law</span>
                                            <p className="mt-1" style={{ color: "var(--fg-secondary)" }}>{concept}</p>
                                        </div>
                                        <div className="pt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                                            <span className="font-semibold" style={{ color: "var(--fg-primary)" }}>{countryMeta?.flag || "📍"} {countryName}</span>
                                            <p className="mt-1" style={{ color: "var(--fg-secondary)" }}>{bridge.comparison}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}