import { ObjectId } from 'mongodb';

/**
 * Quiz Result Type Definitions
 * 
 * Represents a completed quiz submission with answers and calculated score
 */

export interface QuizResult {
    _id?: ObjectId;
    quizId: ObjectId;
    userId?: string; // Optional: for anonymous users
    sessionId?: string; // Track anonymous users across results
    answers: Answer[];
    score: number;
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
    completedAt: string;
}

/**
 * Helper to serialize a quiz result for client transport
 */
export function serializeQuizResult(result: QuizResult): SerializedQuizResult {
    return {
        ...result,
        _id: result._id?.toString() || '',
        quizId: result.quizId.toString(),
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
