import { ObjectId } from 'mongodb';

/**
 * User Type Definitions
 * 
 * EXECUTION CONTEXT: BOTH server and client
 * - Used in loaders (server) and components (client)
 * - No runtime code, just TypeScript types
 */

export interface User {
    _id?: ObjectId;
    email: string;
    passwordHash: string;
    role: 'user' | 'admin';
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Serialized User (for client-side use)
 * MongoDB ObjectId and Date objects need to be serialized for JSON transport
 * 
 * IMPORTANT: Never send passwordHash to client!
 */
export interface SerializedUser {
    _id: string;
    email: string;
    role: 'user' | 'admin';
    createdAt: string;
    updatedAt: string;
    // Note: passwordHash is intentionally excluded
}

/**
 * Helper to serialize a user for client transport
 * Removes sensitive data (passwordHash)
 */
export function serializeUser(user: User): SerializedUser {
    return {
        _id: user._id?.toString() || '',
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
    };
}
