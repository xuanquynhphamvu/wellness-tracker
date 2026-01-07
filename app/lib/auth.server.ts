import bcrypt from 'bcrypt';
import { redirect } from 'react-router';
import { getCollection, ObjectId } from './db.server';
import type { User, SerializedUser } from '~/types/user';
import { serializeUser } from '~/types/user';
import { getUserId } from './session.server';

/**
 * Authentication Helpers
 * 
 * EXECUTION CONTEXT: SERVER ONLY (.server.ts suffix)
 * - Password hashing and verification
 * - User authentication
 * - Route protection
 * 
 * SECURITY NOTES:
 * - Passwords are hashed with bcrypt (10 rounds)
 * - Never store plain-text passwords
 * - Never send passwordHash to client
 */

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 * 
 * @param password - Plain-text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 * 
 * @param password - Plain-text password
 * @param hash - Hashed password from database
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Get user by email
 * 
 * @param email - User email
 * @returns User or null if not found
 */
export async function getUserByEmail(email: string): Promise<User | null> {
    const users = await getCollection<User>('users');
    return users.findOne({ email: email.toLowerCase() });
}

/**
 * Get user by ID
 * 
 * @param userId - User ID
 * @returns User or null if not found
 */
export async function getUserById(userId: string): Promise<User | null> {
    const users = await getCollection<User>('users');
    return users.findOne({ _id: new ObjectId(userId) });
}

/**
 * Create a new user
 * 
 * @param email - User email
 * @param password - Plain-text password (will be hashed)
 * @param role - User role (default: 'user')
 * @returns Created user
 */
export async function createUser(
    email: string,
    password: string,
    role: 'user' | 'admin' = 'user'
): Promise<User> {
    const users = await getCollection<User>('users');

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
        throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user: Omit<User, '_id'> = {
        email: email.toLowerCase(),
        passwordHash,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const result = await users.insertOne(user as User);

    return {
        ...user,
        _id: result.insertedId,
    } as User;
}

/**
 * Verify user credentials
 * 
 * @param email - User email
 * @param password - Plain-text password
 * @returns User if credentials are valid, null otherwise
 */
export async function verifyLogin(email: string, password: string): Promise<User | null> {
    const user = await getUserByEmail(email);

    if (!user) {
        return null;
    }

    const isValid = await verifyPassword(password, user.passwordHash);

    return isValid ? user : null;
}

/**
 * Get optional user from request
 * Returns null if not logged in (doesn't redirect)
 * 
 * @param request - Request object
 * @returns Serialized user or null
 */
export async function getOptionalUser(request: Request): Promise<SerializedUser | null> {
    const userId = await getUserId(request);

    if (!userId) {
        return null;
    }

    const user = await getUserById(userId);

    if (!user) {
        return null;
    }

    return serializeUser(user);
}

/**
 * Require authenticated user
 * Redirects to login if not authenticated
 * 
 * @param request - Request object
 * @param redirectTo - Path to redirect to after login (default: current path)
 * @returns Serialized user
 */
export async function requireUser(
    request: Request,
    redirectTo?: string
): Promise<SerializedUser> {
    const userId = await getUserId(request);

    if (!userId) {
        const url = new URL(request.url);
        const searchParams = new URLSearchParams([
            ['redirectTo', redirectTo || url.pathname],
        ]);
        throw redirect(`/auth/login?${searchParams}`);
    }

    const user = await getUserById(userId);

    if (!user) {
        throw redirect('/auth/login');
    }

    return serializeUser(user);
}

/**
 * Require admin user
 * Redirects to login if not authenticated
 * Throws 403 if not admin
 * 
 * @param request - Request object
 * @returns Serialized user (guaranteed to be admin)
 */
export async function requireAdmin(request: Request): Promise<SerializedUser> {
    const user = await requireUser(request);

    if (user.role !== 'admin') {
        throw new Response('Forbidden: Admin access required', { status: 403 });
    }

    return user;
}
