
import { describe, it, expect } from 'vitest';
import { serializeUser, type User } from './user';
import { ObjectId } from 'mongodb';

describe('serializeUser', () => {
    it('should serialize user and remove sensitive data', () => {
        const date = new Date();
        const user: User = {
            _id: new ObjectId('507f1f77bcf86cd799439011'),
            email: 'test@example.com',
            passwordHash: 'secret',
            role: 'user',
            createdAt: date,
            updatedAt: date
        };

        const serialized = serializeUser(user);

        expect(serialized._id).toBe('507f1f77bcf86cd799439011');
        expect(serialized.email).toBe('test@example.com');
        expect(serialized.role).toBe('user');
        expect(serialized.createdAt).toBe(date.toISOString());
        // @ts-ignore
        expect(serialized.passwordHash).toBeUndefined();
    });
});
