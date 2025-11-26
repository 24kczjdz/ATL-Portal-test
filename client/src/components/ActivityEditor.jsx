import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import DBTable from '../handlers/DatabaseHandler';

function ActivityEditor({ activity, onCancel, onSuccess }) {
    const activityTable = useMemo(() => new DBTable('ACTIVITY', 'Act_ID', {
        Act_ID: "LOADER",
        Title: "ATL Activity",
        Pointer: 2,
        Ending: 2,
        Questions: [{
            Type: "Basic Info",
            Text: "Please enter Activity PIN:",
            Answers: ["Activity PIN", "Act_ID"]
        }, {
            Type: "Basic Info",
            Text: "Please enter your UID:",
            Answers: ["UID", "User_ID"]
        }, {
            Type: "Basic Info",
            Text: "Please enter your alias:",
            Answers: ["Alias", "Nickname"]
        }]
    }), []);

    const [idExists, setIdExists] = useState(false);
    const [formData, setFormData] = useState({
        Act_ID: '',
        Title: 'ATL Activity',
        Pointer: 0,
        Ending: 0,
        Questions: [],
        Creator_ID: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (activity) {
            setFormData(activity);
        }
    }, [activity]);

    useEffect(() => {
        const checkId = async () => {
            if (formData.Act_ID && formData.Act_ID !== activity?.Act_ID) {
                const exists = await activityTable.checkIdExists(formData.Act_ID);
                setIdExists(exists);
                if (exists) {
                    setError('Activity ID already exists');
                } else {
                    setError(null);
                }
            } else {
                setIdExists(false);
                setError(null);
            }
        };

        const debounceTimer = setTimeout(checkId, 500);
        return () => clearTimeout(debounceTimer);
    }, [formData.Act_ID, activity?.Act_ID, activityTable]);

    const handleQuestionChange = (index, field, value) => {
        const updatedQuestions = [...formData.Questions];
        const currentQuestion = updatedQuestions[index];

        if (field === 'Type') {
            // When changing type, initialize the appropriate arrays if they don't exist
            if (value === 'multiple-choice') {
                currentQuestion.Options = currentQuestion.Options || [];
                currentQuestion.Scores = currentQuestion.Scores || [];
            } else if (value === 'textbox scored') {
                currentQuestion.Answers = currentQuestion.Answers || [];
                currentQuestion.Scores = currentQuestion.Scores || [];
            }
            // For unscored textbox, we don't need to initialize any arrays
        }

        currentQuestion[field] = value;
        setFormData(prev => ({
            ...prev,
            Questions: updatedQuestions
        }));
    };

    const handleAddQuestion = () => {
        const newQuestion = {
            Text: '',
            Type: 'multiple-choice',
            Options: [],
            Answers: [],
            Scores: [],
            Required: true,
            Time_Limit: 0,
            Order: formData.Questions.length
        };
        setFormData(prev => ({
            ...prev,
            Questions: [...prev.Questions, newQuestion],
            Ending: prev.Questions.length
        }));
    };

    const handleRemoveQuestion = (index) => {
        const newQuestions = formData.Questions.filter((_, i) => i !== index);
        setFormData(prev => ({
            ...prev,
            Questions: newQuestions,
            Ending: newQuestions.length - 1,
            Pointer: Math.min(prev.Pointer, newQuestions.length - 1)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const userData = JSON.parse(localStorage.getItem('user'));
            if (!userData || !userData.User_ID) {
                throw new Error('User not authenticated');
            }

            const activityData = {
                ...formData,
                Ending: formData.Questions.length - 1,
                Creator_ID: formData.Creator_ID.includes(userData.User_ID) 
                    ? formData.Creator_ID 
                    : [...formData.Creator_ID, userData.User_ID]
            };

            const result = await activityTable.handleWrite(activityData, false);
            if (!result) {
                onSuccess();
            } else {
                setError('Failed to update activity');
            }
        } catch (err) {
            setError(err.message || 'Failed to update activity');
            console.error('Error updating activity:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const { source, destination } = result;
        const questionIndex = parseInt(result.draggableId.split('-')[0]);
        const answerIndex = parseInt(result.draggableId.split('-')[1]);
        
        // Log for debugging purposes (making answerIndex used)
        console.log(`Moving answer ${answerIndex} from question ${questionIndex}`);

        const newQuestions = [...formData.Questions];
        const question = newQuestions[questionIndex];
        const answers = [...question.Answers];
        const scores = [...question.Scores];

        const [movedAnswer] = answers.splice(source.index, 1);
        const [movedScore] = scores.splice(source.index, 1);

        answers.splice(destination.index, 0, movedAnswer);
        scores.splice(destination.index, 0, movedScore);

        question.Answers = answers;
        question.Scores = scores;
        setFormData(prev => ({
            ...prev,
            Questions: newQuestions
        }));
    };

    const handleAddOption = (questionIndex) => {
        const updatedQuestions = [...formData.Questions];
        const currentQuestion = updatedQuestions[questionIndex];

        if (currentQuestion.Type === 'multiple-choice') {
            currentQuestion.Options = currentQuestion.Options || [];
            currentQuestion.Scores = currentQuestion.Scores || [];
            currentQuestion.Options.push('');
            currentQuestion.Scores.push(0);
        } else if (currentQuestion.Type === 'textbox scored') {
            currentQuestion.Answers = currentQuestion.Answers || [];
            currentQuestion.Scores = currentQuestion.Scores || [];
            currentQuestion.Answers.push('');
            currentQuestion.Scores.push(0);
        }

        setFormData(prev => ({
            ...prev,
            Questions: updatedQuestions
        }));
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">
                {activity ? 'Edit Activity' : 'Create New Activity'}
            </h3>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Activity ID</label>
                    <div className="relative mt-1 flex items-center">
                        <input
                            type="text"
                            value={formData.Act_ID}
                            onChange={(e) => setFormData(prev => ({ ...prev, Act_ID: e.target.value }))}
                            required
                            className={`block w-full rounded-md shadow-sm focus:ring-blue-500 ${formData.Act_ID ? (idExists ? 'border-red-300 focus:border-red-500' : 'border-green-300 focus:border-green-500') : 'border-gray-300 focus:border-blue-500'}`}
                            placeholder="Enter Activity ID"
                        />
                        {formData.Act_ID && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                {idExists ? (
                                    <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                        )}
                    </div>
                    {formData.Act_ID && idExists && (
                        <p className="mt-1 text-sm text-red-600">This Activity ID is already in use</p>
                    )}
                    {formData.Act_ID && !idExists && (
                        <p className="mt-1 text-sm text-green-600">This Activity ID is available</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                        type="text"
                        value={formData.Title}
                        onChange={(e) => setFormData(prev => ({ ...prev, Title: e.target.value }))}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="text-md font-medium text-gray-700">Questions</h4>
                        <button
                            type="button"
                            onClick={handleAddQuestion}
                            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                        >
                            Add Question
                        </button>
                    </div>

                    <DragDropContext onDragEnd={handleDragEnd}>
                        {formData.Questions.map((question, questionIndex) => (
                            <div key={questionIndex} className="bg-gray-50 p-4 rounded-lg space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="cursor-move px-2 py-1 mr-2 text-gray-500 hover:text-gray-700">
                                        ⋮⋮
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Question Type</label>
                                            <select
                                                value={question.Type}
                                                onChange={(e) => handleQuestionChange(questionIndex, 'Type', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            >
                                                <option value="multiple-choice">Multiple Choice</option>
                                                <option value="textbox scored">Textbox (Scored)</option>
                                                <option value="textbox unscored">Textbox (Unscored)</option>
                                            </select>
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Question Text
                                            </label>
                                            <input
                                                type="text"
                                                value={question.Text}
                                                onChange={(e) => handleQuestionChange(questionIndex, 'Text', e.target.value)}
                                                className="w-full px-3 py-2 border rounded-lg"
                                                placeholder="Enter question text"
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={question.Required}
                                                    onChange={(e) => handleQuestionChange(questionIndex, 'Required', e.target.checked)}
                                                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700">Required Question</span>
                                            </label>
                                        </div>
                                        {(question.Type === 'multiple-choice' || question.Type === 'textbox scored') && (
                                            <div>
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <div className="flex-1 font-medium text-gray-700">
                                                        {question.Type === 'multiple-choice' ? 'Answer Options' : 'Possible Answers'}
                                                    </div>
                                                    <div className="w-24 font-medium text-gray-700 text-left">Score</div>
                                                    <div className="w-12"></div>
                                                </div>
                                                <Droppable droppableId={`answers-${questionIndex}`}>
                                                    {(provided) => (
                                                        <div
                                                            {...provided.droppableProps}
                                                            ref={provided.innerRef}
                                                            className="space-y-2"
                                                        >
                                                            {(question.Type === 'multiple-choice' ? question.Options : question.Answers).map((item, itemIndex) => (
                                                                <Draggable
                                                                    key={`${questionIndex}-${itemIndex}`}
                                                                    draggableId={`${questionIndex}-${itemIndex}`}
                                                                    index={itemIndex}
                                                                >
                                                                    {(provided, snapshot) => (
                                                                        <div
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps}
                                                                            className={`flex items-center space-x-2 p-2 rounded ${
                                                                                snapshot.isDragging ? 'bg-blue-50' : 'bg-white'
                                                                            }`}
                                                                        >
                                                                            <div
                                                                                {...provided.dragHandleProps}
                                                                                className="cursor-move text-gray-400 hover:text-gray-600"
                                                                            >
                                                                                ⋮⋮
                                                                            </div>
                                                                            <input
                                                                                type="text"
                                                                                value={item}
                                                                                onChange={(e) => {
                                                                                    const newItems = question.Type === 'multiple-choice' 
                                                                                        ? [...question.Options]
                                                                                        : [...question.Answers];
                                                                                    newItems[itemIndex] = e.target.value;
                                                                                    handleQuestionChange(
                                                                                        questionIndex,
                                                                                        question.Type === 'multiple-choice' ? 'Options' : 'Answers',
                                                                                        newItems
                                                                                    );
                                                                                }}
                                                                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white border"
                                                                                placeholder={question.Type === 'multiple-choice' ? `Option ${itemIndex + 1}` : `Possible answer ${itemIndex + 1}`}
                                                                            />
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                step="0.1"
                                                                                value={question.Scores[itemIndex] || 0}
                                                                                onChange={(e) => {
                                                                                    const newScores = [...question.Scores];
                                                                                    newScores[itemIndex] = parseFloat(e.target.value) || 0;
                                                                                    handleQuestionChange(questionIndex, 'Scores', newScores);
                                                                                }}
                                                                                className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-center bg-white border"
                                                                                placeholder="Score"
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const newItems = question.Type === 'multiple-choice'
                                                                                        ? question.Options.filter((_, i) => i !== itemIndex)
                                                                                        : question.Answers.filter((_, i) => i !== itemIndex);
                                                                                    const newScores = question.Scores.filter((_, i) => i !== itemIndex);
                                                                                    handleQuestionChange(
                                                                                        questionIndex,
                                                                                        question.Type === 'multiple-choice' ? 'Options' : 'Answers',
                                                                                        newItems
                                                                                    );
                                                                                    handleQuestionChange(questionIndex, 'Scores', newScores);
                                                                                }}
                                                                                className="text-red-600 hover:text-red-800"
                                                                            >
                                                                                Remove
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            ))}
                                                            {provided.placeholder}
                                                        </div>
                                                    )}
                                                </Droppable>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddOption(questionIndex)}
                                                    className="mt-2 px-3 py-1 text-sm rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200"
                                                >
                                                    {question.Type === 'multiple-choice' ? 'Add Option' : 'Add Possible Answer'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveQuestion(questionIndex)}
                                        className="text-red-600 hover:text-red-800 ml-4"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </DragDropContext>
                </div>

                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || formData.Questions.length === 0 || idExists || !formData.Act_ID}
                        className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Activity'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ActivityEditor; 