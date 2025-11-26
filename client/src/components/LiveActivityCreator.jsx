import React, { useState } from 'react';
import axios from 'axios';

// Create Live Activity Modal Component
const LiveActivityCreator = ({ onClose, onActivityCreated }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        questions: [
            {
                type: 'MultiChoice',
                text: '',
                options: ['', ''],
                settings: {
                    timeLimit: 0,
                    allowMultiple: false,
                    required: true
                }
            }
        ],
        settings: {
            allowAnonymous: true,
            allowComments: true,
            allowQuestions: true,
            showResultsLive: true,
            moderateQA: false
        }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const baseURL = process.env.NODE_ENV === 'production' 
        ? '/api' 
        : 'http://localhost:5000/api';

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic validation
        if (!formData.title.trim()) {
            setError('Title is required');
            return;
        }

        if (formData.questions.some(q => !q.text.trim())) {
            setError('All questions must have text');
            return;
        }

        if (formData.questions.some(q => (q.type === 'MultiChoice' || q.type === 'MultiVote') && q.options.some(opt => !opt.trim()))) {
            setError('All multiple choice options must be filled');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${baseURL}/live/activities`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                onActivityCreated(response.data.activity);
            }
        } catch (error) {
            console.error('Error creating activity:', error);
            setError(error.response?.data?.error || 'Failed to create activity');
        } finally {
            setLoading(false);
        }
    };

    const addQuestion = () => {
        setFormData(prev => ({
            ...prev,
            questions: [...prev.questions, {
                type: 'MultiChoice',
                text: '',
                options: ['', ''],
                settings: {
                    timeLimit: 0,
                    allowMultiple: false,
                    required: true
                }
            }]
        }));
    };

    const updateQuestion = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) => {
                if (i === index) {
                    const updatedQuestion = { ...q, [field]: value };
                    
                    // Automatically set allowMultiple based on question type
                    if (field === 'type') {
                        updatedQuestion.settings = {
                            ...updatedQuestion.settings,
                            allowMultiple: value === 'MultiVote'
                        };
                    }
                    
                    return updatedQuestion;
                }
                return q;
            })
        }));
    };

    const removeQuestion = (index) => {
        if (formData.questions.length > 1) {
            setFormData(prev => ({
                ...prev,
                questions: prev.questions.filter((_, i) => i !== index)
            }));
        }
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Activity Title *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter activity title..."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description (Optional)
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter activity description..."
                                rows="3"
                            />
                        </div>
                    </div>
                </div>

                {/* Questions */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Questions</h3>
                        <button
                            type="button"
                            onClick={addQuestion}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                        >
                            + Add Question
                        </button>
                    </div>

                    <div className="space-y-4">
                        {formData.questions.map((question, index) => (
                            <QuestionEditor
                                key={index}
                                question={question}
                                index={index}
                                onUpdate={updateQuestion}
                                onRemove={() => removeQuestion(index)}
                                canRemove={formData.questions.length > 1}
                            />
                        ))}
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Activity'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// Question Editor Component
const QuestionEditor = ({ question, index, onUpdate, onRemove, canRemove }) => {
    const updateOption = (optionIndex, value) => {
        const newOptions = [...question.options];
        newOptions[optionIndex] = value;
        onUpdate(index, 'options', newOptions);
    };

    const addOption = () => {
        if (question.options.length < 6) {
            onUpdate(index, 'options', [...question.options, '']);
        }
    };

    const removeOption = (optionIndex) => {
        if (question.options.length > 2) {
            const newOptions = question.options.filter((_, i) => i !== optionIndex);
            onUpdate(index, 'options', newOptions);
        }
    };

    return (
        <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-800">Question {index + 1}</h4>
                <div className="flex items-center gap-2">
                    <select
                        value={question.type}
                        onChange={(e) => onUpdate(index, 'type', e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                        <option value="MultiChoice">Multiple Choice (Single Vote)</option>
                        <option value="MultiVote">Multiple Choice (Multiple Votes)</option>
                        <option value="OpenText">Open Text (Word Cloud)</option>
                        <option value="Rating">Rating (1-5)</option>
                    </select>
                    {canRemove && (
                        <button
                            type="button"
                            onClick={onRemove}
                            className="text-red-500 hover:text-red-700 text-sm"
                        >
                            Remove
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Question Text
                    </label>
                    <input
                        type="text"
                        value={question.text}
                        onChange={(e) => onUpdate(index, 'text', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your question..."
                    />
                </div>

                {(question.type === 'MultiChoice' || question.type === 'MultiVote') && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Answer Options
                        </label>
                        <div className="space-y-2">
                            {question.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={option}
                                        onChange={(e) => updateOption(optionIndex, e.target.value)}
                                        className="flex-1 p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder={`Option ${optionIndex + 1}`}
                                    />
                                    {question.options.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => removeOption(optionIndex)}
                                            className="px-2 py-2 text-red-500 hover:text-red-700"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                            {question.options.length < 6 && (
                                <button
                                    type="button"
                                    onClick={addOption}
                                    className="text-sm text-blue-500 hover:text-blue-700"
                                >
                                    + Add option
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveActivityCreator;