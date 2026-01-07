import type { Route } from "./+types/admin.quizzes.new";
import { Form, redirect, Link } from "react-router";
import { getCollection } from "~/lib/db.server";
import type { Quiz } from "~/types/quiz";

/**
 * Create Quiz Route
 * 
 * EXECUTION FLOW:
 * - No loader needed (form is empty)
 * - ACTION: Validate and insert new quiz
 * - Redirect to admin quiz list after creation
 * 
 * LEARNING POINTS:
 * - Actions handle form validation
 * - Return validation errors to display in UI
 * - Redirect on success, return errors on failure
 * 
 * TODO: Implement full quiz builder with dynamic questions
 * For now: Simple form to demonstrate the pattern
 */

export async function action({ request }: Route.ActionArgs) {
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

    // Create quiz with placeholder questions
    const quizzes = await getCollection<Quiz>('quizzes');
    await quizzes.insertOne({
        title: String(title),
        description: String(description),
        questions: [
            {
                id: '1',
                text: 'How are you feeling today?',
                type: 'scale',
                scaleMin: 1,
                scaleMax: 10,
            },
        ],
        isPublished: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    return redirect('/admin/quizzes');
}

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Create Quiz - Admin - Wellness Tracker" },
    ];
}

export default function NewQuiz({ actionData }: Route.ComponentProps) {
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
                    Create New Quiz
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
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="e.g., Depression Screening (PHQ-9)"
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
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Describe what this quiz measures..."
                        />
                        {errors?.description && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                            <strong>Note:</strong> This creates a quiz with a placeholder question.
                            After creation, use the edit page to add your full question set.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow transition-colors"
                        >
                            Create Quiz
                        </button>
                        <Link
                            to="/admin/quizzes"
                            className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg shadow text-center transition-colors"
                        >
                            Cancel
                        </Link>
                    </div>
                </Form>
            </div>
        </div>
    );
}
