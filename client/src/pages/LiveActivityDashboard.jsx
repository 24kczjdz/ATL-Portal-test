import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import EditActivityModal from '../components/EditActivityModal';
import { Card, Button, Badge, PageTemplate } from '../components/ui';
import { FiPlay, FiEdit3, FiBarChart, FiDownload, FiActivity, FiPlus, FiUsers } from 'react-icons/fi';

const LiveActivityDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState('total'); // 'total' or 'live'
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);

  const baseURL = process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:5000/api';

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${baseURL}/live/activities/host`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('🔍 API response:', response.data);
      setActivities(response.data.activities || []);
    } catch (error) {
      console.error('Error loading activities:', error);
      setError('Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, [baseURL]);

  useEffect(() => {
    // Check if user has host permissions
    if (!currentUser || !['ATL_ADMIN', 'ATL_Member_HKU_Staff', 'ATL_Member_HKU_Student', 'ATL_Member_General'].includes(currentUser.User_Role)) {
      navigate('/');
      return;
    }

    loadActivities();
  }, [currentUser, navigate, loadActivities]);

  const handleCreateActivity = () => {
    setShowCreateForm(true);
  };

  const handleActivityCreated = (newActivity) => {
    setActivities(prev => [newActivity, ...prev]);
    setShowCreateForm(false);
  };

  const handleStartActivity = async (activityId) => {
    try {
      console.log('🔍 Starting activity with ID:', activityId);
      
      if (!activityId) {
        console.error('❌ Activity ID is undefined or null');
        setError('Invalid activity ID');
        return;
      }
      
      const token = localStorage.getItem('token');
      const activity = activities.find(a => (a.Act_ID === activityId) || (a.id === activityId) || (a._id === activityId));
      
      console.log('🔍 Found activity:', activity);
      
      if (!activity) {
        console.error('❌ Activity not found for ID:', activityId);
        setError('Activity not found');
        return;
      }
      
      // If activity is already live, navigate directly to host mode with activity data
      if (activity.isLive) {
        console.log('🎯 Resuming live activity directly:', activity);
        // Pass activity data via state to bypass PIN lookup
        navigate(`/live/${activity.pin}/host`, {
          state: { 
            activityData: activity,
            isResuming: true 
          }
        });
        return;
      }
      
      // If activity is not live, toggle it first
      await axios.patch(
        `${baseURL}/live/activities/${activityId}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Navigate to host control panel
      navigate(`/live/${activity.pin}/host`, {
        state: { 
          activityData: activity,
          isResuming: false 
        }
      });
    } catch (error) {
      console.error('Error starting activity:', error);
      setError('Failed to start activity');
    }
  };

  const handleViewResults = async (activityId) => {
    const activity = activities.find(a => (a.Act_ID === activityId) || (a.id === activityId) || (a._id === activityId));
    setSelectedActivity(activity);
    setShowResults(true);
  };

  const handleExportData = async (activityId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${baseURL}/live/activities/${activityId}/export`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `activity-${activityId}-data.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting data:', error);
      setError('Failed to export data');
    }
  };

  const handleEditActivity = (activity) => {
    setEditingActivity(activity);
    setShowEditForm(true);
  };

  const handleActivityUpdated = (updatedActivity) => {
    setActivities(prev => 
      prev.map(activity => {
        const activityId = activity.Act_ID || activity.id || activity._id;
        const updatedActivityId = updatedActivity.Act_ID || updatedActivity.id || updatedActivity._id;
        return activityId === updatedActivityId ? updatedActivity : activity;
      })
    );
    setShowEditForm(false);
    setEditingActivity(null);
  };

  // Filter activities based on active tab
  const filteredActivities = activities.filter(activity => {
    if (activeTab === 'live') {
      return activity.isLive === true;
    }
    return true; // 'total' shows all activities
  });

  const totalActivities = activities.length;
  const liveActivities = activities.filter(a => a.isLive).length;

  if (loading) {
    return (
      <PageTemplate
        title="Activities Dashboard"
        description="Create and manage your interactive live activities"
        loading={true}
      />
    );
  }

  return (
    <PageTemplate
      title="Activities Dashboard"
      description="Create and manage your interactive live activities"
      headerActions={
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => navigate('/join')}
            variant="outline"
            icon={FiPlay}
          >
            Join Activity
          </Button>
          <Button
            onClick={handleCreateActivity}
            variant="primary"
            icon={FiPlus}
          >
            Create Activity
          </Button>
        </div>
      }
      error={error}
      onErrorClose={() => setError('')}
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <Card.Content className="p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/20">
                <FiActivity className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <div className="text-2xl font-elegant font-bold text-primary-900 dark:text-white">{totalActivities}</div>
            <div className="text-sm font-serif text-primary-600 dark:text-gray-300">Total Activities</div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-lg bg-success-100 dark:bg-success-900/20">
                <FiPlay className="w-6 h-6 text-success-600 dark:text-success-400" />
              </div>
            </div>
            <div className="text-2xl font-elegant font-bold text-success-600 dark:text-success-400">{liveActivities}</div>
            <div className="text-sm font-serif text-success-600 dark:text-success-400">Live Now</div>
          </Card.Content>
        </Card>
        
        <Card>
          <Card.Content className="p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-lg bg-info-100 dark:bg-info-900/20">
                <FiUsers className="w-6 h-6 text-info-600 dark:text-info-400" />
              </div>
            </div>
            <div className="text-2xl font-elegant font-bold text-info-600 dark:text-info-400">
              {activities.reduce((sum, a) => sum + (a.analytics?.totalParticipants || 0), 0)}
            </div>
            <div className="text-sm font-serif text-info-600 dark:text-info-400">Participants</div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-lg bg-warning-100 dark:bg-warning-900/20">
                <FiBarChart className="w-6 h-6 text-warning-600 dark:text-warning-400" />
              </div>
            </div>
            <div className="text-2xl font-elegant font-bold text-warning-600 dark:text-warning-400">
              {activities.reduce((sum, a) => sum + (a.analytics?.totalResponses || 0), 0)}
            </div>
            <div className="text-sm font-serif text-warning-600 dark:text-warning-400">Responses</div>
          </Card.Content>
        </Card>
      </div>

      {/* Activity Management */}
      <Card>
        <Card.Header>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Card.Title>Your Activities</Card.Title>
              <Card.Description>Manage and control your interactive activities</Card.Description>
            </div>
            <div className="flex space-x-2 mt-4 sm:mt-0">
              <Button
                onClick={() => setActiveTab('total')}
                variant={activeTab === 'total' ? 'primary' : 'outline'}
                size="sm"
              >
                All ({totalActivities})
              </Button>
              <Button
                onClick={() => setActiveTab('live')}
                variant={activeTab === 'live' ? 'success' : 'outline'}
                size="sm"
              >
                Live ({liveActivities})
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Content>
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                <FiActivity className="w-12 h-12 text-primary-400 dark:text-primary-500" />
              </div>
              <h3 className="text-lg font-serif font-medium text-primary-900 dark:text-white mb-2">
                {activeTab === 'live' ? 'No Live Activities' : 'No Activities Yet'}
              </h3>
              <p className="font-literary text-primary-600 dark:text-gray-300 mb-6">
                {activeTab === 'live' 
                  ? 'Start an existing activity to see live sessions here' 
                  : 'Create your first interactive activity to get started'
                }
              </p>
              {activeTab === 'total' && (
                <Button
                  onClick={handleCreateActivity}
                  variant="primary"
                  icon={FiPlus}
                >
                  Create Your First Activity
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredActivities.map((activity) => {
                const activityId = activity.Act_ID || activity.id || activity._id;
                
                return (
                  <ActivityCard
                    key={activity._id || activity.id}
                    activity={activity}
                    onStart={() => handleStartActivity(activityId)}
                    onViewResults={() => handleViewResults(activityId)}
                    onExport={() => handleExportData(activityId)}
                    onEdit={handleEditActivity}
                  />
                );
              })}
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Create Activity Modal */}
      {showCreateForm && (
        <CreateActivityModal
          onClose={() => setShowCreateForm(false)}
          onActivityCreated={handleActivityCreated}
        />
      )}

      {/* Edit Activity Modal */}
      {showEditForm && editingActivity && (
        <EditActivityModal
          activity={editingActivity}
          onClose={() => {
            setShowEditForm(false);
            setEditingActivity(null);
          }}
          onActivityUpdated={handleActivityUpdated}
        />
      )}

      {/* Results Modal */}
      {showResults && selectedActivity && (
        <ActivityResultsModal
          activity={selectedActivity}
          onClose={() => {
            setShowResults(false);
            setSelectedActivity(null);
          }}
        />
      )}
    </PageTemplate>
  );
};

// Activity Card Component
const ActivityCard = ({ activity, onStart, onViewResults, onExport, onEdit }) => {
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
    <Card hover className={activity.isLive ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20' : ''}>
      <Card.Content className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-serif font-medium text-primary-900 dark:text-white mb-2">
              {activity.title}
            </h3>
            {activity.description && (
              <p className="font-literary text-primary-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                {activity.description}
              </p>
            )}
          </div>
          <Badge variant={activity.isLive ? 'success' : 'secondary'} size="sm">
            {activity.isLive ? 'Live' : 'Stopped'}
          </Badge>
        </div>

        {/* Activity Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-primary-50 dark:bg-gray-800 rounded-lg border border-primary-200 dark:border-gray-600">
          <div className="text-center">
            <div className="text-xl font-elegant font-bold text-primary-900 dark:text-white">
              {activity.questions?.length || 0}
            </div>
            <div className="text-xs font-serif text-primary-600 dark:text-gray-300 uppercase tracking-wider">Questions</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-elegant font-bold text-primary-900 dark:text-white">
              {activity.analytics?.totalParticipants || 0}
            </div>
            <div className="text-xs font-serif text-primary-600 dark:text-gray-300 uppercase tracking-wider">Participants</div>
          </div>
        </div>

        {/* Activity Details */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="font-serif text-sm text-primary-600 dark:text-gray-300 uppercase tracking-wider">PIN:</span>
            <Badge variant="primary" size="sm" className="font-mono text-lg tracking-widest">
              {activity.pin}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-serif text-primary-600 dark:text-gray-300 uppercase tracking-wider">Created:</span>
            <span className="font-literary text-primary-700 dark:text-gray-200">{formatDate(activity.createdAt)}</span>
          </div>
          {activity.analytics?.totalResponses > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="font-serif text-primary-600 dark:text-gray-300 uppercase tracking-wider">Responses:</span>
              <span className="font-literary text-primary-700 dark:text-gray-200">{activity.analytics.totalResponses}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={onStart}
            variant={activity.isLive ? 'success' : 'primary'}
            size="lg"
            className="w-full"
            icon={activity.isLive ? FiPlay : FiPlay}
          >
            {activity.isLive ? 'Resume Hosting' : 'Start Activity'}
          </Button>
          
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => onEdit(activity)}
              variant="outline"
              size="sm"
              icon={FiEdit3}
            >
              Edit
            </Button>
            <Button
              onClick={onViewResults}
              variant="outline"
              size="sm"
              icon={FiBarChart}
            >
              Results
            </Button>
            <Button
              onClick={onExport}
              disabled={!activity.analytics?.totalResponses}
              variant="outline"
              size="sm"
              icon={FiDownload}
            >
              Export
            </Button>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
};

// Create Activity Modal Component
const CreateActivityModal = ({ onClose, onActivityCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    questions: [
      {
        type: 'MultiChoice',
        text: '',
        options: ['', ''],
        settings: {
          timeLimit: 0,
          allowMultiple: false,
          required: true
        }
      }
    ],
    settings: {
      allowAnonymous: true, // Re-enable for anonymous responses
      allowComments: true,
      allowQuestions: true,
      showResultsLive: true,
      moderateQA: false
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const baseURL = process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:5000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (formData.questions.some(q => !q.text.trim())) {
      setError('All questions must have text');
      return;
    }

    if (formData.questions.some(q => (q.type === 'MultiChoice' || q.type === 'MultiVote') && q.options.some(opt => !opt.trim()))) {
      setError('All multiple choice options must be filled');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${baseURL}/live/activities`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        onActivityCreated(response.data.activity);
      }
    } catch (error) {
      console.error('Error creating activity:', error);
      setError(error.response?.data?.error || 'Failed to create activity');
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, {
        type: 'MultiChoice',
        text: '',
        options: ['', ''],
        settings: {
          timeLimit: 0,
          allowMultiple: false, // Will be set to true for MultiVote type
          required: true
        }
      }]
    }));
  };

  const updateQuestion = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i === index) {
          const updatedQuestion = { ...q, [field]: value };
          
          // Automatically set allowMultiple based on question type
          if (field === 'type') {
            updatedQuestion.settings = {
              ...updatedQuestion.settings,
              allowMultiple: value === 'MultiVote'
            };
          }
          
          return updatedQuestion;
        }
        return q;
      })
    }));
  };

  const removeQuestion = (index) => {
    if (formData.questions.length > 1) {
      setFormData(prev => ({
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index)
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-300 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6 border-b border-gray-300">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-light text-black tracking-wide font-serif">Create New Activity</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl font-light"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-error-100 border border-error-300 dark:bg-error-900/30 dark:border-error-700">
              <p className="text-error-800 text-sm font-light dark:text-error-200">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="mb-6">
            <h3 className="text-lg font-light text-white mb-4 tracking-wide uppercase">Basic Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-light text-gray-300 mb-1 tracking-wider uppercase">
                  Activity Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-3 border border-primary-300 bg-white text-primary-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-primary-400 dark:focus:border-primary-400 font-light"
                  placeholder="Enter activity title..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-light text-gray-300 mb-1 tracking-wider uppercase">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 border border-primary-300 bg-white text-primary-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-primary-400 dark:focus:border-primary-400 font-light"
                  placeholder="Enter activity description..."
                  rows="3"
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Questions</h3>
              <button
                type="button"
                onClick={addQuestion}
                className="px-4 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 dark:bg-success-600 dark:hover:bg-success-700 transition-colors text-sm"
              >
                + Add Question
              </button>
            </div>

            <div className="space-y-4">
              {formData.questions.map((question, index) => (
                <QuestionEditor
                  key={index}
                  question={question}
                  index={index}
                  onUpdate={updateQuestion}
                  onRemove={() => removeQuestion(index)}
                  canRemove={formData.questions.length > 1}
                />
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Activity Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.settings.allowAnonymous}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, allowAnonymous: e.target.checked }
                  }))}
                  className="w-4 h-4 text-primary-600 bg-primary-50 border-primary-300 rounded focus:ring-primary-500 dark:text-primary-400 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-400"
                />
                <span className="ml-2 text-sm text-gray-700">Allow anonymous responses</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.settings.allowComments}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, allowComments: e.target.checked }
                  }))}
                  className="w-4 h-4 text-primary-600 bg-primary-50 border-primary-300 rounded focus:ring-primary-500 dark:text-primary-400 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-400"
                />
                <span className="ml-2 text-sm text-gray-700">Allow comments</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.settings.allowQuestions}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, allowQuestions: e.target.checked }
                  }))}
                  className="w-4 h-4 text-primary-600 bg-primary-50 border-primary-300 rounded focus:ring-primary-500 dark:text-primary-400 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-400"
                />
                <span className="ml-2 text-sm text-gray-700">Allow Q&A questions</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.settings.showResultsLive}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, showResultsLive: e.target.checked }
                  }))}
                  className="w-4 h-4 text-primary-600 bg-primary-50 border-primary-300 rounded focus:ring-primary-500 dark:text-primary-400 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-400"
                />
                <span className="ml-2 text-sm text-gray-700">Show results live</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Question Editor Component
const QuestionEditor = ({ question, index, onUpdate, onRemove, canRemove }) => {
  const updateOption = (optionIndex, value) => {
    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    onUpdate(index, 'options', newOptions);
  };

  const addOption = () => {
    if (question.options.length < 6) {
      onUpdate(index, 'options', [...question.options, '']);
    }
  };

  const removeOption = (optionIndex) => {
    if (question.options.length > 2) {
      const newOptions = question.options.filter((_, i) => i !== optionIndex);
      onUpdate(index, 'options', newOptions);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-800">Question {index + 1}</h4>
        <div className="flex items-center gap-2">
          <select
            value={question.type}
            onChange={(e) => onUpdate(index, 'type', e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="MultiChoice">Multiple Choice (Single Vote)</option>
            <option value="MultiVote">Multiple Choice (Multiple Votes)</option>
            <option value="OpenText">Open Text (Word Cloud)</option>
            <option value="Rating">Rating (1-5)</option>
          </select>
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Question Text
          </label>
          <input
            type="text"
            value={question.text}
            onChange={(e) => onUpdate(index, 'text', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your question..."
          />
        </div>

        {(question.type === 'MultiChoice' || question.type === 'MultiVote') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Answer Options
            </label>
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(optionIndex, e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Option ${optionIndex + 1}`}
                  />
                  {question.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(optionIndex)}
                      className="px-2 py-2 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {question.options.length < 6 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  + Add option
                </button>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time Limit (seconds, 0 = no limit)
          </label>
          <input
            type="number"
            min="0"
            max="300"
            value={question.settings.timeLimit}
            onChange={(e) => onUpdate(index, 'settings', {
              ...question.settings,
              timeLimit: parseInt(e.target.value) || 0
            })}
            className="w-32 p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

// Activity Results Modal Component
const ActivityResultsModal = ({ activity, onClose }) => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  const baseURL = process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:5000/api';

  const loadResults = useCallback(async () => {
    try {
      // Load results for each question
      const token = localStorage.getItem('token');
      const questionResults = await Promise.all(
        activity.questions.map(async (_, index) => {
          try {
            const response = await axios.get(
              `${baseURL}/live/activities/${activity.Act_ID}/results`,
              { 
                params: { questionIndex: index },
                headers: { Authorization: `Bearer ${token}` },
                timeout: 30000 // 30 second timeout for serverless
              }
            );
            return { questionIndex: index, ...response.data };
          } catch (error) {
            console.error(`Error loading results for question ${index}:`, error);
            if (error.code === 'ECONNABORTED') {
              return { questionIndex: index, error: true, errorType: 'timeout' };
            } else if (error.response?.status === 404) {
              return { questionIndex: index, error: true, errorType: 'not_found' };
            }
            return { questionIndex: index, error: true, errorType: 'network' };
          }
        })
      );

      setResults(questionResults);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  }, [activity, baseURL]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Activity Results: {activity.title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading results...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center border border-blue-200 dark:border-blue-800">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {activity.analytics?.totalParticipants || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Total Participants</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center border border-green-200 dark:border-green-800">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {activity.analytics?.totalResponses || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Total Responses</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center border border-purple-200 dark:border-purple-800">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {activity.questions?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Questions</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center border border-orange-200 dark:border-orange-800">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {Math.round(activity.analytics?.averageResponseTime / 1000) || 0}s
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Avg Response Time</div>
                </div>
              </div>

              {/* Question Results */}
              {results && results.map((result, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Question {index + 1}: {activity.questions[index]?.text}
                  </h3>
                  
                  {result.error ? (
                    <p className="text-red-600">Failed to load results for this question</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Response Summary</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p><strong>Total Responses:</strong> {result.analytics?.totalResponses || 0}</p>
                          <p><strong>Average Response Time:</strong> {Math.round(result.analytics?.averageResponseTime / 1000) || 0}s</p>
                        </div>
                      </div>
                      
                      {activity.questions[index]?.type === 'MultiChoice' && result.analytics?.answerCounts && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Answer Distribution</h4>
                          <div className="space-y-2">
                            {Object.entries(result.analytics.answerCounts).map(([answer, count]) => (
                              <div key={answer} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                <span className="text-sm">{answer}</span>
                                <span className="font-medium">{count} votes</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveActivityDashboard;