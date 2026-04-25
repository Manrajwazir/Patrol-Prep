// components/question/AnswerOption.tsx
"use client";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const EASE = [0.2, 0.8, 0.2, 1] as const;

interface Props {
    index: number;
    letter: "A" | "B" | "C" | "D";
    text: string;
    selected: boolean;
    onSelect: () => void;
    state?: "default" | "correct" | "incorrect";
    disabled?: boolean;
    cinematic?: boolean;
}

export function AnswerOption({
    index,
    letter,
    text,
    selected,
    onSelect,
    state = "default",
    disabled,
    cinematic = false,
}: Props) {
    const isIncorrect = state === "incorrect";
    const isCorrect   = state === "correct";

    const letterColor =
        isCorrect   ? "var(--correct)"   :
        isIncorrect ? "var(--incorrect)" :
        selected    ? "var(--accent)"    :
                      "var(--fg-tertiary)";

    return (
        <div
            className="relative"
            style={{ borderTop: index === 0 ? "none" : "1px solid var(--border-subtle)" }}
        >
            {/* Strikethrough on wrong answer (cinematic, 200ms) */}
            {isIncorrect && cinematic && (
                <motion.div
                    className="absolute pointer-events-none"
                    style={{
                        left: 64,   // letter col (48) + gap (16)
                        right: 16,
                        top: "50%",
                        height: 1,
                        background: "var(--incorrect)",
                        transformOrigin: "left",
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.2, duration: 0.18, ease: EASE }}
                />
            )}

            {/* Green bar on correct answer (cinematic, 400ms) */}
            {isCorrect && cinematic && (
                <motion.div
                    className="absolute left-0 top-0 bottom-0 pointer-events-none"
                    style={{ width: 3, background: "var(--correct)", transformOrigin: "top" }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: 0.4, duration: 0.2, ease: EASE }}
                />
            )}

            {/* Selected accent bar — slides between options via layoutId */}
            {selected && !disabled && (
                <motion.div
                    layoutId="answer-bar"
                    className="absolute left-0 top-0 bottom-0"
                    style={{ width: 2, background: "var(--accent)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
            )}

            <button
                onClick={onSelect}
                disabled={disabled}
                className="w-full flex items-center text-left transition-all duration-150"
                style={{
                    // Fix: paddingLeft creates gap between the 2px bar and the letter
                    padding: "20px 16px 20px 16px",
                    cursor: disabled ? "default" : "pointer",
                    opacity: disabled && state === "default" ? 0.45 : 1,
                }}
                onMouseEnter={e => {
                    if (!disabled && state === "default") {
                        e.currentTarget.style.opacity = "0.85";
                        if (!selected)
                            e.currentTarget.style.background = "rgba(var(--accent-glow), 0.04)";
                    }
                }}
                onMouseLeave={e => {
                    if (!disabled && state === "default") {
                        e.currentTarget.style.opacity = "1";
                        e.currentTarget.style.background = "transparent";
                    }
                }}
            >
                {/* Letter */}
                <div
                    className="flex-shrink-0 font-mono transition-colors duration-200"
                    style={{
                        width: 56,
                        fontSize: 24,
                        lineHeight: 1,
                        color: letterColor,
                        fontWeight: selected || isCorrect || isIncorrect ? 600 : 400,
                    }}
                >
                    {letter}
                </div>

                {/* Option text */}
                <span
                    className="flex-1 text-[18px] leading-relaxed"
                    style={{
                        color:
                            isCorrect   ? "var(--correct)"   :
                            isIncorrect ? "var(--incorrect)" :
                                          "var(--fg-primary)",
                    }}
                >
                    {text}
                </span>

                {/* Checkmark on correct (cinematic, 600ms) */}
                {isCorrect && cinematic && (
                    <motion.span
                        className="ml-3 flex-shrink-0"
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6, duration: 0.15, ease: EASE }}
                        style={{ color: "var(--correct)" }}
                    >
                        <Check size={18} strokeWidth={2.5} />
                    </motion.span>
                )}
            </button>
        </div>
    );
}