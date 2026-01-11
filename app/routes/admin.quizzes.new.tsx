import type { Route } from "./+types/admin.quizzes.new";
import { Form, redirect, useActionData, useNavigation } from "react-router";
import { getCollection } from "~/lib/db.server";
import type { Quiz, Question } from "~/types/quiz";
import { requireAdmin } from "~/lib/auth.server";
import { useState } from "react";
import { QuestionEditor } from "~/components/QuestionEditor";
import { Button } from "~/components/Button";
import { Card } from "~/components/Card";
import { ScoreRangeEditor } from "~/components/ScoreRangeEditor";
import type { ScoreRange } from "~/types/quiz";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as crypto from "node:crypto";

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

    const title = String(formData.get("title"));
    const description = String(formData.get("description"));
    const questionsString = String(formData.get("questions"));
    const scoreRangesString = formData.get("scoreRanges") ? String(formData.get("scoreRanges")) : "[]";

    // File Upload Logic
    let coverImage = formData.get('coverImage') ? String(formData.get('coverImage')) : undefined;
    const coverImageFile = formData.get('coverImageFile') as File | null;

    if (coverImageFile && coverImageFile.size > 0 && coverImageFile.name) {
        try {
            const uploadsDir = path.join(process.cwd(), "public", "uploads");
            await fs.mkdir(uploadsDir, { recursive: true });

            const ext = path.extname(coverImageFile.name);
            const fileName = `${crypto.randomUUID()}${ext}`;
            const filePath = path.join(uploadsDir, fileName);

            const buffer = Buffer.from(await coverImageFile.arrayBuffer());
            await fs.writeFile(filePath, buffer);

            coverImage = `/uploads/${fileName}`;
        } catch (error) {
            console.error("File upload failed:", error);
            // Non-blocking error, proceed without image
        }
    }

    // Validation
    const errors: Record<string, string> = {};

    if (!title || String(title).trim().length === 0) {
        errors.title = 'Title is required';
    }

    if (!description || String(description).trim().length === 0) {
        errors.description = 'Description is required';
    }

    let questions: Question[] = [];
    let scoreRanges: ScoreRange[] = [];
    try {
        questions = JSON.parse(questionsString);
        scoreRanges = JSON.parse(scoreRangesString);
    } catch {
        errors.questions = 'Invalid data';
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
    const quizzes = await getCollection<Quiz>('quizzes');
    
    // Generate slug
    const slug = String(title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    await quizzes.insertOne({
        title: String(title),
        slug,
        description: String(description),
        baseTestName: formData.get('baseTestName') ? String(formData.get('baseTestName')) : undefined,
        shortName: formData.get('shortName') ? String(formData.get('shortName')) : undefined,
        instructions: formData.get('instructions') ? String(formData.get('instructions')) : undefined,
        coverImage,
        questions,
        scoreRanges,
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

    const [scoreRanges, setScoreRanges] = useState<ScoreRange[]>([]);

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

    const duplicateQuestion = (index: number) => {
        const questionToDuplicate = questions[index];
        const newQuestion: Question = {
            ...questionToDuplicate,
            id: `${Date.now()}`,
            text: `${questionToDuplicate.text} (Copy)`,
        };
        const newQuestions = [...questions];
        newQuestions.splice(index + 1, 0, newQuestion);
        setQuestions(newQuestions);
    };

    return (
        <div>
            <div className="mb-8">
                <Button
                    to="/admin/quizzes"
                    variant="ghost"
                    size="sm"
                    className="mb-4"
                >
                    ← Back to Quizzes
                </Button>
                <h1 className="text-3xl font-bold text-warm-gray-900 dark:text-white">
                    Create New Quiz
                </h1>
            </div>


            <Form method="post" className="space-y-8" encType="multipart/form-data">
                {/* Hidden inputs */}
                <input type="hidden" name="questions" value={JSON.stringify(questions)} />
                <input type="hidden" name="scoreRanges" value={JSON.stringify(scoreRanges)} />

                {/* Quiz Details */}
                <Card className="p-8">
                    <h2 className="text-xl font-bold text-warm-gray-900 mb-6">
                        Quiz Details
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <label htmlFor="title" className="block text-sm font-semibold text-warm-gray-700 mb-2">
                                Quiz Title *
                            </label>
                            <input
                                id="title"
                                type="text"
                                name="title"
                                className="w-full px-4 py-2 rounded-xl border border-warm-gray-200 bg-warm-gray-50 text-warm-gray-900 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all outline-none"
                                placeholder="e.g., Depression Screening (PHQ-9)"
                                required
                            />
                            {errors?.title && (
                                <p className="mt-1 text-sm text-orange-600">
                                    {errors.title}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-semibold text-warm-gray-700 mb-2">
                                Description *
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={4}
                                className="w-full px-4 py-2 rounded-xl border border-warm-gray-200 bg-warm-gray-50 text-warm-gray-900 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all outline-none resize-none"
                                placeholder="Describe what this quiz measures..."
                                required
                            />
                            {errors?.description && (
                                <p className="mt-1 text-sm text-orange-600">
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-warm-gray-700 mb-2">
                                    Full Name of Base Test <span className="text-warm-gray-400 font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    name="baseTestName"
                                    className="w-full px-4 py-2 rounded-xl border border-warm-gray-200 bg-warm-gray-50 text-warm-gray-900 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all outline-none"
                                    placeholder="e.g., Patient Health Questionnaire 9"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-warm-gray-700 mb-2">
                                    Short Name <span className="text-warm-gray-400 font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    name="shortName"
                                    className="w-full px-4 py-2 rounded-xl border border-warm-gray-200 bg-warm-gray-50 text-warm-gray-900 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all outline-none"
                                    placeholder="e.g., PHQ-9"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-warm-gray-700 mb-2">
                                Instructions <span className="text-warm-gray-400 font-normal">(Optional)</span>
                            </label>
                            <textarea
                                name="instructions"
                                rows={3}
                                className="w-full px-4 py-2 rounded-xl border border-warm-gray-200 bg-warm-gray-50 text-warm-gray-900 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all outline-none resize-none"
                                placeholder="Explain how users should answer..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-warm-gray-700 mb-2">
                                    Cover Image URL <span className="text-warm-gray-400 font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    name="coverImage"
                                    className="w-full px-4 py-2 rounded-xl border border-warm-gray-200 bg-warm-gray-50 text-warm-gray-900 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all outline-none"
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-warm-gray-700 mb-2">
                                    Or Upload Image <span className="text-warm-gray-400 font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="file"
                                    name="coverImageFile"
                                    accept="image/*"
                                    className="w-full px-4 py-1.5 rounded-xl border border-warm-gray-200 bg-warm-gray-50 text-warm-gray-900 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sage-100 file:text-sage-700 hover:file:bg-sage-200"
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Questions */}
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-warm-gray-900">
                            Questions
                        </h2>
                        <Button
                            type="button"
                            onClick={addQuestion}
                            variant="secondary"
                            size="sm"
                        >
                            + Add Question
                        </Button>
                    </div>

                    {errors?.questions && (
                        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-4 rounded-r-lg">
                            <p className="text-orange-800 text-sm">
                                {errors.questions}
                            </p>
                        </div>
                    )}

                    <div className="space-y-6">
                        {questions.map((question, index) => (
                            <QuestionEditor
                                key={question.id}
                                question={question}
                                index={index}
                                onChange={updateQuestion}
                                onRemove={removeQuestion}
                                onDuplicate={duplicateQuestion}
                            />
                        ))}
                    </div>
                </div>

                {/* Scoring Logic */}
                <ScoreRangeEditor
                    scoreRanges={scoreRanges}
                    onChange={setScoreRanges}
                />

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-4 border-t border-warm-gray-200">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        variant="primary"
                        size="lg"
                        className="flex-1 justify-center"
                    >
                        {isSubmitting ? "Creating..." : "Create Quiz"}
                    </Button>
                    <Button
                        to="/admin/quizzes"
                        variant="ghost"
                        size="lg"
                        className="flex-1 justify-center text-warm-gray-600 hover:bg-warm-gray-100"
                    >
                        Cancel
                    </Button>
                </div>
            </Form>
        </div>
    );
}
