import React from 'react';
import { QuestionEditor } from './QuestionEditor';
import { Button } from '~/components/Button';
import type { Question } from '~/types/quiz';

interface QuestionListProps {
    questions: Question[];
    onQuestionsChange: (questions: Question[]) => void;
    errors?: Record<string, string>;
}

export function QuestionList({ questions, onQuestionsChange, errors }: QuestionListProps) {
    const addQuestion = () => {
        const newQuestion: Question = {
            id: `${Date.now()}`,
            text: '',
            type: 'multiple-choice',
            options: ['', ''],
            scoreMapping: {},
        };
        onQuestionsChange([...questions, newQuestion]);
    };

    const updateQuestion = (index: number, updatedQuestion: Question) => {
        const newQuestions = [...questions];
        newQuestions[index] = updatedQuestion;
        onQuestionsChange(newQuestions);
    };

    const removeQuestion = (index: number) => {
        if (questions.length > 1) {
            onQuestionsChange(questions.filter((_, i) => i !== index));
        }
    };

    const duplicateQuestion = (index: number) => {
        const questionToDuplicate = questions[index];
        const newQuestion: Question = {
            ...questionToDuplicate,
            id: `${Date.now()}`,
            text: `${questionToDuplicate.text} (Copy)`,
        };
        const newQuestions = [...questions];
        newQuestions.splice(index + 1, 0, newQuestion);
        onQuestionsChange(newQuestions);
    };

    const moveQuestionUp = (index: number) => {
        if (index > 0) {
            const newQuestions = [...questions];
            [newQuestions[index - 1], newQuestions[index]] = [newQuestions[index], newQuestions[index - 1]];
            onQuestionsChange(newQuestions);
        }
    };

    const moveQuestionDown = (index: number) => {
        if (index < questions.length - 1) {
            const newQuestions = [...questions];
            [newQuestions[index + 1], newQuestions[index]] = [newQuestions[index], newQuestions[index + 1]];
            onQuestionsChange(newQuestions);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-warm-gray-900">
                    Questions
                </h2>
                <Button
                    type="button"
                    onClick={addQuestion}
                    variant="secondary"
                    size="sm"
                >
                    + Add Question
                </Button>
            </div>

            {errors?.questions && (
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-4 rounded-r-lg">
                    <p className="text-orange-800 text-sm">
                        {errors.questions}
                    </p>
                </div>
            )}

            <div className="space-y-6">
                {questions.map((question, index) => (
                    <QuestionEditor
                        key={question.id}
                        question={question}
                        index={index}
                        onChange={updateQuestion}
                        onRemove={removeQuestion}
                        onDuplicate={duplicateQuestion}
                        onMoveUp={moveQuestionUp}
                        onMoveDown={moveQuestionDown}
                        isFirst={index === 0}
                        isLast={index === questions.length - 1}
                    />
                ))}
            </div>
        </div>
    );
}
