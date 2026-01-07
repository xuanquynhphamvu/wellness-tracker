import type { Route } from "./+types/progress";
import { Link } from "react-router";
import { getCollection, ObjectId } from "~/lib/db.server";
import type { QuizResult } from "~/types/result";
import type { Quiz } from "~/types/quiz";
import { requireUser } from "~/lib/auth.server";
import { calculateProgressStats, type Trend } from "~/lib/progress.server";

/**
 * Progress Tracking Route
 * 
 * EXECUTION FLOW:
 * 1. LOADER fetches user's quiz results
 * 2. LOADER calculates trends and statistics
 * 3. COMPONENT displays progress with visual indicators
 * 
 * FEATURES:
 * - Trend analysis (improving/declining/stable)
 * - Score statistics (best, worst, average)
 * - Visual progress indicators
 * - Color-coded trends
 */

interface QuizProgress {
    quizId: string;
    quizTitle: string;
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

export async function loader({ request }: Route.LoaderArgs) {
    // PROTECTED ROUTE: Require authentication
    const user = await requireUser(request);

    // Fetch only current user's results
    const results = await getCollection<QuizResult>('results');
    const userResults = await results
        .find({ userId: new ObjectId(user._id) })
        .sort({ completedAt: 1 })  // Oldest first for trend calculation
        .toArray();

    // Group results by quiz
    const quizzes = await getCollection<Quiz>('quizzes');
    const progressMap = new Map<string, QuizProgress>();

    for (const result of userResults) {
        const quizId = result.quizId.toString();

        if (!progressMap.has(quizId)) {
            const quiz = await quizzes.findOne({ _id: result.quizId });
            progressMap.set(quizId, {
                quizId,
                quizTitle: quiz?.title || 'Unknown Quiz',
                attempts: 0,
                scores: [],
                dates: [],
                trend: 'stable',
                average: 0,
                best: 0,
                worst: 0,
                latest: 0,
                change: 0,
            });
        }

        const progress = progressMap.get(quizId)!;
        progress.scores.push(result.score);
        progress.dates.push(result.completedAt.toISOString());
    }

    // Calculate statistics for each quiz
    const progressByQuiz: QuizProgress[] = [];
    for (const progress of progressMap.values()) {
        const stats = calculateProgressStats(progress.scores, progress.dates.map(d => new Date(d)));
        progressByQuiz.push({
            ...progress,
            ...stats,
        });
    }

    // Sort by most recent attempt
    progressByQuiz.sort((a, b) => {
        const aLatest = new Date(a.dates[a.dates.length - 1]);
        const bLatest = new Date(b.dates[b.dates.length - 1]);
        return bLatest.getTime() - aLatest.getTime();
    });

    return { progressByQuiz };
}

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Your Progress - Wellness Tracker" },
        { name: "description", content: "Track your wellness journey over time" },
    ];
}

function TrendIndicator({ trend }: { trend: Trend }) {
    if (trend === 'improving') {
        return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                ↗️ Improving
            </span>
        );
    }

    if (trend === 'declining') {
        return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                ↘️ Declining
            </span>
        );
    }

    return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            → Stable
        </span>
    );
}

function ProgressCard({ progress }: { progress: QuizProgress }) {
    const latestDate = new Date(progress.dates[progress.dates.length - 1]);
    const formattedDate = latestDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {progress.quizTitle}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {progress.attempts} {progress.attempts === 1 ? 'attempt' : 'attempts'} • Last taken {formattedDate}
                    </p>
                </div>
                <TrendIndicator trend={progress.trend} />
            </div>

            {/* Score Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Latest</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{progress.latest}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Average</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{progress.average}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Best</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{progress.best}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Worst</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{progress.worst}</p>
                </div>
            </div>

            {/* Change Indicator */}
            {progress.attempts > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Change from first attempt:
                    </span>
                    <span className={`text-lg font-semibold ${progress.change > 0 ? 'text-green-600 dark:text-green-400' :
                            progress.change < 0 ? 'text-red-600 dark:text-red-400' :
                                'text-gray-600 dark:text-gray-400'
                        }`}>
                        {progress.change > 0 ? '+' : ''}{progress.change}
                    </span>
                </div>
            )}
        </div>
    );
}

export default function Progress({ loaderData }: Route.ComponentProps) {
    const { progressByQuiz } = loaderData;

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

                    {progressByQuiz.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
                            <div className="mb-6">
                                <svg
                                    className="mx-auto h-24 w-24 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                No Progress Yet
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                You haven't taken any quizzes yet. Start your wellness journey by taking your first quiz!
                            </p>
                            <Link
                                to="/quizzes"
                                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg shadow transition-colors"
                            >
                                Browse Quizzes
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {progressByQuiz.map((progress) => (
                                <ProgressCard key={progress.quizId} progress={progress} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
