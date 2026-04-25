// components/language/LanguageSelector.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LANGUAGES, getLanguage, setLanguage, type Language } from "@/lib/language";

export function LanguageSelector() {
    const [current, setCurrent] = useState<Language>("English");
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setCurrent(getLanguage());
    }, []);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    const handleChange = (lang: Language) => {
        setLanguage(lang);
        setCurrent(lang);
        setOpen(false);
        window.dispatchEvent(new Event("language-change"));
    };

    const currentLang = LANGUAGES.find(l => l.code === current)!;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200"
                style={{
                    background: open ? "var(--bg-hover)" : "var(--bg-surface)",
                    border: "1px solid var(--border-default)",
                    cursor: "pointer",
                }}
            >
                <span className="text-base">{currentLang.flag}</span>
                <span style={{ color: "var(--fg-secondary)" }}>{currentLang.label}</span>
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="transition-transform duration-200"
                    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="var(--fg-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-52 rounded-xl overflow-hidden z-50"
                        style={{
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--border-default)",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                        }}
                    >
                        <div className="py-1">
                            {LANGUAGES.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => handleChange(lang.code)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-all duration-150"
                                    style={{
                                        color: lang.code === current ? "var(--accent)" : "var(--fg-primary)",
                                        background: lang.code === current ? "rgba(var(--accent-glow), 0.06)" : "transparent",
                                        cursor: "pointer",
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.opacity = "0.8";
                                        if (lang.code !== current) e.currentTarget.style.background = "var(--bg-hover)";
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.opacity = "1";
                                        if (lang.code !== current) e.currentTarget.style.background = "transparent";
                                    }}
                                >
                                    <span className="text-base">{lang.flag}</span>
                                    <span>{lang.label}</span>
                                    {lang.code === current && (
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="ml-auto">
                                            <path d="M3 7l2.5 2.5L11 4.5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}