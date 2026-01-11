import type { Question } from '~/types/quiz';

interface QuestionEditorProps {
    question: Question;
    index: number;
    onChange: (index: number, updatedQuestion: Question) => void;
    onRemove: (index: number) => void;
    onDuplicate: (index: number) => void;
    onMoveUp?: (index: number) => void;
    onMoveDown?: (index: number) => void;
    isFirst?: boolean;
    isLast?: boolean;
}

export function QuestionEditor({ 
    question, 
    index, 
    onChange, 
    onRemove, 
    onDuplicate,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast
}: QuestionEditorProps) {
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
        <div className="bg-white dark:bg-warm-gray-800 rounded-3xl p-8 border border-warm-gray-100 dark:border-warm-gray-700 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex justify-between items-start mb-8 pb-6 border-b border-warm-gray-50 dark:border-warm-gray-700/50">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col bg-warm-gray-50 dark:bg-warm-gray-900/50 rounded-xl p-1 border border-warm-gray-100 dark:border-warm-gray-700">
                        <button
                            type="button"
                            onClick={() => onMoveUp?.(index)}
                            disabled={isFirst}
                            className="p-1.5 text-warm-gray-400 hover:text-sage-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                            title="Move Up"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            onClick={() => onMoveDown?.(index)}
                            disabled={isLast}
                            className="p-1.5 text-warm-gray-400 hover:text-sage-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                            title="Move Down"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-warm-gray-900 dark:text-white">
                            Question {index + 1}
                        </h3>
                        <p className="text-sm text-warm-gray-400 font-medium">
                            {question.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => onDuplicate(index)}
                        className="px-4 py-2 text-sm font-semibold text-sage-600 hover:bg-sage-50 dark:hover:bg-sage-900/20 rounded-xl transition-all"
                    >
                        Duplicate
                    </button>
                    <button
                        type="button"
                        onClick={() => onRemove(index)}
                        className="px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-all"
                    >
                        Remove
                    </button>
                </div>
            </div>

            {/* Question Text */}
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-warm-gray-700 dark:text-warm-gray-300 mb-2">
                        Question Text *
                    </label>
                    <input
                        type="text"
                        value={question.text}
                        onChange={(e) => updateQuestion({ text: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-warm-gray-200 dark:border-warm-gray-700 bg-warm-gray-50 dark:bg-warm-gray-900/50 text-warm-gray-900 dark:text-white focus:ring-2 focus:ring-sage-500/20 focus:border-sage-500 transition-all outline-none"
                        placeholder="e.g., How often do you feel focused?"
                        required
                    />
                </div>

                {/* Question Type */}
                <div>
                    <label className="block text-sm font-semibold text-warm-gray-700 dark:text-gray-300 mb-2">
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
                        className="w-full px-4 py-3 rounded-xl border border-warm-gray-200 dark:border-warm-gray-700 bg-warm-gray-50 dark:bg-warm-gray-900/50 text-warm-gray-900 dark:text-white focus:ring-2 focus:ring-sage-500/20 focus:border-sage-500 transition-all outline-none appearance-none"
                    >
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="scale">Scale (Range)</option>
                        <option value="text">Text Response (Unscored)</option>
                    </select>
                </div>

                {/* Multiple Choice Options */}
                {question.type === 'multiple-choice' && (
                    <div className="pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-sm font-semibold text-warm-gray-700 dark:text-gray-300 mb-4">
                            Answer Options & Scoring
                        </label>
                        <div className="space-y-3 mb-6">
                            {question.options?.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex gap-3 group">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={option}
                                            onChange={(e) => updateOption(optionIndex, e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-warm-gray-200 dark:border-warm-gray-700 bg-white dark:bg-warm-gray-900 text-warm-gray-900 dark:text-white focus:ring-2 focus:ring-sage-500/20 focus:border-sage-500 transition-all outline-none"
                                            placeholder={`Option ${optionIndex + 1}`}
                                            required
                                        />
                                    </div>
                                    <div className="w-28 relative">
                                        <input
                                            type="number"
                                            value={question.scoreMapping?.[option] || 0}
                                            onChange={(e) => updateScoreMapping(option, parseInt(e.target.value) || 0)}
                                            className="w-full px-4 py-3 rounded-xl border border-warm-gray-200 dark:border-warm-gray-700 bg-white dark:bg-warm-gray-900 text-warm-gray-900 dark:text-white focus:ring-2 focus:ring-sage-500/20 focus:border-sage-500 transition-all outline-none"
                                            placeholder="Score"
                                        />
                                        <span className="absolute -top-2 left-3 px-1 bg-white dark:bg-warm-gray-900 text-[10px] font-bold text-warm-gray-400 uppercase tracking-wider">
                                            Points
                                        </span>
                                    </div>
                                    {question.options && question.options.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => removeOption(optionIndex)}
                                            className="p-3 text-warm-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-all"
                                            title="Remove Option"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={addOption}
                            className="flex items-center gap-2 text-sm font-bold text-sage-600 hover:text-sage-700 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add another option
                        </button>
                    </div>
                )}

                {/* Scale Settings */}
                {question.type === 'scale' && (
                    <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div>
                            <label className="block text-sm font-semibold text-warm-gray-700 dark:text-gray-300 mb-2">
                                Minimum Value
                            </label>
                            <input
                                type="number"
                                value={question.scaleMin || 1}
                                onChange={(e) => updateQuestion({ scaleMin: parseInt(e.target.value) || 1 })}
                                className="w-full px-4 py-3 rounded-xl border border-warm-gray-200 dark:border-warm-gray-700 bg-white dark:bg-warm-gray-900 text-warm-gray-900 dark:text-white focus:ring-2 focus:ring-sage-500/20 focus:border-sage-500 transition-all outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-warm-gray-700 dark:text-gray-300 mb-2">
                                Maximum Value
                            </label>
                            <input
                                type="number"
                                value={question.scaleMax || 10}
                                onChange={(e) => updateQuestion({ scaleMax: parseInt(e.target.value) || 10 })}
                                className="w-full px-4 py-3 rounded-xl border border-warm-gray-200 dark:border-warm-gray-700 bg-white dark:bg-warm-gray-900 text-warm-gray-900 dark:text-white focus:ring-2 focus:ring-sage-500/20 focus:border-sage-500 transition-all outline-none"
                            />
                        </div>
                    </div>
                )}

                {/* Text Response Info */}
                {question.type === 'text' && (
                    <div className="mt-4 bg-sage-50 dark:bg-sage-900/20 border-l-4 border-sage-500 p-5 rounded-r-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex gap-3">
                            <svg className="w-5 h-5 text-sage-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-sage-800 dark:text-sage-300 leading-relaxed">
                                <span className="font-bold">Text responses</span> allow users to type free-form answers. This type of question is primarily for qualitative reflection and <span className="underline decoration-sage-300">does not contribute to the final numerical score</span>.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
