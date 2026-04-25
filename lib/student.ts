// lib/student.ts
import { Language, LANGUAGES } from "./language";

export interface SessionResult {
    id: string;          // 4-char hex
    date: string;        // ISO timestamp
    answers: { 
        questionId: string; 
        correct: boolean; 
        topic: string;
        questionText?: string;
        selectedAnswerText?: string;
        correctAnswerText?: string;
    }[];
    score: number;       // 0-10
    total: number;       // 10
}

export interface StudentProfile {
    name: string;
    language: Language;
    country: string;
    createdAt: string;
    sessions: SessionResult[];
}

export function getStudent(): StudentProfile | null {
    if (typeof window === "undefined") return null;
    const data = localStorage.getItem("patrolprep-student");
    if (!data) return null;
    try {
        const parsed = JSON.parse(data) as StudentProfile;
        if (!parsed.country) parsed.country = "Canada"; // backward compatibility
        return parsed;
    } catch {
        return null;
    }
}

export function saveStudent(profile: StudentProfile): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("patrolprep-student", JSON.stringify(profile));
    // Also sync the language/country selection so they are available globally
    localStorage.setItem("patrolprep-lang", profile.language);
    localStorage.setItem("patrolprep-country", profile.country);
    // Dispatch events so hooks update
    window.dispatchEvent(new Event("language-change"));
    window.dispatchEvent(new Event("country-change"));
}

export function isOnboarded(): boolean {
    return getStudent() !== null;
}

export function clearStudent(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("patrolprep-student");
}

export function addSession(session: SessionResult): void {
    const student = getStudent();
    if (!student) return;
    
    // Deduplicate by ID
    if (student.sessions.some(s => s.id === session.id)) return;
    
    student.sessions.push(session);
    saveStudent(student);
}

export function getWeakTopics(): { topic: string; accuracy: number; total: number }[] {
    const student = getStudent();
    if (!student || student.sessions.length === 0) return [];

    const stats: Record<string, { correct: number; total: number }> = {};

    for (const session of student.sessions) {
        for (const ans of session.answers) {
            if (!stats[ans.topic]) {
                stats[ans.topic] = { correct: 0, total: 0 };
            }
            stats[ans.topic].total += 1;
            if (ans.correct) {
                stats[ans.topic].correct += 1;
            }
        }
    }

    return Object.entries(stats)
        .map(([topic, data]) => ({
            topic,
            accuracy: data.correct / data.total,
            total: data.total
        }))
        .sort((a, b) => a.accuracy - b.accuracy);
}
