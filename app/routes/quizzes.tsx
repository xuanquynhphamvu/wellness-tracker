import React from "react";
import type { Route } from "./+types/quizzes";
import { Link } from "react-router";
import { getCollection } from "~/lib/db.server";
import type { Quiz, SerializedQuiz } from "~/types/quiz";
import { Card } from "~/components/Card";
import { Button } from "~/components/Button";

/**
 * Quiz Listing Route
 * 
 * EXECUTION FLOW:
 * 1. LOADER runs on SERVER (fetches quizzes from MongoDB)
 * 2. Data is serialized and sent to client
 * 3. COMPONENT renders on server (SSR) with data
 * 4. COMPONENT hydrates on client with same data
 * 
 * LEARNING POINTS:
 * - Loaders run BEFORE the component renders
 * - No loading states needed (data is ready immediately)
 * - useLoaderData() is type-safe with TypeScript
 * - This eliminates the "fetch in useEffect" waterfall pattern
 */

export async function loader() {
    // This code runs on the SERVER (Node.js)
    // It will NEVER run in the browser

    const quizzes = await getCollection<Quiz>('quizzes');
    const allQuizzes = await quizzes
        .find({ isPublished: true })
        .sort({ order: 1, createdAt: -1 })
        .toArray();

    // Serialize MongoDB documents for JSON transport
    const serialized: SerializedQuiz[] = allQuizzes.map(quiz => ({
        _id: quiz._id!.toString(),
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions,
        isPublished: quiz.isPublished,
        createdAt: quiz.createdAt.toISOString(),
        updatedAt: quiz.updatedAt.toISOString(),
        baseTestName: quiz.baseTestName,
        shortName: quiz.shortName,
        coverImage: quiz.coverImage,
    }));

    return { quizzes: serialized };
}

export function meta() {
    return [
        { title: "Browse Quizzes - Wellness Tracker" },
        { name: "description", content: "Choose from our evidence-based mental health quizzes" },
    ];
}

export default function Quizzes({ loaderData }: Route.ComponentProps) {
    const { quizzes } = loaderData;

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-6 py-12">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-warm-gray-900 mb-2">
                                Choose what feels right today.
                            </h1>
                            <p className="text-warm-gray-600">
                                There is no rush. Select an assessment to start your reflection.
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

                    {quizzes.length === 0 ? (
                        <Card className="p-12 text-center bg-white/50 backdrop-blur-sm">
                            <p className="text-warm-gray-600 text-lg mb-4">
                                No quizzes available yet.
                            </p>
                            <p className="text-warm-gray-500 text-sm">
                                Check back soon.
                            </p>
                        </Card>
                    ) : (
                        <div className="grid md:grid-cols-1 gap-8">
                            {quizzes.map((quiz) => (
                                <Link
                                    key={quiz._id}
                                    to={`/quizzes/${quiz._id}`}
                                    className="block h-full group"
                                >
                                    <Card variant="hover" className="h-full overflow-hidden bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300">
                                        <div className="flex flex-col md:flex-row h-full items-center">
                                            {quiz.coverImage && (
                                                <div className="w-full h-56 md:w-56 md:h-56 shrink-0 relative">
                                                    <img
                                                        src={quiz.coverImage}
                                                        alt={quiz.title}
                                                        className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                </div>
                                            )}
                                            <div className="p-8 flex flex-col flex-grow">
                                                <div className="flex justify-between items-start mb-4 gap-4">
                                                    <h2 className="text-2xl font-bold text-warm-gray-900 group-hover:text-sage-800 transition-colors">
                                                        {quiz.title}
                                                    </h2>
                                                    {quiz.shortName && (
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-sage-100 text-sage-700">
                                                            {quiz.shortName}
                                                        </span>
                                                    )}
                                                </div>

                                                {quiz.baseTestName && (
                                                    <p className="text-xs font-semibold tracking-wider text-warm-gray-400 uppercase mb-4">
                                                        Based on: {quiz.baseTestName}
                                                    </p>
                                                )}

                                                <p className="text-warm-gray-600 mb-8 flex-grow leading-relaxed">
                                                    {quiz.description}
                                                </p>

                                                <div className="flex items-center justify-between pt-6 mt-auto border-t border-warm-gray-100">
                                                    <span className="text-sm font-medium text-warm-gray-500 bg-warm-gray-50 px-3 py-1 rounded-full">
                                                        {quiz.questions.length} Questions
                                                    </span>
                                                    <span className="text-sage-600 font-semibold flex items-center group-hover:translate-x-1 transition-transform">
                                                        Begin →
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
