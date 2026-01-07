import type { Route } from "./+types/admin.quizzes.$id.edit";
import { Form, redirect, Link } from "react-router";
import { getCollection, ObjectId } from "~/lib/db.server";
import type { Quiz, SerializedQuiz, Question } from "~/types/quiz";
import { requireAdmin } from "~/lib/auth.server";
import { useState } from "react";
import { QuestionEditor } from "~/components/QuestionEditor";

/**
 * Edit Quiz Route
 * 
 * EXECUTION FLOW:
 * 1. LOADER: Fetch quiz by ID
 * 2. COMPONENT: Pre-fill form with quiz data
 * 3. ACTION: Update quiz in database
 * 4. Redirect back to admin quiz list
 * 
 * FEATURES:
 * - Dynamic question management
 * - Support for multiple question types
 * - Client-side state for questions array
 * - Server-side validation
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
    // PROTECTED ACTION: Require admin role
    await requireAdmin(request);

    if (!params.id) {
        throw new Response("Quiz ID is required", { status: 400 });
    }

    const formData = await request.formData();
    const title = formData.get('title');
    const description = formData.get('description');
    const questionsJson = formData.get('questions');

    // Validation
    const errors: Record<string, string> = {};

    if (!title || String(title).trim().length === 0) {
        errors.title = 'Title is required';
    }

    if (!description || String(description).trim().length === 0) {
        errors.description = 'Description is required';
    }

    let questions: Question[] = [];
    try {
        questions = JSON.parse(String(questionsJson || '[]'));
    } catch {
        errors.questions = 'Invalid questions data';
    }

    if (questions.length === 0) {
        errors.questions = 'At least one question is required';
    }

    // Validate each question
    questions.forEach((q, index) => {
        if (!q.text || q.text.trim().length === 0) {
            errors[`question_${index}`] = `Question ${index + 1} text is required`;
        }

        if (q.type === 'multiple-choice') {
            if (!q.options || q.options.length < 2) {
                errors[`question_${index}`] = `Question ${index + 1} must have at least 2 options`;
            }
            if (q.options?.some(opt => !opt || opt.trim().length === 0)) {
                errors[`question_${index}`] = `Question ${index + 1} has empty options`;
            }
        }

        if (q.type === 'scale') {
            if ((q.scaleMin || 0) >= (q.scaleMax || 0)) {
                errors[`question_${index}`] = `Question ${index + 1} scale min must be less than max`;
            }
        }
    });

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
                questions,
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

    const [questions, setQuestions] = useState<Question[]>(quiz.questions);

    const addQuestion = () => {
        const newQuestion: Question = {
            id: `${Date.now()}`,
            text: '',
            type: 'multiple-choice',
            options: ['', ''],
            scoreMapping: {},
        };
        setQuestions([...questions, newQuestion]);
    };

    const updateQuestion = (index: number, updatedQuestion: Question) => {
        const newQuestions = [...questions];
        newQuestions[index] = updatedQuestion;
        setQuestions(newQuestions);
    };

    const removeQuestion = (index: number) => {
        if (questions.length > 1) {
            setQuestions(questions.filter((_, i) => i !== index));
        }
    };

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

            <Form method="post" className="space-y-6">
                {/* Hidden input for questions */}
                <input type="hidden" name="questions" value={JSON.stringify(questions)} />
                {/* Quiz Details */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        Quiz Details
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                Quiz Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                defaultValue={quiz.title}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                required
                            />
                            {errors?.title && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {errors.title}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                Description *
                            </label>
                            <textarea
                                name="description"
                                rows={4}
                                defaultValue={quiz.description}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                required
                            />
                            {errors?.description && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {errors.description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Questions */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Questions
                        </h2>
                        <button
                            type="button"
                            onClick={addQuestion}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow transition-colors"
                        >
                            + Add Question
                        </button>
                    </div>

                    {errors?.questions && (
                        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-4">
                            <p className="text-red-800 dark:text-red-300">
                                {errors.questions}
                            </p>
                        </div>
                    )}

                    {questions.map((question, index) => (
                        <QuestionEditor
                            key={question.id}
                            question={question}
                            index={index}
                            onChange={updateQuestion}
                            onRemove={removeQuestion}
                        />
                    ))}
                </div>

                {/* Submit Buttons */}
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
        </div>
    );
}
