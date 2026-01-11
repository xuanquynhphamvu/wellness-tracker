
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';
import { MemoryRouter } from 'react-router';

describe('Button', () => {
    it('renders children correctly', () => {
        render(<Button>Click Me</Button>);
        expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('renders as a link when "to" prop is present', () => {
        render(
            <MemoryRouter>
                <Button to="/home">Go Home</Button>
            </MemoryRouter>
        );
        const link = screen.getByRole('link', { name: /go home/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/home');
    });

    it('applies variant classes', () => {
        render(<Button variant="secondary">Secondary</Button>);
        const button = screen.getByRole('button', { name: /secondary/i });
        expect(button.className).toContain('bg-sage-100');
    });

    it('passes standard HTML attributes', () => {
        render(<Button type="submit" disabled>Submit</Button>);
        const button = screen.getByRole('button', { name: /submit/i });
        expect(button).toHaveAttribute('type', 'submit');
        expect(button).toBeDisabled();
    });
});
