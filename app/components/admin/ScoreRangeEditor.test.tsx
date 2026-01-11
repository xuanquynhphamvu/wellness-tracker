
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScoreRangeEditor } from './ScoreRangeEditor';
import type { ScoreRange } from '~/types/quiz';

describe('ScoreRangeEditor', () => {
    const mockRanges: ScoreRange[] = [
        { min: 0, max: 5, status: 'Low', description: 'Low Score', color: 'green' },
        { min: 6, max: 10, status: 'High', description: 'High Score', color: 'orange' }
    ];

    const mockOnChange = vi.fn();

    it('renders empty message when no ranges', () => {
        render(<ScoreRangeEditor scoreRanges={[]} onChange={mockOnChange} />);
        expect(screen.getByText(/No score ranges defined/i)).toBeInTheDocument();
    });

    it('renders existing ranges', () => {
        render(<ScoreRangeEditor scoreRanges={mockRanges} onChange={mockOnChange} />);
        expect(screen.getByText('Range 1')).toBeInTheDocument();
        expect(screen.getByText('Range 2')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Low')).toBeInTheDocument();
        expect(screen.getByDisplayValue('High')).toBeInTheDocument();
    });

    it('add range button calls onChange with new range', () => {
        render(<ScoreRangeEditor scoreRanges={[]} onChange={mockOnChange} />);
        const addBtn = screen.getByText('+ Add Score Range');
        fireEvent.click(addBtn);

        expect(mockOnChange).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ min: 0, max: 10 })
        ]));
    });

    it('remove button calls onChange with filtered ranges', () => {
        render(<ScoreRangeEditor scoreRanges={mockRanges} onChange={mockOnChange} />);
        const removeBtns = screen.getAllByText('Remove');
        fireEvent.click(removeBtns[0]);

        expect(mockOnChange).toHaveBeenCalledWith([mockRanges[1]]);
    });

    it('updates range values', () => {
        render(<ScoreRangeEditor scoreRanges={mockRanges} onChange={mockOnChange} />);
        const inputs = screen.getAllByDisplayValue('Low'); // Status input
        fireEvent.change(inputs[0], { target: { value: 'Very Low' } });

        expect(mockOnChange).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ status: 'Very Low' }),
            mockRanges[1]
        ]));
    });
});
