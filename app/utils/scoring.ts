
import type { Question, ScoreRange } from "~/types/quiz";

export interface CalculateScoreResult {
    totalScore: number;
    subScores?: Record<string, number>;
    resultMessage: string;
    resultDescription: string;
    answers: { questionId: string; answer: string | number }[];
}

export function calculateScore(
    formData: FormData,
    questions: Question[],
    scoreRanges: ScoreRange[],
    scoreMultiplier?: number
): CalculateScoreResult {
    let totalScore = 0;
    const subScores: Record<string, number> = {};
    const answers: { questionId: string; answer: string | number }[] = [];

    questions.forEach((question) => {
        const answer = formData.get(`question_${question.id}`);

        if (answer) {
            const answerValue = question.type === 'scale'
                ? Number(answer)
                : String(answer);

            answers.push({
                questionId: question.id,
                answer: answerValue,
            });

            let points = 0;
            // Calculate score based on question type and format
            if (question.type === 'scale' && typeof answerValue === 'number') {
                // Scale questions: use the numeric value directly
                points = answerValue;
            } else if (question.type === 'multiple-choice' && typeof answerValue === 'string') {
                // Multiple-choice: support both scoreMapping (object) and points (array) formats
                if (question.scoreMapping) {
                    // Format 1: scoreMapping object { "option": score }
                    points = question.scoreMapping[answerValue] || 0;
                } else if (question.points && question.options) {
                    // Format 2: points array [0, 1, 2, 3] mapped to options array
                    const optionIndex = question.options.indexOf(answerValue);
                    if (optionIndex !== -1 && optionIndex < question.points.length) {
                        points = question.points[optionIndex];
                    }
                }
            }

            totalScore += points;

            if (question.category && question.category.trim() !== '') {
                const category = question.category.trim();
                subScores[category] = (subScores[category] || 0) + points;
            }
        }
    });

    // Apply score multiplier if provided (e.g., for DASS-21 which multiplies by 2)
    if (scoreMultiplier && scoreMultiplier > 0) {
        totalScore = totalScore * scoreMultiplier;
        // Also apply multiplier to subscores
        Object.keys(subScores).forEach(category => {
            subScores[category] = subScores[category] * scoreMultiplier;
        });
    }

    // Determine result message based on score ranges
    let resultMessage = "Assessment Complete";
    let resultDescription = "Thank you for completing the assessment.";

    if (scoreRanges && scoreRanges.length > 0) {
        const matchedRange = scoreRanges.find(
            range => totalScore >= range.min && totalScore <= range.max
        );

        if (matchedRange) {
            resultMessage = matchedRange.status;
            resultDescription = matchedRange.description;
        }
    }

    return {
        totalScore,
        subScores: Object.keys(subScores).length > 0 ? subScores : undefined,
        resultMessage,
        resultDescription,
        answers
    };
}

export function calculateMaxScore(questions: Question[], scoreMultiplier?: number): number {
    let maxScore = 0;
    questions.forEach(q => {
        if (q.type === 'scale') {
            maxScore += q.scaleMax || 10;
        } else if (q.type === 'multiple-choice') {
            // Support both scoreMapping and points formats
            if (q.scoreMapping) {
                const scores = Object.values(q.scoreMapping);
                if (scores.length > 0) {
                    maxScore += Math.max(...scores);
                }
            } else if (q.points && q.points.length > 0) {
                maxScore += Math.max(...q.points);
            }
        }
    });
    
    // Apply score multiplier if provided
    if (scoreMultiplier && scoreMultiplier > 0) {
        maxScore = maxScore * scoreMultiplier;
    }
    
    return maxScore;
}
