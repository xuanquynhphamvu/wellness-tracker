/**
 * Progress Tracking Helpers
 * 
 * Server-side utilities for calculating trends and statistics
 * from quiz attempt history.
 */

export type Trend = 'improving' | 'declining' | 'stable';

export interface ProgressStats {
    attempts: number;
    scores: number[];
    dates: string[];
    trend: Trend;
    average: number;
    best: number;
    worst: number;
    latest: number;
    change: number;
}

/**
 * Calculate trend from score history
 * 
 * @param scores - Array of scores in chronological order (oldest first)
 * @returns 'improving', 'declining', or 'stable'
 */
export function calculateTrend(scores: number[]): Trend {
    if (scores.length < 2) {
        return 'stable';
    }

    const first = scores[0];
    const last = scores[scores.length - 1];
    const change = last - first;

    // Consider a change of more than 2 points significant
    if (change > 2) return 'improving';
    if (change < -2) return 'declining';
    return 'stable';
}

/**
 * Calculate average score
 * 
 * @param scores - Array of scores
 * @returns Average score rounded to 1 decimal place
 */
export function getAverageScore(scores: number[]): number {
    if (scores.length === 0) return 0;

    const sum = scores.reduce((acc, score) => acc + score, 0);
    const average = sum / scores.length;

    return Math.round(average * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate score change from first to last attempt
 * 
 * @param scores - Array of scores in chronological order
 * @returns Change in score (positive = improvement, negative = decline)
 */
export function getScoreChange(scores: number[]): number {
    if (scores.length < 2) return 0;

    return scores[scores.length - 1] - scores[0];
}

/**
 * Get best (highest) score
 * 
 * @param scores - Array of scores
 * @returns Highest score
 */
export function getBestScore(scores: number[]): number {
    if (scores.length === 0) return 0;
    return Math.max(...scores);
}

/**
 * Get worst (lowest) score
 * 
 * @param scores - Array of scores
 * @returns Lowest score
 */
export function getWorstScore(scores: number[]): number {
    if (scores.length === 0) return 0;
    return Math.min(...scores);
}

/**
 * Calculate comprehensive progress statistics
 * 
 * @param scores - Array of scores in chronological order
 * @param dates - Array of completion dates
 * @returns Complete progress statistics
 */
export function calculateProgressStats(
    scores: number[],
    dates: Date[]
): Omit<ProgressStats, 'scores' | 'dates'> {
    return {
        attempts: scores.length,
        trend: calculateTrend(scores),
        average: getAverageScore(scores),
        best: getBestScore(scores),
        worst: getWorstScore(scores),
        latest: scores[scores.length - 1] || 0,
        change: getScoreChange(scores),
    };
}
