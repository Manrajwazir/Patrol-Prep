// components/voice/MicButton.tsx
// Step 15 — Floating mic button. Opens VoiceModal.
"use client";
import { useState } from "react";
import { VoiceModal } from "./VoiceModal";

export function MicButton() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                aria-label="Ask a question by voice"
                className="fixed bottom-7 right-7 z-30 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                    width: 60,
                    height: 60,
                    background: "var(--accent)",
                    boxShadow: "0 0 24px rgba(var(--accent-glow),.45), 0 6px 20px rgba(0,0,0,.45)",
                    cursor: "pointer",
                }}
            >
                {/* Mic SVG */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="9" y="2" width="6" height="12" rx="3" fill="white" />
                    <path d="M5 11a7 7 0 0 0 14 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="18" x2="12" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <line x1="8" y1="22" x2="16" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>

            {open && <VoiceModal onClose={() => setOpen(false)} />}
        </>
    );
}
