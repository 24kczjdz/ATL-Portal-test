import React, { useState } from 'react';
import axios from 'axios';

const ThreadedQAPanel = ({ questions, onSubmitQuestion, onUpvoteQuestion, participantId, onReplySubmitted }) => {
  const [newQuestion, setNewQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyText, setReplyText] = useState({});
  const [showReplyForm, setShowReplyForm] = useState({});
  const [expandedQuestions, setExpandedQuestions] = useState({});

  const baseURL = process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:5000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmitQuestion(newQuestion.trim());
      setNewQuestion('');
    } catch (error) {
      console.error('Error submitting question:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (questionId) => {
    const reply = replyText[questionId];
    if (!reply?.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${baseURL}/live/activities/${questions[0]?.activityId}/questions/${questionId}/reply`,
        {
          participantId,
          question: reply.trim()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Clear reply form
      setReplyText(prev => ({ ...prev, [questionId]: '' }));
      setShowReplyForm(prev => ({ ...prev, [questionId]: false }));
      
      console.log('✅ Reply submitted successfully');
      
      // Trigger data refresh if callback provided
      if (onReplySubmitted) {
        onReplySubmitted();
      }
    } catch (error) {
      console.error('❌ Error submitting reply:', error);
      alert('Failed to submit reply. Please try again.');
    }
  };

  const toggleReplyForm = (questionId) => {
    setShowReplyForm(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const toggleExpandQuestion = (questionId) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const handleReplyTextChange = (questionId, text) => {
    setReplyText(prev => ({
      ...prev,
      [questionId]: text
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 h-full max-h-screen overflow-hidden flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <span className="mr-2">💬</span>
        Q&A Discussion
      </h3>
      
      {/* Submit Question Form */}
      <form onSubmit={handleSubmit} className="mb-6 flex-shrink-0">
        <textarea
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="Ask a new question..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
          rows="3"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={!newQuestion.trim() || isSubmitting}
          className="mt-2 w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Ask Question'}
        </button>
      </form>

      {/* Questions List */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {questions.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">💭</span>
            </div>
            <p>No questions yet</p>
            <p className="text-sm">Be the first to ask!</p>
          </div>
        ) : (
          questions.map((question) => (
            <div key={question.id} className="border border-gray-200 rounded-lg p-4">
              {/* Main Question */}
              <div className="mb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium mb-1">{question.question}</p>
                    <div className="flex items-center text-xs text-gray-500 space-x-3">
                      <span>
                        {question.isAnonymous ? 'Anonymous' : question.nickname}
                      </span>
                      <span>
                        {new Date(question.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {question.status === 'answered' && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Answered
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 mt-2">
                  <button
                    onClick={() => onUpvoteQuestion(question.id)}
                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs hover:bg-gray-100 ${
                      question.upvotes?.includes(participantId) 
                        ? 'text-purple-600 bg-purple-50' 
                        : 'text-gray-600'
                    }`}
                  >
                    <span>👍</span>
                    <span>{question.upvoteCount || 0}</span>
                  </button>
                  
                  <button
                    onClick={() => toggleReplyForm(question.id)}
                    className="flex items-center space-x-1 px-2 py-1 rounded text-xs text-gray-600 hover:bg-gray-100"
                  >
                    <span>💬</span>
                    <span>Reply</span>
                  </button>

                  {question.replyCount > 0 && (
                    <button
                      onClick={() => toggleExpandQuestion(question.id)}
                      className="flex items-center space-x-1 px-2 py-1 rounded text-xs text-gray-600 hover:bg-gray-100"
                    >
                      <span>{expandedQuestions[question.id] ? '🔽' : '▶️'}</span>
                      <span>{question.replyCount} replies</span>
                    </button>
                  )}
                </div>

                {/* Host Answer */}
                {question.answer && (
                  <div className="mt-3 p-3 bg-green-50 border-l-4 border-green-500 rounded">
                    <div className="flex items-center mb-2">
                      <span className="text-sm font-medium text-green-700">📢 Host Answer:</span>
                    </div>
                    <p className="text-gray-800">{question.answer.text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(question.answer.answeredAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Reply Form */}
                {showReplyForm[question.id] && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <textarea
                      value={replyText[question.id] || ''}
                      onChange={(e) => handleReplyTextChange(question.id, e.target.value)}
                      placeholder="Write your reply..."
                      className="w-full px-3 py-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows="2"
                    />
                    <div className="flex items-center justify-end space-x-2 mt-2">
                      <button
                        onClick={() => toggleReplyForm(question.id)}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSubmitReply(question.id)}
                        disabled={!replyText[question.id]?.trim()}
                        className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                )}

                {/* Replies */}
                {expandedQuestions[question.id] && question.replies && (
                  <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-2">
                    {question.replies.map((reply) => (
                      <div key={reply.id} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-800 text-sm mb-1">{reply.question}</p>
                        <div className="flex items-center text-xs text-gray-500 space-x-3">
                          <span>
                            {reply.isAnonymous ? 'Anonymous' : reply.nickname}
                          </span>
                          <span>
                            {new Date(reply.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ThreadedQAPanel;