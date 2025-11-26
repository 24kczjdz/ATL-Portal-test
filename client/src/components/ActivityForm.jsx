import React, { useState, useEffect, useRef } from 'react';
import DBTable from '../handlers/DatabaseHandler';

function ActivityForm({ server, table, Act_ID }) {
    const activityTable = new DBTable('ACTIVITY', 'Act_ID', {
        Act_ID: "LOADER",
        Title: "ATL Activity",
        Description: "",
        Questions: [],
        Settings: {
            Randomize_Questions: false,
            Show_Correct_Answers: false,
            Allow_Retry: false,
            Max_Attempts: 1,
            Time_Limit: 0
        },
        Pointer: 0,
        Ending: 0,
        Live: false,
        Creator_ID: [],
        Status: "draft",
        Schedule: {
            Start_Time: null,
            End_Time: null
        },
        Created_At: new Date(),
        Last_Updated: new Date()
    });

    const participantTable = new DBTable('PARTICIPANT', 'Parti_ID', {
        Parti_ID: "LOADER",
        User_ID: "",
        Act_ID: "",
        Nickname: "",
        Answers: [],
        Scores: [],
        Status: "joined",
        Last_Active: new Date(),
        Created_At: new Date(),
        Last_Updated: new Date()
    });

    const [currentActivity, setCurrentActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [nickname, setNickname] = useState('');
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [participant, setParticipant] = useState(null);
    const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
    const [activityPin, setActivityPin] = useState('');
    const [basicInfoStep, setBasicInfoStep] = useState(0);
    const [basicInfoAnswers, setBasicInfoAnswers] = useState({});
    const activityLoaded = useRef(false);

    // Basic Info questions from Activity.js
    const basicInfoQuestions = [
        { text: "Please enter Activity PIN:", field: "Act_ID" },
        { text: "Please enter your UID:", field: "User_ID" },
        { text: "Please enter your alias:", field: "Nickname" }
    ];

    const handleBasicInfoSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            if (basicInfoStep === 0) {
                // First step: Validate Activity PIN
                const activity = await activityTable.handleRead({ Act_ID: activityPin }, false);
                if (!activity) {
                    throw new Error('Invalid Activity PIN');
                }
                if (!activity.Live) {
                    setError('This activity is not currently live. Please wait for the host to start the activity or try a different PIN.');
                    return;
                }
                setCurrentActivity(activity);
                setBasicInfoAnswers(prev => ({ ...prev, Act_ID: activityPin }));
            } else {
                // Store the answer for the current step
                setBasicInfoAnswers(prev => ({ ...prev, [basicInfoQuestions[basicInfoStep].field]: currentAnswer }));
            }

            if (basicInfoStep < basicInfoQuestions.length - 1) {
                setBasicInfoStep(prev => prev + 1);
                setCurrentAnswer('');
            } else {
                // All basic info collected, create participant
                const user = JSON.parse(localStorage.getItem('user'));
                const newParticipant = {
                    ...participantTable.schema,
                    User_ID: basicInfoAnswers.User_ID || user?.User_ID,
                    Act_ID: basicInfoAnswers.Act_ID,
                    Nickname: basicInfoAnswers.Nickname || `Participant-${Date.now()}`,
                    Created_At: new Date(),
                    Last_Updated: new Date()
                };

                // Create the participant
                const result = await participantTable.handleWrite(newParticipant, false);
                if (result) {
                    throw new Error('Failed to create participant');
                }

                // Load the activity again to ensure we have the latest data
                const activity = await activityTable.handleRead({ Act_ID: basicInfoAnswers.Act_ID }, false);
                if (!activity) {
                    throw new Error('Activity not found');
                }

                setParticipant(newParticipant);
                setCurrentActivity(activity);
                setNickname(basicInfoAnswers.Nickname);
                activityLoaded.current = true;
                setBasicInfoStep(basicInfoQuestions.length); // Move past the basic info steps
            }
        } catch (err) {
            setError(err.message || 'Failed to submit information');
            console.error('Error submitting information:', err);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            setError('Please log in to participate');
            return;
        }

        const loadActivity = async () => {
            // Only load if we haven't loaded the activity yet
            if (activityLoaded.current) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                // If Act_ID is provided, load directly
                if (Act_ID) {
                    const activity = await activityTable.handleRead({ Act_ID }, false);
                    if (activity) {
                        setCurrentActivity(activity);
                        await loadOrCreateParticipant(activity.Act_ID, user.User_ID);
                        activityLoaded.current = true;
                    } else {
                        setError('Activity not found');
                    }
                }
            } catch (err) {
                setError('Failed to load activity');
                console.error('Error loading activity:', err);
            } finally {
                setLoading(false);
            }
        };

        loadActivity();
    }, [Act_ID]);

    // Poll for activity updates
    useEffect(() => {
        if (!currentActivity) return;

        const interval = setInterval(async () => {
            try {
                const updated = await activityTable.handleRead({ Act_ID: currentActivity.Act_ID }, false);
                if (updated && JSON.stringify(updated) !== JSON.stringify(currentActivity)) {
                    setCurrentActivity(updated);
                    setLastUpdateTime(Date.now());
                    // Clear the answer when the question changes
                    if (updated.Pointer !== currentActivity.Pointer) {
                        setCurrentAnswer('');
                    }
                }
            } catch (err) {
                console.error('Error refreshing activity:', err);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [currentActivity]);

    const loadOrCreateParticipant = async (actId, userId) => {
        try {
            // Try to find existing participant
            const existingParticipants = await participantTable.handleRead({ 
                Act_ID: actId,
                User_ID: basicInfoAnswers.User_ID || userId 
            }, false);

            if (existingParticipants && existingParticipants.length > 0) {
                setParticipant(existingParticipants[0]);
                setNickname(existingParticipants[0].Nickname);
            } else {
                // Create new participant
                const newParticipant = {
                    ...participantTable.schema,
                    User_ID: basicInfoAnswers.User_ID || userId,
                    Act_ID: actId,
                    Nickname: basicInfoAnswers.Nickname || `Participant-${Date.now()}`,
                    Created_At: new Date(),
                    Last_Updated: new Date()
                };
                const result = await participantTable.handleWrite(newParticipant, false);
                if (!result) {
                    setParticipant(newParticipant);
                    setNickname(newParticipant.Nickname);
                }
            }
        } catch (err) {
            console.error('Error loading/creating participant:', err);
        }
    };

    const handleSubmitAnswer = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!currentActivity || !participant) {
                throw new Error('Activity or participant data not loaded');
            }

            const currentQuestion = currentActivity.Questions[currentActivity.Pointer];
            if (!currentQuestion) {
                throw new Error('Current question not found');
            }

            // Calculate score based on answer type
            let score = 0;
            if (currentQuestion.Type === 'MultiChoice') {
                const selectedAnswer = currentQuestion.Answers.indexOf(currentAnswer);
                if (selectedAnswer !== -1) {
                    score = currentQuestion.Scores[selectedAnswer] || 0;
                }
            } else if (currentQuestion.Type === 'Textbox Scored') {
                const answerIndex = currentQuestion.Answers.findIndex(
                    ans => ans.toLowerCase() === currentAnswer.toLowerCase()
                );
                if (answerIndex !== -1) {
                    score = currentQuestion.Scores[answerIndex] || 0;
                }
            }

            const answerData = {
                QuestionIndex: currentActivity.Pointer,
                Answer: currentAnswer,
                Score: score,
                Timestamp: new Date().toISOString()
            };

            const updatedAnswers = [...(participant.Answers || [])];
            const existingAnswerIndex = updatedAnswers.findIndex(
                a => a.QuestionIndex === currentActivity.Pointer
            );

            if (existingAnswerIndex !== -1) {
                updatedAnswers[existingAnswerIndex] = answerData;
            } else {
                updatedAnswers.push(answerData);
            }

            const updatedParticipant = {
                ...participant,
                Answers: updatedAnswers,
                Last_Active: new Date().toISOString()
            };

            await participantTable.handleWrite(updatedParticipant, false);
            setParticipant(updatedParticipant);
            setCurrentAnswer(''); // Clear the answer after submission
            setLastUpdateTime(Date.now());
        } catch (err) {
            setError(err.message || 'Failed to submit answer');
            console.error('Error submitting answer:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateNickname = async () => {
        if (!participant) return;

        try {
            setLoading(true);
            const updatedParticipant = {
                ...participant,
                Nickname: nickname,
                Last_Updated: new Date()
            };

            const result = await participantTable.handleWrite(updatedParticipant, false);
            if (!result) {
                setParticipant(updatedParticipant);
            } else {
                setError('Failed to update nickname');
            }
        } catch (err) {
            setError('Failed to update nickname');
            console.error('Error updating nickname:', err);
        } finally {
            setLoading(false);
      }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!currentActivity && !Act_ID && basicInfoStep === 0) {
        return (
            <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Join Activity</h2>
                {error && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {basicInfoQuestions[basicInfoStep].text}
                        </label>
                        <input
                            type="text"
                            value={activityPin}
                            onChange={(e) => setActivityPin(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && activityPin.trim()) {
                                    handleBasicInfoSubmit();
                                }
                            }}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Activity PIN"
                        />
                    </div>
                    <button
                        onClick={handleBasicInfoSubmit}
                        disabled={loading || !activityPin.trim()}
                        className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Continue'}
                    </button>
                </div>
            </div>
        );
    }

    if (basicInfoStep > 0 && basicInfoStep < basicInfoQuestions.length) {
        return (
            <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Join Activity</h2>
                {error && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {basicInfoQuestions[basicInfoStep].text}
                        </label>
                        <input
                            type="text"
                            value={currentAnswer}
                            onChange={(e) => setCurrentAnswer(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && currentAnswer.trim()) {
                                    handleBasicInfoSubmit();
                                }
                            }}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`Enter ${basicInfoQuestions[basicInfoStep].field}`}
                        />
                    </div>
                    <button
                        onClick={handleBasicInfoSubmit}
                        disabled={loading || !currentAnswer.trim()}
                        className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Continue'}
                    </button>
                </div>
            </div>
        );
    }

    if (!currentActivity) {
        return (
            <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                    Activity not found
                </div>
            </div>
        );
    }

    const currentQuestion = currentActivity.Questions?.[currentActivity.Pointer] || null;
    const participantAnswer = participant?.Answers?.find(
        a => a.QuestionIndex === currentActivity.Pointer
    );

    if (!currentQuestion) {
        return (
            <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                    No questions available in this activity
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
                {!currentActivity.Live && (
                    <div className="mb-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                        <p className="font-bold">Activity Not Live</p>
                        <p>This activity is not currently live. Please wait for the host to start the activity.</p>
                    </div>
                )}
                {error && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}
                <div className="mb-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="text-sm font-medium text-gray-700">Activity ID:</span>
                            <span className="ml-2 text-gray-900">{currentActivity.Act_ID}</span>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-700">Your Nickname:</span>
                            <span className="ml-2 text-gray-900">{nickname}</span>
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Question {currentActivity.Pointer + 1} of {currentActivity.Questions.length}
                    </h3>
                    <p className="text-gray-800 mb-4">{currentQuestion.Text}</p>

                    {currentQuestion.Type === 'multiple-choice' && currentQuestion.Options && (
                        <div className="space-y-2">
                            {currentQuestion.Options.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentAnswer(option)}
                                    className={`w-full px-4 py-2 text-left rounded-lg ${
                                        currentAnswer === option
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                    }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    )}

                    {(currentQuestion.Type === 'textbox scored' || currentQuestion.Type === 'textbox unscored') && (
                        <textarea
                            value={currentAnswer}
                            onChange={(e) => setCurrentAnswer(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && currentAnswer.trim()) {
                                    e.preventDefault();
                                    handleSubmitAnswer();
                                }
                            }}
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="Type your answer here..."
                            rows={4}
                        />
                    )}
                </div>
                
                <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        {participantAnswer ? (
                            <span>Last submitted: {new Date(participantAnswer.Timestamp).toLocaleTimeString()}</span>
                        ) : (
                            <span>Not submitted yet</span>
                        )}
                    </div>
                    <button
                        onClick={handleSubmitAnswer}
                        disabled={loading || !currentAnswer || !currentActivity.Live}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                    >
                        Submit Answer
                    </button>
                </div>
            </div>
        </div>
    );
}
    
export default ActivityForm;