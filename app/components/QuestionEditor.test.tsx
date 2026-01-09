
import { describe, it, expect, vi } from 'vitest';
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

    const mockOnChange = vi.fn();
    const mockOnRemove = vi.fn();
    const mockOnDuplicate = vi.fn();

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
});
