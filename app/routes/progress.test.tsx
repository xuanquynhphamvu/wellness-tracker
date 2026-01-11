import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import React from 'react';
import Progress, { loader } from './progress';
import type { Route } from './+types/progress';
import type { Trend } from '~/lib/progress.server';

// Mock dependencies using vi.hoisted to ensure availability
const mocks = vi.hoisted(() => ({
    requireUser: vi.fn(),
    getCollection: vi.fn(),
    ObjectId: class {
        id: string | number;
        constructor(id: string | number) { this.id = id; }
        toString() { return String(this.id); }
        equals(other: string | number | { id: string | number }) { 
            return String(this.id) === String(typeof other === 'object' ? other.id : other); 
        }
    }
}));

vi.mock('~/lib/auth.server', () => ({
    requireUser: mocks.requireUser,
}));

vi.mock('~/lib/db.server', () => ({
    getCollection: mocks.getCollection,
    ObjectId: mocks.ObjectId,
}));

// Mock progress server utils
vi.mock('~/lib/progress.server', () => ({
    calculateProgressStats: (scores: number[]) => ({
        average: 15,
        best: 20,
        worst: 10,
        latest: scores[scores.length - 1],
        change: 5,
        trend: 'improving',
    }),
}));

vi.mock('~/utils/scoring', () => ({
    calculateMaxScore: () => 27,
}));

// Mock ProgressChart to simplify testing
vi.mock('~/components/ProgressChart', () => ({
    ProgressChart: () => <div data-testid="progress-chart">Mock Chart</div>
}));

const mockFind = vi.fn();
const mockSort = vi.fn();
const mockToArray = vi.fn();
const mockFindOne = vi.fn();

const mockCollection = {
    find: mockFind.mockReturnThis(),
    sort: mockSort.mockReturnThis(),
    toArray: mockToArray,
    findOne: mockFindOne,
};

describe('Progress Route', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Default mock implementation for chaining
        mockFind.mockReturnValue({
            sort: mockSort.mockReturnValue({
                toArray: mockToArray
            })
        });

        // Setup default collection mock
        mocks.getCollection.mockResolvedValue(mockCollection);
    });

    describe('loader', () => {
        it('returns empty list when user has no results', async () => {
            const mockUser = { _id: 'user1' };
            mocks.requireUser.mockResolvedValue(mockUser);
            mockToArray.mockResolvedValue([]); // No results

            const request = new Request('http://localhost/progress');
            const result = await loader({ request, params: {}, context: {} } as Route.LoaderArgs);

            expect(result.progressByQuiz).toEqual([]);
            expect(mocks.getCollection).toHaveBeenCalledWith('results');
        });

        it('groups results by quiz and calculates stats', async () => {
            const mockUser = { _id: 'user1' };
            mocks.requireUser.mockResolvedValue(mockUser);

            const mockResults = [
                {
                    quizId: new mocks.ObjectId('quiz1'),
                    score: 10,
                    completedAt: new Date('2023-01-01'),
                    userId: new mocks.ObjectId('user1')
                },
                {
                    quizId: new mocks.ObjectId('quiz1'),
                    score: 20,
                    completedAt: new Date('2023-01-02'),
                    userId: new mocks.ObjectId('user1')
                }
            ];

            mockToArray.mockResolvedValue(mockResults);

            // Mock quizzes collection check
            mockFindOne.mockResolvedValue({ _id: new mocks.ObjectId('quiz1'), title: 'Test Quiz' });

            const request = new Request('http://localhost/progress');
            const result = await loader({ request, params: {}, context: {} } as Route.LoaderArgs);

            expect(result.progressByQuiz).toHaveLength(1);
            expect(result.progressByQuiz[0]).toMatchObject({
                quizId: 'quiz1',
                quizTitle: 'Test Quiz',
                trend: 'improving'
            });
            expect(result.progressByQuiz[0].average).toBe(15);
        });

        it('sorts quizzes by most recent attempt', async () => {
            const mockUser = { _id: 'user1' };
            mocks.requireUser.mockResolvedValue(mockUser);

            const mockResults = [
                {
                    quizId: new mocks.ObjectId('quiz1'),
                    score: 10,
                    completedAt: new Date('2023-01-01'), // Old
                    userId: new mocks.ObjectId('user1')
                },
                {
                    quizId: new mocks.ObjectId('quiz2'),
                    score: 20,
                    completedAt: new Date('2023-01-02'), // New
                    userId: new mocks.ObjectId('user1')
                }
            ];

            mockToArray.mockResolvedValue(mockResults);

            // Mock quizzes checking
            mockFindOne.mockImplementation(async (query) => {
                if (String(query._id) === 'quiz1') return { _id: new mocks.ObjectId('quiz1'), title: 'Old Quiz' };
                if (String(query._id) === 'quiz2') return { _id: new mocks.ObjectId('quiz2'), title: 'New Quiz' };
                return null;
            });

            const request = new Request('http://localhost/progress');
            const result = await loader({ request, params: {}, context: {} } as Route.LoaderArgs);

            expect(result.progressByQuiz).toHaveLength(2);
            expect(result.progressByQuiz[0].quizId).toBe('quiz2'); // Newer one first
            expect(result.progressByQuiz[1].quizId).toBe('quiz1');
        });
    });

    describe('Component', () => {
        it('renders empty state when no progress', () => {
            const router = createMemoryRouter([
                {
                    path: '/progress',
                    element: <Progress {...{ loaderData: { progressByQuiz: [] }, params: {}, matches: [] } as unknown as Route.ComponentProps} />
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
                maxScore: 27,
                attempts: 5,
                scores: [10, 15, 12, 18, 20],
                dates: [new Date().toISOString()],
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
                    element: <Progress {...{ loaderData: { progressByQuiz: mockProgress }, params: {}, matches: [] } as unknown as Route.ComponentProps} />
                }
            ], { initialEntries: ['/progress'] });

            render(<RouterProvider router={router} />);

            expect(screen.getByText('Anxiety Test')).toBeInTheDocument();
            // Checking for partial text because date format might vary
            expect(screen.getByText(/5 attempts/)).toBeInTheDocument();
            expect(screen.getByText('↗️ Finding balance')).toBeInTheDocument();
            expect(screen.getAllByText('20')).toHaveLength(2); // Latest and Best
            expect(screen.getByTestId('progress-chart')).toBeInTheDocument();
        });
    });
});
