
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCookieSessionStorage, redirect } from 'react-router';
import { getUserId, createUserSession, logout, getUser } from './session.server';


// Define mocks using vi.hoisted
const { mockSession, mockStorage } = vi.hoisted(() => ({
    mockSession: {
        get: vi.fn(),
        set: vi.fn(),
        destroy: vi.fn(),
    },
    mockStorage: {
        getSession: vi.fn(),
        commitSession: vi.fn(),
        destroySession: vi.fn(),
    },
}));

// Mock react-router
vi.mock('react-router', () => ({
    createCookieSessionStorage: vi.fn(() => mockStorage),
    redirect: vi.fn((url, init) => ({ url, init })),
}));

// Mock auth.server (handled dynamically in getUser test or mocked here)
// Using vi.mock to mock dynamic import in getUser if needed, 
// but since getUser uses dynamic import, we might need a different approach 
// or just mock the dependencies that getUser calls.
// Let's rely on standard mocks for now.

describe('session.server', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset default mock implementations
        mockStorage.getSession.mockResolvedValue(mockSession);
        mockStorage.commitSession.mockResolvedValue('set-cookie-string');
        mockStorage.destroySession.mockResolvedValue('destroyed-cookie-string');
        mockSession.get.mockReturnValue(null);
    });

    describe('getUserId', () => {
        it('should return userId from session', async () => {
            mockSession.get.mockReturnValue('123');
            const request = new Request('http://localhost', {
                headers: { Cookie: '__session=123' }
            });

            const userId = await getUserId(request);
            expect(userId).toBe('123');
            expect(mockStorage.getSession).toHaveBeenCalled();
        });

        it('should return null if no userId', async () => {
            mockSession.get.mockReturnValue(undefined);
            const request = new Request('http://localhost');

            const userId = await getUserId(request);
            expect(userId).toBeNull();
        });
    });

    describe('createUserSession', () => {
        it('should create session and redirect', async () => {
            const response = await createUserSession('123', '/dashboard');

            expect(mockStorage.getSession).toHaveBeenCalled();
            expect(mockSession.set).toHaveBeenCalledWith('userId', '123');
            expect(mockStorage.commitSession).toHaveBeenCalled();
            // @ts-ignore
            expect(response.init.headers['Set-Cookie']).toBeDefined();
        });
    });

    describe('logout', () => {
        it('should destroy session and redirect', async () => {
            const request = new Request('http://localhost');
            const response = await logout(request);

            expect(mockStorage.getSession).toHaveBeenCalled();
            expect(mockStorage.destroySession).toHaveBeenCalled();
            // @ts-ignore
            expect(response.init.headers['Set-Cookie']).toBeDefined();
        });
    });
});
