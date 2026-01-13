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
 * @param scoringDirection - Direction of scoring ('higher-is-better' or 'lower-is-better')
 * @returns 'improving', 'declining', or 'stable'
 */
export function calculateTrend(scores: number[], scoringDirection: 'higher-is-better' | 'lower-is-better' = 'higher-is-better'): Trend {
    if (scores.length < 2) {
        return 'stable';
    }

    const first = scores[0];
    const last = scores[scores.length - 1];
    const change = last - first;

    // For 'lower-is-better', negative change is improvement, positive is decline
    // For 'higher-is-better', positive change is improvement, negative is decline
    const threshold = 2;
    
    if (scoringDirection === 'lower-is-better') {
        if (change < -threshold) return 'improving'; // Score decreased = better
        if (change > threshold) return 'declining';  // Score increased = worse
    } else {
        if (change > threshold) return 'improving';  // Score increased = better
        if (change < -threshold) return 'declining'; // Score decreased = worse
    }
    
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
 * Get best score
 * 
 * @param scores - Array of scores
 * @param scoringDirection - Direction of scoring ('higher-is-better' or 'lower-is-better')
 * @returns Best score (highest for higher-is-better, lowest for lower-is-better)
 */
export function getBestScore(scores: number[], scoringDirection: 'higher-is-better' | 'lower-is-better' = 'higher-is-better'): number {
    if (scores.length === 0) return 0;
    return scoringDirection === 'lower-is-better' ? Math.min(...scores) : Math.max(...scores);
}

/**
 * Get worst score
 * 
 * @param scores - Array of scores
 * @param scoringDirection - Direction of scoring ('higher-is-better' or 'lower-is-better')
 * @returns Worst score (lowest for higher-is-better, highest for lower-is-better)
 */
export function getWorstScore(scores: number[], scoringDirection: 'higher-is-better' | 'lower-is-better' = 'higher-is-better'): number {
    if (scores.length === 0) return 0;
    return scoringDirection === 'lower-is-better' ? Math.max(...scores) : Math.min(...scores);
}

/**
 * Calculate comprehensive progress statistics
 * 
 * @param scores - Array of scores in chronological order
 * @param dates - Array of completion dates
 * @param scoringDirection - Direction of scoring ('higher-is-better' or 'lower-is-better')
 * @returns Complete progress statistics
 */
export function calculateProgressStats(
    scores: number[],
    dates: Date[],
    scoringDirection: 'higher-is-better' | 'lower-is-better' = 'higher-is-better'
): Omit<ProgressStats, 'scores' | 'dates'> {
    return {
        attempts: scores.length,
        trend: calculateTrend(scores, scoringDirection),
        average: getAverageScore(scores),
        best: getBestScore(scores, scoringDirection),
        worst: getWorstScore(scores, scoringDirection),
        latest: scores[scores.length - 1] || 0,
        change: getScoreChange(scores),
    };
}
