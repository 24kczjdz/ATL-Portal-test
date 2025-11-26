import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Badge, PageTemplate, Alert } from '../components/ui';
import { FiClipboard, FiStar, FiUser, FiMessageSquare, FiEye, FiTrash2, FiDownload, FiRefreshCw, FiFilter, FiX } from 'react-icons/fi';

function SurveyManage() {
    const { currentUser } = useAuth();
    const [surveys, setSurveys] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedSurvey, setSelectedSurvey] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [filters, setFilters] = useState({
        rating: '',
        dateFrom: '',
        dateTo: '',
        hasComments: false
    });

    // Check if user is staff
    const staffRoles = ['ATL_ADMIN', 'ATL_Member_HKU_Staff', 'Non_ATL_HKU_Staff'];
    const isStaff = staffRoles.includes(currentUser?.User_Role);

    useEffect(() => {
        if (isStaff) {
            fetchSurveys();
        }
    }, [isStaff]);

    const fetchSurveys = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('/api/surveys', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSurveys(data.surveys || []);
                setStats(data.stats || {});
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to fetch surveys');
            }
        } catch (err) {
            setError('Network error occurred while fetching surveys');
            console.error('Error fetching surveys:', err);
        } finally {
            setLoading(false);
        }
    };

    const deleteSurvey = async (surveyId) => {
        if (!window.confirm('Are you sure you want to delete this survey? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/surveys/${surveyId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Remove survey from local state
                setSurveys(surveys.filter(survey => survey._id !== surveyId));
                alert('Survey deleted successfully');
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Failed to delete survey');
            }
        } catch (err) {
            alert('Network error occurred while deleting survey');
            console.error('Error deleting survey:', err);
        }
    };

    const viewSurveyDetails = async (surveyId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/surveys/${surveyId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSelectedSurvey(data.survey);
                setShowDetails(true);
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Failed to fetch survey details');
            }
        } catch (err) {
            alert('Network error occurred while fetching survey details');
            console.error('Error fetching survey details:', err);
        }
    };

    const exportSurveys = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/surveys/export', {
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
                a.download = `surveys_export_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Failed to export surveys');
            }
        } catch (err) {
            alert('Network error occurred while exporting surveys');
            console.error('Error exporting surveys:', err);
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

    const getRatingStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <FiStar 
                    key={i} 
                    className={`w-4 h-4 ${i <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-500'}`}
                />
            );
        }
        return stars;
    };

    if (!isStaff) {
        return (
            <PageTemplate
                title="Survey Management"
                description="Manage and analyze chat surveys"
            >
                <Alert variant="error">
                    Access denied. You need staff privileges to access survey management.
                    <br />
                    <span className="text-sm">Current role: {currentUser?.User_Role || 'None'}</span>
                </Alert>
            </PageTemplate>
        );
    }

    if (loading) {
        return (
            <PageTemplate
                title="Survey Management"
                description="Manage and analyze chat surveys"
                loading={true}
            />
        );
    }

    return (
        <PageTemplate
            title="Survey Management"
            description="Manage and analyze chat surveys"
            icon="📋"
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
                                    <FiClipboard className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                </div>
                                <h3 className="text-lg font-serif font-medium text-primary-900 dark:text-white mb-2">Total Surveys</h3>
                                <p className="text-3xl font-elegant font-bold text-primary-600 dark:text-primary-400">{stats.totalSurveys || 0}</p>
                            </Card.Content>
                        </Card>
                        <Card hover>
                            <Card.Content className="p-6 text-center">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <FiStar className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-lg font-serif font-medium text-primary-900 dark:text-white mb-2">Average Rating</h3>
                                <p className="text-3xl font-elegant font-bold text-green-600 dark:text-green-400">
                                    {stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}
                                </p>
                            </Card.Content>
                        </Card>
                        <Card hover>
                            <Card.Content className="p-6 text-center">
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <FiMessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-lg font-serif font-medium text-primary-900 dark:text-white mb-2">With Comments</h3>
                                <p className="text-3xl font-elegant font-bold text-purple-600 dark:text-purple-400">{stats.surveysWithComments || 0}</p>
                            </Card.Content>
                        </Card>
                        <Card hover>
                            <Card.Content className="p-6 text-center">
                                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <FiClipboard className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <h3 className="text-lg font-serif font-medium text-primary-900 dark:text-white mb-2">This Month</h3>
                                <p className="text-3xl font-elegant font-bold text-orange-600 dark:text-orange-400">{stats.thisMonth || 0}</p>
                            </Card.Content>
                        </Card>
                    </div>
                )}

                {/* Controls */}
                <Card>
                    <Card.Header>
                        <Card.Title className="flex items-center font-serif">
                            <FiFilter className="mr-2" />
                            Survey Filters & Controls
                        </Card.Title>
                        <p className="font-literary text-primary-600 dark:text-gray-300 mt-1">
                            Filter surveys and export feedback data
                        </p>
                    </Card.Header>
                    <Card.Content className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Filter by Rating
                                </label>
                                <select
                                    value={filters.rating}
                                    onChange={(e) => setFilters({...filters, rating: e.target.value})}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="">All Ratings</option>
                                    <option value="5">5 Stars</option>
                                    <option value="4">4 Stars</option>
                                    <option value="3">3 Stars</option>
                                    <option value="2">2 Stars</option>
                                    <option value="1">1 Star</option>
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
                                        id="hasComments"
                                        checked={filters.hasComments}
                                        onChange={(e) => setFilters({...filters, hasComments: e.target.checked})}
                                        className="mr-2 rounded text-primary-600 focus:ring-primary-500"
                                    />
                                    <label htmlFor="hasComments" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Has Comments Only
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button
                                onClick={fetchSurveys}
                                variant="primary"
                                className="flex items-center gap-2"
                            >
                                <FiRefreshCw className="w-4 h-4" />
                                Refresh
                            </Button>
                            <Button
                                onClick={exportSurveys}
                                variant="success"
                                className="flex items-center gap-2"
                            >
                                <FiDownload className="w-4 h-4" />
                                Export CSV
                            </Button>
                        </div>
                    </Card.Content>
                </Card>

                {/* Surveys Table */}
                <Card>
                    <Card.Header>
                        <div className="flex items-center justify-between">
                            <Card.Title className="flex items-center font-serif">
                                <FiClipboard className="mr-2" />
                                Surveys ({surveys.length})
                            </Card.Title>
                            <Badge variant="primary" size="lg">
                                {surveys.length} Total
                            </Badge>
                        </div>
                    </Card.Header>
                    
                    {surveys.length === 0 ? (
                        <Card.Content className="p-6 text-center">
                            <p className="font-literary text-gray-500 dark:text-gray-400">No surveys found</p>
                        </Card.Content>
                    ) : (
                        <Card.Content className="p-0">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Rating
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Submitted
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Chat ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-600">
                                        {surveys.map((survey) => (
                                            <tr key={survey.Chat_ID} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <FiUser className="w-4 h-4 text-gray-400 mr-2" />
                                                        <div>
                                                            <div className="text-sm font-serif font-medium text-gray-900 dark:text-white">
                                                                {survey.User_Context?.Last_Name && survey.User_Context?.First_Name 
                                                                    ? `${survey.User_Context.Last_Name} ${survey.User_Context.First_Name}`
                                                                    : 'Unknown'
                                                                }
                                                            </div>
                                                            <div className="text-sm font-literary text-gray-500 dark:text-gray-400">
                                                                {survey.User_Context?.Email_Address || ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex mr-2">
                                                            {getRatingStars(survey.Survey_Responses?.overallExperience?.rating || 0)}
                                                        </div>
                                                        <Badge 
                                                            variant={survey.Survey_Responses?.overallExperience?.rating >= 4 ? 'success' : 
                                                                    survey.Survey_Responses?.overallExperience?.rating >= 3 ? 'warning' : 'danger'} 
                                                            size="sm"
                                                        >
                                                            {survey.Survey_Responses?.overallExperience?.rating || 0}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-literary text-gray-500 dark:text-gray-400">
                                                    {formatDate(survey.Created_At)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                                                    {survey.Chat_ID}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => viewSurveyDetails(survey._id)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex items-center gap-1"
                                                        >
                                                            <FiEye className="w-3 h-3" />
                                                            View
                                                        </Button>
                                                        <Button
                                                            onClick={() => deleteSurvey(survey._id)}
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

                {/* Survey Details Modal */}
                {showDetails && selectedSurvey && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                            <div className="mt-3">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">Survey Details</h3>
                                    <button
                                        onClick={() => setShowDetails(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <span className="sr-only">Close</span>
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium text-gray-900">User Information</h4>
                                        <p className="text-sm text-gray-600">
                                            Name: {selectedSurvey.User_Context?.Last_Name && selectedSurvey.User_Context?.First_Name 
                                                ? `${selectedSurvey.User_Context.Last_Name} ${selectedSurvey.User_Context.First_Name}`
                                                : 'Unknown'
                                            }
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Email: {selectedSurvey.User_Context?.Email_Address || 'N/A'}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Chat ID: {selectedSurvey.Chat_ID}
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-medium text-gray-900">Survey Responses</h4>
                                        {selectedSurvey.Survey_Responses?.overallExperience && (
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-600">
                                                    <strong>Overall Experience:</strong> {getRatingStars(selectedSurvey.Survey_Responses.overallExperience.rating)}
                                                    ({selectedSurvey.Survey_Responses.overallExperience.rating})
                                                </p>
                                            </div>
                                        )}
                                        {selectedSurvey.Survey_Responses?.suggestions?.response && (
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-600">
                                                    <strong>Suggestions:</strong>
                                                </p>
                                                <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded">
                                                    {selectedSurvey.Survey_Responses.suggestions.response}
                                                </p>
                                            </div>
                                        )}
                                        {selectedSurvey.Survey_Responses?.primaryIntent?.response && (
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-600">
                                                    <strong>Primary Intent:</strong>
                                                </p>
                                                <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded">
                                                    {selectedSurvey.Survey_Responses.primaryIntent.response}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-medium text-gray-900">Metadata</h4>
                                        <p className="text-sm text-gray-600">
                                            Submitted: {formatDate(selectedSurvey.Created_At)}
                                        </p>
                                        {selectedSurvey.Export_Metadata && (
                                            <>
                                                <p className="text-sm text-gray-600">
                                                    Total Messages: {selectedSurvey.Export_Metadata.total_messages || 0}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    Chat Duration: {selectedSurvey.Export_Metadata.chat_duration || 0} seconds
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={() => setShowDetails(false)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageTemplate>
    );
}

export default SurveyManage;