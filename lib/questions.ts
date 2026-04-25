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

export function getAdaptiveQuestion(exclude: string[] = [], weakTopics: string[] = []): Question {
    const all = getAllQuestions().filter(q => !exclude.includes(q.id));
    
    // If no weak topics or out of questions, just pick random
    if (weakTopics.length === 0 || all.length === 0) {
        return all[Math.floor(Math.random() * all.length)];
    }
    
    // 60% chance to pick from weak topics
    if (Math.random() < 0.6) {
        const weak = all.filter(q => weakTopics.includes(q.topic));
        if (weak.length > 0) {
            return weak[Math.floor(Math.random() * weak.length)];
        }
    }
    
    // Fallback to random
    return all[Math.floor(Math.random() * all.length)];
}