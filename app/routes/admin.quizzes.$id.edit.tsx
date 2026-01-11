import type { Route } from "./+types/admin.quizzes.$id.edit";
import { Form, redirect, Link, useActionData, useLoaderData, useNavigation, isRouteErrorResponse, useRouteError } from "react-router";
import { getCollection, ObjectId } from "~/lib/db.server";
import type { Quiz, SerializedQuiz, Question } from "~/types/quiz";
import { requireAdmin } from "~/lib/auth.server";
import React, { useState } from "react";
import { QuestionList } from "~/components/admin/QuestionList";
import { Button } from "~/components/Button";
import { Card } from "~/components/Card";
import { ScoreRangeEditor } from "~/components/admin/ScoreRangeEditor";
import type { ScoreRange } from "~/types/quiz";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { validateQuiz } from "~/utils/quiz-validation";

/**
 * Edit Quiz Route
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
        slug: quiz.slug || '',
        description: quiz.description,
        questions: quiz.questions,
        isPublished: quiz.isPublished,
        createdAt: quiz.createdAt.toISOString(),
        updatedAt: quiz.updatedAt.toISOString(),
        baseTestName: quiz.baseTestName,
        shortName: quiz.shortName,
        instructions: quiz.instructions,
        scoreRanges: quiz.scoreRanges,
        coverImage: quiz.coverImage,
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
    const title = String(formData.get("title"));
    const slug = String(formData.get("slug"));
    const description = String(formData.get("description"));
    const questionsString = String(formData.get("questions"));
    const scoreRangesString = formData.get("scoreRanges") ? String(formData.get("scoreRanges")) : "[]";
    const scoringDirection = String(formData.get("scoringDirection") || "higher-is-better");

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
    let questions: Question[] = [];
    let scoreRanges: ScoreRange[] = [];
    let parseError: string | null = null;

    try {
        questions = JSON.parse(questionsString);
        scoreRanges = JSON.parse(scoreRangesString);
    } catch {
        parseError = 'Invalid data';
    }

    const { errors, isValid } = validateQuiz(title, slug, description, questions, scoreRanges);

    if (parseError) {
        errors.questions = parseError;
    }

    if (!isValid || parseError) {
        return { errors };
    }

    // Update quiz
    const quizzes = await getCollection<Quiz>('quizzes');
    await quizzes.updateOne(
        { _id: new ObjectId(params.id) },
        {
            $set: {
                title: String(title),
                slug: String(slug),
                description: String(description),
                baseTestName: formData.get('baseTestName') ? String(formData.get('baseTestName')) : undefined,
                shortName: formData.get('shortName') ? String(formData.get('shortName')) : undefined,
                instructions: formData.get('instructions') ? String(formData.get('instructions')) : undefined,
                scoringDirection: scoringDirection as 'higher-is-better' | 'lower-is-better',
                coverImage,
                questions,
                scoreRanges,
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
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    const [questions, setQuestions] = useState<Question[]>(quiz.questions);
    const [scoreRanges, setScoreRanges] = useState<ScoreRange[]>(quiz.scoreRanges || []);

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
                    Edit Quiz
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
                                defaultValue={quiz.title}
                                className="w-full px-4 py-2 rounded-xl border border-warm-gray-200 bg-warm-gray-50 text-warm-gray-900 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all outline-none"
                                required
                            />
                            {errors?.title && (
                                <p className="mt-1 text-sm text-orange-600">
                                    {errors.title}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="slug" className="block text-sm font-semibold text-warm-gray-700 mb-2">
                                Slug *
                            </label>
                            <input
                                id="slug"
                                type="text"
                                name="slug"
                                defaultValue={quiz.slug}
                                className="w-full px-4 py-2 rounded-xl border border-warm-gray-200 bg-warm-gray-50 text-warm-gray-900 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all outline-none"
                                required
                            />
                            {errors?.slug && (
                                <p className="mt-1 text-sm text-orange-600">
                                    {errors.slug}
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
                                defaultValue={quiz.description}
                                className="w-full px-4 py-2 rounded-xl border border-warm-gray-200 bg-warm-gray-50 text-warm-gray-900 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all outline-none resize-none"
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
                                    defaultValue={quiz.baseTestName}
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
                                    defaultValue={quiz.shortName}
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
                                defaultValue={quiz.instructions}
                                className="w-full px-4 py-2 rounded-xl border border-warm-gray-200 bg-warm-gray-50 text-warm-gray-900 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all outline-none resize-none"
                                placeholder="Explain how users should answer..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-warm-gray-700 mb-2">
                                Scoring Direction
                            </label>
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="scoringDirection"
                                        value="higher-is-better"
                                        defaultChecked={quiz.scoringDirection === 'higher-is-better' || !quiz.scoringDirection}
                                        className="w-4 h-4 text-sage-600 focus:ring-sage-500 border-gray-300 transition-all"
                                    />
                                    <span className="text-warm-gray-700 group-hover:text-warm-gray-900 transition-colors">
                                        Higher is Better <span className="text-warm-gray-400 text-sm">(e.g., Wellness)</span>
                                    </span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="scoringDirection"
                                        value="lower-is-better"
                                        defaultChecked={quiz.scoringDirection === 'lower-is-better'}
                                        className="w-4 h-4 text-sage-600 focus:ring-sage-500 border-gray-300 transition-all"
                                    />
                                    <span className="text-warm-gray-700 group-hover:text-warm-gray-900 transition-colors">
                                        Lower is Better <span className="text-warm-gray-400 text-sm">(e.g., Depression)</span>
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-warm-gray-700 mb-2">
                                    Cover Image URL <span className="text-warm-gray-400 font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    name="coverImage"
                                    defaultValue={quiz.coverImage}
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
                                {quiz.coverImage && (
                                    <p className="mt-2 text-xs text-warm-gray-500">
                                        Current: <a href={quiz.coverImage} target="_blank" rel="noopener noreferrer" className="underline hover:text-sage-600">View Image</a>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Questions */}
                <QuestionList
                    questions={questions}
                    onQuestionsChange={setQuestions}
                    errors={errors}
                />

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
                        {isSubmitting ? "Saving..." : "Save Changes"}
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

export function ErrorBoundary() {
    const error = useRouteError();

    if (isRouteErrorResponse(error)) {
        return (
            <Card className="p-12 text-center border-orange-200 bg-orange-50">
                <h1 className="text-4xl font-bold text-orange-600 mb-4">
                    {error.status}
                </h1>
                <h2 className="text-xl font-bold text-warm-gray-900 mb-4">
                    {error.statusText}
                </h2>
                <p className="text-warm-gray-600 mb-8">
                    {error.data}
                </p>
                <Button to="/admin/quizzes" variant="primary">
                    Back to Quizzes
                </Button>
            </Card>
        );
    }

    return (
        <Card className="p-12 text-center border-orange-200 bg-orange-50">
            <h1 className="text-4xl font-bold text-orange-600 mb-4">
                Error
            </h1>
            <h2 className="text-xl font-bold text-warm-gray-900 mb-4">
                Something went wrong
            </h2>
            <p className="text-warm-gray-600 mb-8">
                We encountered an error editing the quiz. Please try again.
            </p>
            <Button to="/admin/quizzes" variant="primary">
                Back to Quizzes
            </Button>
        </Card>
    );
}