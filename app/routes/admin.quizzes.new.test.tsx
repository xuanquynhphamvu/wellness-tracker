import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import AdminNewQuiz, { action } from './admin.quizzes.new';
import type { Route } from './+types/admin.quizzes.new';

// Mock server-side utilities
vi.mock('~/lib/auth.server', () => ({
    requireAdmin: vi.fn(),
}));

const mockInsertOne = vi.fn();
vi.mock('~/lib/db.server', () => ({
    getCollection: vi.fn(() => ({
        insertOne: mockInsertOne,
    })),
    ObjectId: vi.fn(),
}));

// Mock Node modules
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

// Mock child components to simplify integration testing
vi.mock('~/components/QuestionEditor', () => ({
    QuestionEditor: ({ question, onDuplicate, onRemove }: { question: { id: string; text?: string }; onDuplicate: (index: number) => void; onRemove: (index: number) => void }) => (
        <div data-testid={`question-${question.id}`}>
            <div>{question.text || 'New Question'}</div>
            <button onClick={() => onDuplicate(0)}>Duplicate</button>
            <button onClick={() => onRemove(0)}>Remove</button>
        </div>
    )
}));

vi.mock('~/components/ScoreRangeEditor', () => ({
    ScoreRangeEditor: ({ onChange }: { onChange: (ranges: unknown[]) => void }) => (
        <button onClick={() => onChange([{ min: 0, max: 10, label: 'Low', description: 'Low Score', color: 'green' }])}>
            Add Score Range
        </button>
    )
}));

describe('Admin New Quiz Route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createTestRouter = (element: React.ReactNode) => {
        return createMemoryRouter([
            {
                path: '/admin/quizzes/new',
                element
            }
        ], { initialEntries: ['/admin/quizzes/new'] });
    };

    describe('Component', () => {
        it('renders the create quiz form', () => {
            const router = createTestRouter(
                <AdminNewQuiz
                    loaderData={undefined}
                    actionData={undefined}
                    params={{} as unknown as Route.ComponentProps['params']}
                    matches={[] as unknown as Route.ComponentProps['matches']}
                />
            );
            render(<RouterProvider router={router} />);

            expect(screen.getByText('Create New Quiz')).toBeInTheDocument();
            expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
            expect(screen.getByText('+ Add Question')).toBeInTheDocument();
            expect(screen.getByText('Create Quiz')).toBeInTheDocument();
        });

        it('adds a new question when "Add Question" is clicked', async () => {
            const router = createTestRouter(
                <AdminNewQuiz
                    loaderData={undefined}
                    actionData={undefined}
                    params={{} as unknown as Route.ComponentProps['params']}
                    matches={[] as unknown as Route.ComponentProps['matches']}
                />
            );
            render(<RouterProvider router={router} />);

            const addBtn = screen.getByText('+ Add Question');
            fireEvent.click(addBtn);

            // We mock QuestionEditor, so we count them or look for specific mock output
            // Initial state has 1 question. After click, should have 2.
            await waitFor(() => {
                const questions = screen.getAllByTestId(/^question-/);
                expect(questions).toHaveLength(2);
            });
        });

        it('updates hidden inputs when score ranges are added', async () => {
            const router = createTestRouter(
                <AdminNewQuiz
                    loaderData={undefined}
                    actionData={undefined}
                    params={{} as unknown as Route.ComponentProps['params']}
                    matches={[] as unknown as Route.ComponentProps['matches']}
                />
            );
            render(<RouterProvider router={router} />);

            // Click the mocked Add Score Range button
            fireEvent.click(screen.getByText('Add Score Range'));

            // Check hidden input
            const hiddenInput = document.querySelector('input[name="scoreRanges"]') as HTMLInputElement;
            expect(hiddenInput.value).toContain('Low Score');
        });

        it('updates quiz title', () => {
            const router = createTestRouter(
                <AdminNewQuiz
                    loaderData={undefined}
                    actionData={undefined}
                    params={{} as unknown as Route.ComponentProps['params']}
                    matches={[] as unknown as Route.ComponentProps['matches']}
                />
            );
            render(<RouterProvider router={router} />);

            const titleInput = screen.getByLabelText(/Title/i);
            fireEvent.change(titleInput, { target: { value: 'My New Quiz' } });

            expect(titleInput).toHaveValue('My New Quiz');
        });

        it('inputs optional text fields', () => {
            const router = createTestRouter(
                <AdminNewQuiz
                    loaderData={undefined}
                    actionData={undefined}
                    params={{} as unknown as Route.ComponentProps['params']}
                    matches={[] as unknown as Route.ComponentProps['matches']}
                />
            );
            render(<RouterProvider router={router} />);

            const baseTestInput = screen.getByPlaceholderText(/Patient Health Questionnaire 9/i);
            const shortNameInput = screen.getByPlaceholderText('e.g., PHQ-9');
            const instructionsInput = screen.getByPlaceholderText(/Explain how users should answer/i);

            fireEvent.change(baseTestInput, { target: { value: 'Base Test' } });
            fireEvent.change(shortNameInput, { target: { value: 'BT' } });
            fireEvent.change(instructionsInput, { target: { value: 'Do this.' } });

            expect(baseTestInput).toHaveValue('Base Test');
            expect(shortNameInput).toHaveValue('BT');
            expect(instructionsInput).toHaveValue('Do this.');
        });

        it('renders server validation errors', () => {
            const router = createTestRouter(
                <AdminNewQuiz
                    loaderData={undefined}
                    actionData={{ errors: { title: 'Validation Failed' } }}
                    params={{} as unknown as Route.ComponentProps['params']}
                    matches={[] as unknown as Route.ComponentProps['matches']}
                />
            );
            render(<RouterProvider router={router} />);

            expect(screen.getByText('Validation Failed')).toBeInTheDocument();
        });

        it('supports duplicating a question', async () => {
            const router = createTestRouter(
                <AdminNewQuiz
                    loaderData={undefined}
                    actionData={undefined}
                    params={{} as unknown as Route.ComponentProps['params']}
                    matches={[] as unknown as Route.ComponentProps['matches']}
                />
            );
            render(<RouterProvider router={router} />);

            const duplicateBtns = screen.getAllByText('Duplicate');
            fireEvent.click(duplicateBtns[0]);

            await waitFor(() => {
                const questions = screen.getAllByTestId(/^question-/);
                expect(questions).toHaveLength(2);
            });
        });

        it('supports removing a question', async () => {
            const router = createTestRouter(
                <AdminNewQuiz
                    loaderData={undefined}
                    actionData={undefined}
                    params={{} as unknown as Route.ComponentProps['params']}
                    matches={[] as unknown as Route.ComponentProps['matches']}
                />
            );
            render(<RouterProvider router={router} />);

            // Add a question first so we have 2
            fireEvent.click(screen.getByText('+ Add Question'));
            await waitFor(() => expect(screen.getAllByTestId(/^question-/)).toHaveLength(2));

            // Remove one
            const removeBtns = screen.getAllByText('Remove');
            fireEvent.click(removeBtns[0]);

            await waitFor(() => {
                const questions = screen.getAllByTestId(/^question-/);
                expect(questions).toHaveLength(1);
            });
        });
    });

    describe('Action', () => {
        const createRequest = (formData: FormData) => {
            return new Request('http://localhost/admin/quizzes/new', {
                method: 'POST',
                body: formData,
            });
        };

        const baseFormData = () => {
            const formData = new FormData();
            formData.append('title', 'Valid Title');
            formData.append('description', 'Valid Description');
            return formData;
        };

        it('returns validation errors for empty fields', async () => {
            const formData = new FormData();
            formData.append('title', '');
            formData.append('description', '');
            formData.append('questions', '[]');

            const response = await action({ request: createRequest(formData) } as Route.ActionArgs);

            expect(response).toHaveProperty('errors');
            const errors = (response as { errors: Record<string, string> }).errors;
            expect(errors).toHaveProperty('title');
            expect(errors).toHaveProperty('description');
            expect(errors).toHaveProperty('questions');
        });

        it('returns validation errors for invalid question data', async () => {
            const formData = baseFormData();
            const questions = [{
                id: '1',
                text: '', // Empty text
                type: 'multiple-choice',
                options: ['A', 'B']
            }];
            formData.append('questions', JSON.stringify(questions));

            const response = await action({ request: createRequest(formData) } as Route.ActionArgs);

            expect(response).toHaveProperty('errors');
            const errors = (response as { errors: Record<string, string> }).errors;
            expect(errors).toHaveProperty('question_0');
        });

        it('validates scale question min/max values', async () => {
            const formData = baseFormData();
            const questions = [{
                id: '1',
                text: 'Scale Q',
                type: 'scale',
                scaleMin: 5,
                scaleMax: 3 // Invalid: min > max
            }];
            formData.append('questions', JSON.stringify(questions));

            const response = await action({ request: createRequest(formData) } as Route.ActionArgs);

            expect(response).toHaveProperty('errors');
            const errors = (response as { errors: Record<string, string> }).errors;
            // Check message content roughly matches
            expect(errors['question_0']).toMatch(/min must be less than max/i);
        });

        it('creates a quiz and redirects on success', async () => {
            const formData = baseFormData();
            formData.append('questions', JSON.stringify([{
                id: '1', text: 'Q1', type: 'multiple-choice', options: ['Y', 'N']
            }]));
            // Add score ranges
            formData.append('scoreRanges', JSON.stringify([{
                min: 0, max: 5, label: 'Good', description: 'Good job', color: 'green'
            }]));

            const response = await action({ request: createRequest(formData) } as Route.ActionArgs);

            // Redirect check
            expect(response).toBeInstanceOf(Response);
            expect((response as Response).status).toBe(302);
            expect((response as Response).headers.get('Location')).toBe('/admin/quizzes');

            expect(mockInsertOne).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Valid Title',
                slug: 'valid-title',
                scoreRanges: expect.arrayContaining([
                    expect.objectContaining({ label: 'Good' })
                ])
            }));
        });

        it('handles file upload correctly', async () => {
            const formData = baseFormData();
            formData.append('questions', JSON.stringify([{
                id: '1', text: 'Q1', type: 'multiple-choice', options: ['A', 'B']
            }]));

            const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
            formData.append('coverImageFile', file);

            await action({ request: createRequest(formData) } as Route.ActionArgs);

            const fs = await import('node:fs/promises');
            expect(fs.writeFile).toHaveBeenCalled();
            expect(mockInsertOne).toHaveBeenCalledWith(expect.objectContaining({
                coverImage: '/uploads/mock-uuid.jpg'
            }));
        });

        it('handles file upload failure gracefully', async () => {
            const formData = baseFormData();
            formData.append('questions', JSON.stringify([{
                id: '1', text: 'Q1', type: 'multiple-choice', options: ['A', 'B']
            }]));

            const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
            formData.append('coverImageFile', file);

            // Mock fs failure
            const fs = await import('node:fs/promises');
            vi.mocked(fs.writeFile).mockRejectedValueOnce(new Error('Write failed'));

            // Warning: console.error might pollute test output, could spyOn it to suppress
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            await action({ request: createRequest(formData) } as Route.ActionArgs);

            // Should still proceed to create quiz, just without image (or with failure logged)
            // Implementation says: "Non-blocking error, proceed without image"
            expect(mockInsertOne).toHaveBeenCalled();

            // Verify we didn't crash
            expect(consoleSpy).toHaveBeenCalledWith("File upload failed:", expect.any(Error));
            consoleSpy.mockRestore();
        });
    });
});
