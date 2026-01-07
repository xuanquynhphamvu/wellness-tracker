import type { Route } from "./+types/results.$id";
import { Link } from "react-router";
import { getCollection, ObjectId } from "~/lib/db.server";
import type { QuizResult, SerializedQuizResult } from "~/types/result";
import type { Quiz } from "~/types/quiz";
import { requireUser } from "~/lib/auth.server";

/**
 * Quiz Results Route
 * 
 * EXECUTION FLOW:
 * 1. LOADER fetches result + quiz data
 * 2. COMPONENT displays score and insights
 * 
 * LEARNING POINTS:
 * - Loaders can fetch from multiple collections
 * - Join data on the server (not in the component)
 * - Type-safe params with Route.LoaderArgs
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

    // Fetch the quiz to display title
    const quizzes = await getCollection<Quiz>('quizzes');
    const quiz = await quizzes.findOne({ _id: result.quizId });

    if (!quiz) {
        throw new Response("Quiz not found", { status: 404 });
    }

    // Serialize for client
    const serialized: SerializedQuizResult = {
        _id: result._id!.toString(),
        quizId: result.quizId.toString(),
        userId: result.userId.toString(),  // Convert ObjectId to string
        sessionId: result.sessionId,
        answers: result.answers,
        score: result.score,
        completedAt: result.completedAt.toISOString(),
    };

    return {
        result: serialized,
        quizTitle: quiz.title,
        maxScore: quiz.questions.length * 10, // Example calculation
    };
}

export function meta({ data }: Route.MetaArgs) {
    return [
        { title: `Results - ${data?.quizTitle || 'Quiz'} - Wellness Tracker` },
    ];
}

export default function Results({ loaderData }: Route.ComponentProps) {
    const { result, quizTitle, maxScore } = loaderData;
    const percentage = Math.round((result.score / maxScore) * 100);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Quiz Complete!
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 mb-8">
                            {quizTitle}
                        </p>

                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-8 text-center mb-8">
                            <div className="text-6xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                                {result.score}
                            </div>
                            <div className="text-gray-600 dark:text-gray-300">
                                out of {maxScore} points ({percentage}%)
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                What This Means
                            </h2>

                            {percentage >= 70 && (
                                <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4">
                                    <p className="text-green-800 dark:text-green-300">
                                        Great job! Your responses indicate positive mental wellness.
                                    </p>
                                </div>
                            )}

                            {percentage >= 40 && percentage < 70 && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4">
                                    <p className="text-yellow-800 dark:text-yellow-300">
                                        Your responses suggest moderate wellness. Consider tracking your progress over time.
                                    </p>
                                </div>
                            )}

                            {percentage < 40 && (
                                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
                                    <p className="text-red-800 dark:text-red-300">
                                        Your responses may indicate areas for improvement. Consider speaking with a mental health professional.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
                            Completed on {new Date(result.completedAt).toLocaleDateString()} at{' '}
                            {new Date(result.completedAt).toLocaleTimeString()}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Link
                            to="/quizzes"
                            className="flex-1 bg-white hover:bg-gray-50 text-indigo-600 font-semibold py-3 px-6 rounded-lg shadow border-2 border-indigo-600 text-center transition-colors"
                        >
                            Take Another Quiz
                        </Link>
                        <Link
                            to="/progress"
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow text-center transition-colors"
                        >
                            View Progress
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
