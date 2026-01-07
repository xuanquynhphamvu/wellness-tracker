import { Outlet, Link } from "react-router";
import type { Route } from "./+types/admin";
import { requireAdmin } from "~/lib/auth.server";

/**
 * Admin Layout
 * 
 * EXECUTION FLOW:
 * - This is a layout route (wraps child routes)
 * - All /admin/* routes will render inside <Outlet />
 * 
 * LEARNING POINTS:
 * - Layout routes provide shared UI (nav, sidebar, etc.)
 * - <Outlet /> renders the matched child route
 * - Loader protects ALL child routes (runs before children)
 */

/**
 * PROTECTED ROUTE: Require admin role
 * This loader runs for ALL /admin/* routes
 */
export async function loader({ request }: Route.LoaderArgs) {
    await requireAdmin(request);
    return {};
}

export default function AdminLayout() {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <nav className="bg-white dark:bg-gray-800 shadow-lg">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-8">
                            <Link
                                to="/admin/quizzes"
                                className="text-xl font-bold text-indigo-600"
                            >
                                Admin Panel
                            </Link>

                            <Link
                                to="/admin/quizzes"
                                className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 font-medium"
                            >
                                Quizzes
                            </Link>
                        </div>

                        <Link
                            to="/"
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                            ← Back to Site
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-8">
                {/* Child routes render here */}
                <Outlet />
            </main>
        </div>
    );
}
