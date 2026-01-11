
import { describe, it, expect } from 'vitest';
import { calculateScore, calculateMaxScore } from './scoring';
import type { Question, ScoreRange } from '~/types/quiz';

describe('calculateScore', () => {
    const questions: Question[] = [
        {
            id: '1',
            text: 'Q1',
            type: 'multiple-choice',
            options: ['A', 'B'],
            scoreMapping: { 'A': 1, 'B': 2 }
        },
        {
            id: '2',
            text: 'Q2',
            type: 'scale',
            scaleMin: 1,
            scaleMax: 5
        }
    ];

    const scoreRanges: ScoreRange[] = [
        { min: 0, max: 5, status: 'Low', description: 'Low desc', color: 'green' },
        { min: 6, max: 10, status: 'High', description: 'High desc', color: 'orange' }
    ];

    it('calculates score for multiple choice', () => {
        const formData = new FormData();
        formData.append('question_1', 'B'); // Score 2

        const result = calculateScore(formData, [questions[0]], []);
        expect(result.totalScore).toBe(2);
        expect(result.answers).toHaveLength(1);
    });

    it('calculates score for scale', () => {
        const formData = new FormData();
        formData.append('question_2', '4'); // Score 4

        const result = calculateScore(formData, [questions[1]], []);
        expect(result.totalScore).toBe(4);
    });

    it('sums scores from multiple questions', () => {
        const formData = new FormData();
        formData.append('question_1', 'A'); // Score 1
        formData.append('question_2', '3'); // Score 3

        const result = calculateScore(formData, questions, []);
        expect(result.totalScore).toBe(4); // 1 + 3
    });

    it('ignores unscored questions (text)', () => {
        const textQuestion: Question = { id: '3', text: 'Text', type: 'text' };
        const formData = new FormData();
        formData.append('question_3', 'Some text');

        const result = calculateScore(formData, [textQuestion], []);
        expect(result.totalScore).toBe(0);
        expect(result.answers).toHaveLength(1);
    });

    it('determines result based on score ranges', () => {
        const formData = new FormData();
        formData.append('question_2', '4'); // Score 4 -> Low range (0-5)

        const result = calculateScore(formData, [questions[1]], scoreRanges);
        expect(result.resultMessage).toBe('Low');
        expect(result.resultDescription).toBe('Low desc');
    });

    it('uses fallback message if no range matches', () => {
        const formData = new FormData();
        formData.append('question_2', '4');

        const result = calculateScore(formData, [questions[1]], []);
        expect(result.resultMessage).toBe('Assessment Complete');
    });

    describe('calculateMaxScore', () => {
        it('calculates max score for scale questions', () => {
            const questions: Question[] = [
                { id: '1', text: 'Q1', type: 'scale', scaleMin: 1, scaleMax: 5 },
                { id: '2', text: 'Q2', type: 'scale', scaleMin: 0, scaleMax: 10 }
            ];
            expect(calculateMaxScore(questions)).toBe(15);
        });

        it('calculates max score for multiple-choice questions', () => {
            const questions: Question[] = [
                { 
                    id: '1', 
                    text: 'Q1', 
                    type: 'multiple-choice', 
                    options: ['A', 'B'], 
                    scoreMapping: { 'A': 1, 'B': 5 } 
                }
            ];
            expect(calculateMaxScore(questions)).toBe(5);
        });

        it('handles mixed question types', () => {
            const questions: Question[] = [
                { id: '1', text: 'Q1', type: 'scale', scaleMax: 10 },
                { 
                    id: '2', 
                    text: 'Q2', 
                    type: 'multiple-choice', 
                    options: ['A', 'B'], 
                    scoreMapping: { 'A': 2, 'B': 3 } 
                },
                { id: '3', text: 'Q3', type: 'text' } // Should correspond to 0
            ];
            expect(calculateMaxScore(questions)).toBe(13);
        });
    });

    describe('Sub-scale Scoring', () => {
        it('calculates sub-scores by category', () => {
            const questions: Question[] = [
                { id: '1', text: 'Q1', type: 'scale', scaleMax: 10, category: 'Stress' },
                { id: '2', text: 'Q2', type: 'scale', scaleMax: 10, category: 'Anxiety' },
                { id: '3', text: 'Q3', type: 'scale', scaleMax: 10, category: 'Stress' },
                { id: '4', text: 'Q4', type: 'scale', scaleMax: 10 } // No category
            ];

            const formData = new FormData();
            formData.append('question_1', '5');
            formData.append('question_2', '3');
            formData.append('question_3', '5');
            formData.append('question_4', '2');

            const result = calculateScore(formData, questions, []);

            expect(result.totalScore).toBe(15);
            expect(result.subScores).toEqual({
                'Stress': 10,
                'Anxiety': 3
            });
        });
    });
});
