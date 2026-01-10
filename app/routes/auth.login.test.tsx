
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import Login, { loader, action } from './auth.login';
import * as authServer from '~/lib/auth.server';
import * as sessionServer from '~/lib/session.server';
import React from 'react';

// Mock server-side dependencies
vi.mock('~/lib/auth.server', () => ({
    verifyLogin: vi.fn(),
    requireUser: vi.fn(),
}));

vi.mock('~/lib/session.server', () => ({
    createUserSession: vi.fn(),
    getUserId: vi.fn(),
    getUser: vi.fn(),
}));

describe('Login Route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Loader', () => {
        it('redirects to home if user is already logged in', async () => {
            (sessionServer.getUserId as any).mockResolvedValue('user-123');

            const request = new Request('http://localhost/login');
            try {
                await loader({ request, params: {}, context: {} } as any);
            } catch (response) {
                expect(response).toBeInstanceOf(Response);
                expect((response as Response).status).toBe(302);
                expect((response as Response).headers.get('Location')).toBe('/');
            }
        });

        it('returns redirectTo param when not logged in', async () => {
            (sessionServer.getUserId as any).mockResolvedValue(null);

            const request = new Request('http://localhost/login?redirectTo=/dashboard');
            const result = await loader({ request, params: {}, context: {} } as any);

            expect(result).toEqual({ redirectTo: '/dashboard' });
        });
    });

    describe('Action', () => {
        it('returns error for invalid email', async () => {
            const formData = new FormData();
            formData.append('email', 'invalid-email');
            formData.append('password', 'password123');

            const request = new Request('http://localhost/login', {
                method: 'POST',
                body: formData,
            });

            const result = await action({ request, params: {}, context: {} } as any);
            // @ts-ignore
            expect(result?.errors?.email).toBe('Valid email is required');
        });

        it('returns error for short password', async () => {
            const formData = new FormData();
            formData.append('email', 'test@example.com');
            formData.append('password', '12345');

            const request = new Request('http://localhost/login', {
                method: 'POST',
                body: formData,
            });

            const result = await action({ request, params: {}, context: {} } as any);
            // @ts-ignore
            expect(result?.errors?.password).toBe('Password must be at least 6 characters');
        });

        it('returns error when login fails', async () => {
            const formData = new FormData();
            formData.append('email', 'test@example.com');
            formData.append('password', 'wrongpassword');

            (authServer.verifyLogin as any).mockResolvedValue(null);

            const request = new Request('http://localhost/login', {
                method: 'POST',
                body: formData,
            });

            const result = await action({ request, params: {}, context: {} } as any);
            // @ts-ignore
            expect(result?.errors?.form).toBe('Invalid email or password');
        });

        it('creates session and redirects on successful login', async () => {
            const formData = new FormData();
            formData.append('email', 'test@example.com');
            formData.append('password', 'correctpassword');
            formData.append('redirectTo', '/dashboard');

            const mockUser = { _id: 'user-123', email: 'test@example.com' };
            (authServer.verifyLogin as any).mockResolvedValue(mockUser);
            (sessionServer.createUserSession as any).mockImplementation(() => new Response(null, { status: 302, headers: { Location: '/dashboard' } }));

            const request = new Request('http://localhost/login', {
                method: 'POST',
                body: formData,
            });

            await action({ request, params: {}, context: {} } as any);
            expect(authServer.verifyLogin).toHaveBeenCalledWith('test@example.com', 'correctpassword');
            expect(sessionServer.createUserSession).toHaveBeenCalledWith('user-123', '/dashboard');
        });
    });

    describe('Component', () => {
        it('renders login form', () => {
            const router = createMemoryRouter([
                {
                    path: '/login',
                    element: <Login loaderData={{ redirectTo: '/' } as any} actionData={undefined} params={{} as any} matches={[] as any} />
                }
            ], { initialEntries: ['/login'] });

            render(<RouterProvider router={router} />);

            expect(screen.getByText('Welcome Back')).toBeInTheDocument();
            expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Log In/i })).toBeInTheDocument();
        });

        it('displays error message from action data', () => {
            const errorData = {
                errors: {
                    form: 'Invalid credentials'
                }
            };

            const router = createMemoryRouter([
                {
                    path: '/login',
                    element: <Login loaderData={{ redirectTo: '/' } as any} actionData={errorData as any} params={{} as any} matches={[] as any} />
                }
            ], { initialEntries: ['/login'] });

            render(<RouterProvider router={router} />);

            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });
    });
});
