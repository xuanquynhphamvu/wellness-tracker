
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { createMemoryRouter, RouterProvider, type LoaderFunctionArgs, type Params } from 'react-router';
import Home, { loader } from './home';
import * as sessionServer from '~/lib/session.server';
import React from 'react';

// Mock server-side dependencies
vi.mock('~/lib/session.server', () => ({
    getUser: vi.fn(),
}));

describe('Home Route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Loader', () => {
        it('returns user when authenticated', async () => {
            const mockUser = {
                _id: 'user-123',
                email: 'test@example.com',
                role: 'user' as const,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            vi.mocked(sessionServer.getUser).mockResolvedValue(mockUser);

            const request = new Request('http://localhost/');
            const args = { request, params: {} as Params, context: {} } as unknown as LoaderFunctionArgs;
            const result = await loader(args);

            expect(sessionServer.getUser).toHaveBeenCalledWith(request);
            expect(result).toEqual({ user: mockUser });
        });

        it('returns null user when not authenticated', async () => {
            vi.mocked(sessionServer.getUser).mockResolvedValue(null);

            const request = new Request('http://localhost/');
            const result = await loader({ request, params: {} as Params, context: {} } as unknown as LoaderFunctionArgs);

            expect(result).toEqual({ user: null });
        });
    });

    describe('Component', () => {
        it('renders guest view when no user', () => {
            const router = createMemoryRouter([
                {
                    path: '/',
                    element: <Home {...({ loaderData: { user: null }, params: {}, matches: [] } as unknown as ComponentProps<typeof Home>)} />
                }
            ], { initialEntries: ['/'] });

            render(<RouterProvider router={router} />);

            // Check for guest elements
            expect(screen.getByText('Log In')).toBeInTheDocument();
            expect(screen.getByText('Sign Up')).toBeInTheDocument();
            // Check for common elements
            expect(screen.getByText(/You're in a safe space/i)).toBeInTheDocument();
            expect(screen.getByText('Browse Tests')).toBeInTheDocument();
        });

        it('renders authenticated view when user is logged in', () => {
            const mockUser = {
                _id: 'user-123',
                email: 'test@example.com',
                role: 'user' as const,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            const router = createMemoryRouter([
                {
                    path: '/',
                    element: <Home {...({ loaderData: { user: mockUser }, params: {}, matches: [] } as unknown as ComponentProps<typeof Home>)} />
                }
            ], { initialEntries: ['/'] });

            render(<RouterProvider router={router} />);

            // Check for auth elements
            expect(screen.getByText('test@example.com')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Log Out/i })).toBeInTheDocument();
            // Should not show admin panel
            expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
        });

        it('renders admin view when user is admin', () => {
            const mockAdmin = {
                _id: 'admin-123',
                email: 'admin@example.com',
                role: 'admin' as const,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            const router = createMemoryRouter([
                {
                    path: '/',
                    element: <Home {...({ loaderData: { user: mockAdmin }, params: {}, matches: [] } as unknown as ComponentProps<typeof Home>)} />
                }
            ], { initialEntries: ['/'] });

            render(<RouterProvider router={router} />);

            // Check for admin elements
            expect(screen.getByText('Admin Panel')).toBeInTheDocument();
            expect(screen.getByText('admin@example.com')).toBeInTheDocument();
        });
    });
});
