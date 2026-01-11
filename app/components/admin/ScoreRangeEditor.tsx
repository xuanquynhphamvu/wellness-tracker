import React from "react";
import type { ScoreRange } from "~/types/quiz";
import { Button } from "~/components/Button";
import { Card } from "~/components/Card";

interface ScoreRangeEditorProps {
    scoreRanges: ScoreRange[];
    onChange: (ranges: ScoreRange[]) => void;
}

export function ScoreRangeEditor({ scoreRanges, onChange }: ScoreRangeEditorProps) {
    // Add a new empty range
    const addRange = () => {
        const newRange: ScoreRange = {
            min: 0,
            max: 10,
            status: "",
            description: "",
            color: "gray",
        };
        onChange([...scoreRanges, newRange]);
    };

    // Remove a range by index
    const removeRange = (index: number) => {
        const newRanges = scoreRanges.filter((_, i) => i !== index);
        onChange(newRanges);
    };

    // Update a specific range
    const updateRange = (index: number, field: keyof ScoreRange, value: string | number) => {
        const newRanges = [...scoreRanges];
        newRanges[index] = { ...newRanges[index], [field]: value };
        onChange(newRanges);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-warm-gray-900">
                    Scoring Logic
                </h3>
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addRange}
                >
                    + Add Score Range
                </Button>
            </div>

            {scoreRanges.length === 0 ? (
                <div className="text-sm text-warm-gray-500 italic bg-warm-gray-50 p-4 rounded-lg">
                    No score ranges defined. The results page will use default generic feedback.
                </div>
            ) : (
                <div className="space-y-4">
                    {scoreRanges.map((range, index) => (
                        <Card key={index} className="p-4 bg-warm-gray-50/50">
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="text-sm font-bold text-warm-gray-700">
                                    Range {index + 1}
                                </h4>
                                <button
                                    type="button"
                                    onClick={() => removeRange(index)}
                                    className="text-orange-400 hover:text-orange-600 text-sm font-medium"
                                >
                                    Remove
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <label className="block text-xs font-semibold text-warm-gray-600 mb-1">
                                            Min Score
                                        </label>
                                        <input
                                            type="number"
                                            value={range.min}
                                            onChange={(e) => updateRange(index, "min", parseInt(e.target.value) || 0)}
                                            className="w-full px-3 py-2 rounded-lg border border-warm-gray-200 bg-white text-sm focus:ring-2 focus:ring-sage-500 outline-none"
                                        />
                                    </div>
                                    <span className="mt-6 text-warm-gray-400">-</span>
                                    <div className="flex-1">
                                        <label className="block text-xs font-semibold text-warm-gray-600 mb-1">
                                            Max Score
                                        </label>
                                        <input
                                            type="number"
                                            value={range.max}
                                            onChange={(e) => updateRange(index, "max", parseInt(e.target.value) || 0)}
                                            className="w-full px-3 py-2 rounded-lg border border-warm-gray-200 bg-white text-sm focus:ring-2 focus:ring-sage-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-warm-gray-600 mb-1">
                                        Status Label (e.g., &ldquo;High Risk&rdquo;)
                                    </label>
                                    <input
                                        type="text"
                                        value={range.status}
                                        onChange={(e) => updateRange(index, "status", e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-warm-gray-200 bg-white text-sm focus:ring-2 focus:ring-sage-500 outline-none"
                                        placeholder="Enter status..."
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-xs font-semibold text-warm-gray-600 mb-1">
                                    Description / Feedback
                                </label>
                                <textarea
                                    rows={2}
                                    value={range.description}
                                    onChange={(e) => updateRange(index, "description", e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-warm-gray-200 bg-white text-sm focus:ring-2 focus:ring-sage-500 outline-none resize-none"
                                    placeholder="Explanation for the user..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-warm-gray-600 mb-2">
                                    Color Theme
                                </label>
                                <div className="flex gap-2">
                                    {(['green', 'yellow', 'orange', 'gray'] as const).map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => updateRange(index, "color", color)}
                                            className={`
                                                w-8 h-8 rounded-full border-2 transition-all
                                                ${range.color === color ? 'border-warm-gray-900 scale-110' : 'border-transparent opacity-60 hover:opacity-100'}
                                                ${color === 'green' ? 'bg-green-100' : ''}
                                                ${color === 'yellow' ? 'bg-yellow-100' : ''}
                                                ${color === 'orange' ? 'bg-orange-100' : ''}
                                                ${color === 'gray' ? 'bg-gray-200' : ''}
                                            `}
                                            aria-label={`Select ${color} color`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
