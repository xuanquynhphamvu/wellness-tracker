
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import AdminQuizzes from './admin.quizzes';

vi.mock('~/lib/auth.server', () => ({
    requireAdmin: vi.fn(),
}));

vi.mock('~/lib/db.server', () => ({
    getCollection: vi.fn(),
    ObjectId: vi.fn(),
}));

describe('Admin Quizzes Route', () => {
    it('renders empty state', () => {
        const router = createMemoryRouter([
            {
                path: '/admin/quizzes',
                element: <AdminQuizzes loaderData={{ quizzes: [] }} actionData={undefined} params={{} as any} matches={[] as any} />
            }
        ], { initialEntries: ['/admin/quizzes'] });

        render(<RouterProvider router={router} />);

        expect(screen.getByText('Manage Quizzes')).toBeInTheDocument();
        expect(screen.getByText('No quizzes created yet.')).toBeInTheDocument();
        expect(screen.getByText('Create Your First Quiz')).toBeInTheDocument();
    });

    it('renders list of quizzes', () => {
        const mockQuizzes = [{
            _id: '1',
            title: 'Depression Test',
            description: 'Assess levels',
            questions: [],
            isPublished: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }, {
            _id: '2',
            title: 'Draft Quiz',
            description: 'WIP',
            questions: [],
            isPublished: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }];

        const router = createMemoryRouter([
            {
                path: '/admin/quizzes',
                element: <AdminQuizzes loaderData={{ quizzes: mockQuizzes }} actionData={undefined} params={{} as any} matches={[] as any} />
            }
        ], { initialEntries: ['/admin/quizzes'] });

        render(<RouterProvider router={router} />);

        expect(screen.getByText('Depression Test')).toBeInTheDocument();
        expect(screen.getByText('Published')).toBeInTheDocument();

        expect(screen.getByText('Draft Quiz')).toBeInTheDocument();
        expect(screen.getByText('Draft')).toBeInTheDocument();
    });
});
