import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import pollingService from '../../services/pollingService';
import PollChart from '../charts/PollChart';
import WordCloudChart from '../charts/WordCloudChart';
import { Card, Button, PageTemplate, Badge } from '../ui';
import { FiActivity, FiArrowLeft, FiUser, FiPlay, FiSettings, FiBarChart, FiMessageCircle, FiHelpCircle, FiX, FiInfo, FiPieChart, FiTrendingUp, FiGrid, FiCircle, FiTarget, FiType, FiStar } from 'react-icons/fi';

const HostControlPanel = ({ activity, onClose }) => {

  const [activityState, setActivityState] = useState(activity);
  const [currentResults, setCurrentResults] = useState(null);
  const [qaQuestions, setQAQuestions] = useState([]);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [loading, setLoading] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [chartType, setChartType] = useState('bar'); // Chart type selection
  const [wordCloudStyle, setWordCloudStyle] = useState('classic'); // Word cloud style selection
  const [currentQuestionReactions, setCurrentQuestionReactions] = useState(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showVisualizationGuide, setShowVisualizationGuide] = useState(false);
  const [livePolls, setLivePolls] = useState([]);

  const baseURL = process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:5000/api';

  // Fetch reactions for current question
  const fetchCurrentQuestionReactions = useCallback(async (questionIndex) => {
    try {
      const response = await axios.get(
        `${baseURL}/live/activities/${activityState?.id || activityState?.Act_ID}/questions/${questionIndex}/reactions`
      );
      setCurrentQuestionReactions(response.data);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  }, [baseURL, activityState?.id, activityState?.Act_ID]);

  // Define handlers as useCallback to avoid dependency issues
  const handleNavigateQuestion = useCallback(async (direction, questionIndex = null) => {
    setLoading(true);
    let newIndex = activityState?.currentQuestionIndex ?? 0;
    const totalQuestions = activityState?.questions?.length || 0;
    
    try {
      const token = localStorage.getItem('token');
      const activityId = activityState?.id || activityState?.Act_ID;
      
      console.log('🧭 Navigation Debug:', {
        direction,
        questionIndex,
        currentIndex: newIndex,
        totalQuestions,
        activityId,
        tokenExists: !!token
      });
      
      // Handle navigation logic
      // For now, only use totalQuestions until livePolls are properly implemented
      
      if (direction === 'next' && newIndex < totalQuestions - 1) {
        newIndex++;
      } else if (direction === 'previous' && newIndex > 0) {
        newIndex--;
      } else if (direction === 'jump' && questionIndex !== null && questionIndex >= 0 && questionIndex < totalQuestions) {
        newIndex = questionIndex;
      } else {
        // If no valid navigation, don't proceed
        console.log('❌ Navigation blocked:', {
          reason: 'Invalid navigation parameters',
          direction,
          questionIndex,
          currentIndex: newIndex,
          totalQuestions
        });
        setLoading(false);
        return;
      }
      
      console.log('📤 Sending navigation request:', {
        url: `${baseURL}/live/activities/${activityId}/navigate`,
        body: { questionIndex: newIndex },
        newIndex
      });

      // Use unified navigation endpoint for all questions/polls
      const response = await axios.patch(
        `${baseURL}/live/activities/${activityId}/navigate`,
        { questionIndex: newIndex },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 25000
        }
      );

      console.log('📥 Navigation response:', response.data);

      if (response.data.success) {
        const serverIndex = response.data.currentQuestionIndex;
        console.log('🔄 Updating activity state:', {
          oldIndex: activityState?.currentQuestionIndex,
          newIndex: serverIndex,
          responseData: response.data
        });
        
        setActivityState(prev => {
          const newState = {
            ...prev,
            currentQuestionIndex: serverIndex,
            currentQuestion: response.data.currentQuestion
          };
          console.log('🔄 New activity state:', newState);
          return newState;
        });

        // Update results polling for new question/poll
        console.log('🔄 Stopping polling for old question index:', activityState.currentQuestionIndex);
        pollingService.stopResultsPolling(activityId, activityState.currentQuestionIndex);
        
        // Get results for the current question/poll
        const currentItem = activityState?.questions?.[serverIndex];
        console.log('🔄 Current item at new index:', currentItem);
        
        if (currentItem) {
          if (currentItem.isPoll) {
            // For polls, use the poll results endpoint
            console.log('🔄 Starting poll results fetch for:', currentItem.id);
            fetchPollResults(currentItem.id);
          } else {
            // For regular questions, use standard results polling
            console.log('🔄 Starting results polling for question index:', serverIndex);
            pollingService.startResultsPolling(activityId, serverIndex, setCurrentResults);
          }
        } else {
          console.warn('⚠️ No current item found at index:', serverIndex);
        }
      }
      
    } catch (error) {
      console.error('❌ Error navigating questions:', error);
      console.error('📊 Navigation error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        direction,
        questionIndex,
        newIndex,
        activityId: activityState?.id || activityState?.Act_ID,
        url: error.config?.url
      });
      
      // Show user-friendly error message
      if (error.response?.status === 404) {
        alert('Activity not found or you do not have permission to navigate.');
      } else if (error.response?.status === 400) {
        alert(`Navigation failed: ${error.response?.data?.error || 'Invalid request'}`);
      } else {
        alert('Failed to navigate to question. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [activityState, baseURL, setActivityState, setLoading, fetchPollResults]);

  const handleToggleActivity = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const activityId = activityState?.id || activityState?.Act_ID;
      const response = await axios.patch(
        `${baseURL}/live/activities/${activityId}/toggle`,
        {},
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 25000 // 25 second timeout for serverless
        }
      );

      if (response.data.success) {
        setActivityState(prev => ({
          ...prev,
          isLive: response.data.isLive,
          currentQuestionIndex: response.data.currentQuestionIndex
        }));
      }
    } catch (error) {
      console.error('Error toggling activity:', error);
    } finally {
      setLoading(false);
    }
  }, [activityState, baseURL, setActivityState, setLoading]);

  // Keyboard shortcuts for solo hosts
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Only handle keyboard shortcuts when not typing in inputs
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      const currentIndex = activityState?.currentQuestionIndex ?? 0;
      const totalQuestions = activityState?.questions?.length || 0;

      switch (event.key) {
        case 'ArrowLeft':
          if (currentIndex > 0) {
            handleNavigateQuestion('previous');
          }
          event.preventDefault();
          break;
        case 'ArrowRight':
          if (currentIndex < totalQuestions - 1) {
            handleNavigateQuestion('next');
          }
          event.preventDefault();
          break;
        case ' ': // Space bar to toggle activity
          if (event.ctrlKey || event.metaKey) {
            handleToggleActivity();
            event.preventDefault();
          }
          break;
        case '?':
          setShowKeyboardHelp(!showKeyboardHelp);
          event.preventDefault();
          break;
        default:
          // No special handling for other keys
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [activityState?.currentQuestionIndex, activityState?.questions?.length, showKeyboardHelp, handleNavigateQuestion, handleToggleActivity]);

  useEffect(() => {
    const activityId = activityState?.id || activityState?.Act_ID;
    if (!activityId) {
      console.error('No activity ID found:', { activityState });
      return;
    }

    console.log('Starting polling for activity ID:', activityId);

    // Start polling for activity updates (optimized for serverless)
    pollingService.startActivityPolling(activityId, (data) => {
      setActivityState(prev => ({ ...prev, ...data }));
      setParticipantCount(data.participantCount || 0);
    }); // Uses default 8s interval

    // Start polling for Q&A
    pollingService.startQAPolling(activityId, setQAQuestions); // Uses default 7s interval

    // Start polling for live polls
    pollingService.startLivePollsPolling(activityId, setLivePolls);

    // Start polling for current question results (moved to separate useEffect)
    if (activityState.currentQuestionIndex !== undefined) {
      console.log('🔄 Initial question index setup:', activityState.currentQuestionIndex);
    }

    return () => {
      pollingService.stopAllPolling(activityId);
    };
  }, [activityState?.id, activityState?.Act_ID, activityState, fetchCurrentQuestionReactions]);

  // Separate useEffect for handling current question index changes
  useEffect(() => {
    const activityId = activityState?.id || activityState?.Act_ID;
    if (!activityId || activityState.currentQuestionIndex === undefined) {
      return;
    }

    console.log('🔄 Question index changed, updating polling for index:', activityState.currentQuestionIndex);

    // Stop previous results polling
    pollingService.stopResultsPolling(activityId, activityState.currentQuestionIndex);
    
    // Start polling for new question results
    pollingService.startResultsPolling(
      activityId, 
      activityState.currentQuestionIndex, 
      setCurrentResults
    );
    
    // Fetch reactions for current question and start polling
    fetchCurrentQuestionReactions(activityState.currentQuestionIndex);
    
    // Poll for reactions every 8 seconds
    const reactionInterval = setInterval(() => {
      fetchCurrentQuestionReactions(activityState.currentQuestionIndex);
    }, 8000);
    
    return () => {
      clearInterval(reactionInterval);
    };
  }, [activityState?.currentQuestionIndex, activityState?.id, activityState?.Act_ID, fetchCurrentQuestionReactions]);

  // Fetch poll results
  const fetchPollResults = useCallback(async (pollId) => {
    try {
      const response = await axios.get(
        `${baseURL}/live/activities/${activityState?.id || activityState?.Act_ID}/polls/${pollId}/results`
      );
      setCurrentResults(response.data);
    } catch (error) {
      console.error('Error fetching poll results:', error);
    }
  }, [baseURL, activityState?.id, activityState?.Act_ID]);



  const handleAnswerQuestion = async (questionId, answer) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${baseURL}/live/activities/${activityState?.id || activityState?.Act_ID}/questions/${questionId}/answer`,
        { answer },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 25000 // 25 second timeout for serverless
        }
      );
    } catch (error) {
      console.error('Error answering question:', error);
    }
  };

  const totalQuestions = activityState?.questions?.length || 0;
  
  // Helper to get current item (question or poll)
  const getCurrentItem = () => {
    const currentIndex = activityState?.currentQuestionIndex ?? 0;
    const currentItem = activityState?.questions?.[currentIndex];
    
    if (currentItem) {
      return { 
        type: currentItem.isPoll ? 'poll' : 'question', 
        item: currentItem, 
        index: currentIndex 
      };
    }
    
    return { type: 'question', item: null, index: currentIndex };
  };

  const currentItem = getCurrentItem();

  return (
    <>
      <PageTemplate
        title={`Hosting: ${activityState?.title}`}
        description="Manage your live interactive activity in real-time"
        icon={<FiActivity className="w-8 h-8" />}
        className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
      headerActions={
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Primary Control - Start/Stop */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleToggleActivity}
              disabled={loading}
              variant={activityState?.isLive ? "danger" : "success"}
              size="lg"
              icon={activityState?.isLive ? FiX : FiPlay}
              loading={loading}
              className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
            >
              {activityState?.isLive ? 'Stop Activity' : 'Start Activity'}
            </Button>
            {activityState?.isLive && (
              <Badge variant="success" className="animate-pulse">
                ● LIVE
              </Badge>
            )}
          </div>
          
          {/* Secondary Controls */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowPollCreator(true)}
              disabled={!activityState?.isLive}
              variant="primary"
              size="sm"
              icon={FiBarChart}
              className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
            >
              Create Poll
            </Button>
            
            <Button
              onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
              variant="ghost"
              size="sm"
              icon={FiHelpCircle}
              className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
            />
            
            <Button
              onClick={() => setShowVisualizationGuide(!showVisualizationGuide)}
              variant="ghost"
              size="sm"
              icon={FiBarChart}
              className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
              title="Visualization Guide"
            >
              Guide
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              icon={FiArrowLeft}
              className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
            >
              Exit
            </Button>
          </div>
        </div>
      }
    >
      {/* Activity Info Header */}
      <div className="mb-8">
        <Card shadow="lg" className="border-primary-200 dark:border-gray-700">
          <Card.Content className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Badge variant="primary" size="lg" className="font-mono text-lg">
                    PIN: {activityState?.pin}
                  </Badge>
                  <Button
                    href="/join"
                    variant="ghost"
                    size="xs"
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
                  >
                    Join Activity ↗
                  </Button>
                </div>
                <div className="flex items-center gap-4 text-sm font-literary text-primary-600 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      activityState?.isLive ? 'bg-success-500 animate-pulse' : 'bg-warning-500'
                    }`}></div>
                    <span className="font-serif">
                      {activityState?.isLive ? 'Live' : 'Stopped'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiUser className="w-4 h-4" />
                    <span className="font-serif">{participantCount} participants</span>
                  </div>
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Question Navigation */}
          <Card shadow="lg" className="border-primary-200 dark:border-gray-700">
            <Card.Header className="bg-gradient-to-r from-primary-50 to-white dark:from-gray-800 dark:to-gray-800">
              <div className="flex items-center justify-between">
                <Card.Title className="text-xl font-elegant text-primary-900 dark:text-white flex items-center gap-3">
                  <FiSettings className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  Question Control
                </Card.Title>
                <Badge variant="info" className="font-mono">
                  {(activityState?.currentQuestionIndex ?? -1) + 1} / {totalQuestions}
                </Badge>
              </div>
            </Card.Header>
            <Card.Content className="p-6">

              {currentItem.item && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-primary-50 to-white dark:from-gray-800 dark:to-gray-700 border border-primary-200 dark:border-gray-600 rounded-xl p-6 shadow-soft">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-serif text-primary-900 dark:text-white">
                        Current {currentItem.type === 'question' ? 'Question' : 'Live Poll'}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant={currentItem.item.isPoll ? "success" : "primary"} size="sm">
                          {currentItem.item.type}
                        </Badge>
                        {currentItem.item.isPoll && (
                          <Badge variant="warning" size="sm">
                            Live Poll
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-primary-800 dark:text-gray-200 font-literary text-lg leading-relaxed">
                        {currentItem.item.text}
                      </p>
                      {currentItem.item.description && (
                        <p className="text-primary-600 dark:text-gray-400 font-literary">
                          {currentItem.item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Navigation Controls - Prominent for Solo Hosts */}
                  <div className="space-y-6">
                    {/* Primary Navigation */}
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        onClick={() => handleNavigateQuestion('previous')}
                        disabled={loading || (activityState?.currentQuestionIndex ?? 0) <= 0}
                        variant="outline"
                        size="lg"
                        icon={FiArrowLeft}
                        className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                      >
                        Previous
                      </Button>
                      
                      <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 text-white font-serif text-lg min-w-[140px] text-center px-6 py-3 rounded-lg shadow-lg">
                        {(activityState?.currentQuestionIndex ?? -1) + 1} of {totalQuestions}
                      </div>
                      
                      <Button
                        onClick={() => handleNavigateQuestion('next')}
                        disabled={loading || (activityState?.currentQuestionIndex ?? 0) >= totalQuestions - 1}
                        variant="primary"
                        size="lg"
                        className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                      >
                        Next →
                      </Button>
                    </div>

                    {/* Quick Jump Section */}
                    <div className="border-t border-primary-200 dark:border-gray-600 pt-6">
                      <div className="space-y-3">
                        <h4 className="text-sm font-serif text-primary-700 dark:text-gray-300">
                          Quick Navigation
                        </h4>
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Show buttons for questions */}
                          {activityState?.questions?.map((_, index) => (
                            <Button
                              key={`q-${index}`}
                              onClick={() => handleNavigateQuestion('jump', index)}
                              disabled={loading}
                              variant={index === activityState?.currentQuestionIndex ? "primary" : "ghost"}
                              size="xs"
                              className={`w-10 h-10 rounded-lg font-mono shadow-soft ${
                                index === activityState?.currentQuestionIndex
                                  ? 'shadow-lg transform scale-105'
                                  : 'hover:shadow-lg hover:transform hover:scale-105'
                              } transition-all duration-200`}
                              title={`Question ${index + 1}`}
                            >
                              {index + 1}
                            </Button>
                          ))}
                          {/* Show buttons for live polls */}
                          {livePolls.map((poll, pollIndex) => {
                            const pollIndexInQuestions = activityState?.questions?.findIndex(
                              q => q?.isPoll && q?.id === poll?.id
                            );
                            const disabled = loading || pollIndexInQuestions === -1 || pollIndexInQuestions === undefined;
                            return (
                              <Button
                                key={`p-${pollIndex}`}
                                onClick={() => {
                                  console.log('🔍 Jump to poll (P button) debug:', {
                                    pollId: poll?.id,
                                    pollIndexInQuestions,
                                    totalQuestions,
                                    currentIndex: activityState?.currentQuestionIndex
                                  });
                                  if (!disabled) handleNavigateQuestion('jump', pollIndexInQuestions);
                                }}
                                disabled={disabled}
                                variant={pollIndexInQuestions === activityState?.currentQuestionIndex ? "success" : "ghost"}
                                size="xs"
                                className={`w-12 h-10 rounded-lg font-mono shadow-soft ${
                                  pollIndexInQuestions === activityState?.currentQuestionIndex
                                    ? 'shadow-lg transform scale-105'
                                    : 'hover:shadow-lg hover:transform hover:scale-105'
                                } transition-all duration-200`}
                                title={`Poll: ${String(poll?.question || '').substring(0, 20)}...`}
                              >
                                P{pollIndex + 1}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!currentItem.item && totalQuestions === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-primary-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiMessageCircle className="w-8 h-8 text-primary-400 dark:text-gray-400" />
                  </div>
                  <h3 className="text-lg font-serif text-primary-600 dark:text-gray-300 mb-2">
                    No Content Available
                  </h3>
                  <p className="font-literary text-primary-500 dark:text-gray-400">
                    No questions or polls have been added to this activity yet.
                  </p>
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Live Results */}
            {currentResults && currentItem.item && (
              <Card shadow="lg" className="border-primary-200 dark:border-gray-700">
                <Card.Header className="bg-gradient-to-r from-success-50 to-white dark:from-gray-800 dark:to-gray-800">
                  <div className="flex items-center justify-between">
                    <Card.Title className="text-xl font-elegant text-primary-900 dark:text-white flex items-center gap-3">
                      <FiBarChart className="w-6 h-6 text-success-600 dark:text-success-400" />
                      Live Results
                    </Card.Title>
                    
                    <div className="flex items-center gap-3">
                      {/* Chart Type Selector - Only show for MultiChoice and MultiVote */}
                      {(currentItem.item.type === 'MultiChoice' || currentItem.item.type === 'MultiVote') && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-serif text-primary-600 dark:text-gray-300">Chart Type:</span>
                          <select
                            value={chartType}
                            onChange={(e) => setChartType(e.target.value)}
                            className="text-sm border border-primary-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-primary-900 dark:text-gray-100 rounded-lg px-3 py-1 font-literary focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="bar">Bar Chart</option>
                            <option value="pie">Pie Chart</option>
                            <option value="doughnut">Doughnut Chart</option>
                          </select>
                        </div>
                      )}
                      
                      {/* Word Cloud Style Selector - Only show for OpenText */}
                      {currentItem.item.type === 'OpenText' && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-serif text-primary-600 dark:text-gray-300">Style:</span>
                          <select
                            value={wordCloudStyle}
                            onChange={(e) => setWordCloudStyle(e.target.value)}
                            className="text-sm border border-primary-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-primary-900 dark:text-gray-100 rounded-lg px-3 py-1 font-literary focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="classic">Classic Cloud</option>
                            <option value="circular">Circular Layout</option>
                            <option value="spiral">Spiral Layout</option>
                            <option value="grid">Grid Layout</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </Card.Header>
                <Card.Content className="p-6">
                
                  {currentItem.item.type === 'OpenText' && currentResults.analytics?.wordCloud ? (
                    <WordCloudChart 
                      wordCloudData={currentResults.analytics.wordCloud}
                      animated={true}
                      cloudStyle={wordCloudStyle}
                    />
                  ) : (
                    <PollChart
                      question={currentItem.item}
                      analytics={currentResults.analytics}
                      chartType={chartType}
                      animated={true}
                      showResults={true}
                    />
                  )}
                </Card.Content>
              </Card>
            )}

            {/* Live Reactions */}
            {currentQuestionReactions && currentQuestionReactions.total > 0 && (
              <Card shadow="lg" className="border-primary-200 dark:border-gray-700">
                <Card.Header className="bg-gradient-to-r from-warning-50 to-white dark:from-gray-800 dark:to-gray-800">
                  <Card.Title className="text-xl font-elegant text-primary-900 dark:text-white flex items-center gap-3">
                    <span className="text-2xl">🎭</span>
                    Live Reactions
                    <Badge variant="warning" size="sm" className="font-mono">
                      {currentQuestionReactions.total}
                    </Badge>
                  </Card.Title>
                </Card.Header>
                <Card.Content className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                    {Object.entries({
                      '👍': 'like',
                      '❤️': 'love',
                      '😂': 'laugh', 
                      '😮': 'wow',
                      '🤔': 'confused',
                      '👏': 'clap'
                    }).map(([emoji, type]) => {
                      const count = currentQuestionReactions.counts[type] || 0;
                      return (
                        <div key={type} className="text-center p-4 bg-gradient-to-br from-primary-50 to-white dark:from-gray-800 dark:to-gray-700 border border-primary-200 dark:border-gray-600 rounded-xl shadow-soft hover:shadow-lg transition-shadow duration-200">
                          <div className="text-3xl mb-2">{emoji}</div>
                          <div className="text-xl font-serif text-primary-900 dark:text-white mb-1">{count}</div>
                          <div className="text-xs text-primary-600 dark:text-gray-400 capitalize font-literary">{type}</div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Recent reactions feed */}
                  <div className="border-t border-primary-200 dark:border-gray-600 pt-6">
                    <h4 className="text-sm font-serif text-primary-700 dark:text-gray-300 mb-4">Recent Activity</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {currentQuestionReactions.details
                        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                        .slice(0, 10)
                        .map((reaction, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-primary-25 dark:bg-gray-800 rounded-lg">
                            <span className="font-literary text-primary-800 dark:text-gray-200 flex items-center gap-3">
                              <span className="text-lg">
                                {{'like': '👍', 'love': '❤️', 'laugh': '😂', 'wow': '😮', 'confused': '🤔', 'clap': '👏'}[reaction.type]}
                              </span>
                              {reaction.nickname}
                            </span>
                            <span className="text-xs text-primary-500 dark:text-gray-400 font-mono">
                              {new Date(reaction.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </Card.Content>
              </Card>
            )}

            {/* Live Poll Results - Show poll results if current item is a poll */}
            {currentItem.type === 'poll' && currentItem.item && (
              <Card shadow="lg" className="border-primary-200 dark:border-gray-700">
                <Card.Header className="bg-gradient-to-r from-info-50 to-white dark:from-gray-800 dark:to-gray-800">
                  <Card.Title className="text-xl font-elegant text-primary-900 dark:text-white flex items-center gap-3">
                    <FiBarChart className="w-6 h-6 text-info-600 dark:text-info-400" />
                    Live Poll Results
                  </Card.Title>
                </Card.Header>
                <Card.Content className="p-6">
                  <LivePollCard 
                    poll={currentItem.item} 
                    activityId={activityState?.id || activityState?.Act_ID} 
                  />
                </Card.Content>
              </Card>
            )}

            {/* Active Live Polls */}
            {livePolls.length > 0 && (
              <Card shadow="lg" className="border-primary-200 dark:border-gray-700">
                <Card.Header className="bg-gradient-to-r from-info-50 to-white dark:from-gray-800 dark:to-gray-800">
                  <Card.Title className="text-xl font-elegant text-primary-900 dark:text-white flex items-center gap-3">
                    <FiBarChart className="w-6 h-6 text-info-600 dark:text-info-400" />
                    Active Polls
                    <Badge variant="info" size="sm" className="font-mono">
                      {livePolls.length}
                    </Badge>
                  </Card.Title>
                </Card.Header>
                <Card.Content className="p-6">
                  <div className="space-y-6">
                    {livePolls.map((poll) => (
                      <LivePollCard key={poll.id} poll={poll} activityId={activityState?.id || activityState?.Act_ID} />
                    ))}
                  </div>
                </Card.Content>
              </Card>
            )}
          </div>

          {/* Sidebar - Q&A */}
          <div className="space-y-6">
            <QAPanel 
              questions={qaQuestions}
              onAnswerQuestion={handleAnswerQuestion}
            />
          </div>
        </div>
      </PageTemplate>

      {/* Poll Creator Modal */}
      {showPollCreator && (
        <PollCreatorModal
          activityId={activityState?.id || activityState?.Act_ID}
          onClose={() => setShowPollCreator(false)}
          setActivityState={setActivityState}
        />
      )}

      {/* Keyboard Help Overlay */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card shadow="xl" className="max-w-md w-full border-primary-200 dark:border-gray-600">
            <Card.Header className="bg-gradient-to-r from-primary-50 to-white dark:from-gray-800 dark:to-gray-800">
              <div className="flex items-center justify-between">
                <Card.Title className="text-lg font-elegant text-primary-900 dark:text-white flex items-center gap-3">
                  <FiHelpCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  Keyboard Shortcuts
                </Card.Title>
                <Button
                  onClick={() => setShowKeyboardHelp(false)}
                  variant="ghost"
                  size="xs"
                  icon={FiX}
                />
              </div>
            </Card.Header>
            <Card.Content className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-literary text-primary-700 dark:text-gray-300">Previous Question</span>
                  <Badge variant="ghost" className="font-mono bg-primary-100 dark:bg-gray-700 text-primary-900 dark:text-gray-100">←</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-literary text-primary-700 dark:text-gray-300">Next Question</span>
                  <Badge variant="ghost" className="font-mono bg-primary-100 dark:bg-gray-700 text-primary-900 dark:text-gray-100">→</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-literary text-primary-700 dark:text-gray-300">Start/Stop Activity</span>
                  <Badge variant="ghost" className="font-mono bg-primary-100 dark:bg-gray-700 text-primary-900 dark:text-gray-100">Ctrl+Space</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-literary text-primary-700 dark:text-gray-300">Show Help</span>
                  <Badge variant="ghost" className="font-mono bg-primary-100 dark:bg-gray-700 text-primary-900 dark:text-gray-100">?</Badge>
                </div>
              </div>
              <div className="mt-6 p-4 bg-info-50 dark:bg-gray-800 rounded-lg border border-info-200 dark:border-gray-600">
                <p className="text-sm font-literary text-info-700 dark:text-info-300">
                  💡 Solo host tip: Use arrow keys for quick navigation during presentations
                </p>
              </div>
            </Card.Content>
          </Card>
        </div>
      )}

      {/* Visualization Guide Overlay */}
      {showVisualizationGuide && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card shadow="xl" className="max-w-4xl w-full max-h-[90vh] overflow-y-auto border-primary-200 dark:border-gray-600">
            <Card.Header className="bg-gradient-to-r from-primary-50 to-white dark:from-gray-800 dark:to-gray-800 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <Card.Title className="text-xl font-elegant text-primary-900 dark:text-white flex items-center gap-3">
                  <FiBarChart className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  Visualization Guide
                </Card.Title>
                <Button
                  onClick={() => setShowVisualizationGuide(false)}
                  variant="ghost"
                  size="xs"
                  icon={FiX}
                />
              </div>
              <p className="text-sm font-literary text-primary-600 dark:text-gray-300 mt-2">
                Complete guide to all visualization options available during your live activity
              </p>
            </Card.Header>
            <Card.Content className="p-6">
              <div className="space-y-8">
                
                {/* Multiple Choice & Multiple Vote */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <FiBarChart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif text-primary-900 dark:text-white">Multiple Choice & Multiple Vote</h3>
                      <p className="text-sm font-literary text-primary-600 dark:text-gray-300">Best for polls, quizzes, and preference questions</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl border border-blue-200 dark:border-gray-600">
                      <div className="flex items-center gap-2 mb-2">
                        <FiBarChart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h4 className="font-serif text-blue-900 dark:text-blue-300">Bar Chart</h4>
                      </div>
                      <p className="text-xs font-literary text-gray-600 dark:text-gray-400 mb-2">
                        Classic visualization showing response counts as vertical bars
                      </p>
                      <div className="text-xs">
                        <Badge variant="info" size="xs">Best for: Comparing options</Badge>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-white dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl border border-green-200 dark:border-gray-600">
                      <div className="flex items-center gap-2 mb-2">
                        <FiPieChart className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <h4 className="font-serif text-green-900 dark:text-green-300">Pie Chart</h4>
                      </div>
                      <p className="text-xs font-literary text-gray-600 dark:text-gray-400 mb-2">
                        Shows proportional representation of each choice
                      </p>
                      <div className="text-xs">
                        <Badge variant="success" size="xs">Best for: Showing percentages</Badge>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-white dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl border border-purple-200 dark:border-gray-600">
                      <div className="flex items-center gap-2 mb-2">
                        <FiCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <h4 className="font-serif text-purple-900 dark:text-purple-300">Doughnut Chart</h4>
                      </div>
                      <p className="text-xs font-literary text-gray-600 dark:text-gray-400 mb-2">
                        Modern variation of pie chart with center space for total count
                      </p>
                      <div className="text-xs">
                        <Badge variant="primary" size="xs">Best for: Clean aesthetics</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Open Text */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                      <FiType className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif text-primary-900 dark:text-white">Open Text Responses</h3>
                      <p className="text-sm font-literary text-primary-600 dark:text-gray-300">Perfect for gathering qualitative feedback and ideas</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-orange-50 to-white dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl border border-orange-200 dark:border-gray-600">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">☁️</span>
                        <h4 className="font-serif text-orange-900 dark:text-orange-300">Classic Cloud</h4>
                      </div>
                      <p className="text-xs font-literary text-gray-600 dark:text-gray-400 mb-2">
                        Random placement creates organic, natural-looking word cloud
                      </p>
                      <div className="text-xs">
                        <Badge variant="warning" size="xs">Best for: Creative presentations</Badge>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl border border-blue-200 dark:border-gray-600">
                      <div className="flex items-center gap-2 mb-2">
                        <FiCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h4 className="font-serif text-blue-900 dark:text-blue-300">Circular Layout</h4>
                      </div>
                      <p className="text-xs font-literary text-gray-600 dark:text-gray-400 mb-2">
                        Words arranged in concentric circles with size-based importance
                      </p>
                      <div className="text-xs">
                        <Badge variant="info" size="xs">Best for: Structured focus</Badge>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-white dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl border border-green-200 dark:border-gray-600">
                      <div className="flex items-center gap-2 mb-2">
                        <FiTrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <h4 className="font-serif text-green-900 dark:text-green-300">Spiral Layout</h4>
                      </div>
                      <p className="text-xs font-literary text-gray-600 dark:text-gray-400 mb-2">
                        Words flow outward in a spiral pattern from center
                      </p>
                      <div className="text-xs">
                        <Badge variant="success" size="xs">Best for: Dynamic flow</Badge>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-white dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl border border-purple-200 dark:border-gray-600">
                      <div className="flex items-center gap-2 mb-2">
                        <FiGrid className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <h4 className="font-serif text-purple-900 dark:text-purple-300">Grid Layout</h4>
                      </div>
                      <p className="text-xs font-literary text-gray-600 dark:text-gray-400 mb-2">
                        Organized grid arrangement for systematic comparison
                      </p>
                      <div className="text-xs">
                        <Badge variant="primary" size="xs">Best for: Clean analysis</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rating Questions */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                      <FiStar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif text-primary-900 dark:text-white">Rating Questions</h3>
                      <p className="text-sm font-literary text-primary-600 dark:text-gray-300">Ideal for satisfaction surveys and scale-based feedback</p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-yellow-50 to-white dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl border border-yellow-200 dark:border-gray-600">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <FiBarChart className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
                        <h4 className="font-serif text-yellow-900 dark:text-yellow-300 mb-1">Bar Chart</h4>
                        <p className="text-xs font-literary text-gray-600 dark:text-gray-400">Shows distribution across 1-5 star ratings</p>
                      </div>
                      <div className="text-center">
                        <FiTrendingUp className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
                        <h4 className="font-serif text-yellow-900 dark:text-yellow-300 mb-1">Average Display</h4>
                        <p className="text-xs font-literary text-gray-600 dark:text-gray-400">Shows overall satisfaction score</p>
                      </div>
                      <div className="text-center">
                        <FiTarget className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
                        <h4 className="font-serif text-yellow-900 dark:text-yellow-300 mb-1">Response Count</h4>
                        <p className="text-xs font-literary text-gray-600 dark:text-gray-400">Total number of ratings received</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Reactions */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center">
                      <span className="text-xl">🎭</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-serif text-primary-900 dark:text-white">Live Reactions</h3>
                      <p className="text-sm font-literary text-primary-600 dark:text-gray-300">Real-time emotional feedback from participants</p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-pink-50 to-white dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl border border-pink-200 dark:border-gray-600">
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-4">
                      <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg border border-pink-200 dark:border-gray-600">
                        <div className="text-2xl mb-1">👍</div>
                        <div className="text-xs font-literary text-gray-600 dark:text-gray-400">Like</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg border border-pink-200 dark:border-gray-600">
                        <div className="text-2xl mb-1">❤️</div>
                        <div className="text-xs font-literary text-gray-600 dark:text-gray-400">Love</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg border border-pink-200 dark:border-gray-600">
                        <div className="text-2xl mb-1">😂</div>
                        <div className="text-xs font-literary text-gray-600 dark:text-gray-400">Laugh</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg border border-pink-200 dark:border-gray-600">
                        <div className="text-2xl mb-1">😮</div>
                        <div className="text-xs font-literary text-gray-600 dark:text-gray-400">Wow</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg border border-pink-200 dark:border-gray-600">
                        <div className="text-2xl mb-1">🤔</div>
                        <div className="text-xs font-literary text-gray-600 dark:text-gray-400">Confused</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg border border-pink-200 dark:border-gray-600">
                        <div className="text-2xl mb-1">👏</div>
                        <div className="text-xs font-literary text-gray-600 dark:text-gray-400">Clap</div>
                      </div>
                    </div>
                    <p className="text-sm font-literary text-gray-600 dark:text-gray-300 text-center">
                      Participants can react in real-time. View live counts and recent activity feed.
                    </p>
                  </div>
                </div>

                {/* Tips & Best Practices */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-info-500 to-info-600 rounded-xl flex items-center justify-center">
                      <FiInfo className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif text-primary-900 dark:text-white">Tips & Best Practices</h3>
                      <p className="text-sm font-literary text-primary-600 dark:text-gray-300">Maximize engagement with effective visualization choices</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-info-50 to-white dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl border border-info-200 dark:border-gray-600">
                      <h4 className="font-serif text-info-900 dark:text-info-300 mb-2 flex items-center gap-2">
                        <span className="text-green-500">✅</span> Do's
                      </h4>
                      <ul className="space-y-1 text-sm font-literary text-gray-600 dark:text-gray-300">
                        <li>• Use bar charts for easy comparison</li>
                        <li>• Switch to pie charts for percentage focus</li>
                        <li>• Try different word cloud layouts for variety</li>
                        <li>• Monitor reactions for audience engagement</li>
                        <li>• Use animations to maintain attention</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gradient-to-br from-warning-50 to-white dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl border border-warning-200 dark:border-gray-600">
                      <h4 className="font-serif text-warning-900 dark:text-warning-300 mb-2 flex items-center gap-2">
                        <span className="text-red-500">⚠️</span> Consider
                      </h4>
                      <ul className="space-y-1 text-sm font-literary text-gray-600 dark:text-gray-300">
                        <li>• Complex charts may confuse audience</li>
                        <li>• Too many visualization changes can distract</li>
                        <li>• Word clouds work best with 10+ responses</li>
                        <li>• Allow time for participants to react</li>
                        <li>• Consider screen size of remote participants</li>
                      </ul>
                    </div>
                  </div>
                </div>

              </div>
            </Card.Content>
          </Card>
        </div>
      )}
    </>
  );
};

// Q&A Panel Component
const QAPanel = ({ questions, onAnswerQuestion }) => {
  const [filterStatus, setFilterStatus] = useState('pending');
  
  const filteredQuestions = questions.filter(q => 
    filterStatus === 'all' || q.status === filterStatus
  );

  return (
    <Card shadow="lg" className="border-primary-200 dark:border-gray-700">
      <Card.Header className="bg-gradient-to-r from-primary-50 to-white dark:from-gray-800 dark:to-gray-800">
        <div className="flex items-center justify-between">
          <Card.Title className="text-xl font-elegant text-primary-900 dark:text-white flex items-center gap-3">
            <FiMessageCircle className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            Q&A Session
          </Card.Title>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-primary-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-primary-900 dark:text-gray-100 rounded-lg px-3 py-2 font-literary focus:ring-2 focus:ring-primary-500"
          >
            <option value="pending">Pending</option>
            <option value="answered">Answered</option>
            <option value="all">All Questions</option>
          </select>
        </div>
      </Card.Header>
      <Card.Content className="p-6">
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiMessageCircle className="w-8 h-8 text-primary-400 dark:text-gray-400" />
              </div>
              <h3 className="text-lg font-serif text-primary-600 dark:text-gray-300 mb-2">
                No {filterStatus} questions
              </h3>
              <p className="font-literary text-primary-500 dark:text-gray-400">
                {filterStatus === 'pending' 
                  ? 'Waiting for participants to ask questions...'
                  : `No ${filterStatus} questions found.`}
              </p>
            </div>
          ) : (
            filteredQuestions.map((question) => (
              <QAQuestionCard
                key={question.id}
                question={question}
                onAnswer={onAnswerQuestion}
              />
            ))
          )}
        </div>
      </Card.Content>
    </Card>
  );
};

// Q&A Question Card Component
const QAQuestionCard = ({ question, onAnswer }) => {
  const [answerText, setAnswerText] = useState('');
  const [showAnswerForm, setShowAnswerForm] = useState(false);

  const handleSubmitAnswer = () => {
    if (!answerText.trim()) return;
    
    onAnswer(question.id, answerText);
    setAnswerText('');
    setShowAnswerForm(false);
  };

  return (
    <div className="bg-gradient-to-r from-primary-25 to-white dark:from-gray-800 dark:to-gray-700 border border-primary-200 dark:border-gray-600 rounded-xl p-4 shadow-soft hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-serif text-primary-800 dark:text-gray-200">
              {question.isAnonymous ? 'Anonymous' : question.nickname}
            </span>
            <span className="text-xs text-primary-500 dark:text-gray-400 font-mono">
              {new Date(question.createdAt).toLocaleTimeString()}
            </span>
            <div className="flex items-center gap-1 text-xs">
              <span>👍</span>
              <Badge variant="ghost" size="xs" className="font-mono">
                {question.upvoteCount}
              </Badge>
            </div>
            {question.isAnonymous && (
              <Badge variant="warning" size="xs" className="bg-warning-100 dark:bg-warning-900">
                🔒 Private
              </Badge>
            )}
          </div>
          <p className="text-primary-900 dark:text-gray-100 font-literary leading-relaxed">{question.question}</p>
        </div>
        
        <Badge 
          variant={
            question.status === 'pending' ? 'warning' :
            question.status === 'answered' ? 'success' : 'ghost'
          }
          size="sm"
          className="capitalize"
        >
          {question.status}
        </Badge>
      </div>

      {question.answer && (
        <div className="mt-4 p-4 bg-gradient-to-r from-success-50 to-white dark:from-gray-700 dark:to-gray-600 border border-success-200 dark:border-gray-500 rounded-lg">
          <div className="text-xs font-serif text-success-700 dark:text-success-300 mb-2">Host Answer:</div>
          <p className="font-literary text-success-800 dark:text-gray-100">{question.answer.text}</p>
        </div>
      )}

      {question.status === 'pending' && (
        <div className="mt-4">
          {!showAnswerForm ? (
            <Button
              onClick={() => setShowAnswerForm(true)}
              variant="primary"
              size="sm"
              icon={FiMessageCircle}
              className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Answer Question
            </Button>
          ) : (
            <div className="space-y-3">
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Type your answer..."
                className="w-full p-3 border border-primary-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-primary-900 dark:text-gray-100 rounded-lg resize-none font-literary focus:ring-2 focus:ring-primary-500"
                rows="3"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!answerText.trim()}
                  variant="success"
                  size="sm"
                  className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Send Answer
                </Button>
                <Button
                  onClick={() => {
                    setShowAnswerForm(false);
                    setAnswerText('');
                  }}
                  variant="ghost"
                  size="sm"
                  className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Live Poll Card Component
const LivePollCard = ({ poll, activityId }) => {
  const [results, setResults] = useState(null);
  const [chartType, setChartType] = useState('bar'); // Chart type for live polls

  useEffect(() => {
    if (poll?.id) {
      pollingService.startPollResultsPolling(activityId, poll.id, setResults);
      
      return () => {
        pollingService.stopPollResultsPolling(poll.id);
      };
    }
  }, [poll?.id, activityId]);

  const renderResults = () => {
    if (!results) return null;

    if (poll.type === 'OpenText') {
      return (
        <div className="space-y-2">
          <h5 className="font-medium text-gray-700 mb-2">
            Responses ({results.totalVotes}):
          </h5>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {results.responses?.map((response, index) => (
              <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                "{response.text}" - {response.nickname}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // For MultiChoice, MultiVote, and Rating polls, use PollChart
    if (poll.type === 'MultiChoice' || poll.type === 'MultiVote' || poll.type === 'Rating') {
      // Convert poll results to analytics format for PollChart
      const analytics = {
        totalResponses: results.totalVotes,
        answerCounts: results.results || {},
        averageResponseTime: 0
      };

      return (
        <div>
          {/* Chart Type Selector */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">Chart Type:</span>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
            >
              <option value="bar">Bar Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="doughnut">Doughnut Chart</option>
            </select>
          </div>
          
          {/* Poll Chart */}
          <PollChart
            question={poll}
            analytics={analytics}
            chartType={chartType}
            animated={true}
            showResults={true}
          />
        </div>
      );
    }

    // Fallback for other poll types
    return (
      <div className="space-y-2">
        {Object.entries(results.results || {}).map(([option, data]) => (
          <div key={option} className="flex items-center justify-between">
            <span className="text-sm text-gray-700 flex items-center gap-1">
              {poll.type === 'Rating' && <span className="text-yellow-500">{'★'.repeat(parseInt(option))}</span>}
              {option}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${data.percentage}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-600 w-8">{data.count}</span>
            </div>
          </div>
        ))}
        <div className="text-xs text-gray-500 mt-2">
          Total votes: {results.totalVotes}
        </div>
      </div>
    );
  };

  return (
    <div className="border border-purple-200 dark:border-gray-600 rounded-lg p-4 bg-purple-50 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-primary-900 dark:text-white">{poll.question}</h4>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">
            {poll.type}
          </span>
          <span className="text-xs text-gray-500">
            {results?.isActive ? 'Active' : 'Expired'}
          </span>
        </div>
      </div>
      
      {renderResults()}
    </div>
  );
};

// Poll Creator Modal Component
const PollCreatorModal = ({ activityId, onClose, setActivityState }) => {
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [questionType, setQuestionType] = useState('MultiChoice');
  const [options, setOptions] = useState(['', '']);
  const [duration, setDuration] = useState(300);
  const [loading, setLoading] = useState(false);

  const baseURL = process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:5000/api';

  // Helper function to check if poll can be created
  const canCreatePoll = useCallback(() => {
    const questionValid = question.trim().length > 0;
    
    if (questionType === 'MultiChoice' || questionType === 'MultiVote') {
      const validOptions = options.filter(opt => opt.trim());
      const result = questionValid && validOptions.length >= 2;
      console.log('🔍 MultiChoice/MultiVote validation:', { 
        questionValid, 
        validOptionsCount: validOptions.length, 
        result,
        question: question.trim(),
        questionType 
      });
      return result;
    }
    
    // For other poll types, just need a question
    const result = questionValid;
    console.log('🔍 Non-MC validation:', { 
      questionType, 
      questionValid, 
      question: question.trim(),
      result 
    });
    return result;
  }, [question, questionType, options]);

  // Debug useEffect to monitor state changes
  useEffect(() => {
    const canCreate = canCreatePoll();
    console.log('🔍 State change debug:', {
      question: question.trim(),
      questionType,
      options: options.filter(opt => opt.trim()),
      canCreate,
      loading
    });
  }, [question, questionType, options, loading, canCreatePoll]);

  const handleCreatePoll = async () => {
    if (!question.trim()) {
      alert('Please enter a question');
      return;
    }

    // Validate MultiChoice/MultiVote questions have at least 2 options with text
    if (questionType === 'MultiChoice' || questionType === 'MultiVote') {
      const validOptions = options.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        alert('Please provide at least 2 options for multiple choice polls');
        return;
      }
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const pollData = {
        question,
        description: description.trim() || undefined,
        duration,
        type: questionType
      };

      // Add options for MultiChoice and MultiVote questions
      if (questionType === 'MultiChoice' || questionType === 'MultiVote') {
        pollData.options = options.filter(opt => opt.trim());
        pollData.allowMultipleVotes = questionType === 'MultiVote';
      }
      // Let backend handle options for other types based on type parameter

      console.log('📊 Creating poll with data:', pollData);

      const response = await axios.post(
        `${baseURL}/live/activities/${activityId}/polls`,
        pollData,
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 25000 // Add timeout for serverless
        }
      );

      console.log('✅ Poll created successfully:', response.data);
      
      if (response.data.success && response.data.poll) {
        const created = response.data.poll;
        const newQuestionIndex = created.questionIndex;
        console.log('🔧 Integrating created poll into activity state:', { created, newQuestionIndex });

        if (newQuestionIndex !== undefined) {
          setActivityState(prev => {
            const prevQuestions = Array.isArray(prev.questions) ? prev.questions.slice() : [];
            const pollQuestion = {
              id: created.id,
              text: created.question,
              description: created.description || '',
              options: created.options || [],
              isPoll: true,
              isActive: true,
              type: created.type,
              settings: {
                allowMultiple: !!created.allowMultiple,
                expiresAt: created.expiresAt,
                duration: duration,
                showResultsLive: true,
                required: false
              },
              responses: []
            };
            // Place or append at the index returned by server
            if (newQuestionIndex >= 0) {
              prevQuestions[newQuestionIndex] = pollQuestion;
            } else {
              prevQuestions.push(pollQuestion);
            }
            const nextState = {
              ...prev,
              questions: prevQuestions,
              currentQuestionIndex: newQuestionIndex >= 0 ? newQuestionIndex : prevQuestions.length - 1
            };
            console.log('✅ Updated activityState with new poll:', nextState);
            return nextState;
          });
        }
      }
      
      // Reset form state after successful creation
      setQuestion('');
      setDescription('');
      setQuestionType('MultiChoice');
      setOptions(['', '']);
      setDuration(300);
      
      onClose();
    } catch (error) {
      console.error('❌ Error creating poll:', error);
      try {
        const raw = error?.response?.data;
        console.error('📄 Raw error response (may be HTML if misrouted):', typeof raw === 'string' ? raw.slice(0, 200) : raw);
      } catch (_) {}
      console.error('📊 Poll creation error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseURL: error.request?.responseURL,
        headers: error.response?.headers,
        data: error.response?.data,
        pollData: {
          type: questionType,
          question,
          duration,
          options: questionType === 'MultiChoice' ? options : 'Auto-generated'
        }
      });
      
      const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || 'Failed to create poll';
      alert(`Failed to create poll: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-primary-900 dark:text-white">Create Live Poll</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question Type
            </label>
            <select
              value={questionType}
              onChange={(e) => {
                const newType = e.target.value;
                console.log('🔍 Question type change:', { 
                  oldType: questionType, 
                  newType,
                  question: question.trim(),
                  canCreate: canCreatePoll()
                });
                setQuestionType(newType);
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="MultiChoice">Multiple Choice (Single Vote)</option>
              <option value="MultiVote">Multiple Choice (Multiple Votes)</option>
              <option value="OpenText">Open Text</option>
              <option value="Rating">Rating (1-5)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => {
                const newQuestion = e.target.value;
                console.log('🔍 Question input change:', { 
                  newQuestion, 
                  length: newQuestion.trim().length, 
                  questionType,
                  canCreate: canCreatePoll()
                });
                setQuestion(newQuestion);
              }}
              placeholder="What's your question?"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add additional context or instructions..."
              rows="3"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
            />
          </div>
          
          {(questionType === 'MultiChoice' || questionType === 'MultiVote') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options
              </label>
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
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value={60}>1 minute</option>
              <option value={120}>2 minutes</option>
              <option value={300}>5 minutes</option>
              <option value={600}>10 minutes</option>
            </select>
          </div>
          
          {/* Debug validation status */}
          <div className="text-xs text-gray-500 mb-2">
            Debug: {canCreatePoll() ? '✅ Valid' : '❌ Invalid'} | 
            Question: "{question.trim()}" ({question.trim().length} chars) | 
            Type: {questionType}
            {questionType === 'MultiChoice' && ` | Options: ${options.filter(opt => opt.trim()).length}/2`}
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleCreatePoll}
              disabled={loading || !canCreatePoll()}
              className="flex-1 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
              onMouseEnter={() => {
                // Debug validation on hover
                const canCreate = canCreatePoll();
                console.log('🔍 Button hover debug:', { 
                  canCreate, 
                  loading, 
                  question: question.trim(), 
                  questionType,
                  questionLength: question.trim().length,
                  buttonDisabled: loading || !canCreate,
                  options: questionType === 'MultiChoice' ? options.filter(opt => opt.trim()) : 'N/A'
                });
              }}
            >
              {loading ? 'Creating...' : 'Create Poll'}
            </button>
            <button
              onClick={onClose}
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

export default HostControlPanel;