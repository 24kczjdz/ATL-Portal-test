import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ActivityList from '../components/ActivityList';
import ActivityEditor from '../components/ActivityEditor';
import LiveActivityCreator from '../components/LiveActivityCreator';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, PageTemplate } from '../components/ui';
import { FiActivity, FiPlus, FiZap, FiUsers, FiBarChart } from 'react-icons/fi';
import axios from 'axios';

function ActivityHost() {
    const navigate = useNavigate();
    const { isAuthenticated, currentUser } = useAuth();
    const [showEditor, setShowEditor] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [activeTab, setActiveTab] = useState('regular');
    const [liveActivities, setLiveActivities] = useState([]);
    const [stats, setStats] = useState({
        totalActivities: 0,
        liveActivities: 0,
        totalParticipants: 0,
        recentResponses: 0
    });
    const [loading, setLoading] = useState(true);
    const [showLiveEditor, setShowLiveEditor] = useState(false);

    const baseURL = process.env.NODE_ENV === 'production' 
        ? '/api' 
        : 'http://localhost:5000/api';

    const loadDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            // Load live activities
            const liveResponse = await axios.get(
                `${baseURL}/live/activities/host`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setLiveActivities(liveResponse.data.activities || []);
            
            // Calculate stats
            const activities = liveResponse.data.activities || [];
            setStats({
                totalActivities: activities.length,
                liveActivities: activities.filter(a => a.isLive).length,
                totalParticipants: activities.reduce((sum, a) => sum + (a.analytics?.totalParticipants || 0), 0),
                recentResponses: activities.reduce((sum, a) => sum + (a.analytics?.totalResponses || 0), 0)
            });
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }, [baseURL]);

    useEffect(() => {
        if (!isAuthenticated || !currentUser) {
            navigate('/login');
            return;
        }
        loadDashboardData();
    }, [isAuthenticated, currentUser, navigate, loadDashboardData]);

    const handleCreateClick = () => {
        if (!isAuthenticated) {
            navigate('/login');
        } else {
            if (activeTab === 'live') {
                setShowLiveEditor(true);
            } else {
                setSelectedActivity(null);
                setShowEditor(true);
            }
        }
    };

    const handleCreateLiveActivity = () => {
        if (!isAuthenticated) {
            navigate('/login');
        } else {
            setActiveTab('live');
            setShowLiveEditor(true);
        }
    };

    const handleLiveActivityCreated = (newActivity) => {
        setLiveActivities(prev => [newActivity, ...prev]);
        setShowLiveEditor(false);
        loadDashboardData(); // Refresh stats
    };

    const handleEditActivity = (activity) => {
        setSelectedActivity(activity);
        setShowEditor(true);
    };

    const handleStartLiveActivity = async (activity) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(
                `${baseURL}/live/activities/${activity.Act_ID}/toggle`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            navigate(`/live/${activity.pin}/host`);
        } catch (error) {
            console.error('Error starting activity:', error);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <PageTemplate
            title="Activity Dashboard"
            description="Manage all your activities and interactive sessions"
            icon="🎯"
        >
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Actions */}
                <Card>
                    <Card.Content className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-primary-900 dark:text-white">
                                    Welcome, {currentUser?.First_Name}!
                                </h2>
                                <p className="font-literary text-primary-600 dark:text-gray-300 mt-1">
                                    Create and manage engaging activities for your participants
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={handleCreateLiveActivity}
                                    variant="success"
                                    icon={FiZap}
                                    size="lg"
                                >
                                    Create Live Activity
                                </Button>
                                <Button
                                    onClick={handleCreateClick}
                                    variant="primary"
                                    icon={FiPlus}
                                    size="lg"
                                >
                                    Create Regular Activity
                                </Button>
                            </div>
                        </div>
                    </Card.Content>
                </Card>

                {/* Stats Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card hover>
                        <Card.Content className="p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-xl flex items-center justify-center">
                                        <FiActivity className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-sm font-serif font-medium text-primary-500 dark:text-gray-400">Total Activities</h3>
                                    <p className="text-2xl font-elegant font-bold text-primary-900 dark:text-white">{stats.totalActivities}</p>
                                </div>
                            </div>
                        </Card.Content>
                    </Card>
                    
                    <Card hover>
                        <Card.Content className="p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-success-100 dark:bg-success-900/20 rounded-xl flex items-center justify-center">
                                        <FiZap className="w-6 h-6 text-success-600 dark:text-success-400" />
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-sm font-serif font-medium text-primary-500 dark:text-gray-400">Live Activities</h3>
                                    <p className="text-2xl font-elegant font-bold text-success-600 dark:text-success-400">{stats.liveActivities}</p>
                                </div>
                            </div>
                        </Card.Content>
                    </Card>
                    
                    <Card hover>
                        <Card.Content className="p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/20 rounded-xl flex items-center justify-center">
                                        <FiUsers className="w-6 h-6 text-warning-600 dark:text-warning-400" />
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-sm font-serif font-medium text-primary-500 dark:text-gray-400">Total Participants</h3>
                                    <p className="text-2xl font-elegant font-bold text-warning-600 dark:text-warning-400">{stats.totalParticipants}</p>
                                </div>
                            </div>
                        </Card.Content>
                    </Card>
                    
                    <Card hover>
                        <Card.Content className="p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-info-100 dark:bg-info-900/20 rounded-xl flex items-center justify-center">
                                        <FiBarChart className="w-6 h-6 text-info-600 dark:text-info-400" />
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-sm font-serif font-medium text-primary-500 dark:text-gray-400">Total Responses</h3>
                                    <p className="text-2xl font-elegant font-bold text-info-600 dark:text-info-400">{stats.recentResponses}</p>
                                </div>
                            </div>
                        </Card.Content>
                    </Card>
                </div>

                {/* Activity Tabs */}
                <div className="bg-white rounded-lg shadow-sm">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('regular')}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'regular'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Regular Activities
                            </button>
                            <button
                                onClick={() => setActiveTab('live')}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'live'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Live Activities ({liveActivities.length})
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'regular' && (
                            <>
                                {showEditor ? (
                                    <ActivityEditor 
                                        activity={selectedActivity}
                                        onCancel={() => setShowEditor(false)}
                                        onSuccess={() => {
                                            setShowEditor(false);
                                            setSelectedActivity(null);
                                        }}
                                    />
                                ) : (
                                    <ActivityList onEditActivity={handleEditActivity} />
                                )}
                            </>
                        )}

                        {activeTab === 'live' && (
                            <>
                                {showLiveEditor ? (
                                    <LiveActivityCreator
                                        onClose={() => setShowLiveEditor(false)}
                                        onActivityCreated={handleLiveActivityCreated}
                                    />
                                ) : loading ? (
                                    <div className="text-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                        <p className="text-gray-600">Loading live activities...</p>
                                    </div>
                                ) : liveActivities.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
                                            <span className="text-4xl">⚡</span>
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No live activities yet</h3>
                                        <p className="text-gray-500 mb-6">Create your first live interactive activity</p>
                                        <button
                                            onClick={() => setShowLiveEditor(true)}
                                            className="px-6 py-3 bg-success-600 text-white rounded-lg hover:bg-success-700 dark:bg-success-500 dark:hover:bg-success-600 transition-colors font-medium"
                                        >
                                            Create Live Activity
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {liveActivities.map((activity) => (
                                            <ActivityCard
                                                key={activity._id}
                                                activity={activity}
                                                onStart={handleStartLiveActivity}
                                                onViewResults={() => {/* Add view results functionality */}}
                                                onExport={() => {/* Add export functionality */}}
                                                formatDate={formatDate}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </PageTemplate>
    );
}

// Enhanced Activity Card Component
const ActivityCard = ({ activity, onStart, onViewResults, onExport, formatDate }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100">
            {/* Header with status indicator */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-xl p-4 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${activity.isLive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                        <span className="text-sm font-medium">
                            {activity.isLive ? 'LIVE NOW' : 'READY'}
                        </span>
                    </div>
                    <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                        <span className="text-sm font-mono font-bold">{activity.pin}</span>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                    {activity.title}
                </h3>
                
                {activity.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {activity.description}
                    </p>
                )}

                {/* Statistics Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                            {activity.questions?.length || 0}
                        </div>
                        <div className="text-xs text-blue-500 uppercase tracking-wide">Questions</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                            {activity.analytics?.totalParticipants || 0}
                        </div>
                        <div className="text-xs text-green-500 uppercase tracking-wide">Participants</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                            {activity.analytics?.totalResponses || 0}
                        </div>
                        <div className="text-xs text-purple-500 uppercase tracking-wide">Responses</div>
                    </div>
                </div>

                {/* Metadata */}
                <div className="space-y-2 mb-6 text-sm text-gray-500">
                    <div className="flex justify-between">
                        <span>Created:</span>
                        <span className="font-medium">{formatDate(activity.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={`font-medium ${activity.isLive ? 'text-green-600' : 'text-gray-600'}`}>
                            {activity.isLive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                    <button
                        onClick={() => onStart(activity)}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                            activity.isLive
                                ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg'
                                : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg'
                        }`}
                    >
                        <span className="flex items-center justify-center space-x-2">
                            <span>{activity.isLive ? '🎯' : '🚀'}</span>
                            <span>{activity.isLive ? 'Resume Hosting' : 'Start Activity'}</span>
                        </span>
                    </button>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => onViewResults(activity)}
                            className="py-2 px-3 text-sm border border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 hover:border-primary-400 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:border-gray-500 transition-colors flex items-center justify-center space-x-1"
                        >
                            <span>📊</span>
                            <span>Results</span>
                        </button>
                        <button
                            onClick={() => onExport(activity)}
                            disabled={!activity.analytics?.totalResponses}
                            className="py-2 px-3 text-sm border border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 hover:border-primary-400 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:border-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
                        >
                            <span>📤</span>
                            <span>Export</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer with activity type indicator */}
            <div className="px-6 py-3 bg-gray-50 rounded-b-xl">
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Live Activity</span>
                    <span className="flex items-center space-x-1">
                        <span>⚡</span>
                        <span>Interactive</span>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ActivityHost;