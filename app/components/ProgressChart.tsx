import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface ProgressChartProps {
    data: { date: string; score: number }[];
    color: string;
    height?: number;
}

export function ProgressChart({ data, color, height = 200 }: ProgressChartProps) {
    if (!data || data.length === 0) {
        return (
            <div
                data-testid="progress-chart"
                className="flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-400 dark:text-gray-500 text-sm"
                style={{ height }}
            >
                No data available
            </div>
        );
    }

    return (
        <div data-testid="progress-chart" style={{ height, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: '#9CA3AF' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        tick={{ fontSize: 10, fill: '#9CA3AF' }}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 10]} // Assuming 0-10 scale usually, could be dynamic
                        allowDecimals={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            borderRadius: '0.5rem',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            fontSize: '12px'
                        }}
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Line
                        type="monotone"
                        dataKey="score"
                        stroke={color}
                        strokeWidth={2}
                        dot={{ r: 3, fill: color, strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
