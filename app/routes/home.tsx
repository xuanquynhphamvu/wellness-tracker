import type { Route } from "./+types/home";
import { Link, Form } from "react-router";
import { getUser } from "~/lib/session.server";
import { Button } from "~/components/Button";

/**
 * Homepage Route
 * 
 * EXECUTION FLOW:
 * 1. LOADER checks if user is authenticated
 * 2. Component renders with conditional auth UI
 * 
 * LEARNING POINTS:
 * - Loaders can fetch user session data
 * - Conditional rendering based on authentication state
 * - Form component for logout action
 */

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  return { user };
}

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Wellness Tracker - Mental Health Quiz App" },
    { name: "description", content: "Track your mental wellness with evidence-based tests" },
  ];
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;
  return (
    <div className="min-h-screen">
      {/* Header with Auth Links */}
      <header className="container mx-auto px-6 py-8">
        <div className="flex justify-end items-center gap-4">
          {user ? (
            // Authenticated user
            <>
              {user.role === 'admin' && (
                <Button to="/admin/quizzes" variant="ghost" size="sm">
                  Admin Panel
                </Button>
              )}
              <span className="text-warm-gray-600 font-medium tracking-wide">
                {user.email}
              </span>
              <Form method="post" action="/auth/logout">
                <Button type="submit" variant="ghost" size="sm" className="text-warm-gray-500 hover:text-orange-500">
                  Log Out
                </Button>
              </Form>
            </>
          ) : (
            // Guest user
            <>
              <Button to="/auth/login" variant="ghost">
                Log In
              </Button>
              <Button to="/auth/register" variant="primary">
                Sign Up
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 lg:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-warm-gray-900 mb-8 tracking-tight leading-tight">
            You're in a safe space. <br className="hidden md:block" />
            <span className="text-sage-600">Take your time.</span>
          </h1>

          <p className="text-xl md:text-2xl text-warm-gray-600 mb-12 leading-relaxed max-w-2xl mx-auto font-light">
            Explore your mental wellness with evidence-based tests. <br /> No judgment, just understanding.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-24">
            <Button to="/quizzes" size="lg" className="w-full sm:w-auto min-w-[200px]">
              Browse Tests
            </Button>

            <Button to="/progress" variant="outline" size="lg" className="w-full sm:w-auto min-w-[200px]">
              View Progress
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="bg-white/50 dark:bg-warm-gray-800/50 p-8 rounded-3xl border border-warm-gray-100 dark:border-warm-gray-800 backdrop-blur-sm">
              <div className="text-4xl font-bold text-sage-400 mb-4 opacity-50">01</div>
              <h3 className="text-xl font-semibold text-warm-gray-900 mb-3">
                Choose gently
              </h3>
              <p className="text-warm-gray-600 leading-relaxed">
                Select a test that resonates with how you're feeling right now.
              </p>
            </div>

            <div className="bg-white/50 dark:bg-warm-gray-800/50 p-8 rounded-3xl border border-warm-gray-100 dark:border-warm-gray-800 backdrop-blur-sm">
              <div className="text-4xl font-bold text-sage-400 mb-4 opacity-50">02</div>
              <h3 className="text-xl font-semibold text-warm-gray-900 mb-3">
                Answer freely
              </h3>
              <p className="text-warm-gray-600 leading-relaxed">
                Reflect on your experiences in a quiet, unhurried environment.
              </p>
            </div>

            <div className="bg-white/50 dark:bg-warm-gray-800/50 p-8 rounded-3xl border border-warm-gray-100 dark:border-warm-gray-800 backdrop-blur-sm">
              <div className="text-4xl font-bold text-sage-400 mb-4 opacity-50">03</div>
              <h3 className="text-xl font-semibold text-warm-gray-900 mb-3">
                See patterns
              </h3>
              <p className="text-warm-gray-600 leading-relaxed">
                Gain insights into your wellness journey with soft, supportive visuals.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
