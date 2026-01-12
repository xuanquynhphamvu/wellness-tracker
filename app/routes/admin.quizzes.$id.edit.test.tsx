import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import AdminEditQuiz, { loader, action } from './admin.quizzes.$id.edit';
import type { SerializedQuiz } from '~/types/quiz';
import type { Route } from './+types/admin.quizzes.$id.edit';
import { requireAdmin } from '~/lib/auth.server';
import { getCollection, ObjectId } from '~/lib/db.server';

// Mock server-side utilities
vi.mock('~/lib/auth.server', () => ({
    requireAdmin: vi.fn(),
}));

vi.mock('~/lib/db.server', () => {
    class MockObjectId {
        id: string;
        constructor(id: string) {
            this.id = id;
        }
        toString() {
            return this.id || 'mock-id';
        }
        equals(other: unknown) {
            return this.toString() === (other as { toString: () => string }).toString();
        }
    }
    return {
        getCollection: vi.fn(),
        ObjectId: MockObjectId,
    };
});

// Mock node modules for action
vi.mock('node:fs/promises', () => ({
    mkdir: vi.fn(),
    writeFile: vi.fn(),
}));
vi.mock('node:path', () => ({
    join: vi.fn((...args) => args.join('/')),
    extname: vi.fn(() => '.jpg'),
}));
vi.mock('node:crypto', () => ({
    randomUUID: vi.fn(() => 'mock-uuid'),
}));

describe('Admin Edit Quiz Route', () => {
    const mockQuiz: SerializedQuiz = {
        _id: '123',
        title: 'Existing Quiz',
        slug: 'test-quiz',
        description: 'Test Description',
        questions: [{
            id: 'q1',
            text: 'Question 1',
            type: 'multiple-choice',
            options: ['Yes', 'No'],
            scoreMapping: {}
        }],
        isPublished: true,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
        scoreRanges: [],
    };

    const mockParams = { id: '123' } as unknown as Route.ComponentProps['params'];
    const mockMatches = [] as unknown as Route.ComponentProps['matches'];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Loader', () => {
        it('returns quiz data when found', async () => {
            const date = new Date('2023-01-01T00:00:00.000Z');
            const findOneMock = vi.fn().mockResolvedValue({
                ...mockQuiz,
                _id: new ObjectId('123'),
                createdAt: date,
                updatedAt: date,
            });
            (getCollection as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ findOne: findOneMock });

            const response = await loader({
                params: { id: '123' },
                request: new Request('http://localhost'),
                context: {},
            } as Route.LoaderArgs);

            expect(response).toEqual({
                quiz: {
                    ...mockQuiz,
                    createdAt: date.toISOString(),
                    updatedAt: date.toISOString(),
                    // Loader includes these as defined in SerializedQuiz interface, potentially undefined
                    baseTestName: undefined,
                    shortName: undefined,
                    instructions: undefined,
                    coverImage: undefined,
                    scoringDirection: 'higher-is-better',
                }
            });
        });

        it('throws 404 when quiz not found', async () => {
            const findOneMock = vi.fn().mockResolvedValue(null);
            (getCollection as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ findOne: findOneMock });

            try {
                await loader({
                    params: { id: '123' },
                    request: new Request('http://localhost'),
                    context: {},
                } as Route.LoaderArgs);
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(Response);
                expect((error as Response).status).toBe(404);
            }
        });

        it('throws 400 when ID is missing', async () => {
            try {
                await loader({
                    params: {},
                    request: new Request('http://localhost'),
                    context: {},
                } as unknown as Route.LoaderArgs);
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(Response);
                expect((error as Response).status).toBe(400);
            }
        });
    });

    describe('Action', () => {
        it('updates quiz successfully with valid data', async () => {
            const updateOneMock = vi.fn();
            (getCollection as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ updateOne: updateOneMock });

            const formData = new FormData();
            formData.append('title', 'Updated Title');
            formData.append('description', 'Updated Desc');
            formData.append('questions', JSON.stringify(mockQuiz.questions));
            formData.append('scoreRanges', JSON.stringify([]));

            const response = await action({
                request: new Request('http://localhost', { method: 'POST', body: formData }),
                params: { id: '123' },
                context: {},
            } as Route.ActionArgs);

            expect(requireAdmin).toHaveBeenCalled();
            expect(updateOneMock).toHaveBeenCalledWith(
                { _id: new ObjectId('123') },
                expect.objectContaining({
                    $set: expect.objectContaining({
                        title: 'Updated Title',
                        description: 'Updated Desc',
                    })
                })
            );
            // Check for redirect
            expect(response).toEqual(expect.objectContaining({
                status: 302,
                headers: expect.anything()
            }));
        });

        it('saves complex quiz structure with multiple questions and score ranges', async () => {
            const updateOneMock = vi.fn();
            (getCollection as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ updateOne: updateOneMock });

            const complexQuestions = [
                { id: '1', text: 'Q1', type: 'scale', scaleMin: 1, scaleMax: 5 },
                { id: '2', text: 'Q2', type: 'multiple-choice', options: ['A', 'B'], scoreMapping: { 'A': 1, 'B': 0 } }
            ];
            const complexScoreRanges = [
                { min: 0, max: 1, status: 'Low', description: 'Low desc', color: 'orange' },
                { min: 2, max: 5, status: 'High', description: 'High desc', color: 'green' }
            ];

            const formData = new FormData();
            formData.append('title', 'Complex Quiz');
            formData.append('slug', 'complex-quiz');
            formData.append('description', 'Complex description');
            formData.append('questions', JSON.stringify(complexQuestions));
            formData.append('scoreRanges', JSON.stringify(complexScoreRanges));

            await action({
                request: new Request('http://localhost', { method: 'POST', body: formData }),
                params: { id: '123' },
                context: {},
            } as Route.ActionArgs);

            expect(updateOneMock).toHaveBeenCalledWith(
                { _id: new ObjectId('123') },
                expect.objectContaining({
                    $set: expect.objectContaining({
                        title: 'Complex Quiz',
                        questions: expect.arrayContaining([
                            expect.objectContaining({ text: 'Q1' }),
                            expect.objectContaining({ text: 'Q2' })
                        ]),
                        scoreRanges: expect.arrayContaining([
                            expect.objectContaining({ status: 'Low' }),
                            expect.objectContaining({ status: 'High' })
                        ])
                    })
                })
            );
        });

        it('returns validation errors for invalid data', async () => {
            const formData = new FormData();
            formData.append('title', ''); // Invalid
            formData.append('description', 'Desc');
            formData.append('questions', JSON.stringify(mockQuiz.questions));
            formData.append('scoreRanges', JSON.stringify([]));

            const response = await action({
                request: new Request('http://localhost', { method: 'POST', body: formData }),
                params: { id: '123' },
                context: {},
            } as Route.ActionArgs);

            expect(response).toHaveProperty('errors');
            // Cast response to expect specific shape
            const actionResponse = response as { errors: Record<string, string> };
            expect(actionResponse.errors.title).toBeDefined();
        });
    });

    describe('Component', () => {
        it('renders the edit form with existing data', () => {
            const router = createMemoryRouter([
                {
                    path: '/admin/quizzes/123/edit',
                    element: <AdminEditQuiz loaderData={{ quiz: mockQuiz }} actionData={undefined} params={mockParams} matches={mockMatches} />
                }
            ], { initialEntries: ['/admin/quizzes/123/edit'] });

            render(<RouterProvider router={router} />);

            expect(screen.getByDisplayValue('Existing Quiz')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Question 1')).toBeInTheDocument();
        });

        it('handles form submission error', () => {
            const router = createMemoryRouter([
                {
                    path: '/admin/quizzes/123/edit',
                    element: <AdminEditQuiz loaderData={{ quiz: mockQuiz }} actionData={{ errors: { title: 'Title is required' } }} params={mockParams} matches={mockMatches} />
                }
            ], { initialEntries: ['/admin/quizzes/123/edit'] });

            render(<RouterProvider router={router} />);

            expect(screen.getByText('Title is required')).toBeInTheDocument();
        });

        it('adds a new question when "Add Question" is clicked', async () => {
            const router = createMemoryRouter([
                {
                    path: '/admin/quizzes/123/edit',
                    element: <AdminEditQuiz loaderData={{ quiz: mockQuiz }} actionData={undefined} params={mockParams} matches={mockMatches} />
                }
            ], { initialEntries: ['/admin/quizzes/123/edit'] });

            render(<RouterProvider router={router} />);

            const addButtons = screen.getAllByText('+ Add Question');
            fireEvent.click(addButtons[0]);

            await waitFor(() => {
                const inputs = screen.getAllByDisplayValue('');
                expect(inputs.length).toBeGreaterThan(0);
            });
        });

        it('removes a question when "Remove Question" is clicked', async () => {
            const quizTwoQuestions: SerializedQuiz = {
                ...mockQuiz,
                questions: [
                    ...mockQuiz.questions,
                    {
                        id: 'q2',
                        text: 'Question 2',
                        type: 'multiple-choice',
                        options: ['Yes', 'No'],
                        scoreMapping: {}
                    }
                ]
            };

            const router = createMemoryRouter([
                {
                    path: '/admin/quizzes/123/edit',
                    element: <AdminEditQuiz loaderData={{ quiz: quizTwoQuestions }} actionData={undefined} params={mockParams} matches={mockMatches} />
                }
            ], { initialEntries: ['/admin/quizzes/123/edit'] });

            render(<RouterProvider router={router} />);

            expect(screen.getByDisplayValue('Question 1')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Question 2')).toBeInTheDocument();

            const removeButtons = screen.getAllByText('Remove');
            fireEvent.click(removeButtons[1]);

            await waitFor(() => {
                expect(screen.queryByDisplayValue('Question 2')).not.toBeInTheDocument();
                expect(screen.getByDisplayValue('Question 1')).toBeInTheDocument();
            });
        });

        it('duplicates a question when "Duplicate" is clicked', async () => {
            const router = createMemoryRouter([
                {
                    path: '/admin/quizzes/123/edit',
                    element: <AdminEditQuiz loaderData={{ quiz: mockQuiz }} actionData={undefined} params={mockParams} matches={mockMatches} />
                }
            ], { initialEntries: ['/admin/quizzes/123/edit'] });

            render(<RouterProvider router={router} />);

            const duplicateBtn = screen.getByText('Duplicate');
            fireEvent.click(duplicateBtn);

            await waitFor(() => {
                expect(screen.getByDisplayValue('Question 1 (Copy)')).toBeInTheDocument();
            });
        });

        it('updates question fields correctly', async () => {
            const router = createMemoryRouter([
                {
                    path: '/admin/quizzes/123/edit',
                    element: <AdminEditQuiz loaderData={{ quiz: mockQuiz }} actionData={undefined} params={mockParams} matches={mockMatches} />
                }
            ], { initialEntries: ['/admin/quizzes/123/edit'] });

            render(<RouterProvider router={router} />);

            const titleInput = screen.getByDisplayValue('Question 1');
            fireEvent.change(titleInput, { target: { value: 'Updated Q1' } });

            await waitFor(() => {
                expect(screen.getByDisplayValue('Updated Q1')).toBeInTheDocument();
            });
        });
    });
});
