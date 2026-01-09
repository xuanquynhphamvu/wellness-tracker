
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    hashPassword,
    verifyPassword,
    createUser,
    verifyLogin,
    getUserByEmail,
    requireUser
} from './auth.server';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import { getUserId } from './session.server';

// Define mocks using vi.hoisted so they can be accessed inside vi.mock factory
const hoistedMocks = vi.hoisted(() => ({
    mockFindOne: vi.fn(),
    mockInsertOne: vi.fn(),
    mockCompare: vi.fn(),
    mockGetUserId: vi.fn(),
}));

const { mockFindOne, mockInsertOne, mockCompare, mockGetUserId } = hoistedMocks;

// Mock bcrypt to avoid native bindings issues and speed up tests
vi.mock('bcrypt', () => ({
    default: {
        hash: vi.fn().mockResolvedValue('hashed_password'),
        compare: vi.fn().mockImplementation((pass, hash) => Promise.resolve(pass === 'password' && hash === 'hashed_password')),
    }
}));

// Mock db.server
vi.mock('./db.server', () => ({
    getCollection: vi.fn().mockResolvedValue({
        findOne: hoistedMocks.mockFindOne,
        insertOne: hoistedMocks.mockInsertOne,
    }),
    ObjectId: vi.fn(),
}));

// Mock session.server
vi.mock('./session.server', () => ({
    getUserId: hoistedMocks.mockGetUserId,
}));

describe('auth.server', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('hashPassword', () => {
        it('should hash password', async () => {
            const hash = await hashPassword('password');
            expect(hash).toBe('hashed_password');
        });
    });

    describe('verifyPassword', () => {
        it('should return true for matching password', async () => {
            const isValid = await verifyPassword('password', 'hashed_password');
            expect(isValid).toBe(true);
        });

        it('should return false for non-matching password', async () => {
            const isValid = await verifyPassword('wrong', 'hashed_password');
            expect(isValid).toBe(false);
        });
    });

    describe('getUserByEmail', () => {
        it('should return user if found', async () => {
            const mockUser = { email: 'test@example.com' };
            mockFindOne.mockResolvedValue(mockUser);

            const user = await getUserByEmail('test@example.com');
            expect(user).toEqual(mockUser);
            expect(mockFindOne).toHaveBeenCalledWith({ email: 'test@example.com' });
        });

        it('should return null if not found', async () => {
            mockFindOne.mockResolvedValue(null);
            const user = await getUserByEmail('test@example.com');
            expect(user).toBeNull();
        });
    });

    describe('createUser', () => {
        it('should create a new user', async () => {
            // Mock user not existing
            mockFindOne.mockResolvedValueOnce(null);

            // Mock insertion
            mockInsertOne.mockResolvedValue({ insertedId: 'new_id' });

            const user = await createUser('new@example.com', 'password');

            expect(user.email).toBe('new@example.com');
            expect(user.passwordHash).toBe('hashed_password');
            expect(user.role).toBe('user');
            expect(mockInsertOne).toHaveBeenCalled();
        });

        it('should throw error if user exists', async () => {
            mockFindOne.mockResolvedValueOnce({ email: 'existing@example.com' });

            await expect(createUser('existing@example.com', 'password'))
                .rejects.toThrow('User with this email already exists');
        });
    });

    describe('verifyLogin', () => {
        it('should verify correct password', async () => {
            // Mock user
            mockFindOne.mockResolvedValueOnce({
                _id: new ObjectId(),
                email: 'test@example.com',
                passwordHash: 'hashed_password'
            });

            // Mock verify
            mockCompare.mockResolvedValueOnce(true);

            const user = await verifyLogin('test@example.com', 'password');
            expect(user).not.toBeNull();
        });

        it('should fail with incorrect password', async () => {
            // Mock user
            mockFindOne.mockResolvedValueOnce({
                _id: new ObjectId(),
                email: 'test@example.com',
                passwordHash: 'hashed_password'
            });

            // Mock verify fail
            mockCompare.mockResolvedValueOnce(false);

            const user = await verifyLogin('test@example.com', 'wrong');
            expect(user).toBeNull();
        });
        it('should return null if user not found', async () => {
            mockFindOne.mockResolvedValue(null);
            const user = await verifyLogin('test@example.com', 'password');
            expect(user).toBeNull();
        });
    });

    describe('requireUser', () => {
        it('should return user if logged in', async () => {
            // Mock getUserId to return an ID
            mockGetUserId.mockResolvedValue('user_id');
            // Mock getUserById
            mockFindOne.mockResolvedValue({
                _id: 'user_id',
                role: 'user',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const request = new Request('http://localhost/protected');
            const user = await requireUser(request);
            expect(user).toBeDefined();
        });

        it('should redirect if not logged in', async () => {
            mockGetUserId.mockResolvedValue(null);

            const request = new Request('http://localhost/protected');
            try {
                await requireUser(request);
                expect(true).toBe(false); // Should throw
            } catch (response: any) {
                expect(response.status).toBe(302);
            }
        });
    });
});
