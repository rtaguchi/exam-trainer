import { DateTime } from 'luxon'

export interface Question {
    qNumber: number;
    question: string;
    choices: object;
    answer: string[];
    explanation: string;
    responses?: number;
    correctRate?: number;
    correctRateStatus?: string;
    lastAnswerDate?: DateTime;
}
    
export interface AnswerHistory {
    qNumber: number;
    responses: number;
    corrects: number;
    lastAnswerDate: DateTime;
}    

declare module 'twemoji'
