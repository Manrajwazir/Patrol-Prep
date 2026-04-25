// lib/questions.ts
import questions from "@/data/questions.json";

export interface Question {
    id: string;
    topic: string;
    difficulty: string;
    question: string;
    options: string[];
    correctAnswer: number;
    manualReference: string;
    manualExcerpt: string;
}

export function getAllQuestions(): Question[] {
    return questions.questions as Question[];
}

export function getRandomQuestion(exclude: string[] = []): Question {
    const all = getAllQuestions().filter(q => !exclude.includes(q.id));
    return all[Math.floor(Math.random() * all.length)];
}

export function getQuestionsByTopic(topic: string): Question[] {
    return getAllQuestions().filter(q => q.topic === topic);
}