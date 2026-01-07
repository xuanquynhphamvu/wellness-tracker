import { ObjectId } from 'mongodb';

/**
 * Quiz Type Definitions
 * 
 * EXECUTION CONTEXT: BOTH server and client
 * - These types are used in loaders (server) and components (client)
 * - No runtime code, just TypeScript types (no bundle impact)
 */

export interface Quiz {
    _id?: ObjectId;
    title: string;
    description: string;
    questions: Question[];
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Question {
    id: string;
    text: string;
    type: 'multiple-choice' | 'scale' | 'text';
    options?: string[]; // For multiple-choice questions
    scaleMin?: number; // For scale questions (e.g., 1)
    scaleMax?: number; // For scale questions (e.g., 10)
    scoreMapping?: Record<string, number>; // Map answers to scores
}

/**
 * Serialized Quiz (for client-side use)
 * MongoDB ObjectId and Date objects need to be serialized for JSON transport
 */
export interface SerializedQuiz {
    _id: string;
    title: string;
    description: string;
    questions: Question[];
    isPublished: boolean;
    createdAt: string;
    updatedAt: string;
}

/**
 * Helper to serialize a quiz for client transport
 */
export function serializeQuiz(quiz: Quiz): SerializedQuiz {
    return {
        ...quiz,
        _id: quiz._id?.toString() || '',
        createdAt: quiz.createdAt.toISOString(),
        updatedAt: quiz.updatedAt.toISOString(),
    };
}
