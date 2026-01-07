import type { Route } from "./+types/quizzes.$id";
import { Form, redirect, Link } from "react-router";
import { getCollection, ObjectId } from "~/lib/db.server";
import type { Quiz, SerializedQuiz } from "~/types/quiz";
import type { QuizResult } from "~/types/result";
import { data } from "react-router";
import { requireUser } from "~/lib/auth.server";

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

    // Extract answers from form data
    const answers: { questionId: string; answer: string | number }[] = [];
    let totalScore = 0;

    // Get quiz to access score mappings
    const quizzes = await getCollection<Quiz>('quizzes');
    const quiz = await quizzes.findOne({ _id: new ObjectId(quizId) });

    if (!quiz) {
        throw new Response("Quiz not found", { status: 404 });
    }

    // Calculate score based on answers
    quiz.questions.forEach((question) => {
        const answer = formData.get(`question_${question.id}`);

        if (answer) {
            const answerValue = question.type === 'scale'
                ? Number(answer)
                : String(answer);

            answers.push({
                questionId: question.id,
                answer: answerValue,
            });

            // Calculate score if mapping exists
            if (question.scoreMapping && typeof answerValue === 'string') {
                totalScore += question.scoreMapping[answerValue] || 0;
            } else if (question.type === 'scale' && typeof answerValue === 'number') {
                totalScore += answerValue;
            }
        }
    });

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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-8">
                        <Link
                            to="/quizzes"
                            className="text-indigo-600 hover:text-indigo-700 font-medium mb-4 inline-block"
                        >
                            ← Back to Quizzes
                        </Link>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            {quiz.title}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 text-lg">
                            {quiz.description}
                        </p>
                    </div>

                    {/* 
            LEARNING POINT: <Form> component
            - method="post" triggers the action function
            - No need for onSubmit handler or fetch
            - Progressive enhancement: works without JS
          */}
                    <Form method="post" className="space-y-8">
                        {quiz.questions.map((question, index) => (
                            <div
                                key={question.id}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
                            >
                                <label className="block mb-4">
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {index + 1}. {question.text}
                                    </span>

                                    {question.type === 'multiple-choice' && question.options && (
                                        <div className="mt-4 space-y-2">
                                            {question.options.map((option) => (
                                                <label
                                                    key={option}
                                                    className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                                                >
                                                    <input
                                                        type="radio"
                                                        name={`question_${question.id}`}
                                                        value={option}
                                                        required
                                                        className="mr-3"
                                                    />
                                                    <span className="text-gray-700 dark:text-gray-300">
                                                        {option}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {question.type === 'scale' && (
                                        <div className="mt-4">
                                            <input
                                                type="range"
                                                name={`question_${question.id}`}
                                                min={question.scaleMin || 1}
                                                max={question.scaleMax || 10}
                                                defaultValue={Math.floor(((question.scaleMin || 1) + (question.scaleMax || 10)) / 2)}
                                                required
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2">
                                                <span>{question.scaleMin || 1}</span>
                                                <span>{question.scaleMax || 10}</span>
                                            </div>
                                        </div>
                                    )}

                                    {question.type === 'text' && (
                                        <textarea
                                            name={`question_${question.id}`}
                                            required
                                            rows={4}
                                            className="mt-4 w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="Type your answer here..."
                                        />
                                    )}
                                </label>
                            </div>
                        ))}

                        <button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg transition-colors"
                        >
                            Submit Quiz
                        </button>
                    </Form>
                </div>
            </div>
        </div>
    );
}
