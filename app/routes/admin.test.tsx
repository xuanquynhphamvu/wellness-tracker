import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import AdminLayout, { loader } from './admin';
import type { Route } from './+types/admin';

// Mock server-side utilities
vi.mock('~/lib/auth.server', () => ({
    requireAdmin: vi.fn(),
}));

import { requireAdmin } from '~/lib/auth.server';

describe('Admin Route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Loader', () => {
        it('calls requireAdmin to protect the route', async () => {
            const request = new Request('http://localhost/admin');
            
            vi.mocked(requireAdmin).mockResolvedValueOnce({
                _id: 'admin-id',
                email: 'admin@example.com',
                role: 'admin',
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
            });

            const result = await loader({ request } as Route.LoaderArgs);

            expect(requireAdmin).toHaveBeenCalledWith(request);
            expect(result).toEqual({});
        });

        it('throws when requireAdmin rejects (non-admin user)', async () => {
            const request = new Request('http://localhost/admin');
            
            vi.mocked(requireAdmin).mockRejectedValueOnce(
                new Response('Forbidden: Admin access required', { status: 403 })
            );

            await expect(loader({ request } as Route.LoaderArgs)).rejects.toThrow();
            expect(requireAdmin).toHaveBeenCalledWith(request);
        });

        it('throws when requireAdmin redirects (unauthenticated user)', async () => {
            const request = new Request('http://localhost/admin');
            
            const redirectResponse = new Response(null, {
                status: 302,
                headers: { Location: '/auth/login?redirectTo=/admin' }
            });
            
            vi.mocked(requireAdmin).mockRejectedValueOnce(redirectResponse);

            await expect(loader({ request } as Route.LoaderArgs)).rejects.toThrow();
            expect(requireAdmin).toHaveBeenCalledWith(request);
        });
    });

    describe('Component', () => {
        const createTestRouter = (element: React.ReactNode) => {
            return createMemoryRouter([
                {
                    path: '/admin',
                    element
                }
            ], { initialEntries: ['/admin'] });
        };

        it('renders the admin panel navigation', () => {
            const router = createTestRouter(<AdminLayout />);
            render(<RouterProvider router={router} />);

            expect(screen.getByText('Admin Panel')).toBeInTheDocument();
        });

        it('renders the quizzes navigation link', () => {
            const router = createTestRouter(<AdminLayout />);
            render(<RouterProvider router={router} />);

            const quizzesLinks = screen.getAllByText('Quizzes');
            expect(quizzesLinks.length).toBeGreaterThan(0);
            
            // Check that at least one link points to /admin/quizzes
            const quizzesLink = quizzesLinks[0].closest('a');
            expect(quizzesLink).toHaveAttribute('href', '/admin/quizzes');
        });

        it('renders the back to site link', () => {
            const router = createTestRouter(<AdminLayout />);
            render(<RouterProvider router={router} />);

            const backLink = screen.getByText('← Back to Site');
            expect(backLink).toBeInTheDocument();
            expect(backLink.closest('a')).toHaveAttribute('href', '/');
        });

        it('renders the outlet for child routes', () => {
            const router = createMemoryRouter([
                {
                    path: '/admin',
                    element: <AdminLayout />,
                    children: [
                        {
                            index: true,
                            element: <div data-testid="child-route">Child Content</div>
                        }
                    ]
                }
            ], { initialEntries: ['/admin'] });

            render(<RouterProvider router={router} />);

            expect(screen.getByTestId('child-route')).toBeInTheDocument();
            expect(screen.getByText('Child Content')).toBeInTheDocument();
        });

        it('applies correct styling classes for layout', () => {
            const router = createTestRouter(<AdminLayout />);
            const { container } = render(<RouterProvider router={router} />);

            // Check for main container classes
            const mainContainer = container.querySelector('.min-h-screen');
            expect(mainContainer).toBeInTheDocument();
            expect(mainContainer).toHaveClass('bg-warm-white', 'dark:bg-warm-gray-900');

            // Check for navigation classes
            const nav = container.querySelector('nav');
            expect(nav).toBeInTheDocument();
            expect(nav).toHaveClass('sticky', 'top-0', 'z-50');
        });

        it('renders navigation with backdrop blur effect', () => {
            const router = createTestRouter(<AdminLayout />);
            const { container } = render(<RouterProvider router={router} />);

            const nav = container.querySelector('nav');
            expect(nav).toHaveClass('backdrop-blur-md');
        });

        it('renders main content area with proper spacing', () => {
            const router = createTestRouter(<AdminLayout />);
            const { container } = render(<RouterProvider router={router} />);

            const main = container.querySelector('main');
            expect(main).toBeInTheDocument();
            expect(main).toHaveClass('container', 'mx-auto', 'px-6', 'py-12');
        });

        it('has proper semantic HTML structure', () => {
            const router = createTestRouter(<AdminLayout />);
            const { container } = render(<RouterProvider router={router} />);

            // Check for semantic elements
            expect(container.querySelector('nav')).toBeInTheDocument();
            expect(container.querySelector('main')).toBeInTheDocument();
        });

        it('renders admin panel title with correct styling', () => {
            const router = createTestRouter(<AdminLayout />);
            render(<RouterProvider router={router} />);

            const adminPanelLink = screen.getByText('Admin Panel').closest('a');
            expect(adminPanelLink).toHaveClass('text-xl', 'font-bold');
        });
    });
});
