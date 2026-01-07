import { createCookieSessionStorage, redirect } from "react-router";

/**
 * Session Management
 * 
 * EXECUTION CONTEXT: SERVER ONLY (.server.ts suffix)
 * - Manages user sessions using encrypted cookies
 * - Stores only user ID in session (not full user object)
 * - Session data is encrypted and signed
 * 
 * WHY COOKIES?
 * - Automatic with every request (no manual headers)
 * - Secure (httpOnly, sameSite, secure flags)
 * - Works with progressive enhancement
 */

// Session secret from environment variable
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
    throw new Error(
        'SESSION_SECRET environment variable is not set. ' +
        'Add SESSION_SECRET=your-secret-key to your .env file'
    );
}

// Create session storage
const { getSession, commitSession, destroySession } = createCookieSessionStorage({
    cookie: {
        name: '__session',
        httpOnly: true,  // Prevents JavaScript access (XSS protection)
        maxAge: 60 * 60 * 24 * 7,  // 7 days
        path: '/',
        sameSite: 'lax',  // CSRF protection
        secrets: [sessionSecret],
        secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
    },
});

/**
 * Get user ID from session
 * 
 * @param request - Request object
 * @returns User ID or null if not logged in
 */
export async function getUserId(request: Request): Promise<string | null> {
    const session = await getSession(request.headers.get('Cookie'));
    const userId = session.get('userId');
    return userId || null;
}

/**
 * Create a new session for a user
 * 
 * @param userId - User ID to store in session
 * @param redirectTo - Path to redirect to after login
 * @returns Response with Set-Cookie header
 */
export async function createUserSession(
    userId: string,
    redirectTo: string
): Promise<Response> {
    const session = await getSession();
    session.set('userId', userId);

    return redirect(redirectTo, {
        headers: {
            'Set-Cookie': await commitSession(session),
        },
    });
}

/**
 * Destroy user session (logout)
 * 
 * @param request - Request object
 * @param redirectTo - Path to redirect to after logout
 * @returns Response with cleared cookie
 */
export async function logout(request: Request, redirectTo: string = '/'): Promise<Response> {
    const session = await getSession(request.headers.get('Cookie'));

    return redirect(redirectTo, {
        headers: {
            'Set-Cookie': await destroySession(session),
        },
    });
}

/**
 * Get full user object from session
 * 
 * @param request - Request object
 * @returns Serialized user object or null if not logged in
 */
export async function getUser(request: Request) {
    const userId = await getUserId(request);
    if (!userId) return null;

    const { getUserById } = await import('./auth.server');
    const { serializeUser } = await import('~/types/user');

    const user = await getUserById(userId);
    if (!user) return null;

    return serializeUser(user);
}

export { getSession, commitSession, destroySession };
