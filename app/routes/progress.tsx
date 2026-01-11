import React from "react";
import type { Route } from "./+types/progress";
import { Link, isRouteErrorResponse, useRouteError } from "react-router";
import { getCollection, ObjectId } from "~/lib/db.server";
import { Button } from "~/components/Button";
import { Card } from "~/components/Card";
import { ProgressChart } from "~/components/ProgressChart";
import type { QuizResult } from "~/types/result";
import type { Quiz } from "~/types/quiz";
import { requireUser } from "~/lib/auth.server";
import { calculateProgressStats, type Trend } from "~/lib/progress.server";
import { calculateMaxScore } from "~/utils/scoring";

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
    maxScore: number;
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
                maxScore: quiz ? calculateMaxScore(quiz.questions) : 10,
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

export function meta() {
    return [
        { title: "Your Progress - Wellness Tracker" },
        { name: "description", content: "Track your wellness journey over time" },
    ];
}

function TrendIndicator({ trend }: { trend: Trend }) {
    if (trend === 'improving') {
        return (
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-sage-100 text-sage-800">
                ↗️ Finding balance
            </span>
        );
    }

    if (trend === 'declining') {
        return (
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-warm-gray-100 text-warm-gray-800">
                ↘️ Needs care
            </span>
        );
    }

    return (
        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-warm-gray-50 text-warm-gray-600">
            → Steady
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

    const chartData = progress.dates.map((date, i) => ({
        date,
        score: progress.scores[i],
    }));

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        <Link to={`/progress/${progress.quizId}`} className="hover:text-sage-600 transition-colors">
                            {progress.quizTitle}
                        </Link>
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {progress.attempts} {progress.attempts === 1 ? 'attempt' : 'attempts'} • Last taken {formattedDate}
                    </p>
                </div>
                <TrendIndicator trend={progress.trend} />
            </div>

            <div className="mb-6 h-48">
                <ProgressChart
                    data={chartData}
                    color="#10B981" // Could make this dynamic based on trend or quiz color
                    domain={[0, progress.maxScore]}
                />
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
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{progress.worst}</p>
                </div>
            </div>

            {/* Change Indicator and History Link */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                    {progress.attempts > 1 && (
                        <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
                                Change:
                            </span>
                            <span className={`text-lg font-semibold ${progress.change > 0 ? 'text-green-600 dark:text-green-400' :
                                progress.change < 0 ? 'text-orange-600 dark:text-orange-400' :
                                    'text-gray-600 dark:text-gray-400'
                                }`}>
                                {progress.change > 0 ? '+' : ''}{progress.change}
                            </span>
                        </div>
                    )}
                </div>
                <Link
                    to={`/progress/${progress.quizId}`}
                    className="text-sm font-medium text-sage-600 hover:text-sage-700 flex items-center gap-1"
                >
                    View Details →
                </Link>
            </div>
        </div>
    );
}

export default function Progress({ loaderData }: Route.ComponentProps) {
    const { progressByQuiz } = loaderData;

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-6 py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-warm-gray-900 mb-2">
                                Your Journey
                            </h1>
                            <p className="text-warm-gray-600">
                                See how you&apos;ve been doing — gently.
                            </p>
                        </div>
                        <Button
                            to="/"
                            variant="ghost"
                            size="sm"
                        >
                            ← Back to Home
                        </Button>
                    </div>

                    {progressByQuiz.length === 0 ? (
                        <Card className="p-12 text-center bg-white/50 backdrop-blur-sm">
                            <div className="mb-6 inline-flex p-4 rounded-full bg-sage-50 text-sage-300">
                                <svg
                                    className="h-12 w-12"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-warm-gray-900 mb-4">
                                Your journey begins here
                            </h2>
                            <p className="text-warm-gray-600 mb-8 max-w-md mx-auto">
                                You haven&apos;t taken any quizzes yet. Take a moment to check in with yourself.
                            </p>
                            <Button
                                to="/quizzes"
                                variant="primary"
                                size="lg"
                            >
                                Browse Assessments
                            </Button>
                        </Card>
                    ) : (
                        <div className="space-y-8">
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

export function ErrorBoundary() {
    const error = useRouteError();

    if (isRouteErrorResponse(error)) {
        return (
            <div className="min-h-screen bg-warm-white flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center">
                    <h1 className="text-6xl font-bold text-orange-600 mb-4">
                        {error.status}
                    </h1>
                    <h2 className="text-2xl font-bold text-warm-gray-900 mb-4">
                        {error.statusText}
                    </h2>
                    <p className="text-warm-gray-600 mb-8">
                        {error.data}
                    </p>
                    <Button
                        to="/"
                        variant="primary"
                        size="lg"
                        className="w-full justify-center"
                    >
                        Go to Home
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-warm-white flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <h1 className="text-6xl font-bold text-orange-600 mb-4">
                    Error
                </h1>
                <h2 className="text-2xl font-bold text-warm-gray-900 mb-4">
                    Something went wrong
                </h2>
                <p className="text-warm-gray-600 mb-8">
                    We couldn&apos;t load your progress. Please try again.
                </p>
                <Button
                    to="/"
                    variant="primary"
                    size="lg"
                    className="w-full justify-center"
                >
                    Go to Home
                </Button>
            </div>
        </div>
    );
}