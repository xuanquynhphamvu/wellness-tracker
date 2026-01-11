import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressChart } from './ProgressChart';

describe('ProgressChart', () => {
    const mockData = [
        { date: '2023-01-01', score: 5 },
        { date: '2023-01-02', score: 7 },
        { date: '2023-01-03', score: 6 },
    ];

    // Mock ResponsiveContainer from recharts to have a fixed width/height during tests
    // This is often necessary because ResponsiveContainer relies on DOM measurement
    // which might not work perfectly in jsdom without mocks or polyfills.
    // However, for basic rendering tests, we might try without mocking first
    // or use a simple mock if it fails. Let's try mocking since it's a known issue.
    // Actually, Recharts components can be tricky to test. A common strategy is to check if it renders without crashing.

    it('renders without crashing', () => {
        render(<ProgressChart data={mockData} color="#10B981" />);
        // Since charts are SVGs, finding specific text might be hard depending on configuration.
        // But we can check if the container renders.
        // We'll give the component a data-testid.
        expect(screen.getByTestId('progress-chart')).toBeInTheDocument();
    });

    it('renders placeholder when no data', () => {
        render(<ProgressChart data={[]} color="#10B981" />);
        expect(screen.getByText('No data available')).toBeInTheDocument();
    });
});
