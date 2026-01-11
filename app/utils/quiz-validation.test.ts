
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
        const result = validateQuiz('Valid Title', 'valid-slug', 'Valid Description', [validQuestion], validScoreRanges);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
    });

    it('should require title', () => {
        const result = validateQuiz('', 'valid-slug', 'Valid Description', [validQuestion], validScoreRanges);
        expect(result.isValid).toBe(false);
        expect(result.errors.title).toBeDefined();
    });

    it('should require slug', () => {
        const result = validateQuiz('Valid Title', '', 'Valid Description', [validQuestion], validScoreRanges);
        expect(result.isValid).toBe(false);
        expect(result.errors.slug).toBeDefined();
    });

    it('should require description', () => {
        const result = validateQuiz('Valid Title', 'valid-slug', '', [validQuestion], validScoreRanges);
        expect(result.isValid).toBe(false);
        expect(result.errors.description).toBeDefined();
    });

    it('should require at least one question', () => {
        const result = validateQuiz('Valid Title', 'valid-slug', 'Valid Description', [], validScoreRanges);
        expect(result.isValid).toBe(false);
        expect(result.errors.questions).toBeDefined();
    });

    it('should validate question text', () => {
        const invalidQuestion = { ...validQuestion, text: '' };
        const result = validateQuiz('Valid Title', 'valid-slug', 'Valid Description', [invalidQuestion], validScoreRanges);
        expect(result.isValid).toBe(false);
        expect(result.errors['question_0']).toContain('text is required');
    });

    it('should validate multiple-choice options count', () => {
        const invalidQuestion = { ...validQuestion, options: ['Only One'] };
        const result = validateQuiz('Valid Title', 'valid-slug', 'Valid Description', [invalidQuestion], validScoreRanges);
        expect(result.isValid).toBe(false);
        expect(result.errors['question_0']).toContain('at least 2 options');
    });

    it('should validate multiple-choice empty options', () => {
        const invalidQuestion = { ...validQuestion, options: ['Option 1', ''] };
        const result = validateQuiz('Valid Title', 'valid-slug', 'Valid Description', [invalidQuestion], validScoreRanges);
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
        const result = validateQuiz('Valid Title', 'valid-slug', 'Valid Description', [invalidQuestion], validScoreRanges);
        expect(result.isValid).toBe(false);
        expect(result.errors['question_0']).toContain('min must be less than max');
    });

    describe('Score Range Validation', () => {
        it('validates range min/max', () => {
            const invalidRange: ScoreRange = { min: 10, max: 5, status: 'Invalid', description: '', color: 'gray' };
            const result = validateQuiz('Title', 'slug', 'Desc', [validQuestion], [invalidRange]);
            expect(result.isValid).toBe(false);
            expect(result.errors['range_0']).toContain('min must be less than or equal to max');
        });

        it('requires status for ranges', () => {
            const invalidRange: ScoreRange = { min: 0, max: 5, status: '', description: '', color: 'gray' };
            const result = validateQuiz('Title', 'slug', 'Desc', [validQuestion], [invalidRange]);
            expect(result.isValid).toBe(false);
            expect(result.errors['range_0']).toContain('status is required');
        });

        it('detects overlapping ranges', () => {
            const ranges: ScoreRange[] = [
                { min: 0, max: 10, status: 'R1', description: '', color: 'gray' },
                { min: 5, max: 15, status: 'R2', description: '', color: 'gray' }
            ];
            const result = validateQuiz('Title', 'slug', 'Desc', [validQuestion], ranges);
            expect(result.isValid).toBe(false);
            expect(result.errors['range_0_overlap']).toContain('overlaps with Range 2');
        });
    });
});
