import React, { useState } from 'react';
import axios from 'axios';

// Edit Activity Modal Component
const EditActivityModal = ({ activity, onClose, onActivityUpdated }) => {
  const [formData, setFormData] = useState({
    title: activity.title || '',
    description: activity.description || '',
    questions: activity.questions || [{
      type: 'MultiChoice',
      text: '',
      options: ['', ''],
      settings: {
        timeLimit: 0,
        allowMultiple: false,
        required: true
      }
    }],
    settings: activity.settings || {
      allowAnonymous: true, // Re-enable for anonymous responses
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

    if (formData.questions.some(q => q.type === 'MultiChoice' && q.options.some(opt => !opt.trim()))) {
      setError('All multiple choice options must be filled');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${baseURL}/live/activities/${activity.Act_ID}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        onActivityUpdated({ ...activity, ...formData });
      }
    } catch (error) {
      console.error('Error updating activity:', error);
      setError(error.response?.data?.error || 'Failed to update activity');
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
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit Activity</h2>
              {activity.isLive && (
                <p className="text-sm text-orange-600 mt-1">
                  ⚠️ This activity is currently live. Changes will take effect immediately.
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="mb-6">
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
          <div className="mb-6">
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
                  isLive={activity.isLive}
                />
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Activity Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.settings.allowAnonymous}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, allowAnonymous: e.target.checked }
                  }))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Allow anonymous responses</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.settings.allowComments}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, allowComments: e.target.checked }
                  }))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Allow comments</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.settings.allowQuestions}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, allowQuestions: e.target.checked }
                  }))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Allow Q&A questions</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.settings.showResultsLive}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, showResultsLive: e.target.checked }
                  }))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show results live</span>
              </label>
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
              {loading ? 'Updating...' : 'Update Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Question Editor Component  
const QuestionEditor = ({ question, index, onUpdate, onRemove, canRemove, isLive }) => {
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
    <div className={`border border-gray-200 rounded-lg p-4 ${isLive ? 'bg-orange-50 border-orange-200' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-800">Question {index + 1}</h4>
        <div className="flex items-center gap-2">
          <select
            value={question.type}
            onChange={(e) => onUpdate(index, 'type', e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
            disabled={isLive}
          >
            <option value="MultiChoice">Multiple Choice</option>
            <option value="OpenText">Open Text</option>
            <option value="Rating">Rating (1-5)</option>
            <option value="WordCloud">Word Cloud</option>
          </select>
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-red-500 hover:text-red-700 text-sm"
              disabled={isLive}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {isLive && (
        <div className="mb-3 text-xs text-orange-600">
          ⚠️ This question type cannot be changed while the activity is live
        </div>
      )}

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

        {question.type === 'MultiChoice' && (
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
                      disabled={isLive}
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
                  disabled={isLive}
                >
                  + Add option
                </button>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time Limit (seconds, 0 = no limit)
          </label>
          <input
            type="number"
            min="0"
            max="300"
            value={question.settings.timeLimit}
            onChange={(e) => onUpdate(index, 'settings', {
              ...question.settings,
              timeLimit: parseInt(e.target.value) || 0
            })}
            className="w-32 p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default EditActivityModal;