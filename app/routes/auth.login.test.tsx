
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import Login from './auth.login';

// Mock server-side dependencies to prevent import errors
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
    it('renders login form', () => {
        const router = createMemoryRouter([
            {
                path: '/login',
                element: <Login loaderData={{ redirectTo: '/' } as any} actionData={undefined} />
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
                element: <Login loaderData={{ redirectTo: '/' } as any} actionData={errorData as any} />
            }
        ], { initialEntries: ['/login'] });

        render(<RouterProvider router={router} />);

        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
});
