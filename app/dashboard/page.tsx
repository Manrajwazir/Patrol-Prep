// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { getStudent, isOnboarded, StudentProfile, getWeakTopics } from "@/lib/student";
import { LANGUAGES, COUNTRIES } from "@/lib/language";
import { LanguageSelector } from "@/components/language/LanguageSelector";
import { VoiceModal } from "@/components/voice/VoiceModal";
import { MicButton } from "@/components/voice/MicButton";
import { TOPIC_NAMES } from "@/data/topics";

export default function DashboardPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [student, setStudent] = useState<StudentProfile | null>(null);
    const [showVoice, setShowVoice] = useState(false);

    useEffect(() => {
        if (!isOnboarded()) {
            router.replace("/");
            return;
        }
        setStudent(getStudent());
        setMounted(true);
    }, [router]);

    if (!mounted || !student) return null;

    const countryMeta = COUNTRIES.find(c => c.name === student.country) || COUNTRIES[0];
    const weakTopics = getWeakTopics();
    const totalQuestions = student.sessions.reduce((acc, s) => acc + s.answers.length, 0);

    // AI Recommendation logic
    let recommendation = "";
    let recommendedTopic = "";
    if (weakTopics.length > 0) {
        const weakest = weakTopics[0];
        recommendedTopic = weakest.topic;
        const accuracy = Math.round(weakest.accuracy * 100);
        if (accuracy < 70) {
            recommendation = `Focus on ${TOPIC_NAMES[weakest.topic] || weakest.topic}. Your accuracy is ${accuracy}%, which is below the passing threshold. Review the core concepts in the study guide before your next practice session.`;
        } else {
            recommendation = `You're doing great across the board. Your lowest area is ${TOPIC_NAMES[weakest.topic] || weakest.topic} at ${accuracy}%. A quick review of this section will help you secure a perfect score.`;
        }
    } else {
        recommendation = "Complete your first practice session to get personalized AI study recommendations based on your weak areas.";
    }

    return (
        <main className="min-h-screen bg-grid" style={{ background: "var(--bg-base)" }}>
            
            {/* Header */}
            <header
                className="flex items-center justify-between px-5 sm:px-8 h-11 bg-opacity-90 backdrop-blur-md sticky top-0 z-40"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
                <div className="font-display text-lg font-semibold tracking-tight flex-shrink-0">
                    patrolprep<span style={{ color: "var(--accent)" }}>.</span>
                </div>
                <div className="hidden sm:flex items-center gap-0 font-mono text-micro overflow-hidden">
                    <span className="flex items-center">
                        <span style={{ color: "var(--fg-primary)" }}>{student.name.toUpperCase()}</span>
                        <span className="mx-3" style={{ color: "var(--border-strong)" }}>·</span>
                    </span>
                    <span className="flex items-center">
                        <span style={{ color: "var(--fg-tertiary)" }}>{student.language.toUpperCase()}</span>
                        <span className="ml-2">{countryMeta.flag}</span>
                    </span>
                </div>
                <LanguageSelector />
            </header>

            <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10 pb-24">
                
                {/* Welcome */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-display font-semibold mb-2" style={{ color: "var(--fg-primary)" }}>
                            Welcome back, {student.name}
                        </h1>
                        <p className="text-sm" style={{ color: "var(--fg-secondary)" }}>
                            {student.sessions.length} sessions completed · {totalQuestions} questions answered
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/study"
                            className="px-6 py-2.5 rounded-xl font-medium text-sm transition-all hover:opacity-80"
                            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--fg-primary)" }}
                        >
                            Study Guide
                        </Link>
                        <Link
                            href="/practice"
                            className="px-6 py-2.5 rounded-xl font-medium text-sm text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                            style={{ background: "var(--accent)", boxShadow: "0 0 16px rgba(var(--accent-glow), 0.3)" }}
                        >
                            Practice Exam
                        </Link>
                    </div>
                </motion.div>

                {/* AI Recommendation */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="mb-10 p-6 rounded-2xl relative overflow-hidden"
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--accent)" }}
                >
                    <div className="absolute top-0 left-0 w-full h-1" style={{ background: "var(--accent)" }} />
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-micro" style={{ color: "var(--accent)" }}>AI STUDY RECOMMENDATION</span>
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
                    </div>
                    <p className="text-[15px] leading-relaxed mb-4" style={{ color: "var(--fg-primary)" }}>
                        {recommendation}
                    </p>
                    {weakTopics.length > 0 && (
                        <Link
                            href="/study"
                            className="text-sm font-medium hover:underline inline-flex items-center gap-1"
                            style={{ color: "var(--accent)" }}
                        >
                            Review {TOPIC_NAMES[recommendedTopic] || recommendedTopic} →
                        </Link>
                    )}
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    
                    {/* Topic Proficiency */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <div className="text-micro mb-4" style={{ color: "var(--fg-tertiary)" }}>TOPIC PROFICIENCY</div>
                        <div className="space-y-4">
                            {Object.entries(TOPIC_NAMES).map(([topicId, title]) => {
                                const stats = weakTopics.find(w => w.topic === topicId);
                                const hasData = !!stats && stats.total > 0;
                                const accuracy = hasData ? Math.round(stats.accuracy * 100) : 0;
                                
                                let color = "var(--border-default)";
                                if (hasData) {
                                    if (accuracy >= 70) color = "var(--correct)";
                                    else if (accuracy >= 60) color = "var(--accent)";
                                    else color = "var(--incorrect)";
                                }

                                return (
                                    <div key={topicId}>
                                        <div className="flex justify-between text-sm mb-1.5">
                                            <span style={{ color: "var(--fg-secondary)" }}>{title}</span>
                                            <span className="font-mono" style={{ color: hasData ? color : "var(--fg-tertiary)" }}>
                                                {hasData ? `${accuracy}%` : "--"}
                                            </span>
                                        </div>
                                        <div className="h-1.5 rounded-full overflow-hidden flex" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                                            {hasData ? (
                                                <>
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${accuracy}%` }}
                                                        transition={{ duration: 1, ease: "easeOut" }}
                                                        className="h-full" 
                                                        style={{ background: color }} 
                                                    />
                                                    {/* The remaining part is just empty */}
                                                </>
                                            ) : (
                                                <div className="h-full w-full" style={{ background: "transparent" }} />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Session History */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <div className="text-micro mb-4" style={{ color: "var(--fg-tertiary)" }}>SESSION HISTORY</div>
                        
                        {student.sessions.length === 0 ? (
                            <div className="p-6 text-center rounded-xl border border-dashed" style={{ borderColor: "var(--border-strong)", color: "var(--fg-tertiary)" }}>
                                <p className="text-sm">No sessions completed yet.</p>
                            </div>
                        ) : (
                            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--fg-tertiary)" }}>
                                            <th className="font-normal px-4 py-2">ID</th>
                                            <th className="font-normal px-4 py-2">Score</th>
                                            <th className="font-normal px-4 py-2">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...student.sessions].reverse().map((session, i) => (
                                            <tr 
                                                key={session.id}
                                                className="transition-colors hover:bg-white/5 group"
                                                style={{ borderBottom: i < student.sessions.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
                                            >
                                                <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--fg-secondary)" }}>{session.id}</td>
                                                <td className="px-4 py-3 font-mono font-medium" style={{ color: (session.score / session.total) >= 0.7 ? "var(--correct)" : "var(--incorrect)" }}>
                                                    {session.score}/{session.total}
                                                </td>
                                                <td className="px-4 py-3 text-xs flex justify-between items-center" style={{ color: "var(--fg-tertiary)" }}>
                                                    <span>{new Date(session.date).toLocaleDateString()} {new Date(session.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                    <Link 
                                                        href={`/history/${session.id}`}
                                                        className="text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                                        style={{ background: "rgba(var(--accent-glow), 0.15)", color: "var(--accent)" }}
                                                    >
                                                        View Exam
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Quick Actions */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <div className="text-micro mb-4" style={{ color: "var(--fg-tertiary)" }}>QUICK ACTIONS</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Link href="/practice" className="flex items-center gap-3 p-4 rounded-xl transition-all hover:bg-white/5" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                            <span className="text-xl">📝</span>
                            <span className="text-sm font-medium" style={{ color: "var(--fg-primary)" }}>Practice Exam</span>
                        </Link>
                        <Link href="/study" className="flex items-center gap-3 p-4 rounded-xl transition-all hover:bg-white/5" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                            <span className="text-xl">📖</span>
                            <span className="text-sm font-medium" style={{ color: "var(--fg-primary)" }}>Study Guide</span>
                        </Link>
                        <button onClick={() => setShowVoice(true)} className="flex items-center gap-3 p-4 rounded-xl transition-all hover:bg-white/5 text-left cursor-pointer" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                            <span className="text-xl">🎤</span>
                            <span className="text-sm font-medium" style={{ color: "var(--fg-primary)" }}>Voice Q&A</span>
                        </button>
                    </div>
                </motion.div>

            </div>

            {/* Global Voice Mic Button (floating) */}
            <MicButton />

            {/* Modal for the quick action button */}
            {showVoice && <VoiceModal onClose={() => setShowVoice(false)} />}

        </main>
    );
}
