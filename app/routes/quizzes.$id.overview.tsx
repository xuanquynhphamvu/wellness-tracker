import React from "react";
import { Link, isRouteErrorResponse, useRouteError, useLoaderData } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { getCollection, ObjectId } from "~/lib/db.server";
import type { Quiz, SerializedQuiz, OverviewSection } from "~/types/quiz";
import { requireUser } from "~/lib/auth.server";
import { Button } from "~/components/Button";

/**
 * Quiz Overview/Info Page Route
 * 
 * Displays informational content about the quiz before users start taking it.
 * Admins configure this content via the OverviewSectionEditor.
 */

export async function loader({ request, params }: LoaderFunctionArgs) {
    // PROTECTED ROUTE: Require authentication
    await requireUser(request);

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
        slug: quiz.slug || '',
        description: quiz.description,
        questions: quiz.questions,
        isPublished: quiz.isPublished,
        createdAt: quiz.createdAt.toISOString(),
        updatedAt: quiz.updatedAt.toISOString(),
        baseTestName: quiz.baseTestName,
        shortName: quiz.shortName,
        instructions: quiz.instructions,
        overview: quiz.overview,
    };

    return { quiz: serialized };
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
    return [
        { title: `${data?.quiz.title || 'Quiz'} - Overview - Wellness Tracker` },
    ];
};

export default function QuizOverview() {
    const { quiz } = useLoaderData<typeof loader>();
    
    // Filter and sort visible sections
    const visibleSections: OverviewSection[] = quiz.overview?.sections
        ?.filter((section: OverviewSection) => section.visible)
        ?.sort((a: OverviewSection, b: OverviewSection) => a.order - b.order) || [];

    return (
        <div className="min-h-screen bg-gradient-to-b from-warm-white to-sage-50/30 transition-colors duration-500">
            <div className="container mx-auto px-6 py-8 md:py-12">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="mb-12">
                        <Link
                            to="/quizzes"
                            className="inline-flex items-center text-warm-gray-500 hover:text-warm-gray-800 transition-colors text-sm font-medium mb-6"
                        >
                            ← Back to Tests
                        </Link>
                        
                        <div className="mb-6">
                            {quiz.shortName && (
                                <span className="inline-block px-3 py-1 bg-sage-100 text-sage-700 rounded-full text-sm font-medium mb-3">
                                    {quiz.shortName}
                                </span>
                            )}
                            <h1 className="text-4xl md:text-5xl font-bold text-warm-gray-900 mb-4 leading-tight">
                                {quiz.title}
                            </h1>
                            {quiz.baseTestName && (
                                <p className="text-lg text-warm-gray-600 mb-2">
                                    {quiz.baseTestName}
                                </p>
                            )}
                            <p className="text-lg text-warm-gray-700 leading-relaxed">
                                {quiz.description}
                            </p>
                        </div>
                    </div>

                    {/* Overview Sections */}
                    {visibleSections.length > 0 ? (
                        <div className="space-y-6 mb-12">
                            {visibleSections.map((section: OverviewSection) => (
                                <div
                                    key={section.id}
                                    className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-sm border border-warm-gray-100/50 hover:shadow-md transition-all duration-300"
                                >
                                    <h2 className="text-xl font-semibold text-warm-gray-900 mb-4 flex items-center gap-2">
                                        <span className="w-1.5 h-6 bg-sage-500 rounded-full"></span>
                                        {section.title}
                                    </h2>
                                    <div className="text-warm-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {section.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white/60 p-12 rounded-3xl text-center mb-12">
                            <p className="text-warm-gray-500 text-lg">
                                No additional information available for this test.
                            </p>
                        </div>
                    )}

                    {/* CTA Section */}
                    <div className="bg-gradient-to-br from-sage-500 to-sage-600 p-8 md:p-10 rounded-3xl shadow-lg text-center">
                        <h3 className="text-2xl font-bold text-white mb-3">
                            Ready to Begin?
                        </h3>
                        <p className="text-sage-50 mb-6 text-lg">
                            Take your time and answer honestly for the most accurate results.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to={`/quizzes/${quiz._id}`}
                                className="inline-flex items-center justify-center bg-white text-sage-700 font-semibold text-lg px-8 py-4 rounded-full shadow-lg hover:bg-warm-white hover:scale-105 active:scale-95 transition-all duration-300"
                            >
                                Start Test →
                            </Link>
                            <Link
                                to="/quizzes"
                                className="inline-flex items-center justify-center bg-sage-700/30 text-white font-medium text-lg px-8 py-4 rounded-full hover:bg-sage-700/50 transition-all duration-300"
                            >
                                View All Tests
                            </Link>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-warm-gray-500">
                            This assessment is for informational purposes only and does not constitute medical advice.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ErrorBoundary() {
    const error = useRouteError();

    if (isRouteErrorResponse(error)) {
        return (
            <div className="min-h-screen bg-warm-white flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center">
                    <h1 className="text-6xl font-bold text-orange-600 mb-4">
                        {error.status}
                    </h1>
                    <h2 className="text-2xl font-bold text-warm-gray-900 mb-4">
                        {error.statusText}
                    </h2>
                    <p className="text-warm-gray-600 mb-8">
                        {error.data}
                    </p>
                    <Button to="/quizzes" variant="primary" size="lg">
                        Back to Tests
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-warm-white flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <h1 className="text-6xl font-bold text-orange-600 mb-4">
                    Error
                </h1>
                <h2 className="text-2xl font-bold text-warm-gray-900 mb-4">
                    Something went wrong
                </h2>
                <p className="text-warm-gray-600 mb-8">
                    We encountered an unexpected error. Please try again.
                </p>
                <Button to="/quizzes" variant="primary" size="lg">
                    Back to Tests
                </Button>
            </div>
        </div>
    );
}
