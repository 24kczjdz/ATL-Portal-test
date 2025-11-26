import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';
import PollVisualization from '../visualizations/PollVisualization';
import LiveQAPanel from './LiveQAPanel';

const LiveActivityInterface = ({ 
  activity, 
  isHost = false, 
  onClose 
}) => {
  const { currentUser } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [responses, setResponses] = useState([]);
  const [userResponse, setUserResponse] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [livePolls, setLivePolls] = useState([]);
  const [showQA, setShowQA] = useState(false);
  const [responseTime, setResponseTime] = useState(0);
  const questionStartTime = useRef(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    const socketConnection = io(process.env.NODE_ENV === 'production' 
      ? 'wss://your-vercel-domain.vercel.app' 
      : 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketConnection.on('connect', () => {
      console.log('Connected to WebSocket server');
      setConnected(true);
      
      // Join activity room
      socketConnection.emit('join_activity', {
        activityId: activity.Act_ID,
        nickname: currentUser?.Nickname || 'Anonymous'
      });
    });

    socketConnection.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setConnected(false);
    });

    socketConnection.on('activity_state', (state) => {
      setCurrentQuestion(state.currentQuestion);
      setParticipants(state.participantCount || 0);
      setLivePolls(state.livePolls || []);
      questionStartTime.current = Date.now();
    });

    socketConnection.on('participant_joined', (data) => {
      setParticipants(data.totalParticipants);
    });

    socketConnection.on('participant_left', (data) => {
      setParticipants(data.totalParticipants);
    });

    socketConnection.on('question_changed', (data) => {
      setCurrentQuestion({ index: data.questionIndex });
      setHasAnswered(false);
      setUserResponse('');
      setResponses([]);
      setShowResults(false);
      questionStartTime.current = Date.now();
    });

    socketConnection.on('new_response', (data) => {
      if (isHost) {
        setResponses(prev => [...prev, {
          participant: data.participant,
          answer: data.answer,
          responseTime: data.responseTime,
          timestamp: new Date()
        }]);
      }
    });

    socketConnection.on('live_results_update', (data) => {
      if (data.questionIndex === currentQuestion?.index) {
        setResponses(prev => [...prev, data.newAnswer]);
      }
    });

    socketConnection.on('new_live_poll', (poll) => {
      setLivePolls(prev => [...prev, poll]);
    });

    socketConnection.on('poll_expired', (data) => {
      setLivePolls(prev => 
        prev.map(poll => 
          poll.id === data.pollId 
            ? { ...poll, isActive: false }
            : poll
        )
      );
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
    };
  }, [activity.Act_ID, currentUser, isHost]);

  // Get current question data
  const getCurrentQuestionData = () => {
    if (!currentQuestion || !activity.Questions) return null;
    return activity.Questions[currentQuestion.index];
  };

  // Handle answer submission
  const handleSubmitAnswer = () => {
    if (!userResponse.trim() || hasAnswered || !socket) return;

    const endTime = Date.now();
    const timeTaken = questionStartTime.current 
      ? Math.round((endTime - questionStartTime.current) / 1000)
      : 0;

    socket.emit('submit_answer', {
      activityId: activity.Act_ID,
      questionIndex: currentQuestion.index,
      answer: userResponse,
      responseTime: timeTaken
    });

    setHasAnswered(true);
    setResponseTime(timeTaken);
    
    // Show results based on activity settings
    if (activity.Settings?.showResults === 'live') {
      setShowResults(true);
    }
  };

  // Handle live poll vote
  const handlePollVote = (pollId, option) => {
    if (!socket) return;
    
    socket.emit('vote_live_poll', {
      activityId: activity.Act_ID,
      pollId,
      option
    });
  };

  // Host controls
  const handleNextQuestion = () => {
    if (!socket || !isHost) return;
    
    socket.emit('host_next_question', {
      activityId: activity.Act_ID,
      questionIndex: currentQuestion.index + 1
    });
  };

  const handlePreviousQuestion = () => {
    if (!socket || !isHost) return;
    
    socket.emit('host_previous_question', {
      activityId: activity.Act_ID,
      questionIndex: currentQuestion.index - 1
    });
  };

  const handleCreateLivePoll = (question, options, duration = 60) => {
    if (!socket || !isHost) return;
    
    socket.emit('create_live_poll', {
      activityId: activity.Act_ID,
      question,
      options,
      duration
    });
  };

  const questionData = getCurrentQuestionData();

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{activity.Title}</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Live • {participants} participants
                </span>
                {questionData && (
                  <span className="text-sm text-gray-600">
                    Question {(currentQuestion?.index || 0) + 1} of {activity.Questions?.length || 0}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowQA(!showQA)}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Q&A {showQA ? '✕' : '💬'}
              </button>
              
              {isHost && (
                <div className="flex gap-2">
                  <button
                    onClick={handlePreviousQuestion}
                    disabled={!currentQuestion || currentQuestion.index <= 0}
                    className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    disabled={!currentQuestion || currentQuestion.index >= (activity.Questions?.length || 0) - 1}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              )}
              
              <button
                onClick={onClose}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className={`grid gap-6 ${showQA ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {/* Main Content */}
          <div className={showQA ? 'lg:col-span-2' : 'col-span-1'}>
            {/* Current Question */}
            {questionData ? (
              <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">
                    {questionData.Text}
                  </h2>
                  {questionData.Type !== 'OpenText' && questionData.Type !== 'QA' && (
                    <p className="text-gray-600">Select your answer below</p>
                  )}
                </div>

                {/* Answer Interface */}
                {!hasAnswered && (
                  <div className="space-y-4 mb-8">
                    {questionData.Type === 'MultiChoice' && (
                      <div className="grid gap-3">
                        {questionData.Answers?.map((answer, index) => (
                          <button
                            key={index}
                            onClick={() => setUserResponse(answer)}
                            className={`p-4 rounded-lg border-2 text-left transition-all hover:border-blue-400 ${
                              userResponse === answer 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <span className="font-medium">{answer}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {questionData.Type === 'OpenText' && (
                      <textarea
                        value={userResponse}
                        onChange={(e) => setUserResponse(e.target.value)}
                        placeholder="Type your answer..."
                        className="w-full p-4 border-2 border-gray-200 rounded-lg resize-none focus:border-blue-500 focus:outline-none"
                        rows="4"
                      />
                    )}

                    {questionData.Type === 'Rating' && (
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => setUserResponse(rating.toString())}
                            className={`text-4xl transition-colors ${
                              parseInt(userResponse) >= rating 
                                ? 'text-yellow-400' 
                                : 'text-gray-300 hover:text-yellow-200'
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-center">
                      <button
                        onClick={handleSubmitAnswer}
                        disabled={!userResponse.trim()}
                        className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Submit Answer
                      </button>
                    </div>
                  </div>
                )}

                {/* Response Submitted */}
                {hasAnswered && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">✓</span>
                    </div>
                    <h3 className="text-xl font-semibold text-green-700 mb-2">Answer Submitted!</h3>
                    <p className="text-gray-600">Response time: {responseTime}s</p>
                    {!showResults && (
                      <p className="text-sm text-gray-500 mt-2">
                        Results will be shown after everyone answers
                      </p>
                    )}
                  </div>
                )}

                {/* Live Results */}
                {showResults && responses.length > 0 && (
                  <div className="mt-8">
                    <PollVisualization
                      question={questionData}
                      responses={responses}
                      showResults={true}
                      animated={true}
                      type="bar"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Waiting for host...</h3>
                <p className="text-gray-600">The activity will begin shortly</p>
              </div>
            )}

            {/* Live Polls */}
            {livePolls.length > 0 && (
              <div className="space-y-4">
                {livePolls.filter(poll => poll.isActive).map(poll => (
                  <div key={poll.id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-800">Live Poll</h4>
                      <span className="text-sm text-gray-500">
                        Expires: {new Date(poll.expiresAt).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <h5 className="text-xl font-medium text-gray-800 mb-4">{poll.question}</h5>
                    
                    <div className="grid gap-2">
                      {poll.options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handlePollVote(poll.id, option)}
                          className="p-3 text-left border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Q&A Sidebar */}
          {showQA && (
            <div className="lg:col-span-1">
              <LiveQAPanel
                socket={socket}
                activityId={activity.Act_ID}
                isHost={isHost}
                currentUser={currentUser}
              />
            </div>
          )}
        </div>
      </div>

      {/* Host Quick Poll Creator */}
      {isHost && (
        <QuickPollCreator onCreatePoll={handleCreateLivePoll} />
      )}
    </div>
  );
};

// Quick Poll Creator Component for Hosts
const QuickPollCreator = ({ onCreatePoll }) => {
  const [showCreator, setShowCreator] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [duration, setDuration] = useState(60);

  const handleCreatePoll = () => {
    if (!question.trim() || options.some(opt => !opt.trim())) return;
    
    onCreatePoll(question, options.filter(opt => opt.trim()), duration);
    
    // Reset form
    setQuestion('');
    setOptions(['', '']);
    setDuration(60);
    setShowCreator(false);
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  if (!showCreator) {
    return (
      <button
        onClick={() => setShowCreator(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-purple-500 text-white rounded-full shadow-lg hover:bg-purple-600 transition-colors flex items-center justify-center text-xl"
      >
        📊
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Create Quick Poll</h3>
          <button
            onClick={() => setShowCreator(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What's your question?"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => removeOption(index)}
                      className="px-3 py-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {options.length < 6 && (
              <button
                onClick={addOption}
                className="mt-2 text-sm text-purple-500 hover:text-purple-600"
              >
                + Add option
              </button>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (seconds)</label>
            <select
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={120}>2 minutes</option>
              <option value={300}>5 minutes</option>
            </select>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleCreatePoll}
              disabled={!question.trim() || options.some(opt => !opt.trim())}
              className="flex-1 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Poll
            </button>
            <button
              onClick={() => setShowCreator(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveActivityInterface;