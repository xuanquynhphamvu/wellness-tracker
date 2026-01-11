
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import Register from './auth.register';

import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { loader, action } from './auth.register';
import * as authServer from '~/lib/auth.server';
import * as sessionServer from '~/lib/session.server';

// Mock server-side dependencies
vi.mock('~/lib/auth.server', () => ({
    verifyLogin: vi.fn(),
    requireUser: vi.fn(),
    createUser: vi.fn(),
}));

vi.mock('~/lib/session.server', () => ({
    createUserSession: vi.fn(),
    getUserId: vi.fn(),
}));

describe('Register Loader', () => {
    it('redirects to home if user is already logged in', async () => {
        vi.mocked(sessionServer.getUserId).mockResolvedValueOnce('user-123');

        const request = new Request('http://localhost/register');
        const response = await loader({ request } as LoaderFunctionArgs);

        expect(response).toBeInstanceOf(Response);
        if (response instanceof Response) {
            expect(response.status).toBe(302);
            expect(response.headers.get('Location')).toBe('/');
        }
    });

    it('returns empty object if user is not logged in', async () => {
        vi.mocked(sessionServer.getUserId).mockResolvedValueOnce(null);

        const request = new Request('http://localhost/register');
        const result = await loader({ request } as LoaderFunctionArgs);

        expect(result).toEqual({});
    });
});

describe('Register Action', () => {
    it('validates missing email', async () => {
        const formData = new FormData();
        formData.append('password', 'password123');
        formData.append('confirmPassword', 'password123');

        const request = new Request('http://localhost/register', {
            method: 'POST',
            body: formData,
        });

        const result = await action({ request } as ActionFunctionArgs);

        expect(result).toEqual({
            errors: {
                email: 'Valid email is required',
            }
        });
    });

    it('validates invalid email format', async () => {
        const formData = new FormData();
        formData.append('email', 'invalid-email');
        formData.append('password', 'password123');
        formData.append('confirmPassword', 'password123');

        const request = new Request('http://localhost/register', {
            method: 'POST',
            body: formData,
        });

        const result = await action({ request } as ActionFunctionArgs);

        expect(result).toEqual({
            errors: {
                email: 'Valid email is required',
            }
        });
    });

    it('validates short password', async () => {
        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', '12345');
        formData.append('confirmPassword', '12345');

        const request = new Request('http://localhost/register', {
            method: 'POST',
            body: formData,
        });

        const result = await action({ request } as ActionFunctionArgs);

        expect(result).toEqual({
            errors: {
                password: 'Password must be at least 6 characters',
            }
        });
    });

    it('validates password mismatch', async () => {
        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', 'password123');
        formData.append('confirmPassword', 'different');

        const request = new Request('http://localhost/register', {
            method: 'POST',
            body: formData,
        });

        const result = await action({ request } as ActionFunctionArgs);

        expect(result).toEqual({
            errors: {
                confirmPassword: 'Passwords do not match',
            }
        });
    });

    it('successfully creates user and session', async () => {
        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', 'password123');
        formData.append('confirmPassword', 'password123');

        const request = new Request('http://localhost/register', {
            method: 'POST',
            body: formData,
        });

        const mockUser = { _id: 'new-user-123', email: 'test@example.com' };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(authServer.createUser).mockResolvedValueOnce(mockUser as any);
        vi.mocked(sessionServer.createUserSession).mockResolvedValueOnce(new Response(null, { status: 302 }));

        const response = await action({ request } as ActionFunctionArgs);

        expect(authServer.createUser).toHaveBeenCalledWith('test@example.com', 'password123', 'user');
        expect(sessionServer.createUserSession).toHaveBeenCalledWith('new-user-123', '/');
        expect(response).toBeInstanceOf(Response);
    });

    it('handles creation errors', async () => {
        const formData = new FormData();
        formData.append('email', 'exists@example.com');
        formData.append('password', 'password123');
        formData.append('confirmPassword', 'password123');

        const request = new Request('http://localhost/register', {
            method: 'POST',
            body: formData,
        });

        vi.mocked(authServer.createUser).mockRejectedValueOnce(new Error('Email already exists'));

        const result = await action({ request } as ActionFunctionArgs);

        expect(result).toEqual({
            errors: {
                form: 'Email already exists',
            }
        });
    });
});

describe('Register Route', () => {
    it('renders register form', () => {
        const router = createMemoryRouter([
            {
                path: '/register',
                // @ts-expect-error - Partial props for testing
                element: <Register loaderData={{}} actionData={undefined} />
            }
        ], { initialEntries: ['/register'] });

        render(<RouterProvider router={router} />);

        // Use exact label text to avoid ambiguity
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();

        expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
    });

    it('displays validation errors from action', () => {
        const errorData = {
            errors: {
                email: 'Email already exists',
                password: 'Passwords do not match'
            }
        };

        const router = createMemoryRouter([
            {
                path: '/register',
                // @ts-expect-error - Partial props for testing
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                element: <Register loaderData={{}} actionData={errorData as any} />
            }
        ], { initialEntries: ['/register'] });

        render(<RouterProvider router={router} />);

        expect(screen.getByText('Email already exists')).toBeInTheDocument();
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
});
