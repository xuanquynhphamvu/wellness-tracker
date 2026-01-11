
import type { Question, ScoreRange } from "~/types/quiz";

export type QuizValidationErrors = Record<string, string>;

export function validateQuiz(
    title: string | null,
    description: string | null,
    questions: Question[],
    scoreRanges: ScoreRange[]
): { errors: QuizValidationErrors; isValid: boolean } {
    const errors: QuizValidationErrors = {};

    if (!title || String(title).trim().length === 0) {
        errors.title = 'Title is required';
    }

    if (!description || String(description).trim().length === 0) {
        errors.description = 'Description is required';
    }

    if (!questions || questions.length === 0) {
        errors.questions = 'At least one question is required';
    } else {
        // Validate each question
        questions.forEach((q, index) => {
            if (!q.text || q.text.trim().length === 0) {
                errors[`question_${index}`] = `Question ${index + 1} text is required`;
            }

            if (q.type === 'multiple-choice') {
                if (!q.options || q.options.length < 2) {
                    errors[`question_${index}`] = `Question ${index + 1} must have at least 2 options`;
                }
                if (q.options?.some(opt => !opt || opt.trim().length === 0)) {
                    errors[`question_${index}`] = `Question ${index + 1} has empty options`;
                }
            }

            if (q.type === 'scale') {
                if ((q.scaleMin || 0) >= (q.scaleMax || 0)) {
                    errors[`question_${index}`] = `Question ${index + 1} scale min must be less than max`;
                }
            }
        });
    }

    return { errors, isValid: Object.keys(errors).length === 0 };
}
