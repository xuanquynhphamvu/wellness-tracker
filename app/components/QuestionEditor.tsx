import type { Question } from '~/types/quiz';

interface QuestionEditorProps {
    question: Question;
    index: number;
    onChange: (index: number, updatedQuestion: Question) => void;
    onRemove: (index: number) => void;
    onDuplicate: (index: number) => void;
}

export function QuestionEditor({ question, index, onChange, onRemove, onDuplicate }: QuestionEditorProps) {
    const updateQuestion = (updates: Partial<Question>) => {
        onChange(index, { ...question, ...updates });
    };

    const addOption = () => {
        const newOptions = [...(question.options || []), ''];
        updateQuestion({ options: newOptions });
    };

    const updateOption = (optionIndex: number, value: string) => {
        const newOptions = [...(question.options || [])];
        newOptions[optionIndex] = value;
        updateQuestion({ options: newOptions });
    };

    const removeOption = (optionIndex: number) => {
        const newOptions = question.options?.filter((_, i) => i !== optionIndex);
        updateQuestion({ options: newOptions });
    };

    const updateScoreMapping = (option: string, score: number) => {
        const newScoreMapping = { ...(question.scoreMapping || {}), [option]: score };
        updateQuestion({ scoreMapping: newScoreMapping });
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-4">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Question {index + 1}
                </h3>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => onDuplicate(index)}
                        className="text-sage-600 hover:text-sage-700 font-medium"
                    >
                        Duplicate
                    </button>
                    <button
                        type="button"
                        onClick={() => onRemove(index)}
                        className="text-orange-600 hover:text-orange-700 font-medium"
                    >
                        Remove
                    </button>
                </div>
            </div>

            {/* Question Text */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Question Text *
                </label>
                <input
                    type="text"
                    value={question.text}
                    onChange={(e) => updateQuestion({ text: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your question..."
                    required
                />
            </div>

            {/* Question Type */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Question Type *
                </label>
                <select
                    value={question.type}
                    onChange={(e) => {
                        const newType = e.target.value as Question['type'];
                        updateQuestion({
                            type: newType,
                            // Reset type-specific fields
                            options: newType === 'multiple-choice' ? [''] : undefined,
                            scoreMapping: newType === 'multiple-choice' ? {} : undefined,
                            scaleMin: newType === 'scale' ? 1 : undefined,
                            scaleMax: newType === 'scale' ? 10 : undefined,
                        });
                    }}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="scale">Scale (1-10)</option>
                    <option value="text">Text Response</option>
                </select>
            </div>

            {/* Multiple Choice Options */}
            {question.type === 'multiple-choice' && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Answer Options
                    </label>
                    <div className="space-y-2">
                        {question.options?.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex gap-2">
                                <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => updateOption(optionIndex, e.target.value)}
                                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder={`Option ${optionIndex + 1}`}
                                    required
                                />
                                <input
                                    type="number"
                                    value={question.scoreMapping?.[option] || 0}
                                    onChange={(e) => updateScoreMapping(option, parseInt(e.target.value) || 0)}
                                    className="w-24 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Score"
                                    title="Score for this option"
                                />
                                {question.options && question.options.length > 2 && (
                                    <button
                                        type="button"
                                        onClick={() => removeOption(optionIndex)}
                                        className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={addOption}
                        className="mt-2 px-4 py-2 bg-sage-500 hover:bg-sage-600 text-white rounded-lg font-medium"
                    >
                        + Add Option
                    </button>
                </div>
            )}

            {/* Scale Settings */}
            {question.type === 'scale' && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Minimum Value
                        </label>
                        <input
                            type="number"
                            value={question.scaleMin || 1}
                            onChange={(e) => updateQuestion({ scaleMin: parseInt(e.target.value) || 1 })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Maximum Value
                        </label>
                        <input
                            type="number"
                            value={question.scaleMax || 10}
                            onChange={(e) => updateQuestion({ scaleMax: parseInt(e.target.value) || 10 })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>
            )}

            {/* Text Response Info */}
            {question.type === 'text' && (
                <div className="bg-sage-50 dark:bg-sage-900/20 border-l-4 border-sage-500 p-4">
                    <p className="text-sm text-sage-800 dark:text-sage-300">
                        Text responses allow users to type free-form answers. No scoring is applied.
                    </p>
                </div>
            )}
        </div>
    );
}
