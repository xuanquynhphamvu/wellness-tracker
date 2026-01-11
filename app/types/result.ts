import { ObjectId } from 'mongodb';

/**
 * Quiz Result Type Definitions
 * 
 * Represents a completed quiz submission with answers and calculated score
 */

export interface QuizResult {
    _id?: ObjectId;
    quizId: ObjectId;
    userId: ObjectId;  // Required: link result to user
    sessionId?: string; // Optional: for tracking sessions
    answers: Answer[];
    score: number;
    subScores?: Record<string, number>;
    completedAt: Date;
}

export interface Answer {
    questionId: string;
    answer: string | number; // String for text/multiple-choice, number for scale
}

/**
 * Serialized QuizResult (for client-side use)
 */
export interface SerializedQuizResult {
    _id: string;
    quizId: string;
    userId?: string;
    sessionId?: string;
    answers: Answer[];
    score: number;
    subScores?: Record<string, number>;
    completedAt: string;
}

/**
 * Helper to serialize a quiz result for client transport
 */
export function serializeQuizResult(result: QuizResult): SerializedQuizResult {
    return {
        _id: result._id?.toString() || '',
        quizId: result.quizId.toString(),
        userId: result.userId.toString(),  // Convert ObjectId to string
        sessionId: result.sessionId,
        answers: result.answers,
        score: result.score,
        subScores: result.subScores,
        completedAt: result.completedAt.toISOString(),
    };
}

/**
 * Progress data for tracking user's quiz history
 */
export interface ProgressData {
    quizTitle: string;
    results: {
        date: string;
        score: number;
    }[];
}
