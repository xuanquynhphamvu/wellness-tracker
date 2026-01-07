import type { Route } from "./+types/admin.quizzes.$id.edit";
import { Form, redirect, Link } from "react-router";
import { getCollection, ObjectId } from "~/lib/db.server";
import type { Quiz, SerializedQuiz } from "~/types/quiz";

/**
 * Edit Quiz Route
 * 
 * EXECUTION FLOW:
 * 1. LOADER: Fetch quiz by ID
 * 2. COMPONENT: Pre-fill form with quiz data
 * 3. ACTION: Update quiz in database
 * 4. Redirect back to admin quiz list
 * 
 * LEARNING POINTS:
 * - Loaders pre-fill forms (no useEffect needed!)
 * - Actions handle updates with MongoDB operators
 * - This is the "loader → form → action → redirect" pattern
 */

export async function loader({ params }: Route.LoaderArgs) {
    if (!params.id) {
        throw new Response("Quiz ID is required", { status: 400 });
    }

    const quizzes = await getCollection<Quiz>('quizzes');
    const quiz = await quizzes.findOne({ _id: new ObjectId(params.id) });

    if (!quiz) {
        throw new Response("Quiz not found", { status: 404 });
    }

    const serialized: SerializedQuiz = {
        _id: quiz._id!.toString(),
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions,
        isPublished: quiz.isPublished,
        createdAt: quiz.createdAt.toISOString(),
        updatedAt: quiz.updatedAt.toISOString(),
    };

    return { quiz: serialized };
}

export async function action({ request, params }: Route.ActionArgs) {
    if (!params.id) {
        throw new Response("Quiz ID is required", { status: 400 });
    }

    const formData = await request.formData();
    const title = formData.get('title');
    const description = formData.get('description');

    // Validation
    const errors: Record<string, string> = {};

    if (!title || String(title).trim().length === 0) {
        errors.title = 'Title is required';
    }

    if (!description || String(description).trim().length === 0) {
        errors.description = 'Description is required';
    }

    if (Object.keys(errors).length > 0) {
        return { errors };
    }

    // Update quiz
    const quizzes = await getCollection<Quiz>('quizzes');
    await quizzes.updateOne(
        { _id: new ObjectId(params.id) },
        {
            $set: {
                title: String(title),
                description: String(description),
                updatedAt: new Date(),
            },
        }
    );

    return redirect('/admin/quizzes');
}

export function meta({ data }: Route.MetaArgs) {
    return [
        { title: `Edit ${data?.quiz.title || 'Quiz'} - Admin - Wellness Tracker` },
    ];
}

export default function EditQuiz({ loaderData, actionData }: Route.ComponentProps) {
    const { quiz } = loaderData;
    const errors = actionData?.errors;

    return (
        <div>
            <div className="mb-8">
                <Link
                    to="/admin/quizzes"
                    className="text-indigo-600 hover:text-indigo-700 font-medium mb-4 inline-block"
                >
                    ← Back to Quizzes
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Edit Quiz
                </h1>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-2xl">
                <Form method="post" className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Quiz Title
                        </label>
                        <input
                            type="text"
                            name="title"
                            defaultValue={quiz.title}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        {errors?.title && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {errors.title}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            rows={4}
                            defaultValue={quiz.description}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        {errors?.description && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4">
                        <p className="text-sm text-yellow-800 dark:text-yellow-300">
                            <strong>Note:</strong> Question editing is not yet implemented.
                            This form only updates the title and description.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow transition-colors"
                        >
                            Save Changes
                        </button>
                        <Link
                            to="/admin/quizzes"
                            className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg shadow text-center transition-colors"
                        >
                            Cancel
                        </Link>
                    </div>
                </Form>

                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                        Current Questions ({quiz.questions.length})
                    </h3>
                    <div className="space-y-2">
                        {quiz.questions.map((question, index) => (
                            <div
                                key={question.id}
                                className="p-3 bg-gray-50 dark:bg-gray-700 rounded"
                            >
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {index + 1}. {question.text}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Type: {question.type}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
