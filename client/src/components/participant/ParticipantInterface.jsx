import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import pollingService from '../../services/pollingService';
import PollChart from '../charts/PollChart';
import WordCloudChart from '../charts/WordCloudChart';
import ThreadedQAPanel from './ThreadedQAPanel';
import { Card, Button, PageTemplate, Alert, Badge } from '../ui';
import { 
  FiActivity, 
  FiArrowLeft, 
  FiUsers, 
  FiMessageCircle, 
  FiX, 
  FiCheck, 
  FiClock, 
  FiHeart, 
  FiSmile,
  FiStar,
  FiBarChart,
  FiRefreshCw,
  FiPause,
  FiShield
} from 'react-icons/fi';

const ParticipantInterface = ({ activity, participantId, onLeave }) => {
  const [activityState, setActivityState] = useState(activity);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentResults, setCurrentResults] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [responseTime, setResponseTime] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [livePolls, setLivePolls] = useState([]);
  const [qaQuestions, setQAQuestions] = useState([]);
  const [showQA, setShowQA] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [questionReactions, setQuestionReactions] = useState({});
  const [participantInfo, setParticipantInfo] = useState(null);
  const [chartType, setChartType] = useState('doughnut'); // Chart type selection for participants

  const baseURL = process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:5000/api';

  // Handle emoji reactions
  const handleReaction = async (emoji) => {
    const emojiTypeMap = {
      '👍': 'like',
      '❤️': 'love', 
      '😂': 'laugh',
      '😮': 'wow',
      '🤔': 'confused',
      '👏': 'clap'
    };

    const reactionType = emojiTypeMap[emoji];
    if (!reactionType) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${baseURL}/live/activities/${activity.id}/participants/${participantId}/react`,
        {
          questionIndex: activityState?.currentQuestionIndex || 0,
          type: reactionType
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Reaction submitted successfully:', emoji);
      
      // Provide immediate feedback
      console.log('Reaction submitted locally:', emoji);

      // Fetch updated reactions
      fetchQuestionReactions(activityState?.currentQuestionIndex || 0);

    } catch (error) {
      console.error('❌ Error submitting reaction:', error);
      alert('Failed to submit reaction. Please try again.');
    }
  };

  // Fetch reactions for current question
  const fetchQuestionReactions = useCallback(async (questionIndex) => {
    try {
      const response = await axios.get(
        `${baseURL}/live/activities/${activity.id}/questions/${questionIndex}/reactions`
      );
      
      setQuestionReactions(prev => ({
        ...prev,
        [questionIndex]: response.data
      }));

    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  }, [baseURL, activity.id]);

  useEffect(() => {
    if (!activity?.id) return;

    // Fetch participant information
    const fetchParticipantInfo = async () => {
      try {
        const response = await axios.get(
          `${baseURL}/live/participants/${participantId}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        if (response.data.participant) {
          setParticipantInfo(response.data.participant);
        }
      } catch (error) {
        console.error('Error fetching participant info:', error);
      }
    };

    fetchParticipantInfo();

    // Start polling for activity updates
    pollingService.startActivityPolling(activity.id, (data) => {
      // Check if question changed - reset answer state
      if (data.currentQuestionIndex !== activityState?.currentQuestionIndex) {
        console.log('🔄 Question changed, resetting participant state');
        setHasAnswered(false);
        setUserAnswer('');
        setQuestionStartTime(Date.now());
        setCurrentResults(null);
        
        // Fetch reactions for new question
        if (data.currentQuestionIndex !== undefined) {
          fetchQuestionReactions(data.currentQuestionIndex);
        }
      }

      setActivityState(prev => ({ ...prev, ...data }));
      setCurrentQuestion(data.currentQuestion);
      setParticipantCount(data.participantCount || 0);

      // Start polling for results if question changed and results should be shown
      if (data.currentQuestionIndex !== undefined && activity.settings?.showResultsLive) {
        pollingService.startResultsPolling(activity.id, data.currentQuestionIndex, setCurrentResults);
      }
    });

    // Start polling for live polls
    pollingService.startLivePollsPolling(activity.id, setLivePolls);

    // Start polling for Q&A
    pollingService.startQAPolling(activity.id, setQAQuestions);

    // Set initial question start time
    setQuestionStartTime(Date.now());

    return () => {
      pollingService.stopAllPolling(activity.id);
    };
  }, [activity?.id, activity.settings?.showResultsLive, activityState?.currentQuestionIndex, baseURL, fetchQuestionReactions, participantId]);

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim() || hasAnswered) return;

    const endTime = Date.now();
    const timeTaken = questionStartTime ? endTime - questionStartTime : 0;

    try {
      const requestData = {
        participantId,
        questionId: currentQuestion?.id,
        questionIndex: activityState?.currentQuestionIndex,
        answer: userAnswer,
        responseTime: timeTaken
      };
      
      console.log('📤 Submitting answer:', {
        url: `${baseURL}/live/activities/${activity.id}/responses`,
        data: requestData,
        currentQuestion: currentQuestion,
        activityState: activityState
      });

      // Retry mechanism for 500 errors (serverless issues)
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          await axios.post(
            `${baseURL}/live/activities/${activity.id}/responses`,
            requestData,
            { timeout: 25000 }
          );
          
          // Success - break out of retry loop
          setHasAnswered(true);
          setResponseTime(Math.round(timeTaken / 1000));
          return;
          
        } catch (retryError) {
          retryCount++;
          console.log(`🔄 Answer submission attempt ${retryCount} failed:`, retryError.response?.status);
          
          const isRetryable = retryError.code === 'ECONNABORTED' || (retryError.response?.status >= 500 && retryError.response?.status < 600);
          if (retryCount > maxRetries || !isRetryable) {
            throw retryError; // Re-throw if max retries reached or non-retryable error
          }
          
          // Wait before retry (exponential backoff)
          const delay = 1000 * retryCount;
          console.log(`⏳ Retrying answer submission in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

    } catch (error) {
      console.error('❌ Error submitting answer:', error);
      console.error('📊 Response error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        participantId: participantId,
        currentQuestion: currentQuestion,
        userAnswer: userAnswer,
        timeTaken: timeTaken
      });
      
      // Provide user feedback for the error
      if (error.response?.status === 500) {
        console.error('💥 Server error - this may be a backend issue with response processing');
      }
    }
  };

  const handlePollVote = async (pollId, option) => {
    try {
      await axios.post(
        `${baseURL}/live/activities/${activity.id}/polls/${pollId}/vote`,
        { participantId, option },
        { timeout: 25000 } // Add timeout for serverless
      );
    } catch (error) {
      console.error('Error voting on poll:', error);
    }
  };

  const handleSubmitQuestion = async (questionText) => {
    try {
      // Get fresh token and user data
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      console.log('🔐 Q&A Authentication Debug:', {
        tokenExists: !!token,
        tokenLength: token?.length,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
        userExists: !!user,
        participantId: participantId,
        activityId: activity.id,
        questionText: questionText,
        timestamp: new Date().toISOString()
      });
      
      if (!token) {
        console.error('❌ No authentication token found for Q&A submission');
        alert('You must be logged in to submit questions. Please refresh the page and log in again.');
        return;
      }
      
      // Retry mechanism for Q&A submission with enhanced error handling
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          const response = await axios.post(
            `${baseURL}/live/activities/${activity.id}/questions`,
            { participantId, question: questionText },
            { 
              headers: { Authorization: `Bearer ${token}` },
              timeout: 25000 // Add timeout for serverless
            }
          );
          
          console.log('✅ Q&A question submitted successfully:', response.data);
          return; // Success, exit retry loop
          
        } catch (retryError) {
          retryCount++;
          console.error(`🔄 Q&A submission attempt ${retryCount} failed:`, {
            status: retryError.response?.status,
            statusText: retryError.response?.statusText,
            data: retryError.response?.data,
            message: retryError.message,
            headers: retryError.config?.headers,
            url: retryError.config?.url,
            attempt: retryCount
          });
          
          if (retryError.response?.status === 401) {
            // Don't retry auth errors - they're persistent
            throw retryError;
          }
          
          if (retryCount > maxRetries) {
            throw retryError; // Re-throw the last error
          }
          
          // Wait before retry (exponential backoff)
          const delay = 1000 * retryCount;
          console.log(`⏳ Retrying Q&A submission in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
    } catch (error) {
      console.error('❌ Final Q&A submission error:', error);
      console.error('📊 Q&A error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.config?.headers,
        url: error.config?.url,
        participantId: participantId,
        activityId: activity.id,
        tokenExists: !!localStorage.getItem('token')
      });
      
      if (error.response?.status === 401) {
        alert('Authentication failed when submitting question. Your session may have expired. Please refresh the page and log in again.');
        // Don't clear tokens here - let user refresh manually
      } else {
        alert('Failed to submit question. Please try again.');
      }
    }
  };

  const handleUpvoteQuestion = async (questionId) => {
    try {
      await axios.post(
        `${baseURL}/live/activities/${activity.id}/questions/${questionId}/upvote`,
        { participantId },
        { 
          timeout: 25000 // Add timeout for serverless
        }
      );
    } catch (error) {
      console.error('Error upvoting question:', error);
      // If 401 error, it might need authentication
      if (error.response?.status === 401) {
        console.log('Upvote might require authentication, trying with token...');
        try {
          const token = localStorage.getItem('token');
          if (token) {
            await axios.post(
              `${baseURL}/live/activities/${activity.id}/questions/${questionId}/upvote`,
              { participantId },
              { 
                headers: { Authorization: `Bearer ${token}` },
                timeout: 25000
              }
            );
          }
        } catch (retryError) {
          console.error('Error upvoting question with auth:', retryError);
        }
      }
    }
  };

  const handleRefreshQA = async () => {
    try {
      await pollingService.fetchQAData(activity.id, setQAQuestions);
      console.log('✅ Q&A data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing Q&A data:', error);
    }
  };

  // Check if activity is not live
  if (!activityState?.isLive) {
    return (
      <PageTemplate
        title="Activity Paused"
        description="Waiting for host to start the activity"
        icon={FiPause}
        className="min-h-screen bg-gradient-to-br from-warning-50 via-white to-warning-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
      >
        <div className="max-w-2xl mx-auto text-center">
          <Card shadow="xl" className="border-warning-200 dark:border-gray-700">
            <Card.Content className="p-12">
              <div className="w-24 h-24 bg-gradient-to-br from-warning-500 to-warning-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                <FiPause className="w-12 h-12 text-white" />
              </div>
              
              <h2 className="text-3xl font-elegant text-primary-900 dark:text-white mb-4">
                Activity Not Live
              </h2>
              <p className="text-lg font-literary text-primary-600 dark:text-gray-300 mb-8">
                The host hasn't started the activity yet. Please wait while they prepare the session...
              </p>
              
              <div className="bg-gradient-to-r from-info-50 to-white dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 mb-8 border border-info-200 dark:border-gray-600">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-warning-500 rounded-full animate-pulse"></div>
                  <span className="font-serif text-primary-900 dark:text-white">
                    Waiting for host...
                  </span>
                </div>
                <p className="text-sm font-literary text-primary-600 dark:text-gray-300">
                  You'll automatically see the activity when it goes live!
                </p>
              </div>

              <Button
                onClick={onLeave}
                variant="outline"
                icon={FiArrowLeft}
                className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
              >
                Leave Activity
              </Button>
            </Card.Content>
          </Card>
        </div>
      </PageTemplate>
    );
  }

  // Check if activity is live but no current question
  if (activityState?.isLive && !currentQuestion) {
    return (
      <PageTemplate
        title="Activity Live"
        description="Waiting for the first question"
        icon={FiActivity}
        className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
      >
        <div className="max-w-2xl mx-auto text-center">
          <Card shadow="xl" className="border-primary-200 dark:border-gray-700">
            <Card.Content className="p-12">
              <div className="w-24 h-24 bg-gradient-to-br from-success-500 to-success-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                <FiActivity className="w-12 h-12 text-white animate-pulse" />
              </div>
              
              <h2 className="text-3xl font-elegant text-primary-900 dark:text-white mb-4">
                Activity is Live!
              </h2>
              <p className="text-lg font-literary text-primary-600 dark:text-gray-300 mb-8">
                The activity is running, but the host hasn't presented the first question yet.
              </p>
              
              <div className="bg-gradient-to-r from-success-50 to-white dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 mb-8 border border-success-200 dark:border-gray-600">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-success-500 rounded-full animate-pulse"></div>
                  <Badge variant="success" className="font-serif">
                    Live • {participantCount} participants
                  </Badge>
                </div>
                <p className="text-sm font-literary text-primary-600 dark:text-gray-300">
                  Get ready! The first question will appear shortly.
                </p>
              </div>

              <Button
                onClick={onLeave}
                variant="outline"
                icon={FiArrowLeft}
                className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
              >
                Leave Activity
              </Button>
            </Card.Content>
          </Card>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title={activityState?.title || "Live Activity"}
      description="Participate in real-time interactive session"
      icon={FiActivity}
      className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
      headerActions={
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowQA(!showQA)}
            variant={showQA ? "primary" : "ghost"}
            size="sm"
            icon={FiMessageCircle}
            className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
          >
            Q&A {showQA && <FiX className="w-4 h-4 ml-1" />}
          </Button>
          <Button
            onClick={onLeave}
            variant="outline"
            size="sm"
            icon={FiArrowLeft}
            className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
          >
            Leave
          </Button>
        </div>
      }
    >
      {/* Activity Status Header */}
      <div className="mb-8">
        <Card shadow="lg" className="border-primary-200 dark:border-gray-700">
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-success-500 rounded-full animate-pulse"></div>
                  <Badge variant="success" className="font-serif">
                    <FiUsers className="w-4 h-4 mr-1" />
                    Live • {participantCount} participants
                  </Badge>
                </div>
                
                {currentQuestion && (
                  <Badge variant="info" className="font-mono">
                    Question {(activityState?.currentQuestionIndex ?? -1) + 1} of {activityState?.totalQuestions || 0}
                  </Badge>
                )}
                
                {participantInfo?.isAnonymous && (
                  <Badge variant="primary" className="font-serif">
                    <FiShield className="w-4 h-4 mr-1" />
                    Anonymous
                  </Badge>
                )}
              </div>
              
              {hasAnswered && responseTime > 0 && (
                <Badge variant="success" className="font-mono">
                  <FiClock className="w-4 h-4 mr-1" />
                  {responseTime}s
                </Badge>
              )}
            </div>
          </Card.Content>
        </Card>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className={`grid gap-8 ${showQA ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {/* Main Content */}
          <div className={showQA ? 'lg:col-span-2' : 'col-span-1'}>
            {/* Current Question */}
            {currentQuestion ? (
              <Card shadow="xl" className="border-primary-200 dark:border-gray-700 mb-8">
                <Card.Header className="bg-gradient-to-r from-primary-50 to-white dark:from-gray-800 dark:to-gray-800 text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                      <FiActivity className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="primary" size="sm" className="font-mono">
                      {currentQuestion.type}
                    </Badge>
                  </div>
                  <Card.Title className="text-3xl font-elegant text-primary-900 dark:text-white mb-4">
                    {currentQuestion.text}
                  </Card.Title>
                  {currentQuestion.type !== 'OpenText' && (
                    <p className="font-literary text-primary-600 dark:text-gray-300">
                      {currentQuestion.type === 'MultiChoice' ? 'Select your answer below' : 
                       currentQuestion.type === 'Rating' ? 'Rate from 1 to 5 stars' : 
                       'Choose an option'}
                    </p>
                  )}
                </Card.Header>
                <Card.Content className="p-8">

                {/* Answer Interface */}
                {!hasAnswered ? (
                  <div className="space-y-6">
                    {currentQuestion.type === 'MultiChoice' && (
                      <div className="space-y-3">
                        {currentQuestion.options?.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => setUserAnswer(option)}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5 ${
                              userAnswer === option 
                                ? 'border-primary-500 bg-gradient-to-r from-primary-50 to-white dark:from-primary-900/20 dark:to-gray-800 shadow-lg scale-[1.02]' 
                                : 'border-primary-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-primary-300 dark:hover:border-gray-500'
                            }`}
                          >
                            <div className="flex items-center">
                              <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                                userAnswer === option 
                                  ? 'bg-primary-500 border-primary-500' 
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}>
                                {userAnswer === option && (
                                  <FiCheck className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <span className="font-serif text-primary-900 dark:text-white">{option}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {currentQuestion.type === 'OpenText' && (
                      <div className="space-y-4">
                        <textarea
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          placeholder="Share your thoughts here..."
                          className="w-full p-4 border-2 border-primary-200 dark:border-gray-600 rounded-xl resize-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:bg-gray-800 dark:text-white font-literary transition-all duration-300"
                          rows="4"
                        />
                        <p className="text-sm font-literary text-primary-600 dark:text-gray-400 text-center">
                          Your response will contribute to the word cloud visualization
                        </p>
                      </div>
                    )}

                    {currentQuestion.type === 'Rating' && (
                      <div className="text-center space-y-4">
                        <div className="flex justify-center gap-3">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              onClick={() => setUserAnswer(rating.toString())}
                              className={`text-5xl transition-all duration-300 hover:scale-125 transform ${
                                parseInt(userAnswer) >= rating 
                                  ? 'text-yellow-400 drop-shadow-lg' 
                                  : 'text-gray-300 dark:text-gray-600 hover:text-yellow-200'
                              }`}
                            >
                              <FiStar className={`w-12 h-12 ${parseInt(userAnswer) >= rating ? 'fill-current' : ''}`} />
                            </button>
                          ))}
                        </div>
                        {userAnswer && (
                          <Badge variant="warning" size="lg" className="font-serif">
                            {userAnswer} Star{parseInt(userAnswer) !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex justify-center pt-4">
                      <Button
                        onClick={handleSubmitAnswer}
                        disabled={!userAnswer.trim()}
                        variant="primary"
                        size="lg"
                        icon={FiCheck}
                        className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:transform-none"
                      >
                        Submit Answer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-success-500 to-success-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                      <FiCheck className="w-12 h-12 text-white" />
                    </div>
                    
                    <h3 className="text-3xl font-elegant text-success-700 dark:text-success-400 mb-4">
                      Answer Submitted!
                    </h3>
                    
                    <div className="space-y-3 mb-6">
                      <Badge variant="success" size="lg" className="font-serif">
                        Your answer: "{userAnswer}"
                      </Badge>
                      <Badge variant="info" className="font-mono">
                        <FiClock className="w-4 h-4 mr-1" />
                        Response time: {responseTime}s
                      </Badge>
                    </div>
                    
                    <Alert variant="info" className="mb-6">
                      <FiHeart className="w-4 h-4" />
                      <Alert.Description>
                        You can only answer once per question. Continue engaging with reactions below!
                      </Alert.Description>
                    </Alert>
                    
                    {/* Reaction Buttons */}
                    <Card shadow="lg" className="border-primary-200 dark:border-gray-700">
                      <Card.Header className="bg-gradient-to-r from-primary-50 to-white dark:from-gray-800 dark:to-gray-800">
                        <Card.Title className="text-lg font-elegant text-primary-900 dark:text-white flex items-center justify-center gap-2">
                          <FiSmile className="w-5 h-5" />
                          Live Reactions
                        </Card.Title>
                      </Card.Header>
                      <Card.Content className="p-6">
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                          {['👍', '❤️', '😂', '😮', '🤔', '👏'].map((emoji, index) => {
                            const currentReactions = questionReactions[activityState?.currentQuestionIndex || 0];
                            const emojiTypeMap = {
                              '👍': 'like',
                              '❤️': 'love', 
                              '😂': 'laugh',
                              '😮': 'wow',
                              '🤔': 'confused',
                              '👏': 'clap'
                            };
                            const count = currentReactions?.counts?.[emojiTypeMap[emoji]] || 0;
                            
                            return (
                              <button
                                key={index}
                                onClick={() => handleReaction(emoji)}
                                className="relative p-4 bg-white dark:bg-gray-800 border border-primary-200 dark:border-gray-600 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 text-3xl group"
                                title={`React with ${emoji}`}
                              >
                                {emoji}
                                {count > 0 && (
                                  <Badge variant="primary" size="xs" className="absolute -top-2 -right-2 font-mono">
                                    {count}
                                  </Badge>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        
                        {/* Reaction Summary */}
                        {questionReactions[activityState?.currentQuestionIndex || 0]?.total > 0 && (
                          <div className="text-center">
                            <Badge variant="ghost" className="font-literary">
                              {questionReactions[activityState?.currentQuestionIndex || 0].total} total reactions
                            </Badge>
                          </div>
                        )}
                      </Card.Content>
                    </Card>
                  </div>
                )}

                {/* Live Results */}
                {hasAnswered && currentResults && activity.settings?.showResultsLive && (
                  <Card shadow="lg" className="border-primary-200 dark:border-gray-700">
                    <Card.Header className="bg-gradient-to-r from-primary-50 to-white dark:from-gray-800 dark:to-gray-800">
                      <div className="flex items-center justify-between">
                        <Card.Title className="text-xl font-elegant text-primary-900 dark:text-white flex items-center gap-2">
                          <FiBarChart className="w-5 h-5" />
                          Live Results
                        </Card.Title>
                        
                        {/* Chart Type Selector - Only show for MultiChoice and MultiVote */}
                        {(currentQuestion.type === 'MultiChoice' || currentQuestion.type === 'MultiVote') && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-literary text-primary-600 dark:text-gray-300">Chart:</span>
                            <select
                              value={chartType}
                              onChange={(e) => setChartType(e.target.value)}
                              className="text-sm border border-primary-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-800 text-primary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="bar">Bar Chart</option>
                              <option value="pie">Pie Chart</option>
                              <option value="doughnut">Doughnut Chart</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </Card.Header>
                    <Card.Content className="p-6">
                      {currentQuestion.type === 'OpenText' && currentResults.analytics?.wordCloud ? (
                        <WordCloudChart 
                          wordCloudData={currentResults.analytics.wordCloud}
                          animated={true}
                        />
                      ) : currentQuestion.type === 'OpenText' ? (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gradient-to-br from-info-500 to-info-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FiRefreshCw className="w-8 h-8 text-white animate-spin" />
                          </div>
                          <h4 className="text-lg font-serif text-primary-900 dark:text-white mb-2">
                            Building Word Cloud
                          </h4>
                          <p className="font-literary text-primary-600 dark:text-gray-300 mb-4">
                            Word cloud will appear as more participants respond
                          </p>
                          <Badge variant="info" className="font-mono">
                            {currentResults?.analytics?.totalResponses || 0} responses so far
                          </Badge>
                        </div>
                      ) : (
                        <PollChart
                          question={currentQuestion}
                          analytics={currentResults.analytics}
                          chartType={chartType}
                          animated={true}
                          showResults={true}
                        />
                      )}
                    </Card.Content>
                  </Card>
                )}
                </Card.Content>
              </Card>
            ) : (
              <Card shadow="xl" className="border-warning-200 dark:border-gray-700">
                <Card.Content className="p-12 text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-warning-500 to-warning-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                    <FiClock className="w-12 h-12 text-white animate-pulse" />
                  </div>
                  <h3 className="text-3xl font-elegant text-primary-900 dark:text-white mb-4">
                    Waiting for the next question...
                  </h3>
                  <p className="text-lg font-literary text-primary-600 dark:text-gray-300">
                    The host will present the next question shortly
                  </p>
                </Card.Content>
              </Card>
            )}

            {/* Active Live Polls */}
            {livePolls.length > 0 && (
              <div className="space-y-4">
                {livePolls.map((poll) => (
                  <LivePollCard
                    key={poll.id}
                    poll={poll}
                    onVote={handlePollVote}
                    activityId={activity.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Q&A Sidebar */}
          {showQA && (
            <div className="lg:col-span-1">
              <ThreadedQAPanel
                questions={qaQuestions}
                onSubmitQuestion={handleSubmitQuestion}
                onUpvoteQuestion={handleUpvoteQuestion}
                participantId={participantId}
                onReplySubmitted={handleRefreshQA}
              />
            </div>
          )}
        </div>
      </div>
    </PageTemplate>
  );
};

// Live Poll Card for Participants
const LivePollCard = ({ poll, onVote, activityId }) => {
  const [hasVoted, setHasVoted] = useState(false);
  const [results, setResults] = useState(null);
  const [textResponse, setTextResponse] = useState('');
  const [selectedRating, setSelectedRating] = useState('');

  useEffect(() => {
    pollingService.startPollResultsPolling(activityId, poll.id, setResults);
    
    return () => {
      pollingService.stopPollResultsPolling(poll.id);
    };
  }, [poll.id, activityId]);

  const handleVote = async (option) => {
    if (hasVoted) return;
    
    await onVote(poll.id, option);
    setHasVoted(true);
  };

  const handleTextSubmit = async () => {
    if (!textResponse.trim() || hasVoted) return;
    
    await onVote(poll.id, textResponse);
    setHasVoted(true);
  };

  const handleRatingVote = async (rating) => {
    if (hasVoted) return;
    
    setSelectedRating(rating);
    await onVote(poll.id, rating.toString());
    setHasVoted(true);
  };

  const renderPollInterface = () => {
    if (hasVoted || !results?.isActive) {
      return (
        <div className="space-y-3">
          {results && poll.type === 'MultiChoice' && Object.entries(results.results || {}).map(([option, data]) => (
            <div key={option} className="relative">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="font-medium text-gray-700">{option}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 transition-all duration-500"
                      style={{ width: `${data.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {data.percentage}%
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {results && poll.type === 'Rating' && Object.entries(results.results || {}).map(([rating, data]) => (
            <div key={rating} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-yellow-500">{'★'.repeat(parseInt(rating))}</span>
                <span className="font-medium text-gray-700">{rating} stars</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 transition-all duration-500"
                    style={{ width: `${data.percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">
                  {data.count}
                </span>
              </div>
            </div>
          ))}
          
          {results && poll.type === 'OpenText' && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h5 className="font-medium text-gray-700 mb-2">Responses:</h5>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {results.responses?.map((response, index) => (
                  <div key={index} className="text-sm text-primary-600 dark:text-gray-300 bg-white dark:bg-gray-700 p-2 rounded">
                    "{response.text}" - {response.nickname}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-center text-sm text-gray-500 mt-4">
            {hasVoted ? 'Thank you for voting!' : 'Poll has ended'} • {results?.totalVotes || 0} total votes
          </div>
        </div>
      );
    }

    // Active poll interface based on type
    switch (poll.type) {
      case 'MultiChoice':
        return (
          <div className="space-y-3">
            {poll.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleVote(option)}
                className="w-full p-4 text-left border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
              >
                {option}
              </button>
            ))}
          </div>
        );
      
      case 'Rating':
        return (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">Rate from 1 to 5 stars:</p>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleRatingVote(rating)}
                  className={`text-4xl transition-all hover:scale-110 ${
                    selectedRating >= rating 
                      ? 'text-yellow-400' 
                      : 'text-gray-300 hover:text-yellow-200'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        );
      
      case 'OpenText':
        return (
          <div className="space-y-3">
            <textarea
              value={textResponse}
              onChange={(e) => setTextResponse(e.target.value)}
              placeholder="Type your response here..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              rows="3"
              maxLength={500}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {textResponse.length}/500 characters
              </span>
              <button
                onClick={handleTextSubmit}
                disabled={!textResponse.trim()}
                className="px-4 py-2 bg-purple-500 dark:bg-purple-600 text-white rounded hover:bg-purple-600 dark:hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        );
      

      
      default:
        return (
          <div className="text-center text-gray-500 py-4">
            Unsupported poll type: {poll.type}
          </div>
        );
    }
  };

  return (
    <Card shadow="xl" className="border-primary-200 dark:border-gray-700">
      <Card.Header className="bg-gradient-to-r from-primary-50 to-white dark:from-gray-800 dark:to-gray-800">
        <div className="flex items-center justify-between">
          <Card.Title className="text-lg font-elegant text-primary-900 dark:text-white flex items-center gap-2">
            <FiBarChart className="w-5 h-5" />
            Live Poll
          </Card.Title>
          <div className="flex items-center gap-2">
            <Badge variant="primary" size="sm" className="font-mono">
              {poll.type}
            </Badge>
            <Badge variant={results?.isActive ? "success" : "ghost"} size="sm">
              {results?.isActive ? 'Active' : 'Ended'}
            </Badge>
          </div>
        </div>
        <Card.Title className="text-xl font-serif text-primary-900 dark:text-white mt-3">
          {poll.question}
        </Card.Title>
      </Card.Header>
      <Card.Content className="p-6">
        {renderPollInterface()}
      </Card.Content>
    </Card>
  );
};

export default ParticipantInterface;