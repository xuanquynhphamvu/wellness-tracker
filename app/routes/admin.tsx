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
        <div className="min-h-screen bg-warm-white dark:bg-warm-gray-900">
            <nav className="bg-white/80 dark:bg-warm-gray-800/80 backdrop-blur-md shadow-sm border-b border-warm-gray-100 dark:border-warm-gray-700 sticky top-0 z-50">
                <div className="container mx-auto px-6">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-8">
                            <Link
                                to="/admin/quizzes"
                                className="text-xl font-bold text-sage-600 dark:text-sage-400"
                            >
                                Admin Panel
                            </Link>

                            <Link
                                to="/admin/quizzes"
                                className="text-warm-gray-600 dark:text-warm-gray-300 hover:text-sage-600 dark:hover:text-sage-400 font-medium transition-colors"
                            >
                                Quizzes
                            </Link>
                        </div>

                        <Link
                            to="/"
                            className="text-warm-gray-500 dark:text-warm-gray-400 hover:text-warm-gray-900 dark:hover:text-white transition-colors text-sm font-medium"
                        >
                            ← Back to Site
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-6 py-12">
                {/* Child routes render here */}
                <Outlet />
            </main>
        </div>
    );
}
