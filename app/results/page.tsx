// app/results/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ResultsPage() {
    const [results, setResults] = useState<any[]>([]);

    useEffect(() => {
        const data = sessionStorage.getItem("patrolprep-results");
        if (data) setResults(JSON.parse(data));
    }, []);

    const correct = results.filter(r => r.correct).length;
    const total = results.length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = pct >= 70;

    // Weak topics
    const byTopic = results.reduce((acc, r) => {
        if (!acc[r.topic]) acc[r.topic] = { correct: 0, total: 0 };
        acc[r.topic].total += 1;
        if (r.correct) acc[r.topic].correct += 1;
        return acc;
    }, {} as Record<string, { correct: number; total: number }>);

    const weak = Object.entries(byTopic)
        .filter(([_, v]: any) => v.correct / v.total < 0.6)
        .map(([k]) => k);

    const strong = Object.entries(byTopic)
        .filter(([_, v]: any) => v.correct / v.total >= 0.6)
        .map(([k]) => k);

    return (
        <main className="min-h-screen flex items-center justify-center p-6 bg-grid" style={{ background: "var(--bg-base)" }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="max-w-md w-full"
            >
                {/* Header */}
                <div className="text-micro mb-3" style={{ color: "var(--fg-tertiary)" }}>
                    SESSION COMPLETE
                </div>

                {/* Score circle */}
                <div className="flex items-center gap-6 mb-8">
                    <div
                        className="relative w-24 h-24 rounded-full flex items-center justify-center"
                        style={{
                            background: `conic-gradient(${passed ? "var(--correct)" : "var(--incorrect)"} ${pct}%, var(--bg-surface) 0%)`,
                        }}
                    >
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center"
                            style={{ background: "var(--bg-base)" }}
                        >
                            <span className="font-display text-2xl font-semibold">{pct}%</span>
                        </div>
                    </div>
                    <div>
                        <div className="font-display text-4xl font-semibold mb-1">
                            {correct}<span style={{ color: "var(--fg-tertiary)" }}> / {total}</span>
                        </div>
                        <div
                            className="text-sm font-medium"
                            style={{ color: passed ? "var(--correct)" : "var(--incorrect)" }}
                        >
                            {passed ? "Passing score ✓" : "Keep practicing"}
                        </div>
                    </div>
                </div>

                {/* Weak topics */}
                {weak.length > 0 && (
                    <div
                        className="mb-4 p-4 rounded-xl"
                        style={{
                            background: "rgba(248, 113, 113, 0.05)",
                            border: "1px solid rgba(248, 113, 113, 0.15)",
                        }}
                    >
                        <div className="text-micro mb-3" style={{ color: "var(--incorrect)" }}>
                            NEEDS PRACTICE
                        </div>
                        <ul className="space-y-2">
                            {weak.map(topic => (
                                <li
                                    key={topic}
                                    className="flex items-center gap-2 text-sm"
                                    style={{ color: "var(--fg-secondary)" }}
                                >
                                    <span
                                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                        style={{ background: "var(--incorrect)" }}
                                    />
                                    {topic.replace(/_/g, " ")}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Strong topics */}
                {strong.length > 0 && (
                    <div
                        className="mb-8 p-4 rounded-xl"
                        style={{
                            background: "rgba(74, 222, 128, 0.05)",
                            border: "1px solid rgba(74, 222, 128, 0.15)",
                        }}
                    >
                        <div className="text-micro mb-3" style={{ color: "var(--correct)" }}>
                            STRONG
                        </div>
                        <ul className="space-y-2">
                            {strong.map(topic => (
                                <li
                                    key={topic}
                                    className="flex items-center gap-2 text-sm"
                                    style={{ color: "var(--fg-secondary)" }}
                                >
                                    <span
                                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                        style={{ background: "var(--correct)" }}
                                    />
                                    {topic.replace(/_/g, " ")}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                    <Link
                        href="/practice"
                        className="block w-full text-center py-3.5 rounded-xl text-white font-medium text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
                        style={{
                            background: "var(--accent)",
                            boxShadow: "0 0 16px rgba(var(--accent-glow), 0.25)",
                        }}
                    >
                        Try Again
                    </Link>
                    <Link
                        href="/"
                        className="block w-full text-center py-3.5 rounded-xl font-medium text-sm transition-all duration-200"
                        style={{
                            background: "var(--bg-surface)",
                            color: "var(--fg-secondary)",
                            border: "1px solid var(--border-default)",
                        }}
                    >
                        Back to Home
                    </Link>
                </div>
            </motion.div>
        </main>
    );
}