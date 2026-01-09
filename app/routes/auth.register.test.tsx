
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import Register from './auth.register';

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

describe('Register Route', () => {
    it('renders register form', () => {
        const router = createMemoryRouter([
            {
                path: '/register',
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
                element: <Register loaderData={{}} actionData={errorData as any} />
            }
        ], { initialEntries: ['/register'] });

        render(<RouterProvider router={router} />);

        expect(screen.getByText('Email already exists')).toBeInTheDocument();
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
});
