import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import AdminQuizzes, { loader, action } from './admin.quizzes';
import * as authServer from '~/lib/auth.server';
import * as dbServer from '~/lib/db.server';

// Mock auth server
vi.mock('~/lib/auth.server', () => ({
    requireAdmin: vi.fn(),
}));

// Mock db server
vi.mock('~/lib/db.server', () => ({
    getCollection: vi.fn(),
    ObjectId: vi.fn(function (id) { return { toString: () => id }; }),
}));

describe('Admin Quizzes Route', () => {
    const mockDate = new Date('2024-01-01T00:00:00.000Z');

    beforeEach(() => {
        vi.clearAllMocks();
        vi.setSystemTime(mockDate);
    });

    describe('Loader', () => {
        it('returns serialized quizzes sorted by order and createdAt', async () => {
            const mockQuizzes = [
                { _id: '1', title: 'Quiz 1', slug: 'quiz-1', isPublished: true, order: 1, createdAt: mockDate, updatedAt: mockDate, questions: [] },
                { _id: '2', title: 'Quiz 2', slug: 'quiz-2', isPublished: false, order: 0, createdAt: mockDate, updatedAt: mockDate, questions: [] },
            ];

            const mockFindFn = {
                sort: vi.fn().mockReturnThis(),
                toArray: vi.fn().mockResolvedValue(mockQuizzes),
            };

            const mockCollection = {
                find: vi.fn().mockReturnValue(mockFindFn),
            };

            (dbServer.getCollection as any).mockResolvedValue(mockCollection);

            const result = await loader({ request: new Request('http://localhost'), params: {}, context: {} } as any);

            expect(dbServer.getCollection).toHaveBeenCalledWith('quizzes');
            expect(mockCollection.find).toHaveBeenCalledWith({});
            expect(mockFindFn.sort).toHaveBeenCalledWith({ order: 1, createdAt: -1 });
            expect(result.quizzes).toHaveLength(2);
            expect(result.quizzes[0].title).toBe('Quiz 1');
            expect(result.quizzes[0].isPublished).toBe(true);
            expect(result.quizzes[0].createdAt).toBe(mockDate.toISOString());
        });
    });

    describe('Action', () => {
        it('requires admin authentication', async () => {
            const formData = new FormData();
            const request = new Request('http://localhost', {
                method: 'POST',
                body: formData,
            });
            await action({ request, params: {}, context: {} } as any);
            expect(authServer.requireAdmin).toHaveBeenCalledWith(request);
        });

        it('handles delete intent', async () => {
            const formData = new FormData();
            formData.append('intent', 'delete');
            formData.append('quizId', '123');

            const mockCollection = {
                deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
            };
            (dbServer.getCollection as any).mockResolvedValue(mockCollection);

            const request = new Request('http://localhost', {
                method: 'POST',
                body: formData,
            });

            const response = await action({ request, params: {}, context: {} } as any);

            expect(mockCollection.deleteOne).toHaveBeenCalledWith(expect.anything());
            expect(response).toEqual(expect.objectContaining({ status: 302 }));
        });

        it('handles toggle-publish intent', async () => {
            const formData = new FormData();
            formData.append('intent', 'toggle-publish');
            formData.append('quizId', '123');

            const mockQuiz = { _id: '123', isPublished: false };
            const mockCollection = {
                findOne: vi.fn().mockResolvedValue(mockQuiz),
                updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
            };
            (dbServer.getCollection as any).mockResolvedValue(mockCollection);

            const request = new Request('http://localhost', {
                method: 'POST',
                body: formData,
            });

            const response = await action({ request, params: {}, context: {} } as any);

            expect(mockCollection.findOne).toHaveBeenCalledWith(expect.anything());
            expect(mockCollection.updateOne).toHaveBeenCalledWith(
                expect.anything(),
                {
                    $set: {
                        isPublished: true,
                        updatedAt: expect.any(Date),
                    }
                }
            );
            expect(response).toEqual(expect.objectContaining({ status: 302 }));
        });

        it('handles reorder intent (up)', async () => {
            const formData = new FormData();
            formData.append('intent', 'reorder');
            formData.append('quizId', '2');
            formData.append('direction', 'up');

            const mockQuizzes = [
                { _id: '1', title: 'Quiz 1', order: 0 },
                { _id: '2', title: 'Quiz 2', order: 1 },
                { _id: '3', title: 'Quiz 3', order: 2 },
            ];

            const mockFindFn = {
                sort: vi.fn().mockReturnThis(),
                toArray: vi.fn().mockResolvedValue([...mockQuizzes]), // Return copy
            };

            const mockCollection = {
                find: vi.fn().mockReturnValue(mockFindFn),
                updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
            };
            (dbServer.getCollection as any).mockResolvedValue(mockCollection);

            const request = new Request('http://localhost', {
                method: 'POST',
                body: formData,
            });

            await action({ request, params: {}, context: {} } as any);

            expect(mockCollection.updateOne).toHaveBeenCalledTimes(3);

            expect(mockCollection.updateOne).toHaveBeenCalledWith(
                { _id: '2' },
                { $set: { order: 0 } }
            );
        });
    });

    describe('Component', () => {
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

        it('renders list of quizzes with correct controls', () => {
            const mockQuizzes = [{
                _id: '1',
                title: 'Depression Test',
                slug: 'depression-test',
                description: 'Assess levels',
                questions: [],
                isPublished: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }, {
                _id: '2',
                title: 'Draft Quiz',
                slug: 'draft-quiz',
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

            // Check for buttons
            expect(screen.getByText('Unpublish')).toBeInTheDocument(); // For published quiz
            expect(screen.getByText('Publish')).toBeInTheDocument(); // For draft quiz

            // Check if delete confirmation is present (mocking window.confirm)
            const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);
            const deleteButtons = screen.getAllByText('Delete');

            act(() => {
                fireEvent.click(deleteButtons[0]);
            });

            expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this quiz?');
            confirmSpy.mockRestore();
        });
    });
});
