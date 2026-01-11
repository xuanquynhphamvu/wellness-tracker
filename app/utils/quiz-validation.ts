
import type { Question, ScoreRange } from "~/types/quiz";

export type QuizValidationErrors = Record<string, string>;

export function validateQuiz(
    title: string | null,
    slug: string | null,
    description: string | null,
    questions: Question[],
    scoreRanges: ScoreRange[]
): { errors: QuizValidationErrors; isValid: boolean } {
    const errors: QuizValidationErrors = {};

    if (!title || String(title).trim().length === 0) {
        errors.title = 'Title is required';
    }

    if (!slug || String(slug).trim().length === 0) {
        errors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(String(slug))) {
        errors.slug = 'Slug must only contain lowercase letters, numbers, and hyphens';
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

    // Validate score ranges
    if (scoreRanges && scoreRanges.length > 0) {
        scoreRanges.forEach((range, index) => {
            if (range.min > range.max) {
                errors[`range_${index}`] = `Range ${index + 1} min must be less than or equal to max`;
            }
            if (!range.status || range.status.trim().length === 0) {
                errors[`range_${index}`] = `Range ${index + 1} status is required`;
            }

            // Check for overlaps with other ranges
            for (let i = index + 1; i < scoreRanges.length; i++) {
                const other = scoreRanges[i];
                if (
                    (range.min <= other.max && range.max >= other.min)
                ) {
                    errors[`range_${index}_overlap`] = `Range ${index + 1} overlaps with Range ${i + 1}`;
                }
            }
        });
    }

    return { errors, isValid: Object.keys(errors).length === 0 };
}
