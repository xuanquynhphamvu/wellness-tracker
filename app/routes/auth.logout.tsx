import type { Route } from "./+types/auth.logout";
import { logout } from "~/lib/session.server";

/**
 * Logout Route
 * 
 * EXECUTION FLOW:
 * 1. ACTION destroys session
 * 2. Redirect to home
 * 
 * NOTE: This is an action-only route (no component)
 */

export async function action({ request }: Route.ActionArgs) {
    return logout(request, '/');
}

export async function loader({ request }: Route.LoaderArgs) {
    // If someone navigates to /auth/logout directly, log them out
    return logout(request, '/');
}
