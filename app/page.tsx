// app/page.tsx — Landing page & Onboarding
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { getStudent, saveStudent, isOnboarded, clearStudent, StudentProfile } from "@/lib/student";
import { Language, LANGUAGES, COUNTRIES } from "@/lib/language";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  
  // Onboarding form state
  const [name, setName] = useState("");
  const [lang, setLang] = useState<Language>("English");
  const [country, setCountry] = useState<string>("Canada");

  useEffect(() => {
    setStudent(getStudent());
    setMounted(true);
  }, []);

  const handleStart = () => {
    if (!name.trim()) return;
    const profile: StudentProfile = {
      name: name.trim(),
      language: lang,
      country: country,
      createdAt: new Date().toISOString(),
      sessions: []
    };
    saveStudent(profile);
    router.push("/dashboard");
  };

  const handleReset = () => {
    clearStudent();
    setStudent(null);
    setName("");
    setLang("English");
  };

  if (!mounted) return null; // Avoid hydration mismatch

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-grid py-12">
      {/* Radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, rgba(var(--accent-glow), 0.05) 0%, transparent 60%)`,
        }}
      />

      <div className="relative z-10 w-full max-w-2xl px-6 flex flex-col items-center">
        
        {/* Wordmark */}
        <h1 className="font-display text-5xl sm:text-6xl font-semibold tracking-tight mb-6 text-center">
          patrolprep<span style={{ color: "var(--accent)", textShadow: "0 0 20px rgba(var(--accent-glow), 0.5)" }}>.</span>
        </h1>

        <p className="text-base sm:text-lg mb-2 text-center" style={{ color: "var(--fg-secondary)" }}>
          Pass the Alberta security guard exam in your language.
        </p>
        <p className="text-sm mb-12 text-center" style={{ color: "var(--fg-tertiary)" }}>
          AI-powered practice · Cultural context · 4 languages
        </p>

        {student ? (
          /* ── ALREADY ONBOARDED ── */
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center w-full max-w-sm"
          >
            <div className="p-8 rounded-2xl w-full mb-6" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-2xl">{COUNTRIES.find(c => c.name === student.country)?.flag || "🇨🇦"}</span>
                <span className="text-micro" style={{ color: "var(--accent)" }}>WELCOME BACK</span>
              </div>
              <h2 className="text-2xl font-semibold text-center" style={{ color: "var(--fg-primary)" }}>
                {student.name}
              </h2>
            </div>

            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-semibold text-[15px] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "var(--accent)",
                boxShadow: `0 0 20px rgba(var(--accent-glow), 0.3), 0 4px 12px rgba(0,0,0,0.4)`,
              }}
            >
              CONTINUE TO DASHBOARD →
            </Link>

            <button 
              onClick={handleReset}
              className="mt-6 text-sm underline transition-opacity hover:opacity-80"
              style={{ color: "var(--fg-tertiary)" }}
            >
              Not {student.name}? Start fresh
            </button>
          </motion.div>
        ) : (
          /* ── NOT ONBOARDED ── */
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md flex flex-col gap-8"
          >
            {/* Name Input */}
            <div>
              <label className="block text-micro mb-2" style={{ color: "var(--fg-secondary)" }}>YOUR NAME</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="E.g., Maria"
                className="w-full px-4 py-3 rounded-xl text-base outline-none transition-all"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  color: "var(--fg-primary)",
                }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border-default)"}
              />
            </div>

            {/* Language Selection */}
            <div>
              <label className="block text-micro mb-2" style={{ color: "var(--fg-secondary)" }}>STUDY LANGUAGE</label>
              <div className="grid grid-cols-2 gap-3">
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all"
                    style={{
                      background: lang === l.code ? "rgba(var(--accent-glow), 0.08)" : "var(--bg-surface)",
                      border: `1px solid ${lang === l.code ? "var(--accent)" : "var(--border-default)"}`,
                      cursor: "pointer",
                    }}
                  >
                    <span className="text-sm font-medium" style={{ color: lang === l.code ? "var(--accent)" : "var(--fg-primary)" }}>
                      {l.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Country Selection */}
            <div>
              <label className="block text-micro mb-2" style={{ color: "var(--fg-secondary)" }}>HOME COUNTRY (For Cultural Bridge)</label>
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-base outline-none transition-all appearance-none cursor-pointer"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  color: "var(--fg-primary)",
                }}
              >
                {COUNTRIES.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <button
              onClick={handleStart}
              disabled={!name.trim()}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-semibold text-[15px] transition-all duration-200"
              style={{
                background: name.trim() ? "var(--accent)" : "var(--border-default)",
                boxShadow: name.trim() ? `0 0 20px rgba(var(--accent-glow), 0.3), 0 4px 12px rgba(0,0,0,0.4)` : "none",
                opacity: name.trim() ? 1 : 0.5,
                cursor: name.trim() ? "pointer" : "not-allowed",
              }}
            >
              START LEARNING →
            </button>
          </motion.div>
        )}

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 w-full max-w-3xl">
          {[
            { icon: "📝", title: "Practice Exams", desc: "Adaptive questions weighted to your weak areas." },
            { icon: "📖", title: "Study Guide", desc: "Key concepts from the manual with cultural bridges." },
            { icon: "🎤", title: "Voice Q&A", desc: "Ask anything about Alberta law out loud." },
          ].map((f, i) => (
            <div key={i} className="p-5 rounded-xl" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
              <div className="text-xl mb-2">{f.icon}</div>
              <div className="text-sm font-semibold mb-1" style={{ color: "var(--fg-primary)" }}>{f.title}</div>
              <div className="text-xs leading-relaxed" style={{ color: "var(--fg-tertiary)" }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* AWS badge */}
        <div
          className="mt-12 text-xs flex items-center justify-center gap-2"
          style={{ color: "var(--fg-tertiary)" }}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "var(--status-live)" }} />
          Built on AWS Bedrock · Polly · Transcribe
        </div>
      </div>
    </main>
  );
}