import React, { useState, useEffect, useRef } from 'react';

const LiveQAPanel = ({ 
  socket, 
  activityId, 
  isHost = false, 
  currentUser 
}) => {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, answered
  const [sortBy, setSortBy] = useState('newest'); // newest, popular, oldest
  const questionsEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    // Listen for Q&A updates
    socket.on('qa_updated', (data) => {
      setQuestions(data.qaQueue || []);
    });

    socket.on('new_qa_question', (question) => {
      setQuestions(prev => [...prev, question]);
      scrollToBottom();
    });

    socket.on('qa_question_answered', (data) => {
      setQuestions(prev => 
        prev.map(q => 
          q.id === data.questionId 
            ? { ...q, status: 'answered', answer: data.answer }
            : q
        )
      );
    });

    socket.on('qa_question_upvoted', (data) => {
      setQuestions(prev => 
        prev.map(q => 
          q.id === data.questionId 
            ? { ...q, upvotes: data.upvotes }
            : q
        )
      );
    });

    return () => {
      socket.off('qa_updated');
      socket.off('new_qa_question');
      socket.off('qa_question_answered');
      socket.off('qa_question_upvoted');
    };
  }, [socket]);

  const scrollToBottom = () => {
    questionsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || isSubmitting) return;

    setIsSubmitting(true);
    
    socket.emit('ask_question', {
      activityId,
      question: newQuestion.trim()
    });

    setNewQuestion('');
    setIsSubmitting(false);
  };

  const handleUpvote = (questionId) => {
    socket.emit('upvote_question', {
      activityId,
      questionId
    });
  };

  const handleAnswerQuestion = (questionId, answer) => {
    if (!isHost) return;
    
    socket.emit('answer_question', {
      activityId,
      questionId,
      answer
    });
  };

  const handleDismissQuestion = (questionId) => {
    if (!isHost) return;
    
    socket.emit('dismiss_question', {
      activityId,
      questionId
    });
  };

  // Filter and sort questions
  const filteredQuestions = questions
    .filter(q => {
      if (filter === 'pending') return q.status === 'pending';
      if (filter === 'answered') return q.status === 'answered';
      return q.status !== 'dismissed';
    })
    .sort((a, b) => {
      if (sortBy === 'popular') {
        return (b.upvotes?.length || 0) - (a.upvotes?.length || 0);
      } else if (sortBy === 'oldest') {
        return new Date(a.timestamp) - new Date(b.timestamp);
      }
      // Default: newest first
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

  const QuestionCard = ({ question }) => {
    const [showAnswerForm, setShowAnswerForm] = useState(false);
    const [answerText, setAnswerText] = useState('');
    const hasUserUpvoted = question.upvotes?.includes(currentUser?.User_ID);

    return (
      <div className="bg-white border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-700">
                {question.nickname}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(question.timestamp).toLocaleTimeString()}
              </span>
              {question.status === 'answered' && (
                <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                  Answered
                </span>
              )}
            </div>
            <p className="text-gray-800 text-sm leading-relaxed">
              {question.question}
            </p>
          </div>
        </div>

        {/* Answer display */}
        {question.answer && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-blue-700">Answer:</span>
              <span className="text-xs text-blue-600">
                by {question.answer.answeredBy || 'Host'}
              </span>
            </div>
            <p className="text-sm text-blue-800">{question.answer.text}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Upvote button */}
            <button
              onClick={() => handleUpvote(question.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                hasUserUpvoted 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>👍</span>
              <span>{question.upvotes?.length || 0}</span>
            </button>

            {/* Status indicator */}
            <span className={`text-xs px-2 py-1 rounded-full ${
              question.status === 'pending' 
                ? 'bg-yellow-100 text-yellow-700' 
                : question.status === 'answered'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {question.status.charAt(0).toUpperCase() + question.status.slice(1)}
            </span>
          </div>

          {/* Host actions */}
          {isHost && question.status === 'pending' && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowAnswerForm(!showAnswerForm)}
                className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Answer
              </button>
              <button
                onClick={() => handleDismissQuestion(question.id)}
                className="text-xs px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Answer form for hosts */}
        {isHost && showAnswerForm && (
          <div className="border-t pt-3 space-y-2">
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Type your answer..."
              className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
              rows="2"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  handleAnswerQuestion(question.id, answerText);
                  setAnswerText('');
                  setShowAnswerForm(false);
                }}
                disabled={!answerText.trim()}
                className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Answer
              </button>
              <button
                onClick={() => {
                  setShowAnswerForm(false);
                  setAnswerText('');
                }}
                className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg h-full flex flex-col">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Q&A</h3>
          <span className="text-sm text-gray-500">
            {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-3">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs px-2 py-1 border rounded"
          >
            <option value="all">All Questions</option>
            <option value="pending">Pending</option>
            <option value="answered">Answered</option>
          </select>
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs px-2 py-1 border rounded"
          >
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* Ask question form */}
        <form onSubmit={handleSubmitQuestion} className="space-y-2">
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Ask a question..."
            className="w-full px-3 py-2 border rounded-lg resize-none text-sm"
            rows="2"
            maxLength={500}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {newQuestion.length}/500 characters
            </span>
            <button
              type="submit"
              disabled={!newQuestion.trim() || isSubmitting}
              className="px-4 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Ask'}
            </button>
          </div>
        </form>
      </div>

      {/* Questions list */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xl">❓</span>
            </div>
            <p className="text-sm">No questions yet</p>
            <p className="text-xs">Be the first to ask a question!</p>
          </div>
        ) : (
          filteredQuestions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))
        )}
        <div ref={questionsEndRef} />
      </div>

      {/* Stats for host */}
      {isHost && (
        <div className="mt-4 p-3 bg-white rounded border">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Total Questions:</span>
              <span className="font-medium">{questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Pending:</span>
              <span className="font-medium text-yellow-600">
                {questions.filter(q => q.status === 'pending').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Answered:</span>
              <span className="font-medium text-green-600">
                {questions.filter(q => q.status === 'answered').length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveQAPanel;