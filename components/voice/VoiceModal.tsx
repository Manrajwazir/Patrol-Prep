// components/voice/VoiceModal.tsx — Step 15
"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { getLanguage, LANGUAGES, getCountry, COUNTRIES } from "@/lib/language";

type Stage = "idle" | "recording" | "processing" | "answer" | "error";

async function blobToBase64(blob: Blob): Promise<string> {
    const buf = await blob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    bytes.forEach(b => (binary += String.fromCharCode(b)));
    return btoa(binary);
}

const ghostBtn: React.CSSProperties = {
    background: "transparent",
    border: "1px solid var(--border-default)",
    color: "var(--fg-secondary)",
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    padding: "8px 16px",
    borderRadius: 8,
    cursor: "pointer",
};

export function VoiceModal({ onClose }: { onClose: () => void }) {
    const [stage, setStage] = useState<Stage>("idle");
    const [transcript, setTranscript] = useState("");
    const [answer, setAnswer] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const lang = getLanguage();
    const langMeta = LANGUAGES.find(l => l.code === lang)!;
    const countryName = getCountry();
    const countryMeta = COUNTRIES.find(c => c.name === countryName);
    const noVoice = lang === "Tagalog" || lang === "Punjabi";

    const start = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/mp4";
            const recorder = new MediaRecorder(stream, { mimeType: mime });
            chunksRef.current = [];
            recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
            recorder.onstop = async () => {
                stream.getTracks().forEach(t => t.stop());
                await process();
            };
            recorder.start(100);
            recorderRef.current = recorder;
            setStage("recording");
        } catch {
            setErrorMsg("Microphone access denied.");
            setStage("error");
        }
    };

    const stop = () => { recorderRef.current?.stop(); setStage("processing"); };

    const process = async () => {
        try {
            const base64 = await blobToBase64(new Blob(chunksRef.current));
            const tr = await api.transcribe(base64, langMeta.transcribeCode);
            const text = tr.text ?? "";
            setTranscript(text);
            if (!text.trim()) { setErrorMsg("Couldn't hear anything. Try again."); setStage("error"); return; }
            const ask = await api.ask({ question: text, language: lang });
            setAnswer(ask.answer ?? "");
            setStage("answer");
            try {
                const sp = await api.speak(ask.answer, lang);
                if (sp.audioBase64) {
                    const audio = new Audio(`data:audio/mpeg;base64,${sp.audioBase64}`);
                    audioRef.current = audio;
                    audio.play().catch(() => { });
                }
            } catch { }
        } catch (e: any) {
            setErrorMsg(e?.message ?? "Something went wrong.");
            setStage("error");
        }
    };

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
    };

    const reset = () => { stopAudio(); setStage("idle"); setTranscript(""); setAnswer(""); setErrorMsg(""); };

    const handleClose = () => { stopAudio(); onClose(); };

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.65)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
        >
            <motion.div
                initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ type: "spring", damping: 26, stiffness: 200 }}
                className="w-full max-w-md rounded-2xl overflow-hidden"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", boxShadow: "0 24px 64px rgba(0,0,0,.6)" }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <div className="flex items-center gap-2">
                        <span className="text-micro" style={{ color: "var(--accent)" }}>VOICE Q&amp;A</span>
                        <span style={{ color: "var(--border-strong)" }}>·</span>
                        <span className="text-micro">{lang.toUpperCase()}</span>
                        <span>{countryMeta?.flag || "🇨🇦"}</span>
                    </div>
                    <button style={{ ...ghostBtn, padding: "4px 10px" }} onClick={handleClose}>ESC</button>
                </div>

                {/* Body */}
                <div className="px-6 py-6">
                    <AnimatePresence mode="wait">

                        {stage === "idle" && (
                            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-2">
                                <p className="text-sm text-center" style={{ color: "var(--fg-secondary)" }}>
                                    Ask anything about Alberta security training. Answer returns in <strong style={{ color: "var(--fg-primary)" }}>{lang}</strong>.
                                </p>
                                <button onClick={start} className="mt-2 px-8 py-4 rounded-xl text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all"
                                    style={{ background: "var(--accent)", boxShadow: "0 0 20px rgba(var(--accent-glow),.3)", cursor: "pointer" }}>
                                    START RECORDING
                                </button>
                            </motion.div>
                        )}

                        {stage === "recording" && (
                            <motion.div key="recording" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-2">
                                <div className="relative flex items-center justify-center my-2">
                                    <div className="absolute w-20 h-20 rounded-full animate-ping" style={{ background: "rgba(248,113,113,.18)" }} />
                                    <div className="relative w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--incorrect)" }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                            <rect x="9" y="2" width="6" height="12" rx="3" fill="white" />
                                            <path d="M5 11a7 7 0 0 0 14 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                            <line x1="12" y1="18" x2="12" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                </div>
                                <span className="text-micro" style={{ color: "var(--incorrect)" }}>RECORDING…</span>
                                <button onClick={stop} className="px-8 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                                    style={{ background: "var(--bg-surface)", border: "1px solid var(--incorrect)", color: "var(--incorrect)", cursor: "pointer" }}>
                                    STOP RECORDING
                                </button>
                            </motion.div>
                        )}

                        {stage === "processing" && (
                            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
                                    <span className="text-micro">TRANSCRIBING · ASKING BEDROCK…</span>
                                </div>
                                <div className="w-full space-y-3 mt-2">
                                    <div className="skeleton h-3 w-full" /><div className="skeleton h-3 w-5/6" /><div className="skeleton h-3 w-4/6" />
                                </div>
                            </motion.div>
                        )}

                        {stage === "answer" && (
                            <motion.div key="answer" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
                                {transcript && (
                                    <div>
                                        <div className="text-micro mb-1">YOU ASKED</div>
                                        <p className="text-sm italic" style={{ color: "var(--fg-tertiary)" }}>"{transcript}"</p>
                                    </div>
                                )}
                                <div className="p-4 rounded-xl" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                                    <div className="text-micro mb-2" style={{ color: "var(--accent)" }}>ANSWER · {lang.toUpperCase()}</div>
                                    <p className="text-[15px] leading-relaxed" style={{ color: "var(--fg-primary)" }}>{answer}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button style={ghostBtn} onClick={reset} onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }} className="flex-1">ASK AGAIN</button>
                                    <button style={{ ...ghostBtn, borderColor: "var(--accent)", color: "var(--accent)" }} onClick={handleClose} onMouseEnter={e => { e.currentTarget.style.background = "rgba(var(--accent-glow),.06)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }} className="flex-1">CLOSE</button>
                                </div>
                            </motion.div>
                        )}

                        {stage === "error" && (
                            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-2">
                                <p className="text-sm text-center" style={{ color: "var(--incorrect)" }}>{errorMsg}</p>
                                <div className="flex gap-2">
                                    <button style={ghostBtn} onClick={reset} onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>TRY AGAIN</button>
                                    <button style={ghostBtn} onClick={handleClose} onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>CLOSE</button>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>

                {/* Polly limitation notice */}
                {noVoice && (
                    <div className="px-6 py-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                        <p className="text-micro">NOTE · POLLY DOES NOT SUPPORT {lang.toUpperCase()} — ANSWER SHOWN AS TEXT ONLY</p>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
