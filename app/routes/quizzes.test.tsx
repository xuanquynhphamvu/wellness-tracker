import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import React from 'react';
import Quizzes, { loader, meta } from './quizzes';
import type { Route } from './+types/quizzes';

// Mock dependencies using vi.hoisted to ensure availability
const mocks = vi.hoisted(() => ({
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

vi.mock('~/lib/db.server', () => ({
    getCollection: mocks.getCollection,
    ObjectId: mocks.ObjectId,
}));

const mockFind = vi.fn();
const mockSort = vi.fn();
const mockToArray = vi.fn();

const mockCollection = {
    find: mockFind.mockReturnThis(),
    sort: mockSort.mockReturnThis(),
    toArray: mockToArray,
};

describe('Quizzes Route', () => {
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
        it('returns empty list when no published quizzes exist', async () => {
            mockToArray.mockResolvedValue([]);

            const result = await loader();

            expect(mocks.getCollection).toHaveBeenCalledWith('quizzes');
            expect(mockFind).toHaveBeenCalledWith({ isPublished: true });
            expect(mockSort).toHaveBeenCalledWith({ order: 1, createdAt: -1 });
            expect(result.quizzes).toEqual([]);
        });

        it('returns serialized published quizzes sorted by order and createdAt', async () => {
            const mockQuizzes = [
                {
                    _id: new mocks.ObjectId('quiz1'),
                    title: 'Anxiety Assessment',
                    slug: 'gad-7',
                    description: 'Measure your anxiety levels',
                    questions: [
                        { id: '1', text: 'Question 1', options: [{ text: 'Yes', score: 1 }, { text: 'No', score: 0 }] }
                    ],
                    isPublished: true,
                    createdAt: new Date('2023-01-01'),
                    updatedAt: new Date('2023-01-02'),
                    baseTestName: 'GAD-7',
                    shortName: 'GAD',
                    coverImage: '/images/anxiety.jpg',
                },
                {
                    _id: new mocks.ObjectId('quiz2'),
                    title: 'Depression Screening',
                    description: 'Assess depression symptoms',
                    questions: [
                        { id: '1', text: 'Question 1', options: [{ text: 'Yes', score: 1 }] },
                        { id: '2', text: 'Question 2', options: [{ text: 'No', score: 0 }] }
                    ],
                    isPublished: true,
                    createdAt: new Date('2023-01-03'),
                    updatedAt: new Date('2023-01-04'),
                    baseTestName: 'PHQ-9',
                    shortName: 'PHQ',
                    coverImage: '/images/depression.jpg',
                }
            ];

            mockToArray.mockResolvedValue(mockQuizzes);

            const result = await loader();

            expect(result.quizzes).toHaveLength(2);
            expect(result.quizzes[0]).toEqual({
                _id: 'quiz1',
                title: 'Anxiety Assessment',
                slug: 'gad-7',
                description: 'Measure your anxiety levels',
                questions: mockQuizzes[0].questions,
                isPublished: true,
                createdAt: '2023-01-01T00:00:00.000Z',
                updatedAt: '2023-01-02T00:00:00.000Z',
                baseTestName: 'GAD-7',
                shortName: 'GAD',
                coverImage: '/images/anxiety.jpg',
            });
            expect(result.quizzes[1]._id).toBe('quiz2');
        });

        it('only returns published quizzes', async () => {
            mockToArray.mockResolvedValue([]);

            await loader();

            expect(mockFind).toHaveBeenCalledWith({ isPublished: true });
        });

        it('serializes MongoDB ObjectId to string', async () => {
            const mockQuizzes = [
                {
                    _id: new mocks.ObjectId('507f1f77bcf86cd799439011'),
                    title: 'Test Quiz',
                    slug: 'test-quiz',
                    description: 'Test description',
                    questions: [],
                    isPublished: true,
                    createdAt: new Date('2023-01-01'),
                    updatedAt: new Date('2023-01-01'),
                    baseTestName: 'Test',
                    shortName: 'TST',
                    coverImage: '/test.jpg',
                }
            ];

            mockToArray.mockResolvedValue(mockQuizzes);

            const result = await loader();

            expect(typeof result.quizzes[0]._id).toBe('string');
            expect(result.quizzes[0]._id).toBe('507f1f77bcf86cd799439011');
        });
    });

    describe('meta', () => {
        it('returns correct meta tags', () => {
            const metaTags = meta();

            expect(metaTags).toEqual([
                { title: 'Browse Quizzes - Wellness Tracker' },
                { name: 'description', content: 'Choose from our evidence-based mental health quizzes' },
            ]);
        });
    });

    describe('Component', () => {
        it('renders empty state when no quizzes available', () => {
            const router = createMemoryRouter([
                {
                    path: '/quizzes',
                    element: <Quizzes {...{ loaderData: { quizzes: [] }, params: {}, matches: [] } as unknown as Route.ComponentProps} />
                }
            ], { initialEntries: ['/quizzes'] });

            render(<RouterProvider router={router} />);

            expect(screen.getByText('Choose what feels right today.')).toBeInTheDocument();
            expect(screen.getByText('No quizzes available yet.')).toBeInTheDocument();
            expect(screen.getByText('Check back soon.')).toBeInTheDocument();
            expect(screen.getByText('← Back to Home')).toBeInTheDocument();
        });

        it('renders quiz cards when quizzes are available', () => {
            const mockQuizzes = [
                {
                    _id: 'quiz1',
                    title: 'Anxiety Assessment',
                    slug: 'gad-7',
                    description: 'Measure your anxiety levels with this evidence-based tool',
                    questions: [
                        { id: '1', text: 'Q1', options: [{ text: 'Yes', score: 1 }] },
                        { id: '2', text: 'Q2', options: [{ text: 'No', score: 0 }] }
                    ],
                    isPublished: true,
                    createdAt: '2023-01-01T00:00:00.000Z',
                    updatedAt: '2023-01-02T00:00:00.000Z',
                    baseTestName: 'GAD-7',
                    shortName: 'GAD',
                    coverImage: '/images/anxiety.jpg',
                }
            ];

            const router = createMemoryRouter([
                {
                    path: '/quizzes',
                    element: <Quizzes {...{ loaderData: { quizzes: mockQuizzes }, params: {}, matches: [] } as unknown as Route.ComponentProps} />
                }
            ], { initialEntries: ['/quizzes'] });

            render(<RouterProvider router={router} />);

            expect(screen.getByText('Anxiety Assessment')).toBeInTheDocument();
            expect(screen.getByText('Measure your anxiety levels with this evidence-based tool')).toBeInTheDocument();
            expect(screen.getByText('2 Questions')).toBeInTheDocument();
            expect(screen.getByText('GAD')).toBeInTheDocument();
            expect(screen.getByText('Based on: GAD-7')).toBeInTheDocument();
            expect(screen.getByText('Begin →')).toBeInTheDocument();
        });

        it('renders multiple quiz cards', () => {
            const mockQuizzes = [
                {
                    _id: 'quiz1',
                    title: 'Anxiety Assessment',
                    slug: 'gad-7',
                    description: 'Measure your anxiety levels',
                    questions: [{ id: '1', text: 'Q1', options: [] }],
                    isPublished: true,
                    createdAt: '2023-01-01T00:00:00.000Z',
                    updatedAt: '2023-01-01T00:00:00.000Z',
                    baseTestName: 'GAD-7',
                    shortName: 'GAD',
                    coverImage: '/anxiety.jpg',
                },
                {
                    _id: 'quiz2',
                    title: 'Depression Screening',
                    description: 'Assess depression symptoms',
                    questions: [
                        { id: '1', text: 'Q1', options: [] },
                        { id: '2', text: 'Q2', options: [] },
                        { id: '3', text: 'Q3', options: [] }
                    ],
                    isPublished: true,
                    createdAt: '2023-01-02T00:00:00.000Z',
                    updatedAt: '2023-01-02T00:00:00.000Z',
                    baseTestName: 'PHQ-9',
                    shortName: 'PHQ',
                    coverImage: '/depression.jpg',
                }
            ];

            const router = createMemoryRouter([
                {
                    path: '/quizzes',
                    element: <Quizzes {...{ loaderData: { quizzes: mockQuizzes }, params: {}, matches: [] } as unknown as Route.ComponentProps} />
                }
            ], { initialEntries: ['/quizzes'] });

            render(<RouterProvider router={router} />);

            expect(screen.getByText('Anxiety Assessment')).toBeInTheDocument();
            expect(screen.getByText('Depression Screening')).toBeInTheDocument();
            expect(screen.getByText('1 Questions')).toBeInTheDocument();
            expect(screen.getByText('3 Questions')).toBeInTheDocument();
        });

        it('renders quiz without optional fields', () => {
            const mockQuizzes = [
                {
                    _id: 'quiz1',
                    title: 'Simple Quiz',
                    slug: 'simple-quiz',
                    description: 'A simple quiz without extras',
                    questions: [{ id: '1', text: 'Q1', options: [] }],
                    isPublished: true,
                    createdAt: '2023-01-01T00:00:00.000Z',
                    updatedAt: '2023-01-01T00:00:00.000Z',
                    baseTestName: undefined,
                    shortName: undefined,
                    coverImage: undefined,
                }
            ];

            const router = createMemoryRouter([
                {
                    path: '/quizzes',
                    element: <Quizzes {...{ loaderData: { quizzes: mockQuizzes }, params: {}, matches: [] } as unknown as Route.ComponentProps} />
                }
            ], { initialEntries: ['/quizzes'] });

            render(<RouterProvider router={router} />);

            expect(screen.getByText('Simple Quiz')).toBeInTheDocument();
            expect(screen.getByText('A simple quiz without extras')).toBeInTheDocument();
            expect(screen.queryByText(/Based on:/)).not.toBeInTheDocument();
            // shortName badge should not be rendered
            const badges = screen.queryAllByText(/GAD|PHQ|TST/);
            expect(badges).toHaveLength(0);
        });

        it('renders cover images when provided', () => {
            const mockQuizzes = [
                {
                    _id: 'quiz1',
                    title: 'Quiz with Image',
                    slug: 'quiz-with-image',
                    description: 'Has a cover image',
                    questions: [{ id: '1', text: 'Q1', options: [] }],
                    isPublished: true,
                    createdAt: '2023-01-01T00:00:00.000Z',
                    updatedAt: '2023-01-01T00:00:00.000Z',
                    baseTestName: 'Test',
                    shortName: 'TST',
                    coverImage: '/images/cover.jpg',
                }
            ];

            const router = createMemoryRouter([
                {
                    path: '/quizzes',
                    element: <Quizzes {...{ loaderData: { quizzes: mockQuizzes }, params: {}, matches: [] } as unknown as Route.ComponentProps} />
                }
            ], { initialEntries: ['/quizzes'] });

            render(<RouterProvider router={router} />);

            const image = screen.getByAltText('Quiz with Image');
            expect(image).toBeInTheDocument();
            expect(image).toHaveAttribute('src', '/images/cover.jpg');
        });

        it('renders header and navigation elements', () => {
            const router = createMemoryRouter([
                {
                    path: '/quizzes',
                    element: <Quizzes {...{ loaderData: { quizzes: [] }, params: {}, matches: [] } as unknown as Route.ComponentProps} />
                }
            ], { initialEntries: ['/quizzes'] });

            render(<RouterProvider router={router} />);

            expect(screen.getByText('Choose what feels right today.')).toBeInTheDocument();
            expect(screen.getByText('There is no rush. Select an assessment to start your reflection.')).toBeInTheDocument();
            expect(screen.getByText('← Back to Home')).toBeInTheDocument();
        });
    });
});
