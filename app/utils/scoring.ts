
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
    scoreRanges: ScoreRange[]
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
            // Calculate score if mapping exists
            if (question.scoreMapping && typeof answerValue === 'string') {
                points = question.scoreMapping[answerValue] || 0;
            } else if (question.type === 'scale' && typeof answerValue === 'number') {
                points = answerValue;
            }

            totalScore += points;

            if (question.category && question.category.trim() !== '') {
                const category = question.category.trim();
                subScores[category] = (subScores[category] || 0) + points;
            }
        }
    });

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

export function calculateMaxScore(questions: Question[]): number {
    let maxScore = 0;
    questions.forEach(q => {
        if (q.type === 'scale') {
            maxScore += q.scaleMax || 10;
        } else if (q.type === 'multiple-choice' && q.scoreMapping) {
            const scores = Object.values(q.scoreMapping);
            if (scores.length > 0) {
                maxScore += Math.max(...scores);
            }
        }
    });
    return maxScore;
}
