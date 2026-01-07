import type { Route } from "./+types/quizzes";
import { Link } from "react-router";
import { getCollection } from "~/lib/db.server";
import type { Quiz, SerializedQuiz } from "~/types/quiz";

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

export async function loader({ }: Route.LoaderArgs) {
    // This code runs on the SERVER (Node.js)
    // It will NEVER run in the browser

    const quizzes = await getCollection<Quiz>('quizzes');
    const allQuizzes = await quizzes
        .find({ isPublished: true })
        .sort({ createdAt: -1 })
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
    }));

    return { quizzes: serialized };
}

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Browse Quizzes - Wellness Tracker" },
        { name: "description", content: "Choose from our evidence-based mental health quizzes" },
    ];
}

export default function Quizzes({ loaderData }: Route.ComponentProps) {
    // This component runs on BOTH server (SSR) and client (hydration)
    // loaderData is type-safe and available immediately (no loading state!)

    const { quizzes } = loaderData;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                            Available Quizzes
                        </h1>
                        <Link
                            to="/"
                            className="text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            ← Back to Home
                        </Link>
                    </div>

                    {quizzes.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
                            <p className="text-gray-600 dark:text-gray-300 text-lg mb-4">
                                No quizzes available yet.
                            </p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                Check back soon or contact an administrator to create quizzes.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {quizzes.map((quiz) => (
                                <Link
                                    key={quiz._id}
                                    to={`/quizzes/${quiz._id}`}
                                    className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
                                >
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                        {quiz.title}
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                                        {quiz.description}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            {quiz.questions.length} questions
                                        </span>
                                        <span className="text-indigo-600 font-medium">
                                            Take Quiz →
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
