import { Link } from "react-router";

/**
 * 404 Not Found Route
 * 
 * Catch-all route for invalid URLs
 * Matches any path that doesn't match other routes
 */

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <div className="mb-8">
                    <h1 className="text-9xl font-bold text-indigo-600 dark:text-indigo-400">
                        404
                    </h1>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">
                        Page Not Found
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mt-4">
                        The page you're looking for doesn't exist or has been moved.
                    </p>
                </div>

                <div className="space-y-4">
                    <Link
                        to="/"
                        className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow transition-colors"
                    >
                        Go to Home
                    </Link>
                    <Link
                        to="/quizzes"
                        className="block w-full bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg shadow border border-gray-300 dark:border-gray-600 transition-colors"
                    >
                        Browse Quizzes
                    </Link>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-8">
                    If you believe this is a mistake, please contact support.
                </p>
            </div>
        </div>
    );
}

export function meta() {
    return [
        { title: "404 - Page Not Found - Wellness Tracker" },
        { name: "robots", content: "noindex" },
    ];
}
