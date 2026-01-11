import React, { useState } from "react";
import type { Route } from "./+types/progress.$quizId";
import { getCollection, ObjectId } from "~/lib/db.server";
import { requireUser } from "~/lib/auth.server";
import { Button } from "~/components/Button";
import { Card } from "~/components/Card";
import { ProgressChart } from "~/components/ProgressChart";
import { calculateMaxScore } from "~/utils/scoring";
import type { Quiz } from "~/types/quiz";
import type { QuizResult } from "~/types/result";
import { Link } from "react-router";

export async function loader({ request, params }: Route.LoaderArgs) {
    const user = await requireUser(request);
    const { quizId } = params;

    if (!quizId) {
        throw new Response("Quiz ID is required", { status: 400 });
    }

    const quizzes = await getCollection<Quiz>('quizzes');
    const quiz = await quizzes.findOne({ _id: new ObjectId(quizId) });

    if (!quiz) {
        throw new Response("Quiz not found", { status: 404 });
    }

    const results = await getCollection<QuizResult>('results');
    const history = await results
        .find({ 
            userId: new ObjectId(user._id),
            quizId: new ObjectId(quizId) 
        })
        .sort({ completedAt: -1 }) // Newest first for table
        .toArray();

    // Serialize
    const serializedQuiz = {
        ...quiz,
        _id: quiz._id!.toString(),
        createdAt: quiz.createdAt.toISOString(),
        updatedAt: quiz.updatedAt.toISOString(),
    };

    const serializedHistory = history.map(h => ({
        _id: h._id!.toString(),
        score: h.score,
        completedAt: h.completedAt.toISOString(),
    }));

    return {
        quiz: serializedQuiz,
        history: serializedHistory,
        maxScore: calculateMaxScore(quiz.questions),
    };
}

export function meta({ data }: Route.MetaArgs) {
    return [
        { title: `${data?.quiz.title} Progress - Wellness Tracker` },
    ];
}

export default function ProgressDetail({ loaderData }: Route.ComponentProps) {
    const { quiz, history, maxScore } = loaderData;

    // Prepare chart data (needs to be oldest to newest)
    const chartData = [...history].reverse().map(h => ({
        date: h.completedAt,
        score: h.score,
    }));

    return (
        <div className="min-h-screen bg-warm-white dark:bg-warm-gray-900">
            <div className="container mx-auto px-6 py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <Button
                                to="/progress"
                                variant="ghost"
                                size="sm"
                                className="mb-2"
                            >
                                ← Back to Overview
                            </Button>
                            <h1 className="text-3xl font-bold text-warm-gray-900 dark:text-white">
                                {quiz.title} Progress
                            </h1>
                        </div>
                        <Button
                            to={`/quizzes/${quiz._id}`}
                            variant="primary"
                        >
                            Take Quiz
                        </Button>
                    </div>

                    <div className="grid gap-8">
                        {/* Chart Section */}
                        <Card className="p-6">
                            <h2 className="text-xl font-bold text-warm-gray-900 dark:text-white mb-6">
                                Trends
                            </h2>
                            <div className="h-80">
                                <ProgressChart 
                                    data={chartData} 
                                    color="#10B981"
                                    domain={[0, maxScore]}
                                    height={320}
                                />
                            </div>
                        </Card>

                        {/* History Table */}
                        <Card className="p-6">
                            <h2 className="text-xl font-bold text-warm-gray-900 dark:text-white mb-6">
                                History
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-warm-gray-200 dark:border-warm-gray-700">
                                            <th className="pb-3 font-semibold text-warm-gray-600 dark:text-warm-gray-400">Date</th>
                                            <th className="pb-3 font-semibold text-warm-gray-600 dark:text-warm-gray-400">Score</th>
                                            <th className="pb-3 font-semibold text-warm-gray-600 dark:text-warm-gray-400">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-warm-gray-100 dark:divide-warm-gray-800">
                                        {history.map((attempt) => (
                                            <tr key={attempt._id} className="group">
                                                <td className="py-4 text-warm-gray-900 dark:text-white">
                                                    {new Date(attempt.completedAt).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </td>
                                                <td className="py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-sage-100 text-sage-800 dark:bg-sage-900 dark:text-sage-200">
                                                        {attempt.score} / {maxScore}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-right">
                                                    <Button
                                                        to={`/results/${attempt._id}`}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-sage-600 hover:text-sage-700 hover:bg-sage-50"
                                                    >
                                                        View Details →
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {history.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="py-8 text-center text-warm-gray-500">
                                                    No history found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
