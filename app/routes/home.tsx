import type { Route } from "./+types/home";
import { Link } from "react-router";

/**
 * Homepage Route
 * 
 * EXECUTION FLOW:
 * 1. No loader needed (static content)
 * 2. Component renders on server (SSR) and client (hydration)
 * 
 * LEARNING POINTS:
 * - Not every route needs a loader
 * - Use loaders only when you need to fetch data
 * - Links use React Router's <Link> for client-side navigation
 */

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Wellness Tracker - Mental Health Quiz App" },
    { name: "description", content: "Track your mental wellness with evidence-based quizzes" },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Welcome to Wellness Tracker
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
            Take evidence-based mental health quizzes and track your progress over time
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Link
              to="/quizzes"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg transition-colors"
            >
              Browse Quizzes
            </Link>

            <Link
              to="/progress"
              className="bg-white hover:bg-gray-50 text-indigo-600 font-semibold py-4 px-8 rounded-lg shadow-lg border-2 border-indigo-600 transition-colors"
            >
              View Progress
            </Link>
          </div>

          <div className="mt-16 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>

            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div>
                <div className="text-3xl font-bold text-indigo-600 mb-2">1</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Take a Quiz
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Choose from our evidence-based mental health assessments
                </p>
              </div>

              <div>
                <div className="text-3xl font-bold text-indigo-600 mb-2">2</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Get Results
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Receive your score and personalized insights
                </p>
              </div>

              <div>
                <div className="text-3xl font-bold text-indigo-600 mb-2">3</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Track Progress
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Monitor your mental wellness journey over time
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
