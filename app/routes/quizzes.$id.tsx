import type { Route } from "./+types/quizzes.$id";
import React from "react";
import { Form, redirect, Link, useNavigation, isRouteErrorResponse, useRouteError } from "react-router";
import { getCollection, ObjectId } from "~/lib/db.server";
import type { Quiz, SerializedQuiz } from "~/types/quiz";
import type { QuizResult } from "~/types/result";
import { data } from "react-router";
import { requireUser } from "~/lib/auth.server";
import { calculateScore } from "~/utils/scoring";

/**
 * Take Quiz Route (Dynamic Route)
 * 
 * EXECUTION FLOW:
 * 1. LOADER runs on server → fetches quiz by ID
 * 2. COMPONENT renders with quiz data
 * 3. User fills out form and submits
 * 4. ACTION runs on server → calculates score, saves to DB
 * 5. Redirect to results page
 * 
 * LEARNING POINTS:
 * - Dynamic routes use $id syntax (params.id)
 * - Forms automatically trigger actions (no fetch needed!)
 * - Actions handle mutations, loaders handle reads
 * - This is the "form → action → DB → redirect" pattern
 * - Progressive enhancement: works without JavaScript!
 */

export async function loader({ request, params }: Route.LoaderArgs) {
    // PROTECTED ROUTE: Require authentication
    await requireUser(request);

    // SERVER-SIDE: Fetch quiz by ID

    if (!params.id) {
        throw new Response("Quiz ID is required", { status: 400 });
    }

    const quizzes = await getCollection<Quiz>('quizzes');
    const quiz = await quizzes.findOne({
        _id: new ObjectId(params.id),
        isPublished: true
    });

    if (!quiz) {
        throw new Response("Quiz not found", { status: 404 });
    }

    // Serialize for client
    const serialized: SerializedQuiz = {
        _id: quiz._id!.toString(),
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions,
        isPublished: quiz.isPublished,
        createdAt: quiz.createdAt.toISOString(),
        updatedAt: quiz.updatedAt.toISOString(),
        baseTestName: quiz.baseTestName,
        shortName: quiz.shortName,
        instructions: quiz.instructions,
    };

    return { quiz: serialized };
}

export async function action({ request, params }: Route.ActionArgs) {
    // PROTECTED ROUTE: Require authentication
    const user = await requireUser(request);

    // SERVER-SIDE: Handle quiz submission

    const formData = await request.formData();
    const quizId = params.id;

    if (!quizId) {
        throw new Response("Quiz ID is required", { status: 400 });
    }

    // Get quiz to access score mappings
    const quizzes = await getCollection<Quiz>('quizzes');
    const quiz = await quizzes.findOne({ _id: new ObjectId(quizId) });

    if (!quiz) {
        throw new Response("Quiz not found", { status: 404 });
    }

    // Calculate score using utility
    const { totalScore, answers } = calculateScore(formData, quiz.questions, quiz.scoreRanges || []);

    // Save result to database (linked to user)
    const results = await getCollection<QuizResult>('results');
    const result = await results.insertOne({
        userId: new ObjectId(user._id),  // Link result to user (convert string to ObjectId)
        quizId: new ObjectId(quizId),
        answers,
        score: totalScore,
        completedAt: new Date(),
    });

    // Redirect to results page
    return redirect(`/results/${result.insertedId}`);
}

export function meta({ data }: Route.MetaArgs) {
    return [
        { title: `${data?.quiz.title || 'Quiz'} - Wellness Tracker` },
    ];
}

export default function TakeQuiz({ loaderData }: Route.ComponentProps) {
    const { quiz } = loaderData;
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";
    const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);

    const questions = quiz.questions;
    const currentQuestion = questions[currentQuestionIndex];
    const isFirst = currentQuestionIndex === 0;
    const isLast = currentQuestionIndex === questions.length - 1;
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    const handleNext = (e: React.MouseEvent) => {
        e.preventDefault();
        // Validation logic could go here
        if (!isLast) {
            setCurrentQuestionIndex(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePrevious = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isFirst) {
            setCurrentQuestionIndex(prev => prev - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-warm-white transition-colors duration-500">
            <div className="container mx-auto px-6 py-8 md:py-12">
                <div className="max-w-2xl mx-auto">
                    {/* Header / Progress */}
                    <div className="mb-12">
                        <div className="flex justify-between items-center mb-6">
                            <Link
                                to="/quizzes"
                                className="text-warm-gray-500 hover:text-warm-gray-800 transition-colors text-sm font-medium"
                            >
                                Cancel & Exit
                            </Link>
                            <span className="text-warm-gray-400 text-sm font-medium">
                                {currentQuestionIndex + 1} of {questions.length}
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1.5 bg-warm-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-sage-500 transition-all duration-700 ease-out rounded-full"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-xl font-medium text-warm-gray-500 mb-1">
                            {quiz.title}
                        </h1>
                    </div>

                    {/* 
                      Keep Form for submission, but visual wizard.
                      We hide non-active questions with display:none 
                      so they are still submitted.
                    */}
                    <Form method="post" className="space-y-8">
                        {questions.map((question, index) => (
                            <div
                                key={question.id}
                                className={index === currentQuestionIndex ? "block animate-in fade-in slide-in-from-bottom-4 duration-500" : "hidden"}
                            >
                                <div className="mb-10">
                                    <span className="block text-4xl md:text-5xl font-bold text-warm-gray-900 mb-8 leading-tight">
                                        {question.text}
                                    </span>

                                    {question.type === 'multiple-choice' && question.options && (
                                        <div className="space-y-4">
                                            {question.options.map((option) => (
                                                <label
                                                    key={option}
                                                    className="flex items-center p-6 rounded-2xl border-2 border-transparent bg-white hover:border-sage-200 hover:bg-sage-50 cursor-pointer transition-all duration-200 group shadow-sm"
                                                >
                                                    <input
                                                        type="radio"
                                                        name={`question_${question.id}`}
                                                        value={option}
                                                        required
                                                        className="w-5 h-5 text-sage-600 border-warm-gray-300 focus:ring-sage-500 transition-colors"
                                                    />
                                                    <span className="ml-4 text-xl text-warm-gray-700 group-hover:text-warm-gray-900">
                                                        {option}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {question.type === 'scale' && (
                                        <div className="space-y-8 py-4">
                                            <input
                                                type="range"
                                                name={`question_${question.id}`}
                                                min={question.scaleMin || 1}
                                                max={question.scaleMax || 10}
                                                defaultValue={Math.floor(((question.scaleMin || 1) + (question.scaleMax || 10)) / 2)}
                                                required
                                                className="w-full h-3 bg-warm-gray-200 rounded-lg appearance-none cursor-pointer accent-sage-600"
                                            />
                                            <div className="flex justify-between text-warm-gray-500 font-medium">
                                                <span>{question.scaleMin || 1} (Low)</span>
                                                <span>{question.scaleMax || 10} (High)</span>
                                            </div>
                                        </div>
                                    )}

                                    {question.type === 'text' && (
                                        <textarea
                                            name={`question_${question.id}`}
                                            required
                                            rows={6}
                                            className="w-full text-xl p-6 rounded-2xl border-2 border-warm-gray-100 bg-white focus:border-sage-400 focus:ring-0 transition-all placeholder:text-warm-gray-300"
                                            placeholder="Type your answer gently here..."
                                        />
                                    )}
                                </div>
                            </div>
                        ))}

                        <div className="flex justify-between items-center pt-8">
                            <button
                                type="button"
                                onClick={handlePrevious}
                                disabled={isFirst}
                                className={`text-warm-gray-500 font-medium px-6 py-3 rounded-full hover:bg-warm-gray-100 transition-colors ${isFirst ? 'opacity-0 pointer-events-none' : 'opacity-100'
                                    }`}
                            >
                                Back
                            </button>

                            {isLast ? (
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-sage-600 text-white font-semibold text-lg px-10 py-4 rounded-full shadow-lg hover:bg-sage-700 hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? "Completing..." : "Complete Reflection"}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="bg-sage-600 text-white font-semibold text-lg px-10 py-4 rounded-full shadow-lg hover:bg-sage-700 hover:scale-105 active:scale-95 transition-all duration-300"
                                >
                                    Next Question
                                </button>
                            )}
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    );
}

export function ErrorBoundary() {
    const error = useRouteError();

    if (isRouteErrorResponse(error)) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center">
                    <h1 className="text-6xl font-bold text-orange-600 dark:text-orange-400 mb-4">
                        {error.status}
                    </h1>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        {error.statusText}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                        {error.data}
                    </p>
                    <Link
                        to="/quizzes"
                        className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow transition-colors"
                    >
                        Back to Quizzes
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <h1 className="text-6xl font-bold text-orange-600 dark:text-orange-400 mb-4">
                    Error
                </h1>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Something went wrong
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-8">
                    We encountered an unexpected error. Please try again.
                </p>
                <Link
                    to="/quizzes"
                    className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow transition-colors"
                >
                    Back to Quizzes
                </Link>
            </div>
        </div>
    );
}
