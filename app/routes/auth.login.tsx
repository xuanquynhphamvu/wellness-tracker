import type { Route } from "./+types/auth.login";
import { Form, redirect, Link } from "react-router";
import { verifyLogin } from "~/lib/auth.server";
import { createUserSession, getUserId } from "~/lib/session.server";

/**
 * Login Route
 * 
 * EXECUTION FLOW:
 * 1. LOADER checks if already logged in → redirect to home
 * 2. COMPONENT renders login form
 * 3. User submits form
 * 4. ACTION verifies credentials
 * 5. If valid → create session and redirect
 * 6. If invalid → return errors
 */

export async function loader({ request }: Route.LoaderArgs) {
    // If already logged in, redirect to home
    const userId = await getUserId(request);
    if (userId) {
        return redirect('/');
    }

    // Get redirectTo from URL params (where to go after login)
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get('redirectTo') || '/';

    return { redirectTo };
}

export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();
    const email = String(formData.get('email'));
    const password = String(formData.get('password'));
    const redirectTo = String(formData.get('redirectTo') || '/');

    // Validate input
    const errors: { email?: string; password?: string; form?: string } = {};

    if (!email || !email.includes('@')) {
        errors.email = 'Valid email is required';
    }

    if (!password || password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(errors).length > 0) {
        return { errors };
    }

    // Verify credentials
    const user = await verifyLogin(email, password);

    if (!user) {
        return {
            errors: {
                form: 'Invalid email or password',
            },
        };
    }

    // Create session and redirect
    return createUserSession(user._id!.toString(), redirectTo);
}

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Login - Wellness Tracker" },
    ];
}

export default function Login({ loaderData, actionData }: Route.ComponentProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                        Log in to track your wellness journey
                    </p>

                    <Form method="post" className="space-y-6">
                        <input
                            type="hidden"
                            name="redirectTo"
                            value={loaderData.redirectTo}
                        />

                        {actionData?.errors?.form && (
                            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
                                <p className="text-red-800 dark:text-red-300">
                                    {actionData.errors.form}
                                </p>
                            </div>
                        )}

                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            />
                            {actionData?.errors?.email && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {actionData.errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            />
                            {actionData?.errors?.password && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {actionData.errors.password}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow transition-colors"
                        >
                            Log In
                        </button>
                    </Form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600 dark:text-gray-400">
                            Don't have an account?{' '}
                            <Link
                                to="/auth/register"
                                className="text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                                Sign up
                            </Link>
                        </p>
                    </div>

                    <div className="mt-4 text-center">
                        <Link
                            to="/"
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm"
                        >
                            ← Back to home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
