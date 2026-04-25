// app/history/[id]/page.tsx
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getStudent, isOnboarded, StudentProfile, SessionResult } from "@/lib/student";
import { TOPIC_NAMES } from "@/data/topics";

export default function HistoryPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [mounted, setMounted] = useState(false);
    const [student, setStudent] = useState<StudentProfile | null>(null);
    const [session, setSession] = useState<SessionResult | null>(null);

    useEffect(() => {
        if (!isOnboarded()) {
            router.replace("/");
            return;
        }
        const profile = getStudent();
        setStudent(profile);
        
        if (profile) {
            const found = profile.sessions.find(s => s.id === id);
            if (found) {
                setSession(found);
            } else {
                router.replace("/dashboard"); // not found
            }
        }
        setMounted(true);
    }, [router, id]);

    if (!mounted || !student || !session) return null;

    const percent = Math.round((session.score / session.total) * 100);
    const passed = percent >= 80;

    return (
        <main className="min-h-screen bg-grid pb-24" style={{ background: "var(--bg-base)" }}>
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
            </header>

            <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <div className="text-micro mb-2" style={{ color: "var(--fg-tertiary)" }}>
                            EXAM REVIEW · SESSION {session.id}
                        </div>
                        <h1 className="text-4xl font-display font-semibold mb-2" style={{ color: "var(--fg-primary)" }}>
                            Exam Results
                        </h1>
                        <p className="text-sm" style={{ color: "var(--fg-secondary)" }}>
                            Completed on {new Date(session.date).toLocaleDateString()} at {new Date(session.date).toLocaleTimeString()}
                        </p>
                    </div>
                    
                    <div 
                        className="px-6 py-4 rounded-2xl flex flex-col items-center justify-center min-w-[140px]"
                        style={{ 
                            background: "var(--bg-surface)", 
                            border: `1px solid ${passed ? "var(--correct)" : "var(--incorrect)"}` 
                        }}
                    >
                        <span className="text-3xl font-mono font-bold" style={{ color: passed ? "var(--correct)" : "var(--incorrect)" }}>
                            {percent}%
                        </span>
                        <span className="text-xs uppercase font-bold tracking-wider mt-1" style={{ color: passed ? "var(--correct)" : "var(--incorrect)", opacity: 0.8 }}>
                            {passed ? "Passed" : "Needs Review"}
                        </span>
                    </div>
                </div>

                <div className="space-y-6">
                    {session.answers.map((ans, idx) => (
                        <div 
                            key={idx}
                            className="rounded-2xl p-6 relative overflow-hidden"
                            style={{ 
                                background: "var(--bg-surface)", 
                                border: "1px solid var(--border-subtle)" 
                            }}
                        >
                            <div className="absolute top-0 left-0 bottom-0 w-1" style={{ background: ans.correct ? "var(--correct)" : "var(--incorrect)" }} />
                            
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-micro font-mono px-2 py-0.5 rounded-md" style={{ background: "rgba(0,0,0,0.2)", color: "var(--fg-secondary)" }}>
                                    Q{idx + 1}
                                </span>
                                <span className="text-micro" style={{ color: "var(--fg-tertiary)" }}>
                                    {TOPIC_NAMES[ans.topic] || ans.topic.replace(/_/g, " ")}
                                </span>
                            </div>

                            <h3 className="text-lg font-medium mb-5 leading-relaxed" style={{ color: "var(--fg-primary)" }}>
                                {ans.questionText || "Historical question data missing."}
                            </h3>

                            {ans.questionText && (
                                <div className="space-y-3">
                                    {/* Selected Answer */}
                                    <div 
                                        className="p-4 rounded-xl flex items-start gap-3"
                                        style={{ 
                                            background: ans.correct ? "rgba(74, 222, 128, 0.05)" : "rgba(248, 113, 113, 0.05)",
                                            border: `1px solid ${ans.correct ? "rgba(74, 222, 128, 0.2)" : "rgba(248, 113, 113, 0.2)"}`
                                        }}
                                    >
                                        <div className="mt-0.5" style={{ color: ans.correct ? "var(--correct)" : "var(--incorrect)" }}>
                                            {ans.correct ? (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            ) : (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: ans.correct ? "var(--correct)" : "var(--incorrect)" }}>
                                                Your Answer
                                            </div>
                                            <div className="text-[15px]" style={{ color: "var(--fg-primary)" }}>
                                                {ans.selectedAnswerText}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Correct Answer (if wrong) */}
                                    {!ans.correct && (
                                        <div 
                                            className="p-4 rounded-xl flex items-start gap-3"
                                            style={{ 
                                                background: "rgba(74, 222, 128, 0.05)",
                                                border: "1px dashed rgba(74, 222, 128, 0.3)"
                                            }}
                                        >
                                            <div className="mt-0.5" style={{ color: "var(--correct)" }}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--correct)" }}>
                                                    Correct Answer
                                                </div>
                                                <div className="text-[15px]" style={{ color: "var(--fg-primary)" }}>
                                                    {ans.correctAnswerText}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex justify-center">
                    <Link 
                        href="/dashboard"
                        className="px-8 py-3 rounded-xl font-semibold text-[15px] transition-all hover:scale-[1.02]"
                        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-strong)", color: "var(--fg-primary)" }}
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </main>
    );
}
