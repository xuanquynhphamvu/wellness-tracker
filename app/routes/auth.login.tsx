import type { Route } from "./+types/auth.login";
import { Form, redirect, Link, useNavigation } from "react-router";
import { verifyLogin } from "~/lib/auth.server";
import { createUserSession, getUserId } from "~/lib/session.server";
import { Button } from "~/components/Button";
import { Card } from "~/components/Card";

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
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-warm-gray-900 mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-warm-gray-600">
                        Log in to continue your journey
                    </p>
                </div>

                <Card className="p-8">
                    <Form method="post" className="space-y-6">
                        <input
                            type="hidden"
                            name="redirectTo"
                            value={loaderData.redirectTo}
                        />

                        {actionData?.errors?.form && (
                            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                                <p className="text-orange-800 text-sm">
                                    {actionData.errors.form}
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
                                    {actionData.errors.email}
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
                                autoComplete="current-password"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-warm-gray-200 bg-warm-gray-50 text-warm-gray-900 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all outline-none"
                                placeholder="••••••••"
                            />
                            {actionData?.errors?.password && (
                                <p className="mt-1 text-sm text-orange-600">
                                    {actionData.errors.password}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full justify-center"
                            size="lg"
                        >
                            {isSubmitting ? "Logging in..." : "Log In"}
                        </Button>
                    </Form>
                </Card>

                <div className="mt-8 text-center space-y-4">
                    <p className="text-warm-gray-600">
                        Don't have an account?{' '}
                        <Link
                            to="/auth/register"
                            className="text-sage-600 hover:text-sage-700 font-semibold transition-colors"
                        >
                            Sign up
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
