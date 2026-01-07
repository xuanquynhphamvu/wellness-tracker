import type { Route } from "./+types/auth.register";
import { Form, redirect, Link } from "react-router";
import { createUser } from "~/lib/auth.server";
import { createUserSession, getUserId } from "~/lib/session.server";

/**
 * Register Route
 * 
 * EXECUTION FLOW:
 * 1. LOADER checks if already logged in → redirect to home
 * 2. COMPONENT renders registration form
 * 3. User submits form
 * 4. ACTION validates input and creates user
 * 5. Create session and redirect
 */

export async function loader({ request }: Route.LoaderArgs) {
    // If already logged in, redirect to home
    const userId = await getUserId(request);
    if (userId) {
        return redirect('/');
    }

    return {};
}

export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();
    const email = String(formData.get('email'));
    const password = String(formData.get('password'));
    const confirmPassword = String(formData.get('confirmPassword'));

    // Validate input
    const errors: {
        email?: string;
        password?: string;
        confirmPassword?: string;
        form?: string;
    } = {};

    if (!email || !email.includes('@')) {
        errors.email = 'Valid email is required';
    }

    if (!password || password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
        return { errors };
    }

    // Create user
    try {
        const user = await createUser(email, password, 'user');

        // Create session and redirect
        return createUserSession(user._id!.toString(), '/');
    } catch (error) {
        return {
            errors: {
                form: error instanceof Error ? error.message : 'Failed to create account',
            },
        };
    }
}

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Sign Up - Wellness Tracker" },
    ];
}

export default function Register({ actionData }: Route.ComponentProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Create Account
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                        Start tracking your wellness journey today
                    </p>

                    <Form method="post" className="space-y-6">
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
                                autoComplete="new-password"
                                required
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            />
                            {actionData?.errors?.password && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {actionData.errors.password}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            />
                            {actionData?.errors?.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {actionData.errors.confirmPassword}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow transition-colors"
                        >
                            Create Account
                        </button>
                    </Form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600 dark:text-gray-400">
                            Already have an account?{' '}
                            <Link
                                to="/auth/login"
                                className="text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                                Log in
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
