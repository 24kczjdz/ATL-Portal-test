import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DBTable from '../handlers/DatabaseHandler';
import ActivityHostView from './ActivityHostView';
import { useAuth } from '../contexts/AuthContext';

function ActivityList({ onEditActivity }) {
    const { currentUser } = useAuth();
    const activityTable = useMemo(() => new DBTable('ACTIVITY', 'Act_ID', {
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
    }), []);

    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hostingActivity, setHostingActivity] = useState(null);

    const fetchActivities = useCallback(async () => {
        try {
            setLoading(true);
            if (!currentUser || !currentUser.User_ID) {
                console.log('User not authenticated or User_ID missing:', currentUser);
                setActivities([]);
                return;
            }

            // Fetch activities with explicit Creator_ID filter
            const fetchedActivities = await activityTable.handleRead({
                Creator_ID: currentUser.User_ID
            }, false);
            console.log('Raw fetched activities:', fetchedActivities);

            if (fetchedActivities) {
                // Ensure we're working with an array and each activity has the required fields
                const activitiesArray = Array.isArray(fetchedActivities) 
                    ? fetchedActivities 
                    : [fetchedActivities];

                // Validate activities
                const userActivities = activitiesArray
                    .filter(activity => 
                        activity && 
                        activity.Act_ID // Ensure activity has an ID
                    )
                    .map(activity => ({
                        ...activity,
                        Questions: activity.Questions || [],
                        Creator_ID: activity.Creator_ID || [],
                        Live: activity.Live || false,
                        Pointer: activity.Pointer || 0,
                        Ending: activity.Ending || 0,
                        Created_At: activity.Created_At || new Date(),
                        Last_Updated: activity.Last_Updated || new Date()
                    }));
                
                console.log('Filtered and validated user activities:', userActivities);
                setActivities(userActivities);
            } else {
                setActivities([]);
            }
        } catch (err) {
            setError(err.message);
            console.error('Error fetching activities:', err);
            setActivities([]);
        } finally {
            setLoading(false);
        }
    }, [currentUser, activityTable]);

    useEffect(() => {
        if (currentUser) {
            fetchActivities();
        }
    }, [currentUser, fetchActivities]);

    const handleViewActivity = (activity) => {
        setHostingActivity(activity);
    };

    const handleCloseHosting = () => {
        setHostingActivity(null);
    };

    const handleDelete = async (activity) => {
        if (!activity.Creator_ID || !activity.Creator_ID.includes(currentUser.User_ID)) {
            alert('You can only delete activities that you created');
            return;
        }
        if (window.confirm('Are you sure you want to delete this activity?')) {
            try {
                const result = await activityTable.handleDelete(activity.Act_ID);
                if (!result) {
                    await fetchActivities(); // Refresh the list
                } else {
                    setError('Failed to delete activity');
                }
            } catch (err) {
                setError(err.message || 'Failed to delete activity');
                console.error('Error deleting activity:', err);
            }
        }
    };

    // Commented out unused functions to fix ESLint warnings
    // const handleAddCreator = async (activityId, newCreatorId) => {
    //     try {
    //         setLoading(true);
    //         const activity = activities.find(a => a.Act_ID === activityId);
    //         if (!activity) {
    //             throw new Error('Activity not found');
    //         }
    //
    //         // Verify current user is a creator
    //         if (!activity.Creator_ID || !activity.Creator_ID.includes(currentUser.User_ID)) {
    //             throw new Error('You must be a creator to add other creators');
    //         }
    //
    //         // Create new array with the new creator ID if it doesn't exist
    //         const updatedCreatorIds = activity.Creator_ID.includes(newCreatorId)
    //             ? activity.Creator_ID
    //             : [...activity.Creator_ID, newCreatorId];
    //
    //         const updatedActivity = {
    //             ...activity,
    //             Creator_ID: updatedCreatorIds
    //         };
    //
    //         const result = await activityTable.handleWrite(updatedActivity, false);
    //         if (!result) {
    //             await fetchActivities(); // Refresh the list
    //         } else {
    //             setError('Failed to add creator');
    //         }
    //     } catch (err) {
    //         setError(err.message || 'Failed to add creator');
    //         console.error('Error adding creator:', err);
    //     } finally {
    //         setLoading(false);
    //     }
    // };
    //
    // const handleRemoveCreator = async (activityId, creatorId) => {
    //     try {
    //         setLoading(true);
    //         const activity = activities.find(a => a.Act_ID === activityId);
    //         if (!activity) {
    //             throw new Error('Activity not found');
    //         }
    //
    //         // Verify current user is a creator
    //         if (!activity.Creator_ID || !activity.Creator_ID.includes(currentUser.User_ID)) {
    //             throw new Error('You must be a creator to remove other creators');
    //         }
    //
    //         // Filter out the creator ID
    //         const updatedCreatorIds = activity.Creator_ID.filter(id => id !== creatorId);
    //
    //         // Don't allow removing the last creator
    //         if (updatedCreatorIds.length === 0) {
    //             throw new Error('Cannot remove the last creator');
    //         }
    //
    //         const updatedActivity = {
    //             ...activity,
    //             Creator_ID: updatedCreatorIds
    //         };
    //
    //         const result = await activityTable.handleWrite(updatedActivity, false);
    //         if (!result) {
    //             await fetchActivities(); // Refresh the list
    //         } else {
    //             setError('Failed to remove creator');
    //         }
    //     } catch (err) {
    //         setError(err.message || 'Failed to remove creator');
    //         console.error('Error removing creator:', err);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
            </div>
        );
    }

    if (hostingActivity) {
        return (
            <ActivityHostView 
                activity={hostingActivity} 
                onClose={handleCloseHosting}
                onUpdate={fetchActivities}
            />
        );
    }

    return (
        <div className="space-y-4">
            {activities.length === 0 ? (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                    No activities found. Create a new activity to get started.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {activities.map((activity) => (
                        <RegularActivityCard
                            key={activity.Act_ID}
                            activity={activity}
                            onView={handleViewActivity}
                            onEdit={onEditActivity}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Enhanced Regular Activity Card Component
const RegularActivityCard = ({ activity, onView, onEdit, onDelete }) => {
    const statusColor = activity.Live ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100';
    const statusIcon = activity.Live ? '🟢' : '⚪';
    
    return (
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-t-xl p-4 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <span className="text-lg">📋</span>
                        <span className="text-sm font-medium">Regular Activity</span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor} text-gray-800 bg-white bg-opacity-90`}>
                        <span className="mr-1">{statusIcon}</span>
                        {activity.Live ? 'Live' : 'Draft'}
                    </span>
                </div>
            </div>

            {/* Main content */}
            <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {activity.Title}
                </h3>
                
                {activity.Description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {activity.Description}
                    </p>
                )}

                {/* Statistics Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 bg-indigo-50 rounded-lg">
                        <div className="text-2xl font-bold text-indigo-600">
                            {activity.Questions?.length || 0}
                        </div>
                        <div className="text-xs text-indigo-500 uppercase tracking-wide">Questions</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                            {activity.Pointer || 0}
                        </div>
                        <div className="text-xs text-green-500 uppercase tracking-wide">Progress</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-lg font-bold text-orange-600">
                            {activity.Status === 'draft' ? 'Draft' : 'Ready'}
                        </div>
                        <div className="text-xs text-orange-500 uppercase tracking-wide">Status</div>
                    </div>
                </div>

                {/* Metadata */}
                <div className="space-y-2 mb-6 text-sm text-gray-500">
                    <div className="flex justify-between">
                        <span>Created:</span>
                        <span className="font-medium">
                            {new Date(activity.Created_At).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Last Updated:</span>
                        <span className="font-medium">
                            {new Date(activity.Last_Updated).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="font-medium">
                            {activity.Settings?.Time_Limit > 0 ? 'Timed' : 'No Limit'}
                        </span>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                    <button
                        onClick={() => onView(activity)}
                        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all duration-200 shadow-lg"
                    >
                        <span className="flex items-center justify-center space-x-2">
                            <span>👁️</span>
                            <span>View & Host</span>
                        </span>
                    </button>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => onEdit(activity)}
                            className="py-2 px-3 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center space-x-1"
                        >
                            <span>✏️</span>
                            <span>Edit</span>
                        </button>
                        <button
                            onClick={() => onDelete(activity)}
                            className="py-2 px-3 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50 hover:border-red-400 transition-colors flex items-center justify-center space-x-1"
                        >
                            <span>🗑️</span>
                            <span>Delete</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer with activity features */}
            <div className="px-6 py-3 bg-gray-50 rounded-b-xl">
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Traditional Activity</span>
                    <span className="flex items-center space-x-1">
                        <span>{activity.Settings?.Randomize_Questions ? '🔀' : '📝'}</span>
                        <span>{activity.Settings?.Randomize_Questions ? 'Randomized' : 'Sequential'}</span>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ActivityList; 