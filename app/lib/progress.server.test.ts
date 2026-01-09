
import { describe, it, expect } from 'vitest';
import {
    calculateTrend,
    getAverageScore,
    getScoreChange,
    getBestScore,
    getWorstScore,
    calculateProgressStats
} from './progress.server';

describe('progress.server', () => {
    describe('calculateTrend', () => {
        it('should return stable for less than 2 scores', () => {
            expect(calculateTrend([])).toBe('stable');
            expect(calculateTrend([10])).toBe('stable');
        });

        it('should return improving for positive change > 2', () => {
            expect(calculateTrend([10, 15])).toBe('improving');
            expect(calculateTrend([10, 11, 15])).toBe('improving');
        });

        it('should return declining for negative change < -2', () => {
            expect(calculateTrend([15, 10])).toBe('declining');
            expect(calculateTrend([15, 14, 10])).toBe('declining');
        });

        it('should return stable for small changes', () => {
            expect(calculateTrend([10, 12])).toBe('stable');
            expect(calculateTrend([10, 8])).toBe('stable');
            expect(calculateTrend([10, 11])).toBe('stable');
        });
    });

    describe('getAverageScore', () => {
        it('should return 0 for empty scores', () => {
            expect(getAverageScore([])).toBe(0);
        });

        it('should calculate average correctly', () => {
            expect(getAverageScore([10, 20])).toBe(15);
            expect(getAverageScore([1, 2, 3])).toBe(2);
        });

        it('should round to 1 decimal place', () => {
            // 10 / 3 = 3.333... -> 3.3
            expect(getAverageScore([3, 3, 4])).toBe(3.3);
        });
    });

    describe('getScoreChange', () => {
        it('should return 0 for less than 2 scores', () => {
            expect(getScoreChange([])).toBe(0);
            expect(getScoreChange([5])).toBe(0);
        });

        it('should calculate change between last and first', () => {
            expect(getScoreChange([10, 15, 20])).toBe(10); // 20 - 10
            expect(getScoreChange([20, 15, 10])).toBe(-10); // 10 - 20
        });
    });

    describe('getBestScore', () => {
        it('should return 0 for empty scores', () => {
            expect(getBestScore([])).toBe(0);
        });

        it('should return highest score', () => {
            expect(getBestScore([10, 5, 20, 15])).toBe(20);
        });
    });

    describe('getWorstScore', () => {
        it('should return 0 for empty scores', () => {
            expect(getWorstScore([])).toBe(0);
        });

        it('should return lowest score', () => {
            expect(getWorstScore([10, 5, 20, 15])).toBe(5);
        });
    });

    describe('calculateProgressStats', () => {
        it('should combine all stats', () => {
            const scores = [10, 12, 11, 15];
            const dates = [new Date(), new Date(), new Date(), new Date()];

            const stats = calculateProgressStats(scores, dates);

            expect(stats).toEqual({
                attempts: 4,
                trend: 'improving', // 15 - 10 = 5 (> 2)
                average: 12, // 48 / 4 = 12
                best: 15,
                worst: 10,
                latest: 15,
                change: 5
            });
        });
    });
});
