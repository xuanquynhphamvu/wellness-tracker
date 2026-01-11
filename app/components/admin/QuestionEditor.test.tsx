import React from 'react';
import { describe, it, expect, vi, type Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionEditor } from './QuestionEditor';
import type { Question } from '~/types/quiz';

describe('QuestionEditor', () => {
    const mockQuestion: Question = {
        id: '1',
        text: 'Test Question',
        type: 'multiple-choice',
        options: ['Yes', 'No'],
        scoreMapping: {}
    };

    const mockOnChange = vi.fn() as Mock<(index: number, updatedQuestion: Question) => void>;
    const mockOnRemove = vi.fn() as Mock<(index: number) => void>;
    const mockOnDuplicate = vi.fn() as Mock<(index: number) => void>;

    const defaultProps = {
        question: mockQuestion,
        index: 0,
        onChange: mockOnChange,
        onRemove: mockOnRemove,
        onDuplicate: mockOnDuplicate
    };

    it('renders question text input', () => {
        render(<QuestionEditor {...defaultProps} />);
        const input = screen.getByDisplayValue('Test Question');
        expect(input).toBeInTheDocument();
    });

    it('calls onChange when text updates', () => {
        render(<QuestionEditor {...defaultProps} />);
        const input = screen.getByDisplayValue('Test Question');
        fireEvent.change(input, { target: { value: 'New Text' } });

        expect(mockOnChange).toHaveBeenCalledWith(0, expect.objectContaining({
            text: 'New Text'
        }));
    });

    it('calls onDuplicate when duplicate button clicked', () => {
        render(<QuestionEditor {...defaultProps} />);
        const duplicateBtn = screen.getByText('Duplicate');
        fireEvent.click(duplicateBtn);
        expect(mockOnDuplicate).toHaveBeenCalledWith(0);
    });

    it('calls onRemove when remove button clicked', () => {
        render(<QuestionEditor {...defaultProps} />);
        const removeBtn = screen.getByText('Remove');
        fireEvent.click(removeBtn);
        expect(mockOnRemove).toHaveBeenCalledWith(0);
    });

    it('updates question category', () => {
        render(<QuestionEditor {...defaultProps} />);
        const categoryInput = screen.getByPlaceholderText(/Stress, Anxiety, Depression/i);
        fireEvent.change(categoryInput, { target: { value: 'Stress' } });

        expect(mockOnChange).toHaveBeenCalledWith(0, expect.objectContaining({
            category: 'Stress'
        }));
    });

    it('renders options for multiple-choice', () => {
        render(<QuestionEditor {...defaultProps} />);
        expect(screen.getByDisplayValue('Yes')).toBeInTheDocument();
        expect(screen.getByDisplayValue('No')).toBeInTheDocument();
    });

    it('updates option text', () => {
        render(<QuestionEditor {...defaultProps} />);
        const optionInput = screen.getByDisplayValue('Yes');
        fireEvent.change(optionInput, { target: { value: 'Perhaps' } });

        expect(mockOnChange).toHaveBeenCalledWith(0, expect.objectContaining({
            options: ['Perhaps', 'No']
        }));
    });

    it('adds a new option', () => {
        render(<QuestionEditor {...defaultProps} />);
        const addBtn = screen.getByText(/Add another option/i);
        fireEvent.click(addBtn);

        expect(mockOnChange).toHaveBeenCalledWith(0, expect.objectContaining({
            options: ['Yes', 'No', '']
        }));
    });

    it('removes an option', () => {
        const questionWithOptions: Question = {
            ...mockQuestion,
            options: ['A', 'B', 'C']
        };
        render(<QuestionEditor {...defaultProps} question={questionWithOptions} />);
        
        const removeBtns = screen.getAllByTitle(/Remove Option/i);
        fireEvent.click(removeBtns[0]);

        expect(mockOnChange).toHaveBeenCalledWith(0, expect.objectContaining({
            options: ['B', 'C']
        }));
    });

    it('changes question type', () => {
        render(<QuestionEditor {...defaultProps} />);
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'scale' } });

        expect(mockOnChange).toHaveBeenCalledWith(0, expect.objectContaining({
            type: 'scale',
            scaleMin: 1,
            scaleMax: 10
        }));
    });

    it('updates scale min/max values', () => {
        const scaleQuestion: Question = {
            ...mockQuestion,
            type: 'scale',
            scaleMin: 1,
            scaleMax: 10
        };
        render(<QuestionEditor {...defaultProps} question={scaleQuestion} />);
        
        const minInput = screen.getByDisplayValue('1');
        fireEvent.change(minInput, { target: { value: '2' } });
        
        expect(mockOnChange).toHaveBeenCalledWith(0, expect.objectContaining({
            scaleMin: 2
        }));
    });

    it('renders text response info', () => {
        const textQuestion: Question = {
            ...mockQuestion,
            type: 'text'
        };
        render(<QuestionEditor {...defaultProps} question={textQuestion} />);
        
        expect(screen.getByText(/allow users to type free-form answers/)).toBeInTheDocument();
    });

    it('updates score mapping', () => {
        render(<QuestionEditor {...defaultProps} />);
        const scoreInput = screen.getAllByPlaceholderText('Score')[0];
        fireEvent.change(scoreInput, { target: { value: '5' } });

        expect(mockOnChange).toHaveBeenCalledWith(0, expect.objectContaining({
            scoreMapping: expect.objectContaining({
                'Yes': 5
            })
        }));
    });
});
