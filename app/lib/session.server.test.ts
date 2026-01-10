import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ObjectId } from 'mongodb';
import { getUserId, createUserSession, logout, getUser } from './session.server';
import type { User, SerializedUser } from '~/types/user';

// Define mocks using vi.hoisted
const { mockSession, mockStorage, mockAuthServer, mockUserTypes } = vi.hoisted(() => ({
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
    mockAuthServer: {
        getUserById: vi.fn(),
    },
    mockUserTypes: {
        serializeUser: vi.fn(),
    },
}));

// Mock react-router
vi.mock('react-router', () => ({
    createCookieSessionStorage: vi.fn(() => mockStorage),
    redirect: vi.fn((url, init) => {
        // Return a mock Response object that mimics what redirect returns
        // redirect in Remix/RR returns a Response object
        const headers = new Headers(init?.headers);
        return {
            status: 302,
            headers,
            url,
        };
    }),
}));

// Mock dynamic imports
vi.mock('./auth.server', () => mockAuthServer);
vi.mock('~/types/user', () => mockUserTypes);

describe('session.server', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset default mock implementations
        mockStorage.getSession.mockResolvedValue(mockSession);
        mockStorage.commitSession.mockResolvedValue('set-cookie-string');
        mockStorage.destroySession.mockResolvedValue('destroyed-cookie-string');
        mockSession.get.mockReturnValue(null);
        mockAuthServer.getUserById.mockResolvedValue(null);
        mockUserTypes.serializeUser.mockImplementation((u: User) => ({ ...u, _id: u._id?.toString() }));
    });

    describe('getUserId', () => {
        it('should return userId from session', async () => {
            mockSession.get.mockReturnValue('123');
            const request = new Request('http://localhost', {
                headers: { Cookie: '__session=123' }
            });

            const userId = await getUserId(request);
            expect(userId).toBe('123');
            expect(mockStorage.getSession).toHaveBeenCalledWith('__session=123');
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
            
            // Check that options passed to redirect include Set-Cookie
            expect(response.headers.get('Set-Cookie')).toBe('set-cookie-string');
            expect(response.status).toBe(302);
            // Verify path from Location header if using real redirect, but here checking mock internal or just return
            // Our mock redirect returns { url: ... } so we check that property if we are testing the return of generic redirect we mocked.
            // But wait, my manual mock returns { status, headers, url }. The actual redirect returns Response.
            // let's adjust the test to match what my mock returns.
            // My mock returns object with url property.
            // But TS complains about @ts-expect-error being unused, meaning it THINKS response has these properties?
            // "redirect" returns a Response in real life.
            // In my mock: `redirect: vi.fn((url, init) => { ... })`
            // If I annotated the return type of `redirect` in the mock or if TS infers it...
            // createUserSession returns Promise<Response>.
            // In the test `const response = await createUserSession(...)`
            // If I mocked redirect to return a POJO, then response IS that POJO at runtime, but TS thinks it is Response.
            // So @ts-expect-error MUST be used if I access properties not on Response, OR if I access existing properties but return type matches?
            // Response has headers. Response has status. Response does NOT have "url" property (it does, read-only).
            
            // If TS complained about UNUSED @ts-expect-error, it means TS thinks the access is VALID.
            // response.headers.get IS valid on Response.
            // response.url IS valid on Response.
            
            // So I should just remove the directives.
            // However, verify that my mock implementation matches what I assert.
        });
    });

    describe('logout', () => {
        it('should destroy session and redirect', async () => {
            const request = new Request('http://localhost', {
                headers: { Cookie: '__session=123' }
            });
            const response = await logout(request);

            expect(mockStorage.getSession).toHaveBeenCalledWith('__session=123');
            expect(mockStorage.destroySession).toHaveBeenCalled();
            
            expect(response.headers.get('Set-Cookie')).toBe('destroyed-cookie-string');
        });
    });

    describe('getUser', () => {
        it('should return null if not logged in', async () => {
            // Setup getUserId to return null
            mockSession.get.mockReturnValue(null); 
            const request = new Request('http://localhost');

            const user = await getUser(request);
            expect(user).toBeNull();
            expect(mockAuthServer.getUserById).not.toHaveBeenCalled();
        });

        it('should return null if user not found', async () => {
            // Setup getUserId to return '123'
            mockSession.get.mockReturnValue('123');
            // Setup getUserById to return null
            mockAuthServer.getUserById.mockResolvedValue(null);

            const request = new Request('http://localhost');
            const user = await getUser(request);
            
            expect(user).toBeNull();
            expect(mockAuthServer.getUserById).toHaveBeenCalledWith('123');
        });

        it('should return serialized user if found', async () => {
            const mockDbUser: User = { 
                _id: { toString: () => '123' } as unknown as ObjectId, 
                email: 'test@example.com', 
                passwordHash: 'hash',
                role: 'user',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const mockSerializedUser: SerializedUser = { 
                _id: '123', 
                email: 'test@example.com',
                role: 'user',
                createdAt: mockDbUser.createdAt.toISOString(),
                updatedAt: mockDbUser.updatedAt.toISOString()
            };

            // Setup getUserId to return '123'
            mockSession.get.mockReturnValue('123');
            // Setup getUserById to return user
            mockAuthServer.getUserById.mockResolvedValue(mockDbUser);
            // Setup serializeUser
            mockUserTypes.serializeUser.mockReturnValue(mockSerializedUser);

            const request = new Request('http://localhost');
            const user = await getUser(request);

            expect(user).toEqual(mockSerializedUser);
            expect(mockAuthServer.getUserById).toHaveBeenCalledWith('123');
            expect(mockUserTypes.serializeUser).toHaveBeenCalledWith(mockDbUser);
        });
    });
});
