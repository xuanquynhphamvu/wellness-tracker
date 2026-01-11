import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import React from 'react';
import NotFound, { meta } from './$';

describe('NotFound Route', () => {
    describe('Meta Function', () => {
        it('returns correct meta tags', () => {
            const result = meta();

            expect(result).toEqual([
                { title: "404 - Page Not Found - Wellness Tracker" },
                { name: "robots", content: "noindex" },
            ]);
        });

        it('includes noindex robots meta to prevent search indexing', () => {
            const result = meta();
            const robotsMeta = result.find((tag) => 'name' in tag && tag.name === 'robots');

            expect(robotsMeta).toBeDefined();
            expect(robotsMeta).toHaveProperty('content', 'noindex');
        });
    });

    describe('Component', () => {
        it('renders 404 heading', () => {
            const router = createMemoryRouter([
                {
                    path: '*',
                    element: <NotFound />
                }
            ], { initialEntries: ['/non-existent-page'] });

            render(<RouterProvider router={router} />);

            expect(screen.getByText('404')).toBeInTheDocument();
        });

        it('renders page not found message', () => {
            const router = createMemoryRouter([
                {
                    path: '*',
                    element: <NotFound />
                }
            ], { initialEntries: ['/non-existent-page'] });

            render(<RouterProvider router={router} />);

            expect(screen.getByText('Page Not Found')).toBeInTheDocument();
            expect(screen.getByText("The page you're looking for doesn't exist or has been moved.")).toBeInTheDocument();
        });

        it('renders home link', () => {
            const router = createMemoryRouter([
                {
                    path: '*',
                    element: <NotFound />
                }
            ], { initialEntries: ['/non-existent-page'] });

            render(<RouterProvider router={router} />);

            const homeLink = screen.getByText('Go to Home');
            expect(homeLink).toBeInTheDocument();
            expect(homeLink.closest('a')).toHaveAttribute('href', '/');
        });

        it('renders browse quizzes link', () => {
            const router = createMemoryRouter([
                {
                    path: '*',
                    element: <NotFound />
                }
            ], { initialEntries: ['/non-existent-page'] });

            render(<RouterProvider router={router} />);

            const quizzesLink = screen.getByText('Browse Quizzes');
            expect(quizzesLink).toBeInTheDocument();
            expect(quizzesLink.closest('a')).toHaveAttribute('href', '/quizzes');
        });

        it('renders support contact message', () => {
            const router = createMemoryRouter([
                {
                    path: '*',
                    element: <NotFound />
                }
            ], { initialEntries: ['/non-existent-page'] });

            render(<RouterProvider router={router} />);

            expect(screen.getByText('If you believe this is a mistake, please contact support.')).toBeInTheDocument();
        });

        it('applies correct styling classes', () => {
            const router = createMemoryRouter([
                {
                    path: '*',
                    element: <NotFound />
                }
            ], { initialEntries: ['/non-existent-page'] });

            const { container } = render(<RouterProvider router={router} />);

            // Check for main container classes
            const mainDiv = container.querySelector('.min-h-screen');
            expect(mainDiv).toBeInTheDocument();
            expect(mainDiv).toHaveClass('bg-gray-50', 'dark:bg-gray-900', 'flex', 'items-center', 'justify-center');
        });
    });
});
