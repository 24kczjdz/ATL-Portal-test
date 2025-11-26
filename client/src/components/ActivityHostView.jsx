import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DBTable from '../handlers/DatabaseHandler';

function ActivityHostView({ activity, onClose, onUpdate }) {
    const activityTable = useMemo(() => new DBTable('ACTIVITY', 'Act_ID', {
        Act_ID: "LOADER",
        Title: "ATL Activity",
        Pointer: 0,
        Ending: 0,
        Questions: [],
        Live: false,
        Creator_ID: []
    }), []);

    const participantTable = useMemo(() => new DBTable('PARTICIPANT', 'Parti_ID', {
        Parti_ID: "LOADER",
        User_ID: "",
        Act_ID: "",
        Nickname: "",
        Answers: [],
        Scores: [],
        Created_At: new Date(),
        Last_Updated: new Date()
    }), []);

    const userTable = useMemo(() => new DBTable('USER', 'User_ID'), []);

    const [currentActivity, setCurrentActivity] = useState(activity);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [showResetModal, setShowResetModal] = useState(false);
    const [pendingLiveValue, setPendingLiveValue] = useState(null);
    const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
    const [newCreatorId, setNewCreatorId] = useState('');
    const [showResponsesModal, setShowResponsesModal] = useState(false);
    const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(null);
    const [creatorDetails, setCreatorDetails] = useState({});
    const [isPolling, setIsPolling] = useState(true);

    // Fetch latest activity from backend
    const refreshActivity = useCallback(async () => {
        try {
            const updated = await activityTable.handleRead({ Act_ID: activity.Act_ID }, false);
            if (updated) {
                if (JSON.stringify(updated) !== JSON.stringify(currentActivity)) {
                    // Preserve existing state while updating
                    setCurrentActivity(prev => ({
                        ...prev,
                        Live: updated.Live,
                        Pointer: updated.Pointer,
                        Questions: updated.Questions || prev.Questions,
                        Creator_ID: updated.Creator_ID || prev.Creator_ID,
                        Title: updated.Title || prev.Title,
                        Ending: updated.Ending || prev.Ending
                    }));
                    setLastUpdateTime(Date.now());
                    // Only call onUpdate for specific changes that need parent notification
                    if (updated.Live !== currentActivity.Live || 
                        updated.Pointer !== currentActivity.Pointer) {
                        onUpdate();
                    }
                }
            }
        } catch (err) {
            console.error('Error refreshing activity:', err);
            if (!err.message?.includes('Failed to fetch') && !err.message?.includes('Connection refused')) {
                setError('Failed to refresh activity data');
            }
        }
    }, [activity.Act_ID, currentActivity, onUpdate, activityTable]);

    // Fetch latest participants
    const refreshParticipants = useCallback(async () => {
        try {
            const updatedParticipants = await participantTable.handleRead({ Act_ID: activity.Act_ID }, false);
            if (updatedParticipants) {
                setParticipants(Array.isArray(updatedParticipants) ? updatedParticipants : [updatedParticipants]);
            }
        } catch (err) {
            console.error('Error refreshing participants:', err);
            if (!err.message?.includes('Failed to fetch') && !err.message?.includes('Connection refused')) {
                setError('Failed to refresh participant data');
            }
        }
    }, [activity.Act_ID, participantTable]);

    // Poll for updates every 1 second
    useEffect(() => {
        let retryCount = 0;
        const maxRetries = 3;
        const retryDelay = 2000; // 2 seconds

        const interval = setInterval(async () => {
            if (!isPolling) return;
            
            try {
                await refreshActivity();
                await refreshParticipants();
                retryCount = 0; // Reset retry count on success
            } catch (err) {
                retryCount++;
                if (retryCount >= maxRetries) {
                    console.error('Max retries reached, stopping refresh');
                    clearInterval(interval);
                } else {
                    console.log(`Retrying in ${retryDelay}ms... (${retryCount}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isPolling, refreshActivity, refreshParticipants]);

    // Sync local state if activity prop changes
    useEffect(() => {
        if (activity) {
            setCurrentActivity(prev => ({
                ...prev,
                ...activity,
                Questions: activity.Questions || prev.Questions,
                Creator_ID: activity.Creator_ID || prev.Creator_ID
            }));
            setLastUpdateTime(Date.now());
        }
    }, [activity]);


    const handleToggleLive = (e) => {
        const nextLive = !activity.Live;
        if (nextLive && activity.Pointer !== 0) {
            setShowResetModal(true);
            setPendingLiveValue(nextLive);
            return;
        }
        performToggleLive(nextLive, false);
    };

    const performToggleLive = async (nextLive, resetPointer) => {
        try {
            setLoading(true);
            setIsPolling(false); // Temporarily disable polling
            
            const updatedActivity = {
                ...activity,
                Live: nextLive,
                Pointer: resetPointer ? 0 : activity.Pointer
            };
            
            const result = await activityTable.handleWrite(updatedActivity, false);
            if (result) {
                setError('Failed to update activity status');
            } else {
                // Notify parent of the change
                onUpdate();
            }
        } catch (err) {
            setError('Failed to update activity status');
            console.error('Error updating activity status:', err);
        } finally {
            setLoading(false);
            setShowResetModal(false);
            setPendingLiveValue(null);
            setIsPolling(true); // Re-enable polling
        }
    };

    const handleModalChoice = (reset) => {
        performToggleLive(pendingLiveValue, reset);
    };

    const handleNextQuestion = async () => {
        if (currentActivity.Pointer >= currentActivity.Questions.length - 1) return;

        try {
            setLoading(true);
            setIsPolling(false); // Temporarily disable polling
            const updatedActivity = {
                ...currentActivity,
                Pointer: currentActivity.Pointer + 1
            };
            const result = await activityTable.handleWrite(updatedActivity, false);
            if (!result) {
                setCurrentActivity(updatedActivity);
                onUpdate();
            } else {
                setError('Failed to update activity');
            }
        } catch (err) {
            setError('Failed to update activity');
            console.error('Error updating activity:', err);
        } finally {
            setLoading(false);
            setIsPolling(true); // Re-enable polling
        }
    };

    const handlePreviousQuestion = async () => {
        if (currentActivity.Pointer <= 0) return;

        try {
            setLoading(true);
            setIsPolling(false); // Temporarily disable polling
            const updatedActivity = {
                ...currentActivity,
                Pointer: currentActivity.Pointer - 1
            };
            const result = await activityTable.handleWrite(updatedActivity, false);
            if (!result) {
                setCurrentActivity(updatedActivity);
                onUpdate();
            } else {
                setError('Failed to update activity');
            }
        } catch (err) {
            setError('Failed to update activity');
            console.error('Error updating activity:', err);
        } finally {
            setLoading(false);
            setIsPolling(true); // Re-enable polling
        }
    };

    const handleJumpToQuestion = async (index) => {
        if (index < 0 || index >= currentActivity.Questions.length) return;

        try {
            setLoading(true);
            setIsPolling(false); // Temporarily disable polling
            const updatedActivity = {
                ...currentActivity,
                Pointer: index
            };
            const result = await activityTable.handleWrite(updatedActivity, false);
            if (!result) {
                setCurrentActivity(updatedActivity);
                onUpdate();
            } else {
                setError('Failed to update activity');
            }
        } catch (err) {
            setError('Failed to update activity');
            console.error('Error updating activity:', err);
        } finally {
            setLoading(false);
            setIsPolling(true); // Re-enable polling
        }
    };

    const loadAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            // Here you would implement the actual analytics loading logic
            // For now, we'll create some mock analytics
            const mockAnalytics = {
                totalResponses: 25,
                questionStats: currentActivity.Questions.map((q, index) => ({
                    questionIndex: index,
                    responses: Math.floor(Math.random() * 25),
                    averageTime: `${Math.floor(Math.random() * 30)}s`
                }))
            };
            setAnalytics(mockAnalytics);
        } catch (err) {
            setError('Failed to load analytics');
            console.error('Error loading analytics:', err);
        } finally {
            setLoading(false);
        }
    }, [currentActivity.Questions]);

    useEffect(() => {
        loadAnalytics();
    }, [activity.Act_ID, currentActivity.Pointer, loadAnalytics]);

    const handleAddCreator = async () => {
        if (!newCreatorId.trim()) return;

        try {
            setLoading(true);
            const updatedActivity = {
                ...currentActivity,
                Creator_ID: currentActivity.Creator_ID.includes(newCreatorId)
                    ? currentActivity.Creator_ID
                    : [...currentActivity.Creator_ID, newCreatorId]
            };

            const result = await activityTable.handleWrite(updatedActivity, false);
            if (!result) {
                await refreshActivity();
                onUpdate();
                setNewCreatorId('');
            } else {
                setError('Failed to add creator');
            }
        } catch (err) {
            setError('Failed to add creator');
            console.error('Error adding creator:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveCreator = async (creatorId) => {
        try {
            setLoading(true);
            // Don't allow removing the last creator
            if (currentActivity.Creator_ID.length <= 1) {
                setError('Cannot remove the last creator');
                return;
            }

            const updatedActivity = {
                ...currentActivity,
                Creator_ID: currentActivity.Creator_ID.filter(id => id !== creatorId)
            };

            const result = await activityTable.handleWrite(updatedActivity, false);
            if (!result) {
                await refreshActivity();
                onUpdate();
            } else {
                setError('Failed to remove creator');
            }
        } catch (err) {
            setError('Failed to remove creator');
            console.error('Error removing creator:', err);
        } finally {
            setLoading(false);
        }
    };

    const getCurrentQuestionAnswers = () => {
        return participants.map(participant => {
            const answer = participant.Answers.find(a => a.QuestionIndex === currentActivity.Pointer);
            return {
                nickname: participant.Nickname,
                answer: answer ? answer.Answer : 'No answer yet',
                score: answer ? answer.Score : 0,
                timestamp: answer ? new Date(answer.Timestamp).toLocaleTimeString() : null
            };
        });
    };

    const getAnswerAnalytics = () => {
        const currentQuestion = currentActivity.Questions[currentActivity.Pointer];
        if (!currentQuestion) return null;

        const analytics = {
            totalResponses: 0,
            answerCounts: {},
            averageScore: 0
        };

        const answers = getCurrentQuestionAnswers();
        analytics.totalResponses = answers.filter(a => a.answer !== 'No answer yet').length;

        if (currentQuestion.Type === 'MultiChoice' || currentQuestion.Type === 'Textbox Scored') {
            currentQuestion.Answers.forEach((answer, index) => {
                const count = answers.filter(a => a.answer === answer).length;
                analytics.answerCounts[answer] = {
                    count,
                    score: currentQuestion.Scores[index] || 0
                };
            });
        }

        const scores = answers.map(a => a.score).filter(score => score !== undefined);
        analytics.averageScore = scores.length > 0 
            ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
            : 0;

        return analytics;
    };

    const ResponsesModal = () => {
        if (!showResponsesModal) return null;

        const answers = getCurrentQuestionAnswers();
        const currentQuestion = currentActivity.Questions[currentActivity.Pointer];

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                            Participant Responses - {currentQuestion?.Text || 'Question'}
                        </h3>
                        <button
                            onClick={() => setShowResponsesModal(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="space-y-4">
                        {answers.map((response, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-gray-900">{response.nickname}</p>
                                        <p className="text-gray-600 mt-1">{response.answer}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">{response.timestamp}</p>
                                        <p className="text-sm font-medium text-gray-900 mt-1">
                                            Score: {response.score}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    useEffect(() => {
        const loadCreatorDetails = async () => {
            if (!currentActivity?.Creator_ID?.length) {
                console.log('No Creator_IDs found in currentActivity');
                return;
            }

            console.log('Fetching creators for IDs:', currentActivity.Creator_ID);
            const details = {};
            
            try {
                // Query each creator individually
                for (const creatorId of currentActivity.Creator_ID) {
                    try {
                        const creator = await userTable.handleRead({ User_ID: creatorId }, false);
                        console.log(`Loaded creator ${creatorId}:`, creator);

                        if (creator && typeof creator === 'object') {
                            details[creatorId] = {
                                Title: creator.Title || '',
                                Nickname: creator.Nickname || '',
                                First_Name: creator.First_Name || '',
                                Last_Name: creator.Last_Name || ''
                            };
                        } else {
                            console.warn(`No user data found for creator ID: ${creatorId}`);
                            details[creatorId] = {
                                Title: '',
                                Nickname: '',
                                First_Name: '',
                                Last_Name: ''
                            };
                        }
                    } catch (err) {
                        console.error(`Error loading creator ${creatorId}:`, err);
                        details[creatorId] = {
                            Title: '',
                            Nickname: '',
                            First_Name: '',
                            Last_Name: ''
                        };
                    }
                }

                console.log('Final creator details:', details);
                setCreatorDetails(details);
            } catch (err) {
                console.error('Error in loadCreatorDetails:', err);
                // Initialize empty details for all creators
                currentActivity.Creator_ID.forEach(creatorId => {
                    details[creatorId] = {
                        Title: '',
                        Nickname: '',
                        First_Name: '',
                        Last_Name: ''
                    };
                });
                setCreatorDetails(details);
            }
        };

        loadCreatorDetails();
    }, [currentActivity?.Creator_ID, userTable]);

    return (
        <div className="space-y-6">
            {/* Error Display */}
            {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                    <button 
                        onClick={() => setError(null)} 
                        className="ml-2 text-red-800 hover:text-red-900"
                    >
                        ✕
                    </button>
                </div>
            )}
            
            {/* Analytics Display */}
            {analytics && (
                <div className="p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
                    <h4 className="font-semibold">Analytics Summary</h4>
                    <p>Total Responses: {analytics.totalResponses}</p>
                    <p>Last Updated: {new Date(lastUpdateTime).toLocaleTimeString()}</p>
                </div>
            )}
            
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Hosting: {activity.Title}</h2>
                <div className="flex gap-4 items-center">
                    <label className="flex items-center cursor-pointer select-none">
                        <span className="mr-2 font-medium text-gray-700">Live</span>
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={activity.Live}
                                onChange={handleToggleLive}
                                disabled={loading}
                                className="sr-only"
                            />
                            <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                                activity.Live ? 'bg-green-500' : 'bg-gray-200'
                            }`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                                activity.Live ? 'translate-x-5' : ''
                            }`}></div>
                        </div>
                    </label>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600"
                    >
                        Close Hosting
                    </button>
                </div>
            </div>

            {/* Reset Pointer Modal */}
            {showResetModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
                    <div className="bg-white p-8 rounded-lg shadow-lg w-80 flex flex-col items-center">
                        <h3 className="text-lg font-semibold mb-4 text-center">Reset Question Progress?</h3>
                        <p className="mb-6 text-center">Do you want to start again from the beginning?</p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => handleModalChoice(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Yes, Reset
                            </button>
                            <button
                                onClick={() => handleModalChoice(false)}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            >
                                No, Keep
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Question</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                                Question {currentActivity.Pointer + 1} of {currentActivity.Questions.length}
                            </span>
                            <div className="flex space-x-2">
                                <button
                                    onClick={handlePreviousQuestion}
                                    disabled={currentActivity.Pointer <= 0 || loading}
                                    className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={handleNextQuestion}
                                    disabled={currentActivity.Pointer >= currentActivity.Questions.length - 1 || loading}
                                    className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded">
                            <p className="text-gray-800 font-medium">
                                {currentActivity.Questions[currentActivity.Pointer]?.Text || 'No question available'}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {currentActivity.Questions.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleJumpToQuestion(index)}
                                    className={`px-3 py-1 rounded ${
                                        index === currentActivity.Pointer
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    {index + 1}
                                </button>
                            ))}
                        </div>
                        
                        {/* Question Selection for Analysis */}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Question for Detailed Analysis:
                            </label>
                            <select
                                value={selectedQuestionIndex || ''}
                                onChange={(e) => setSelectedQuestionIndex(e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Choose a question...</option>
                                {currentActivity.Questions.map((question, index) => (
                                    <option key={index} value={index}>
                                        Question {index + 1}: {question.Text?.substring(0, 50)}...
                                    </option>
                                ))}
                            </select>
                            {selectedQuestionIndex !== null && (
                                <p className="mt-2 text-sm text-gray-600">
                                    Selected: Question {selectedQuestionIndex + 1}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Response Analytics</h3>
                        <button
                            onClick={() => setShowResponsesModal(true)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                            View Responses
                        </button>
                    </div>
                    
                    {(() => {
                        const analytics = getAnswerAnalytics();
                        if (!analytics) return null;

                        return (
                            <div className="space-y-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-gray-800">
                                        Total Responses: <span className="font-semibold">{analytics.totalResponses}</span>
                                    </p>
                                    <p className="text-gray-800 mt-2">
                                        Average Score: <span className="font-semibold">{analytics.averageScore}</span>
                                    </p>
                                </div>

                                {Object.entries(analytics.answerCounts).map(([answer, data]) => (
                                    <div key={answer} className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-gray-900">{answer}</p>
                                                <p className="text-sm text-gray-500">Score: {data.score}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-600">
                                                    {data.count} response{data.count !== 1 ? 's' : ''}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {analytics.totalResponses > 0 
                                                        ? ((data.count / analytics.totalResponses) * 100).toFixed(1)
                                                        : '0'}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Creator Management Section */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Activity Creators</h3>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newCreatorId}
                            onChange={(e) => setNewCreatorId(e.target.value)}
                            placeholder="Enter creator ID"
                            className="flex-1 px-3 py-2 border rounded-lg"
                        />
                        <button
                            onClick={handleAddCreator}
                            disabled={loading || !newCreatorId.trim()}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                        >
                            Add Creator
                        </button>
                    </div>
                    <div className="space-y-2">
                        {currentActivity.Creator_ID?.map((creatorId) => (
                            <div key={creatorId} className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {creatorDetails[creatorId]?.Title || ''} {creatorDetails[creatorId]?.First_Name || ''} {creatorDetails[creatorId]?.Last_Name || ''}
                                            {creatorDetails[creatorId]?.Nickname && `, ${creatorDetails[creatorId].Nickname}`}
                                        </p>
                                        <p className="text-sm text-gray-500">ID: {creatorId}</p>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveCreator(creatorId)}
                                        disabled={loading || currentActivity.Creator_ID.length <= 1}
                                        className="px-3 py-1 text-red-500 hover:text-red-600 disabled:opacity-50"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <ResponsesModal />
        </div>
    );
}

export default ActivityHostView; 