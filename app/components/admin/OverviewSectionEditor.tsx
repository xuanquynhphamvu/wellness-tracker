import React, { useState } from 'react';
import type { OverviewSection } from '~/types/quiz';
import { Card } from '~/components/Card';
import { Button } from '~/components/Button';

interface OverviewSectionEditorProps {
    sections: OverviewSection[];
    onChange: (sections: OverviewSection[]) => void;
}

const SECTION_TYPES = [
    { value: 'purpose', label: 'Purpose of the Test', defaultTitle: 'Purpose of the Test' },
    { value: 'target-audience', label: 'Who the Test Is For', defaultTitle: 'Who the Test Is For' },
    { value: 'question-basis', label: 'What the Questions Are Based On', defaultTitle: 'What the Questions Are Based On' },
    { value: 'format', label: 'Test Format', defaultTitle: 'Test Format' },
    { value: 'scoring', label: 'How Scoring Works', defaultTitle: 'How Scoring Works' },
    { value: 'interpretation', label: 'How to Interpret Results', defaultTitle: 'How to Interpret Results' },
    { value: 'limitations', label: 'Limitations & Disclaimer', defaultTitle: 'Limitations & Disclaimer' },
    { value: 'seek-help', label: 'When to Seek Help', defaultTitle: 'When to Seek Help' },
    { value: 'privacy', label: 'Privacy & Data Use', defaultTitle: 'Privacy & Data Use' },
    { value: 'scientific-background', label: 'Scientific Background', defaultTitle: 'Scientific Background' },
    { value: 'custom', label: 'Custom Section', defaultTitle: 'Custom Section' },
] as const;

const TITLE_CHAR_LIMIT = 100;
const CONTENT_CHAR_LIMIT = 500;

export function OverviewSectionEditor({ sections, onChange }: OverviewSectionEditorProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
    const [previewMode, setPreviewMode] = useState(false);

    const toggleSection = (id: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedSections(newExpanded);
    };

    const addSection = () => {
        const newSection: OverviewSection = {
            id: `section-${Date.now()}`,
            type: 'purpose',
            title: 'Purpose of the Test',
            content: '',
            visible: true,
            order: sections.length,
        };
        onChange([...sections, newSection]);
        setExpandedSections(new Set([...expandedSections, newSection.id]));
    };

    const updateSection = (id: string, updates: Partial<OverviewSection>) => {
        onChange(sections.map(section => 
            section.id === id ? { ...section, ...updates } : section
        ));
    };

    const deleteSection = (id: string) => {
        const newSections = sections
            .filter(section => section.id !== id)
            .map((section, index) => ({ ...section, order: index }));
        onChange(newSections);
        const newExpanded = new Set(expandedSections);
        newExpanded.delete(id);
        setExpandedSections(newExpanded);
    };

    const moveSection = (id: string, direction: 'up' | 'down') => {
        const index = sections.findIndex(s => s.id === id);
        if (index === -1) return;
        
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= sections.length) return;

        const newSections = [...sections];
        [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
        
        // Update order values
        const reordered = newSections.map((section, idx) => ({ ...section, order: idx }));
        onChange(reordered);
    };

    const handleTypeChange = (id: string, newType: OverviewSection['type']) => {
        const defaultTitle = SECTION_TYPES.find(t => t.value === newType)?.defaultTitle || 'Custom Section';
        updateSection(id, { type: newType, title: defaultTitle });
    };

    const visibleSections = sections.filter(s => s.visible).sort((a, b) => a.order - b.order);

    if (previewMode) {
        return (
            <Card className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-warm-gray-900">
                        Overview Preview
                    </h2>
                    <Button
                        type="button"
                        onClick={() => setPreviewMode(false)}
                        variant="ghost"
                        size="sm"
                    >
                        Exit Preview
                    </Button>
                </div>

                <div className="space-y-6 max-w-3xl">
                    {visibleSections.length === 0 ? (
                        <p className="text-warm-gray-500 text-center py-8">
                            No visible sections to preview
                        </p>
                    ) : (
                        visibleSections.map(section => (
                            <div key={section.id} className="bg-white p-6 rounded-2xl shadow-sm border border-warm-gray-100">
                                <h3 className="text-lg font-semibold text-warm-gray-900 mb-3">
                                    {section.title}
                                </h3>
                                <p className="text-warm-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {section.content || <span className="text-warm-gray-400 italic">No content</span>}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-warm-gray-900">
                    Test Overview / Info Page
                </h2>
                <div className="flex gap-2">
                    {sections.length > 0 && (
                        <Button
                            type="button"
                            onClick={() => setPreviewMode(true)}
                            variant="ghost"
                            size="sm"
                        >
                            👁 Preview
                        </Button>
                    )}
                    <Button
                        type="button"
                        onClick={addSection}
                        variant="primary"
                        size="sm"
                    >
                        + Add Section
                    </Button>
                </div>
            </div>

            {sections.length === 0 ? (
                <div className="text-center py-12 bg-warm-gray-50 rounded-xl">
                    <p className="text-warm-gray-500 mb-4">
                        No overview sections yet. Add sections to provide information about this test.
                    </p>
                    <Button
                        type="button"
                        onClick={addSection}
                        variant="primary"
                        size="md"
                    >
                        + Add First Section
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {sections.map((section, index) => {
                        const isExpanded = expandedSections.has(section.id);
                        const titleLength = section.title.length;
                        const contentLength = section.content.length;

                        return (
                            <div
                                key={section.id}
                                className={`border-2 rounded-xl transition-all ${
                                    section.visible 
                                        ? 'border-warm-gray-200 bg-white' 
                                        : 'border-warm-gray-100 bg-warm-gray-50 opacity-60'
                                }`}
                            >
                                {/* Section Header */}
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                        <button
                                            type="button"
                                            onClick={() => toggleSection(section.id)}
                                            className="text-warm-gray-400 hover:text-warm-gray-600 transition-colors"
                                        >
                                            {isExpanded ? '▼' : '▶'}
                                        </button>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-warm-gray-900">
                                                    {section.title || 'Untitled Section'}
                                                </span>
                                                {!section.visible && (
                                                    <span className="text-xs px-2 py-0.5 bg-warm-gray-200 text-warm-gray-600 rounded">
                                                        Hidden
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-warm-gray-500 mt-0.5">
                                                {SECTION_TYPES.find(t => t.value === section.type)?.label}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Visibility Toggle */}
                                        <button
                                            type="button"
                                            onClick={() => updateSection(section.id, { visible: !section.visible })}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                                section.visible
                                                    ? 'bg-sage-100 text-sage-700 hover:bg-sage-200'
                                                    : 'bg-warm-gray-200 text-warm-gray-600 hover:bg-warm-gray-300'
                                            }`}
                                            title={section.visible ? 'Hide section' : 'Show section'}
                                        >
                                            {section.visible ? '👁' : '👁‍🗨'}
                                        </button>

                                        {/* Move Up/Down */}
                                        <div className="flex flex-col gap-0.5">
                                            <button
                                                type="button"
                                                onClick={() => moveSection(section.id, 'up')}
                                                disabled={index === 0}
                                                className="px-2 py-0.5 text-xs text-warm-gray-500 hover:text-warm-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="Move up"
                                            >
                                                ▲
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => moveSection(section.id, 'down')}
                                                disabled={index === sections.length - 1}
                                                className="px-2 py-0.5 text-xs text-warm-gray-500 hover:text-warm-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="Move down"
                                            >
                                                ▼
                                            </button>
                                        </div>

                                        {/* Delete */}
                                        <button
                                            type="button"
                                            onClick={() => deleteSection(section.id)}
                                            className="px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                            title="Delete section"
                                        >
                                            🗑
                                        </button>
                                    </div>
                                </div>

                                {/* Section Content (Expanded) */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 space-y-4 border-t border-warm-gray-100 pt-4">
                                        {/* Section Type */}
                                        <div>
                                            <label className="block text-sm font-semibold text-warm-gray-700 mb-2">
                                                Section Type
                                            </label>
                                            <select
                                                value={section.type}
                                                onChange={(e) => handleTypeChange(section.id, e.target.value as OverviewSection['type'])}
                                                className="w-full px-4 py-2 rounded-xl border border-warm-gray-200 bg-warm-gray-50 text-warm-gray-900 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all outline-none"
                                            >
                                                {SECTION_TYPES.map(type => (
                                                    <option key={type.value} value={type.value}>
                                                        {type.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Title */}
                                        <div>
                                            <label className="block text-sm font-semibold text-warm-gray-700 mb-2">
                                                Section Title
                                                <span className={`ml-2 text-xs font-normal ${
                                                    titleLength > TITLE_CHAR_LIMIT ? 'text-orange-600' : 'text-warm-gray-400'
                                                }`}>
                                                    ({titleLength}/{TITLE_CHAR_LIMIT})
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                value={section.title}
                                                onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                                maxLength={TITLE_CHAR_LIMIT}
                                                className="w-full px-4 py-2 rounded-xl border border-warm-gray-200 bg-warm-gray-50 text-warm-gray-900 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all outline-none"
                                                placeholder="Enter section title..."
                                            />
                                        </div>

                                        {/* Content */}
                                        <div>
                                            <label className="block text-sm font-semibold text-warm-gray-700 mb-2">
                                                Content
                                                <span className={`ml-2 text-xs font-normal ${
                                                    contentLength > CONTENT_CHAR_LIMIT ? 'text-orange-600' : 'text-warm-gray-400'
                                                }`}>
                                                    ({contentLength}/{CONTENT_CHAR_LIMIT})
                                                </span>
                                            </label>
                                            <textarea
                                                value={section.content}
                                                onChange={(e) => updateSection(section.id, { content: e.target.value })}
                                                maxLength={CONTENT_CHAR_LIMIT}
                                                rows={6}
                                                className="w-full px-4 py-2 rounded-xl border border-warm-gray-200 bg-warm-gray-50 text-warm-gray-900 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all outline-none resize-none"
                                                placeholder="Enter clear, concise content for this section..."
                                            />
                                            <p className="mt-1 text-xs text-warm-gray-500">
                                                Keep content concise and structured for clarity
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}
