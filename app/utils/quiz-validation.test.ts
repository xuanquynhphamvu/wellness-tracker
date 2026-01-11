
import { describe, it, expect } from 'vitest';
import { validateQuiz } from './quiz-validation';
import type { Question, ScoreRange } from '~/types/quiz';

describe('validateQuiz', () => {
    const validQuestion: Question = {
        id: '1',
        text: 'Valid Question?',
        type: 'multiple-choice',
        options: ['Yes', 'No'],
        scoreMapping: {}
    };

    const validScoreRanges: ScoreRange[] = [];

    it('should return valid for correct inputs', () => {
        const result = validateQuiz('Valid Title', 'Valid Description', [validQuestion], validScoreRanges);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
    });

    it('should require title', () => {
        const result = validateQuiz('', 'Valid Description', [validQuestion], validScoreRanges);
        expect(result.isValid).toBe(false);
        expect(result.errors.title).toBeDefined();
    });

    it('should require description', () => {
        const result = validateQuiz('Valid Title', '', [validQuestion], validScoreRanges);
        expect(result.isValid).toBe(false);
        expect(result.errors.description).toBeDefined();
    });

    it('should require at least one question', () => {
        const result = validateQuiz('Valid Title', 'Valid Description', [], validScoreRanges);
        expect(result.isValid).toBe(false);
        expect(result.errors.questions).toBeDefined();
    });

    it('should validate question text', () => {
        const invalidQuestion = { ...validQuestion, text: '' };
        const result = validateQuiz('Valid Title', 'Valid Description', [invalidQuestion], validScoreRanges);
        expect(result.isValid).toBe(false);
        expect(result.errors['question_0']).toContain('text is required');
    });

    it('should validate multiple-choice options count', () => {
        const invalidQuestion = { ...validQuestion, options: ['Only One'] };
        const result = validateQuiz('Valid Title', 'Valid Description', [invalidQuestion], validScoreRanges);
        expect(result.isValid).toBe(false);
        expect(result.errors['question_0']).toContain('at least 2 options');
    });

    it('should validate multiple-choice empty options', () => {
        const invalidQuestion = { ...validQuestion, options: ['Option 1', ''] };
        const result = validateQuiz('Valid Title', 'Valid Description', [invalidQuestion], validScoreRanges);
        expect(result.isValid).toBe(false);
        expect(result.errors['question_0']).toContain('empty options');
    });

    it('should validate scale min/max', () => {
        const invalidQuestion: Question = {
            id: '2',
            text: 'Scale Question',
            type: 'scale',
            scaleMin: 10,
            scaleMax: 5,
            scoreMapping: {}
        };
        const result = validateQuiz('Valid Title', 'Valid Description', [invalidQuestion], validScoreRanges);
        expect(result.isValid).toBe(false);
        expect(result.errors['question_0']).toContain('min must be less than max');
    });
});
