import type { Route } from "./+types/auth.register";
import { Form, redirect, Link, useNavigation } from "react-router";
import { createUser } from "~/lib/auth.server";
import { createUserSession, getUserId } from "~/lib/session.server";
import { Button } from "~/components/Button";
import { Card } from "~/components/Card";

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
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-warm-gray-900 mb-2">
                        Create Account
                    </h1>
                    <p className="text-warm-gray-600">
                        Start your journey to wellness
                    </p>
                </div>

                <Card className="p-8">
                    <Form method="post" className="space-y-6">
                        {actionData?.errors?.form && (
                            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                                <p className="text-orange-800 text-sm">
                                    {actionData?.errors?.form}
                                </p>
                            </div>
                        )}

                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-semibold text-warm-gray-700 mb-2"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-warm-gray-200 bg-warm-gray-50 text-warm-gray-900 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all outline-none"
                                placeholder="you@example.com"
                            />
                            {actionData?.errors?.email && (
                                <p className="mt-1 text-sm text-orange-600">
                                    {actionData?.errors?.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-semibold text-warm-gray-700 mb-2"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-warm-gray-200 bg-warm-gray-50 text-warm-gray-900 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all outline-none"
                                placeholder="••••••••"
                            />
                            {actionData?.errors?.password && (
                                <p className="mt-1 text-sm text-orange-600">
                                    {actionData?.errors?.password}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block text-sm font-semibold text-warm-gray-700 mb-2"
                            >
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-warm-gray-200 bg-warm-gray-50 text-warm-gray-900 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all outline-none"
                                placeholder="••••••••"
                            />
                            {actionData?.errors?.confirmPassword && (
                                <p className="mt-1 text-sm text-orange-600">
                                    {actionData?.errors?.confirmPassword}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full justify-center"
                            size="lg"
                        >
                            {isSubmitting ? "Creating Account..." : "Create Account"}
                        </Button>
                    </Form>
                </Card>

                <div className="mt-8 text-center space-y-4">
                    <p className="text-warm-gray-600">
                        Already have an account?{' '}
                        <Link
                            to="/auth/login"
                            className="text-sage-600 hover:text-sage-700 font-semibold transition-colors"
                        >
                            Log in
                        </Link>
                    </p>
                    <Link
                        to="/"
                        className="inline-block text-warm-gray-500 hover:text-warm-gray-700 text-sm transition-colors"
                    >
                        ← Back to home
                    </Link>
                </div>
            </div>
        </div>
    );
}
