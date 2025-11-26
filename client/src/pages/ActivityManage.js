import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Badge, PageTemplate, Alert } from '../components/ui';
import { FiActivity, FiPlus, FiEye, FiTrash2, FiDownload, FiRefreshCw, FiFilter, FiPlay, FiCalendar, FiX } from 'react-icons/fi';

function ActivityManage() {
    const { currentUser } = useAuth();
    const [activities, setActivities] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        dateFrom: '',
        dateTo: '',
        liveOnly: false
    });

    // Check if user is staff (updated for new role system)
    const staffRoles = ['ATL_ADMIN', 'ATL_Member_HKU_Staff', 'Non_ATL_HKU_Staff'];
    const isStaff = staffRoles.includes(currentUser?.User_Role);

    useEffect(() => {
        if (isStaff) {
            fetchActivities();
        }
    }, [isStaff]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('/api/activities', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setActivities(data.activities || []);
                setStats(data.stats || {});
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to fetch activities');
            }
        } catch (err) {
            setError('Network error occurred while fetching activities');
            console.error('Error fetching activities:', err);
        } finally {
            setLoading(false);
        }
    };

    const deleteActivity = async (activityId) => {
        if (!window.confirm('Are you sure you want to delete this activity? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/activities/${activityId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setActivities(activities.filter(activity => activity.Act_ID !== activityId));
                alert('Activity deleted successfully');
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Failed to delete activity');
            }
        } catch (err) {
            alert('Network error occurred while deleting activity');
            console.error('Error deleting activity:', err);
        }
    };

    const viewActivityDetails = async (activityId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/activities/${activityId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSelectedActivity(data.activity);
                setShowDetails(true);
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Failed to fetch activity details');
            }
        } catch (err) {
            alert('Network error occurred while fetching activity details');
            console.error('Error fetching activity details:', err);
        }
    };

    const exportActivities = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/activities/export', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ filters })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `activities_export_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Failed to export activities');
            }
        } catch (err) {
            alert('Network error occurred while exporting activities');
            console.error('Error exporting activities:', err);
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

    const getStatusBadge = (status) => {
        const variants = {
            draft: 'secondary',
            active: 'success',
            completed: 'primary',
            cancelled: 'danger'
        };
        
        return (
            <Badge variant={variants[status] || 'secondary'} size="sm">
                {status}
            </Badge>
        );
    };

    if (!isStaff) {
        return (
            <PageTemplate
                title="Activity Management"
                description="Manage activities and events"
            >
                <Alert variant="error">
                    Access denied. You need staff privileges to access activity management.
                    <br />
                    <span className="text-sm">Current role: {currentUser?.User_Role || 'None'}</span>
                </Alert>
            </PageTemplate>
        );
    }

    if (loading) {
        return (
            <PageTemplate
                title="Activity Management"
                description="Manage activities and events"
                loading={true}
            />
        );
    }

    return (
        <PageTemplate
            title="Activity Management"
            description="Manage activities and events"
            icon="🎯"
        >
            <div className="max-w-7xl mx-auto space-y-6">

                {error && (
                    <Alert variant="error" className="mb-6">
                        {error}
                    </Alert>
                )}

                {/* Stats Overview */}
                {stats && Object.keys(stats).length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card hover>
                            <Card.Content className="p-6 text-center">
                                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <FiActivity className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                </div>
                                <h3 className="text-lg font-serif font-medium text-primary-900 dark:text-white mb-2">Total Activities</h3>
                                <p className="text-3xl font-elegant font-bold text-primary-600 dark:text-primary-400">{stats.totalActivities || 0}</p>
                            </Card.Content>
                        </Card>
                        <Card hover>
                            <Card.Content className="p-6 text-center">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <FiPlay className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-lg font-serif font-medium text-primary-900 dark:text-white mb-2">Live Activities</h3>
                                <p className="text-3xl font-elegant font-bold text-green-600 dark:text-green-400">{stats.liveActivities || 0}</p>
                            </Card.Content>
                        </Card>
                        <Card hover>
                            <Card.Content className="p-6 text-center">
                                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <FiFilter className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <h3 className="text-lg font-serif font-medium text-primary-900 dark:text-white mb-2">Draft Activities</h3>
                                <p className="text-3xl font-elegant font-bold text-yellow-600 dark:text-yellow-400">{stats.draftActivities || 0}</p>
                            </Card.Content>
                        </Card>
                        <Card hover>
                            <Card.Content className="p-6 text-center">
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <FiCalendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-lg font-serif font-medium text-primary-900 dark:text-white mb-2">This Month</h3>
                                <p className="text-3xl font-elegant font-bold text-purple-600 dark:text-purple-400">{stats.thisMonth || 0}</p>
                            </Card.Content>
                        </Card>
                    </div>
                )}

                {/* Controls */}
                <Card>
                    <Card.Header>
                        <Card.Title className="flex items-center font-serif">
                            <FiFilter className="mr-2" />
                            Activity Filters & Controls
                        </Card.Title>
                        <p className="font-literary text-primary-600 dark:text-gray-300 mt-1">
                            Filter activities and manage events
                        </p>
                    </Card.Header>
                    <Card.Content className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Filter by Status
                                </label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="">All Status</option>
                                    <option value="draft">Draft</option>
                                    <option value="active">Active</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    From Date
                                </label>
                                <input
                                    type="date"
                                    value={filters.dateFrom}
                                    onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    To Date
                                </label>
                                <input
                                    type="date"
                                    value={filters.dateTo}
                                    onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div className="flex items-center justify-center">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="liveOnly"
                                        checked={filters.liveOnly}
                                        onChange={(e) => setFilters({...filters, liveOnly: e.target.checked})}
                                        className="mr-2 rounded text-primary-600 focus:ring-primary-500"
                                    />
                                    <label htmlFor="liveOnly" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Live Activities Only
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button
                                variant="success"
                                className="flex items-center gap-2"
                            >
                                <FiPlus className="w-4 h-4" />
                                New Activity
                            </Button>
                            <Button
                                onClick={fetchActivities}
                                variant="primary"
                                className="flex items-center gap-2"
                            >
                                <FiRefreshCw className="w-4 h-4" />
                                Refresh
                            </Button>
                            <Button
                                onClick={exportActivities}
                                variant="secondary"
                                className="flex items-center gap-2"
                            >
                                <FiDownload className="w-4 h-4" />
                                Export CSV
                            </Button>
                        </div>
                    </Card.Content>
                </Card>

                {/* Activities Table */}
                <Card>
                    <Card.Header>
                        <div className="flex items-center justify-between">
                            <Card.Title className="flex items-center font-serif">
                                <FiActivity className="mr-2" />
                                Activities ({activities.length})
                            </Card.Title>
                            <Badge variant="primary" size="lg">
                                {activities.length} Total
                            </Badge>
                        </div>
                    </Card.Header>
                    
                    {activities.length === 0 ? (
                        <Card.Content className="p-6 text-center">
                            <p className="font-literary text-gray-500 dark:text-gray-400">No activities found</p>
                        </Card.Content>
                    ) : (
                        <Card.Content className="p-0">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Activity ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Title
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Live
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Created
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-600">
                                        {activities.map((activity) => (
                                            <tr key={activity.Act_ID} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 dark:text-gray-400">
                                                    {activity.Act_ID}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-serif font-medium text-gray-900 dark:text-white">
                                                        {activity.Title || 'Untitled'}
                                                    </div>
                                                    <div className="text-sm font-literary text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                                        {activity.Description || ''}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(activity.Status)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Badge variant={activity.Live ? 'success' : 'secondary'} size="sm">
                                                        {activity.Live ? 'Yes' : 'No'}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-literary text-gray-500 dark:text-gray-400">
                                                    {formatDate(activity.Created_At)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => viewActivityDetails(activity.Act_ID)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex items-center gap-1"
                                                        >
                                                            <FiEye className="w-3 h-3" />
                                                            View
                                                        </Button>
                                                        <Button
                                                            onClick={() => deleteActivity(activity.Act_ID)}
                                                            variant="danger"
                                                            size="sm"
                                                            className="flex items-center gap-1"
                                                        >
                                                            <FiTrash2 className="w-3 h-3" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card.Content>
                    )}
                </Card>

                {/* Activity Details Modal */}
                {showDetails && selectedActivity && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
                            <div className="mt-3">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-serif font-medium text-gray-900 dark:text-white">Activity Details</h3>
                                    <Button
                                        onClick={() => setShowDetails(false)}
                                        variant="outline"
                                        size="sm"
                                        className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-200"
                                    >
                                        <FiX className="w-4 h-4" />
                                    </Button>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-serif font-medium text-gray-900 dark:text-white mb-2">Basic Information</h4>
                                        <div className="space-y-1">
                                            <p className="text-sm font-literary text-gray-600 dark:text-gray-300">ID: {selectedActivity.Act_ID}</p>
                                            <p className="text-sm font-literary text-gray-600 dark:text-gray-300">Title: {selectedActivity.Title || 'N/A'}</p>
                                            <p className="text-sm font-literary text-gray-600 dark:text-gray-300 flex items-center">Status: {getStatusBadge(selectedActivity.Status)}</p>
                                            <p className="text-sm font-literary text-gray-600 dark:text-gray-300">Live: {selectedActivity.Live ? 'Yes' : 'No'}</p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-serif font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                                        <p className="text-sm font-literary text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                                            {selectedActivity.Description || 'No description provided'}
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-serif font-medium text-gray-900 dark:text-white mb-2">Timestamps</h4>
                                        <div className="space-y-1">
                                            <p className="text-sm font-literary text-gray-600 dark:text-gray-300">Created: {formatDate(selectedActivity.Created_At)}</p>
                                            <p className="text-sm font-literary text-gray-600 dark:text-gray-300">Last Updated: {formatDate(selectedActivity.Last_Updated)}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-6 flex justify-end">
                                    <Button
                                        onClick={() => setShowDetails(false)}
                                        variant="primary"
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageTemplate>
    );
}

export default ActivityManage;