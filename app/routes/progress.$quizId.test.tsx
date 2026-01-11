import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import React from 'react';
import ProgressDetail, { loader } from './progress.$quizId';
import type { Route } from './+types/progress.$quizId';

// Mock dependencies
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

vi.mock('~/utils/scoring', () => ({
    calculateMaxScore: () => 27,
}));

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

describe('Progress Detail Route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFind.mockReturnValue({
            sort: mockSort.mockReturnValue({
                toArray: mockToArray
            })
        });
        mocks.getCollection.mockResolvedValue(mockCollection);
    });

    describe('loader', () => {
        it('returns quiz and history data', async () => {
            const mockUser = { _id: 'user1' };
            mocks.requireUser.mockResolvedValue(mockUser);

            const mockQuiz = { 
                _id: new mocks.ObjectId('quiz1'), 
                title: 'Test Quiz', 
                questions: [],
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const mockResults = [
                {
                    _id: 'r1',
                    score: 10,
                    completedAt: new Date('2023-01-01'),
                    userId: new mocks.ObjectId('user1'),
                    quizId: new mocks.ObjectId('quiz1')
                }
            ];

            // Mock quizzes findOne
            mockFindOne.mockResolvedValue(mockQuiz);
            // Mock results find
            mockToArray.mockResolvedValue(mockResults);

            // Need to mock getCollection implementation to distinguish collections
            mocks.getCollection.mockImplementation(async (name: string) => {
                if (name === 'quizzes') return { findOne: mockFindOne };
                if (name === 'results') return mockCollection;
                return mockCollection;
            });

            const request = new Request('http://localhost/progress/quiz1');
            const result = await loader({ request, params: { quizId: 'quiz1' }, context: {} } as any);

            expect(result.quiz).toBeDefined();
            expect(result.quiz.title).toBe('Test Quiz');
            expect(result.history).toHaveLength(1);
            expect(result.history[0].score).toBe(10);
            expect(result.maxScore).toBe(27);
        });

        it('throws 404 if quiz not found', async () => {
            const mockUser = { _id: 'user1' };
            mocks.requireUser.mockResolvedValue(mockUser);
            
            mocks.getCollection.mockImplementation(async (name: string) => {
                if (name === 'quizzes') return { findOne: vi.fn().mockResolvedValue(null) };
                return mockCollection;
            });

            const request = new Request('http://localhost/progress/quiz1');
            
            try {
                await loader({ request, params: { quizId: 'quiz1' }, context: {} } as any);
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(Response);
                expect((error as Response).status).toBe(404);
            }
        });
    });

    describe('Component', () => {
        it('renders chart and history table', () => {
            const mockData = {
                quiz: { title: 'Test Quiz', _id: 'quiz1' },
                history: [
                    { _id: 'r1', score: 10, completedAt: new Date().toISOString() },
                    { _id: 'r2', score: 15, completedAt: new Date().toISOString() }
                ],
                maxScore: 27
            };

            const router = createMemoryRouter([
                {
                    path: '/progress/:quizId',
                    element: <ProgressDetail {...{ loaderData: mockData, params: {}, matches: [] } as unknown as Route.ComponentProps} />
                }
            ], { initialEntries: ['/progress/quiz1'] });

            render(<RouterProvider router={router} />);

            expect(screen.getByText('Test Quiz Progress')).toBeInTheDocument();
            expect(screen.getByTestId('progress-chart')).toBeInTheDocument();
            expect(screen.getByText('History')).toBeInTheDocument();
            // Scores are rendered as "10 / 27" which might be split
            expect(screen.getByText((content, element) => {
                return element?.tagName.toLowerCase() === 'span' && content.includes('10') && content.includes('27');
            })).toBeInTheDocument();
            expect(screen.getByText((content, element) => {
                return element?.tagName.toLowerCase() === 'span' && content.includes('15') && content.includes('27');
            })).toBeInTheDocument();
        });
    });
});
