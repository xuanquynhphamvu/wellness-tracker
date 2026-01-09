
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import Progress from './progress';
import type { Trend } from '~/lib/progress.server';

vi.mock('~/lib/auth.server', () => ({
    requireUser: vi.fn(),
}));

vi.mock('~/lib/db.server', () => ({
    getCollection: vi.fn(),
    ObjectId: vi.fn(),
}));

describe('Progress Route', () => {
    it('renders empty state when no progress', () => {
        const router = createMemoryRouter([
            {
                path: '/progress',
                element: <Progress loaderData={{ progressByQuiz: [] }} actionData={undefined} params={{} as any} matches={[] as any} />
            }
        ], { initialEntries: ['/progress'] });

        render(<RouterProvider router={router} />);

        expect(screen.getByText('Your Journey')).toBeInTheDocument();
        expect(screen.getByText('Your journey begins here')).toBeInTheDocument();
        expect(screen.getByText('Browse Assessments')).toBeInTheDocument();
    });

    it('renders progress cards when data exists', () => {
        const mockProgress = [{
            quizId: '123',
            quizTitle: 'Anxiety Test',
            attempts: 5,
            scores: [10, 15, 12, 18, 20],
            dates: [],
            trend: 'improving' as Trend,
            average: 15,
            best: 20,
            worst: 10,
            latest: 20,
            change: 10,
        }];

        const router = createMemoryRouter([
            {
                path: '/progress',
                element: <Progress loaderData={{ progressByQuiz: mockProgress }} actionData={undefined} params={{} as any} matches={[] as any} />
            }
        ], { initialEntries: ['/progress'] });

        render(<RouterProvider router={router} />);

        expect(screen.getByText('Anxiety Test')).toBeInTheDocument();
        expect(screen.getByText('5 attempts • Last taken Invalid Date')).toBeInTheDocument(); // Date parsing might fail with empty array, but that's what we mocked
        expect(screen.getByText('↗️ Finding balance')).toBeInTheDocument();
        expect(screen.getAllByText('20')).toHaveLength(2); // Latest and Best
    });
});
