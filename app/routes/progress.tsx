import type { Route } from "./+types/progress";
import { Link } from "react-router";
import { getCollection, ObjectId } from "~/lib/db.server";
import type { QuizResult } from "~/types/result";
import type { Quiz } from "~/types/quiz";
import { requireUser } from "~/lib/auth.server";

/**
 * Progress Tracking Route
 * 
 * EXECUTION FLOW:
 * 1. LOADER fetches all user's quiz results
 * 2. LOADER aggregates data by quiz
 * 3. COMPONENT displays progress charts
 * 
 * LEARNING POINTS:
 * - Complex data aggregation happens in the loader (server)
 * - Component receives ready-to-render data
 * - No client-side data processing needed
 * 
 * TODO: Add user authentication to filter by userId
 * For now, shows all results (demo purposes)
 */

export async function loader({ request }: Route.LoaderArgs) {
    // PROTECTED ROUTE: Require authentication
    const user = await requireUser(request);

    // Fetch only current user's results
    const results = await getCollection<QuizResult>('results');
    const userResults = await results
        .find({ userId: new ObjectId(user._id) })  // Filter by user ID
        .sort({ completedAt: -1 })
        .toArray();

    // Group results by quiz
    const quizzes = await getCollection<Quiz>('quizzes');
    const progressByQuiz: Record<string, {
        quizTitle: string;
        results: { date: string; score: number }[];
    }> = {};

    for (const result of userResults) {
        const quizId = result.quizId.toString();

        if (!progressByQuiz[quizId]) {
            const quiz = await quizzes.findOne({ _id: result.quizId });
            progressByQuiz[quizId] = {
                quizTitle: quiz?.title || 'Unknown Quiz',
                results: [],
            };
        }

        progressByQuiz[quizId].results.push({
            date: result.completedAt.toISOString(),
            score: result.score,
        });
    }

    return { progressByQuiz };
}

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Your Progress - Wellness Tracker" },
        { name: "description", content: "Track your mental wellness progress over time" },
    ];
}

export default function Progress({ loaderData }: Route.ComponentProps) {
    const { progressByQuiz } = loaderData;
    const quizIds = Object.keys(progressByQuiz);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                            Your Progress
                        </h1>
                        <Link
                            to="/"
                            className="text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            ← Back to Home
                        </Link>
                    </div>

                    {quizIds.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
                            <p className="text-gray-600 dark:text-gray-300 text-lg mb-4">
                                No quiz results yet.
                            </p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                                Take a quiz to start tracking your progress!
                            </p>
                            <Link
                                to="/quizzes"
                                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow transition-colors"
                            >
                                Browse Quizzes
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {quizIds.map((quizId) => {
                                const data = progressByQuiz[quizId];
                                const latestScore = data.results[0]?.score || 0;
                                const averageScore = Math.round(
                                    data.results.reduce((sum, r) => sum + r.score, 0) / data.results.length
                                );

                                return (
                                    <div
                                        key={quizId}
                                        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
                                    >
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                            {data.quizTitle}
                                        </h2>

                                        <div className="grid md:grid-cols-3 gap-4 mb-6">
                                            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                    Times Taken
                                                </div>
                                                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                                                    {data.results.length}
                                                </div>
                                            </div>

                                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                    Latest Score
                                                </div>
                                                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                                    {latestScore}
                                                </div>
                                            </div>

                                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                    Average Score
                                                </div>
                                                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                                    {averageScore}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                Recent Results
                                            </h3>
                                            {data.results.slice(0, 5).map((result, index) => (
                                                <div
                                                    key={index}
                                                    className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded"
                                                >
                                                    <span className="text-gray-600 dark:text-gray-300">
                                                        {new Date(result.date).toLocaleDateString()}
                                                    </span>
                                                    <span className="font-semibold text-gray-900 dark:text-white">
                                                        Score: {result.score}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
