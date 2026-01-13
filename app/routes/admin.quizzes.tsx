import React from "react";
import type { Route } from "./+types/admin.quizzes";
import { Form, isRouteErrorResponse, useRouteError, useNavigation } from "react-router";
import { getCollection, ObjectId } from "~/lib/db.server";
import type { Quiz, SerializedQuiz } from "~/types/quiz";
import { redirect } from "react-router";
import { requireAdmin } from "~/lib/auth.server";
import { Button } from "~/components/Button";
import { Card } from "~/components/Card";

import { getAllQuizzes } from "~/lib/quiz.server";

/**
 * Admin Quiz Management Route
 */

export async function loader() {
    const allQuizzes = await getAllQuizzes();

    const serialized: SerializedQuiz[] = allQuizzes.map(quiz => ({
        _id: quiz._id!.toString(),
        title: quiz.title,
        slug: quiz.slug || '',
        description: quiz.description,
        questions: quiz.questions,
        isPublished: quiz.isPublished,
        createdAt: quiz.createdAt.toISOString(),
        updatedAt: quiz.updatedAt.toISOString(),
    }));

    return { quizzes: serialized };
}

export async function action({ request }: Route.ActionArgs) {
    // PROTECTED ACTION: Require admin role
    await requireAdmin(request);

    const formData = await request.formData();
    const intent = formData.get('intent');
    const quizId = formData.get('quizId');

    if (intent === 'delete' && quizId) {
        const quizzes = await getCollection<Quiz>('quizzes');
        await quizzes.deleteOne({ _id: new ObjectId(String(quizId)) });
        return redirect('/admin/quizzes');
    }

    if (intent === 'toggle-publish' && quizId) {
        const quizzes = await getCollection<Quiz>('quizzes');
        const quiz = await quizzes.findOne({ _id: new ObjectId(String(quizId)) });

        if (quiz) {
            await quizzes.updateOne(
                { _id: new ObjectId(String(quizId)) },
                {
                    $set: {
                        isPublished: !quiz.isPublished,
                        updatedAt: new Date(),
                    }
                }
            );
        }
        return redirect('/admin/quizzes');
    }

    if (intent === 'reorder') {
        const direction = formData.get('direction'); // 'up' | 'down'
        if (!quizId || !direction) return null;

        const quizzesCollection = await getCollection<Quiz>('quizzes');
        const allQuizzes = await quizzesCollection.find({}).sort({ order: 1, createdAt: -1 }).toArray();

        const currentIndex = allQuizzes.findIndex(q => q._id!.toString() === String(quizId));
        if (currentIndex === -1) return null;

        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (targetIndex >= 0 && targetIndex < allQuizzes.length) {
            // Swap in the array
            const temp = allQuizzes[currentIndex];
            allQuizzes[currentIndex] = allQuizzes[targetIndex];
            allQuizzes[targetIndex] = temp;

            // Update all orders based on new array position
            // This ensures self-healing if orders were missing or duplicate
            await Promise.all(allQuizzes.map((quiz, index) =>
                quizzesCollection.updateOne(
                    { _id: quiz._id },
                    { $set: { order: index } }
                )
            ));
        }

        return redirect('/admin/quizzes');
    }

    if (intent === 'duplicate' && quizId) {
        const quizzesCollection = await getCollection<Quiz>('quizzes');
        const originalQuiz = await quizzesCollection.findOne({ _id: new ObjectId(String(quizId)) });

        if (originalQuiz) {
            // Create a copy with modified title and slug
            const now = new Date();
            const copyTitle = `${originalQuiz.title} (Copy)`;
            const baseSlug = originalQuiz.slug ? `${originalQuiz.slug}-copy` : 'quiz-copy';
            
            // Ensure unique slug by appending timestamp if needed
            let newSlug = baseSlug;
            const existingWithSlug = await quizzesCollection.findOne({ slug: newSlug });
            if (existingWithSlug) {
                newSlug = `${baseSlug}-${Date.now()}`;
            }

            const duplicatedQuiz: Quiz = {
                ...originalQuiz,
                _id: undefined, // Let MongoDB generate a new ID
                title: copyTitle,
                slug: newSlug,
                isPublished: false, // Duplicates start as drafts
                createdAt: now,
                updatedAt: now,
            };

            await quizzesCollection.insertOne(duplicatedQuiz);
        }

        return redirect('/admin/quizzes');
    }

    return null;
}

export function meta() {
    return [
        { title: "Manage Quizzes - Admin - Wellness Tracker" },
    ];
}

export default function AdminQuizzes({ loaderData }: Route.ComponentProps) {
    const { quizzes } = loaderData;
    const navigation = useNavigation();

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-warm-gray-900 dark:text-white">
                    Manage Quizzes
                </h1>
                <Button
                    to="/admin/quizzes/new"
                    variant="primary"
                >
                    + Create Quiz
                </Button>
            </div>

            {quizzes.length === 0 ? (
                <Card className="p-12 text-center">
                    <p className="text-warm-gray-600 mb-6">
                        No quizzes created yet.
                    </p>
                    <Button
                        to="/admin/quizzes/new"
                        variant="primary"
                    >
                        Create Your First Quiz
                    </Button>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {quizzes.map((quiz) => {
                        const isTogglePublishing = 
                            navigation.state === "submitting" && 
                            navigation.formData?.get("intent") === "toggle-publish" &&
                            navigation.formData?.get("quizId") === quiz._id;
                        
                        const isDeleting = 
                            navigation.state === "submitting" && 
                            navigation.formData?.get("intent") === "delete" &&
                            navigation.formData?.get("quizId") === quiz._id;

                        return (
                            <Card
                                key={quiz._id}
                                className="p-6"
                            >
                                <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <h2 className="text-xl font-bold text-warm-gray-900">
                                                {quiz.title}
                                            </h2>
                                            {quiz.shortName && (
                                                <span className="text-sm font-medium text-sage-600 bg-sage-50 px-2 py-0.5 rounded-full">
                                                    {quiz.shortName}
                                                </span>
                                            )}
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${quiz.isPublished
                                                    ? 'bg-sage-100 text-sage-800'
                                                    : 'bg-warm-gray-100 text-warm-gray-800'
                                                    }`}
                                            >
                                                {quiz.isPublished ? 'Published' : 'Draft'}
                                            </span>
                                        </div>
                                        <p className="text-warm-gray-600 mb-3">
                                            {quiz.description}
                                        </p>
                                        <p className="text-sm text-warm-gray-400">
                                            {quiz.questions.length} {quiz.questions.length === 1 ? 'question' : 'questions'}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-1 mr-2">
                                        <Form method="post">
                                            <input type="hidden" name="quizId" value={quiz._id} />
                                            <input type="hidden" name="intent" value="reorder" />
                                            <input type="hidden" name="direction" value="up" />
                                            <button
                                                type="submit"
                                                className="p-1 text-warm-gray-400 hover:text-sage-600 hover:bg-sage-50 rounded"
                                                title="Move Up"
                                            >
                                                ↑
                                            </button>
                                        </Form>
                                        <Form method="post">
                                            <input type="hidden" name="quizId" value={quiz._id} />
                                            <input type="hidden" name="intent" value="reorder" />
                                            <input type="hidden" name="direction" value="down" />
                                            <button
                                                type="submit"
                                                className="p-1 text-warm-gray-400 hover:text-sage-600 hover:bg-sage-50 rounded"
                                                title="Move Down"
                                            >
                                                ↓
                                            </button>
                                        </Form>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            to={`/admin/quizzes/${quiz._id}/edit`}
                                            variant="outline"
                                            size="sm"
                                        >
                                            Edit
                                        </Button>

                                        <Button
                                            to={`/admin/quizzes/${quiz._id}/edit#overview`}
                                            variant="outline"
                                            size="sm"
                                            className="text-sage-600 border-sage-200 hover:bg-sage-50"
                                        >
                                            📄 Overview
                                        </Button>

                                        <Form method="post">
                                            <input type="hidden" name="quizId" value={quiz._id} />
                                            <input type="hidden" name="intent" value="duplicate" />
                                            <Button
                                                type="submit"
                                                variant="outline"
                                                size="sm"
                                            >
                                                Duplicate
                                            </Button>
                                        </Form>

                                        <Form method="post">
                                            <input type="hidden" name="quizId" value={quiz._id} />
                                            <input type="hidden" name="intent" value="toggle-publish" />
                                            <Button
                                                type="submit"
                                                variant="ghost"
                                                size="sm"
                                                disabled={isTogglePublishing}
                                                className={quiz.isPublished ? "text-warm-gray-500 hover:text-warm-gray-700" : "text-sage-600 hover:text-sage-700"}
                                            >
                                                {isTogglePublishing ? "Processing..." : (quiz.isPublished ? 'Unpublish' : 'Publish')}
                                            </Button>
                                        </Form>

                                        <Form method="post">
                                            <input type="hidden" name="quizId" value={quiz._id} />
                                            <input type="hidden" name="intent" value="delete" />
                                            <Button
                                                type="submit"
                                                variant="ghost"
                                                size="sm"
                                                disabled={isDeleting}
                                                className="text-orange-400 hover:text-orange-600 hover:bg-orange-50"
                                                onClick={(e) => {
                                                    if (!confirm('Are you sure you want to delete this quiz?')) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            >
                                                {isDeleting ? "Deleting..." : "Delete"}
                                            </Button>
                                        </Form>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
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
                    Try Again
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
                We encountered an error managing quizzes. Please try again.
            </p>
            <Button to="/admin/quizzes" variant="primary">
                Try Again
            </Button>
        </Card>
    );
}
