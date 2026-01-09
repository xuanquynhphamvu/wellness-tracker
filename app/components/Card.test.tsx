
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
    it('renders children correctly', () => {
        render(<Card>Card Content</Card>);
        expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('applies default classes', () => {
        render(<Card data-testid="card" />);
        const card = screen.getByTestId('card');
        expect(card.className).toContain('bg-white');
        expect(card.className).toContain('rounded-3xl');
    });

    it('applies hover variant classes', () => {
        render(<Card variant="hover" data-testid="hover-card" />);
        const card = screen.getByTestId('hover-card');
        expect(card.className).toContain('hover:shadow-md');
        expect(card.className).toContain('cursor-pointer');
    });

    it('allows custom classNames', () => {
        render(<Card className="custom-class" data-testid="custom-card" />);
        const card = screen.getByTestId('custom-card');
        expect(card.className).toContain('custom-class');
    });
});
