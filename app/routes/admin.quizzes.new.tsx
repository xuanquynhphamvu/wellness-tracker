import type { Route } from "./+types/admin.quizzes.new";
import { Form, redirect, Link, useNavigation } from "react-router";
import { getCollection } from "~/lib/db.server";
import type { Quiz, Question } from "~/types/quiz";
import { requireAdmin } from "~/lib/auth.server";
import { useState } from "react";
import { QuestionEditor } from "~/components/QuestionEditor";

/**
 * Create Quiz Route
 * 
 * EXECUTION FLOW:
 * - No loader needed (form is empty)
 * - ACTION: Validate and insert new quiz
 * - Redirect to admin quiz list after creation
 * 
 * FEATURES:
 * - Dynamic question management
 * - Support for multiple question types
 * - Client-side state for questions array
 * - Server-side validation
 */

export async function action({ request }: Route.ActionArgs) {
    // PROTECTED ACTION: Require admin role
    await requireAdmin(request);

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

    // Create quiz
    // Create quiz
    const quizzes = await getCollection<Quiz>('quizzes');
    await quizzes.insertOne({
        title: String(title),
        description: String(description),
        baseTestName: formData.get('baseTestName') ? String(formData.get('baseTestName')) : undefined,
        shortName: formData.get('shortName') ? String(formData.get('shortName')) : undefined,
        instructions: formData.get('instructions') ? String(formData.get('instructions')) : undefined,
        questions,
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
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    const [questions, setQuestions] = useState<Question[]>([
        {
            id: '1',
            text: '',
            type: 'multiple-choice',
            options: ['', ''],
            scoreMapping: {},
        },
    ]);

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
                    Create New Quiz
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
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="e.g., Depression Screening (PHQ-9)"
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
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="Describe what this quiz measures..."
                                required
                            />
                            {errors?.description && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                    Full Name of Base Test <span className="text-gray-500 font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    name="baseTestName"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="e.g., Patient Health Questionnaire 9"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                    Short Name <span className="text-gray-500 font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    name="shortName"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="e.g., PHQ-9"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                Instructions <span className="text-gray-500 font-normal">(Optional)</span>
                            </label>
                            <textarea
                                name="instructions"
                                rows={3}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="Explain how users should answer..."
                            />
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
                        disabled={isSubmitting}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg shadow transition-colors"
                    >
                        {isSubmitting ? "Creating..." : "Create Quiz"}
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
