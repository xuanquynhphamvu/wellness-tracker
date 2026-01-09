import type { Route } from "./+types/results.$id";
import { Link } from "react-router";
import { getCollection, ObjectId } from "~/lib/db.server";
import type { QuizResult, SerializedQuizResult } from "~/types/result";
import { type Quiz, serializeQuiz } from "~/types/quiz";
import { requireUser } from "~/lib/auth.server";
import { Card } from "~/components/Card";
import { Button } from "~/components/Button";

/**
 * Quiz Results Route
 */

export async function loader({ request, params }: Route.LoaderArgs) {
    // PROTECTED ROUTE: Require authentication
    const user = await requireUser(request);

    if (!params.id) {
        throw new Response("Result ID is required", { status: 400 });
    }

    const results = await getCollection<QuizResult>('results');
    const result = await results.findOne({ _id: new ObjectId(params.id) });

    if (!result) {
        throw new Response("Result not found", { status: 404 });
    }

    // AUTHORIZATION: Verify user owns this result
    if (result.userId.toString() !== user._id) {
        throw new Response("Forbidden: You can only view your own results", { status: 403 });
    }

    // Fetch the quiz to display title and scoring logic
    const quizzes = await getCollection<Quiz>('quizzes');
    const quiz = await quizzes.findOne({ _id: result.quizId });

    if (!quiz) {
        throw new Response("Quiz not found", { status: 404 });
    }

    // Serialize for client
    const serializedResult: SerializedQuizResult = {
        _id: result._id!.toString(),
        quizId: result.quizId.toString(),
        userId: result.userId.toString(),
        sessionId: result.sessionId,
        answers: result.answers,
        score: result.score,
        completedAt: result.completedAt.toISOString(),
    };

    return {
        result: serializedResult,
        quiz: serializeQuiz(quiz),
    };
}

export function meta({ data }: Route.MetaArgs) {
    return [
        { title: `Results - ${data?.quiz.title || 'Quiz'} - Wellness Tracker` },
    ];
}

export default function Results({ loaderData }: Route.ComponentProps) {
    const { result, quiz } = loaderData;

    // Calculate percentage (fallback standard max score if not specific)
    const maxScore = quiz.questions.length * 10;
    const percentage = Math.round((result.score / maxScore) * 100);

    // Determine Status
    let status: {
        label: string;
        description: string;
        color: 'green' | 'yellow' | 'orange' | 'gray' | 'indigo';
    } = {
        label: "Quiz Complete",
        description: "Thank you for completing this assessment.",
        color: "indigo"
    };

    if (quiz.scoreRanges && quiz.scoreRanges.length > 0) {
        // Use Custom Logic
        const matchedRange = quiz.scoreRanges.find(
            r => result.score >= r.min && result.score <= r.max
        );

        if (matchedRange) {
            status = {
                label: matchedRange.status,
                description: matchedRange.description,
                color: matchedRange.color as any // Cast to match our limited palette
            };
        }
    } else {
        // Fallback Logic
        if (percentage >= 70) {
            status = {
                label: "Doing Well",
                description: "Your responses indicate positive mental wellness.",
                color: "green"
            };
        } else if (percentage >= 40) {
            status = {
                label: "Moderate",
                description: "Your responses suggest moderate wellness. Consider tracking your progress.",
                color: "yellow"
            };
        } else {
            status = {
                label: "Needs Care",
                description: "Your responses may indicate areas for improvement.",
                color: "orange"
            };
        }
    }

    // Map color themes
    const colorStyles = {
        green: "bg-sage-100 text-sage-800 border-sage-200 rounded-3xl",
        yellow: "bg-amber-100 text-amber-800 border-amber-200 rounded-3xl",
        orange: "bg-orange-50 text-orange-700 border-orange-100 rounded-3xl",
        gray: "bg-warm-gray-100 text-warm-gray-800 border-warm-gray-200 rounded-3xl",
        indigo: "bg-slate-100 text-slate-800 border-slate-200 rounded-3xl" // Fallback
    };

    // Default to gray if color not found
    const themeClass = colorStyles[status.color as keyof typeof colorStyles] || colorStyles.gray;

    return (
        <div className="min-h-screen bg-warm-white">
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto space-y-8">

                    {/* Header Section */}
                    <div className="text-center space-y-4">
                        <div className="inline-block p-4 rounded-full bg-sage-50 text-sage-600 mb-2">
                            <span className="text-4xl">✨</span>
                        </div>
                        <h1 className="text-3xl font-bold text-warm-gray-900">
                            Reflection Complete
                        </h1>
                        <p className="text-warm-gray-600">
                            {quiz.title}
                        </p>
                    </div>

                    {/* Main Score Card */}
                    <Card className="overflow-hidden">
                        <div className="p-8 text-center border-b border-warm-gray-100">
                            <h2 className="text-sm font-semibold text-warm-gray-500 uppercase tracking-wider mb-2">
                                Your Result
                            </h2>
                            <div className="text-6xl font-bold text-warm-gray-900 mb-2">
                                {result.score}
                            </div>
                            <div className="text-warm-gray-500">
                                Total Score
                            </div>
                        </div>

                        <div className={`p-8 ${themeClass} border-t-0`}>
                            <h3 className="text-xl font-bold mb-3 flex items-center justify-center gap-2">
                                {status.label}
                            </h3>
                            <p className="text-center opacity-90 leading-relaxed">
                                {status.description}
                            </p>
                        </div>
                    </Card>

                    {/* Navigation Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                            to="/quizzes"
                            variant="outline"
                            size="lg"
                            className="w-full justify-center"
                        >
                            Take Another Test
                        </Button>
                        <Button
                            to="/progress"
                            variant="primary"
                            size="lg"
                            className="w-full justify-center"
                        >
                            View Journey
                        </Button>
                    </div>

                    <div className="text-center text-sm text-warm-gray-400">
                        Completed on {new Date(result.completedAt).toLocaleDateString()} at{' '}
                        {new Date(result.completedAt).toLocaleTimeString()}
                    </div>
                </div>
            </div>
        </div>
    );
}
