// app/study/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getStudent, isOnboarded, StudentProfile, getWeakTopics } from "@/lib/student";
import { TOPICS } from "@/data/topics";
import { LANGUAGES } from "@/lib/language";
import { LanguageSelector } from "@/components/language/LanguageSelector";
import { MicButton } from "@/components/voice/MicButton";
import { api } from "@/lib/api";

export default function StudyGuidePage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [student, setStudent] = useState<StudentProfile | null>(null);
    const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
    const [weakTopicIds, setWeakTopicIds] = useState<string[]>([]);
    
    // State for explanations
    const [explaining, setExplaining] = useState<Record<string, boolean>>({});
    const [explanations, setExplanations] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isOnboarded()) {
            router.replace("/");
            return;
        }
        setStudent(getStudent());
        setWeakTopicIds(getWeakTopics().map(w => w.topic));
        setMounted(true);
    }, [router]);

    if (!mounted || !student) return null;
    const langMeta = LANGUAGES.find(l => l.code === student.language) || LANGUAGES[0];

    const handleExplain = async (topicId: string, conceptIndex: number, excerpt: string) => {
        const key = `${topicId}-${conceptIndex}`;
        if (explaining[key] || explanations[key]) return;

        setExplaining(prev => ({ ...prev, [key]: true }));
        try {
            const prompt = `Please explain this Alberta security law concept simply in ${student.language}. Then, provide a brief cultural comparison to the laws in ${langMeta.homeCountry}: "${excerpt}"`;
            const res = await api.ask({ question: prompt, language: student.language });
            setExplanations(prev => ({ ...prev, [key]: res.answer }));
        } catch (err) {
            setExplanations(prev => ({ ...prev, [key]: "Sorry, unable to load explanation right now." }));
        } finally {
            setExplaining(prev => ({ ...prev, [key]: false }));
        }
    };

    return (
        <main className="min-h-screen bg-grid" style={{ background: "var(--bg-base)" }}>
            
            {/* Header */}
            <header
                className="flex items-center justify-between px-5 sm:px-8 h-11 bg-opacity-90 backdrop-blur-md sticky top-0 z-40"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
                <div className="font-display text-lg font-semibold tracking-tight flex-shrink-0 flex items-center gap-4">
                    <Link href="/dashboard" className="text-sm font-medium hover:underline" style={{ color: "var(--fg-secondary)" }}>
                        ← Dashboard
                    </Link>
                    <span>
                        patrolprep<span style={{ color: "var(--accent)" }}>.</span>
                    </span>
                </div>
                <div className="hidden sm:flex items-center gap-0 font-mono text-micro overflow-hidden">
                    <span className="flex items-center">
                        <span style={{ color: "var(--fg-primary)" }}>STUDY GUIDE</span>
                        <span className="mx-3" style={{ color: "var(--border-strong)" }}>·</span>
                    </span>
                    <span className="flex items-center">
                        <span style={{ color: "var(--fg-tertiary)" }}>{student.language.toUpperCase()}</span>
                        <span className="ml-2">{langMeta.flag}</span>
                    </span>
                </div>
                <LanguageSelector />
            </header>

            <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10 pb-24">
                
                <h1 className="text-3xl font-display font-semibold mb-2" style={{ color: "var(--fg-primary)" }}>
                    Study Guide
                </h1>
                <p className="text-sm mb-10" style={{ color: "var(--fg-secondary)" }}>
                    Core concepts from the Alberta Basic Security Training manual.
                </p>

                <div className="space-y-6">
                    {TOPICS.map((topic, i) => {
                        const isExpanded = expandedTopic === topic.id;
                        const isWeak = weakTopicIds.includes(topic.id) && weakTopicIds.indexOf(topic.id) < 2; // top 2 weak

                        return (
                            <motion.div
                                key={topic.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="rounded-2xl overflow-hidden"
                                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                            >
                                {/* Card Header (Clickable) */}
                                <button
                                    className="w-full text-left p-6 relative flex flex-col sm:flex-row gap-4 sm:items-center justify-between cursor-pointer transition-colors hover:bg-white/5"
                                    onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: topic.color }} />
                                    
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-xl">{topic.icon}</span>
                                            <h2 className="text-lg font-semibold" style={{ color: "var(--fg-primary)" }}>{topic.title}</h2>
                                            {isWeak && (
                                                <span className="text-micro px-2 py-0.5 rounded bg-red-500/10" style={{ color: "var(--incorrect)", border: "1px solid rgba(248,113,113,0.2)" }}>
                                                    NEEDS PRACTICE
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm leading-relaxed max-w-xl" style={{ color: "var(--fg-secondary)" }}>
                                            {topic.summary}
                                        </p>
                                    </div>
                                    
                                    <div className="flex-shrink-0 flex flex-col items-end">
                                        <span className="text-micro mb-1" style={{ color: "var(--fg-tertiary)" }}>{topic.module}</span>
                                        <span className="text-xs" style={{ color: "var(--fg-tertiary)" }}>{topic.pages}</span>
                                    </div>
                                </button>

                                {/* Expanded Content */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t overflow-hidden"
                                            style={{ borderColor: "var(--border-subtle)" }}
                                        >
                                            <div className="p-6 space-y-8 bg-black/20">
                                                {topic.keyConcepts.map((concept, idx) => {
                                                    const key = `${topic.id}-${idx}`;
                                                    const isExplaining = explaining[key];
                                                    const explanation = explanations[key];

                                                    return (
                                                        <div key={idx} className="relative pl-4" style={{ borderLeft: `2px solid var(--border-default)` }}>
                                                            <div className="text-micro mb-1" style={{ color: "var(--fg-tertiary)" }}>
                                                                {concept.section}
                                                            </div>
                                                            <h3 className="font-semibold text-base mb-2" style={{ color: "var(--fg-primary)" }}>
                                                                {concept.title}
                                                            </h3>
                                                            <p className="text-[15px] italic leading-relaxed mb-4" style={{ color: "var(--fg-secondary)" }}>
                                                                "{concept.excerpt}"
                                                            </p>
                                                            
                                                            {!explanation && !isExplaining && (
                                                                <button
                                                                    onClick={() => handleExplain(topic.id, idx, concept.excerpt)}
                                                                    className="text-sm font-medium px-4 py-2 rounded-lg transition-all"
                                                                    style={{ background: "rgba(var(--accent-glow), 0.1)", color: "var(--accent)", border: "1px solid rgba(var(--accent-glow), 0.2)" }}
                                                                >
                                                                    Explain in {student.language} ✨
                                                                </button>
                                                            )}

                                                            {isExplaining && (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
                                                                    <span className="text-micro">TRANSLATING CONCEPTS…</span>
                                                                </div>
                                                            )}

                                                            {explanation && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: 5 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    className="p-4 rounded-xl mt-4"
                                                                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                                                                >
                                                                    <div className="text-micro mb-2 flex items-center gap-2" style={{ color: "var(--accent)" }}>
                                                                        <span>{langMeta.flag}</span>
                                                                        AI EXPLANATION · {student.language.toUpperCase()}
                                                                    </div>
                                                                    <p className="text-[15px] leading-relaxed" style={{ color: "var(--fg-primary)" }}>
                                                                        {explanation}
                                                                    </p>
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <MicButton />
        </main>
    );
}
