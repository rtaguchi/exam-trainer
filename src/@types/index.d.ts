export interface Question {
    qNumber: number;
    question: string;
    choices: object;
    answer: string[];
    explanation: string;
    responses?: number;
    correctRate?: number;
    correctRateStatus?: string;
    lastAnswerDate?: string;
}
    
export interface AnswerHistory {
    qNumber: number;
    responses: number;
    corrects: number;
    lastAnswerDate: string;
}    

declare module 'twemoji'
