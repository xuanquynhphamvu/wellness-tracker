import type { Route } from "./+types/admin.quizzes";
import { Link, Form } from "react-router";
import { getCollection, ObjectId } from "~/lib/db.server";
import type { Quiz, SerializedQuiz } from "~/types/quiz";
import { redirect } from "react-router";
import { requireAdmin } from "~/lib/auth.server";

/**
 * Admin Quiz Management Route
 * 
 * EXECUTION FLOW:
 * - LOADER: Fetch ALL quizzes (including unpublished)
 * - ACTION: Handle quiz deletion
 * - COMPONENT: Display admin quiz list with edit/delete
 * 
 * LEARNING POINTS:
 * - Actions can handle different intents (delete, publish, etc.)
 * - Use FormData to determine action intent
 * - Revalidation happens automatically after actions
 */

export async function loader({ }: Route.LoaderArgs) {
    const quizzes = await getCollection<Quiz>('quizzes');
    const allQuizzes = await quizzes
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

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

    return null;
}

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Manage Quizzes - Admin - Wellness Tracker" },
    ];
}

export default function AdminQuizzes({ loaderData }: Route.ComponentProps) {
    const { quizzes } = loaderData;

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Manage Quizzes
                </h1>
                <Link
                    to="/admin/quizzes/new"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition-colors"
                >
                    + Create Quiz
                </Link>
            </div>

            {quizzes.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        No quizzes created yet.
                    </p>
                    <Link
                        to="/admin/quizzes/new"
                        className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition-colors"
                    >
                        Create Your First Quiz
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {quizzes.map((quiz) => (
                        <div
                            key={quiz._id}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                            {quiz.title}
                                            {quiz.shortName && (
                                                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                                                    ({quiz.shortName})
                                                </span>
                                            )}
                                        </h2>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${quiz.isPublished
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                                                }`}
                                        >
                                            {quiz.isPublished ? 'Published' : 'Draft'}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                                        {quiz.description}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {quiz.questions.length} questions
                                    </p>
                                </div>

                                <div className="flex gap-2 ml-4">
                                    <Link
                                        to={`/admin/quizzes/${quiz._id}/edit`}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                                    >
                                        Edit
                                    </Link>

                                    <Form method="post">
                                        <input type="hidden" name="quizId" value={quiz._id} />
                                        <input type="hidden" name="intent" value="toggle-publish" />
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium transition-colors"
                                        >
                                            {quiz.isPublished ? 'Unpublish' : 'Publish'}
                                        </button>
                                    </Form>

                                    <Form method="post">
                                        <input type="hidden" name="quizId" value={quiz._id} />
                                        <input type="hidden" name="intent" value="delete" />
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors"
                                            onClick={(e) => {
                                                if (!confirm('Are you sure you want to delete this quiz?')) {
                                                    e.preventDefault();
                                                }
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </Form>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
