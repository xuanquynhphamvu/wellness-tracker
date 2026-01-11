import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionList } from './QuestionList';
import type { Question } from '~/types/quiz';

describe('QuestionList', () => {
    const mockQuestions: Question[] = [
        {
            id: '1',
            text: 'Question 1',
            type: 'text',
        }
    ];

    const mockOnQuestionsChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const defaultProps = {
        questions: mockQuestions,
        onQuestionsChange: mockOnQuestionsChange,
    };

    it('renders questions', () => {
        render(<QuestionList {...defaultProps} />);
        expect(screen.getByText('Question 1')).toBeInTheDocument();
    });

    it('calls onQuestionsChange when adding a question', () => {
        render(<QuestionList {...defaultProps} />);
        const addBtn = screen.getByText('+ Add Question');
        fireEvent.click(addBtn);

        expect(mockOnQuestionsChange).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ text: 'Question 1' }),
            expect.objectContaining({ text: '', type: 'multiple-choice' })
        ]));
    });

    it('calls onQuestionsChange when removing a question', () => {
        const twoQuestions = [
            ...mockQuestions,
            { id: '2', text: 'Question 2', type: 'text' }
        ];
        render(<QuestionList {...defaultProps} questions={twoQuestions} />);
        
        const removeBtns = screen.getAllByText('Remove');
        fireEvent.click(removeBtns[0]);

        expect(mockOnQuestionsChange).toHaveBeenCalledWith([
            expect.objectContaining({ text: 'Question 2' })
        ]);
    });

    it('does not remove last question', () => {
        render(<QuestionList {...defaultProps} />);
        const removeBtn = screen.getByText('Remove');
        fireEvent.click(removeBtn);
        expect(mockOnQuestionsChange).not.toHaveBeenCalled();
    });

    it('calls onQuestionsChange when duplicating a question', () => {
        render(<QuestionList {...defaultProps} />);
        const duplicateBtn = screen.getByText('Duplicate');
        fireEvent.click(duplicateBtn);

        expect(mockOnQuestionsChange).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ text: 'Question 1' }),
            expect.objectContaining({ text: 'Question 1 (Copy)' })
        ]));
    });

    it('renders error message', () => {
        render(<QuestionList {...defaultProps} errors={{ questions: 'Error message' }} />);
        expect(screen.getByText('Error message')).toBeInTheDocument();
    });
});
