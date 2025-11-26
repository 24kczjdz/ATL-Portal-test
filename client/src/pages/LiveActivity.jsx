import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import HostControlPanel from '../components/host/HostControlPanel';
import ParticipantInterface from '../components/participant/ParticipantInterface';
import { Card, Button, Input, PageTemplate, Alert, Badge } from '../components/ui';
import { FiActivity, FiArrowLeft, FiUser, FiPlay, FiEye, FiRefreshCw } from 'react-icons/fi';

const LiveActivity = () => {
  const { pin } = useParams(); // Activity PIN from URL
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Get current location to detect host route
  
  const [activity, setActivity] = useState(null);
  const [participantId, setParticipantId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinData, setJoinData] = useState({
    nickname: '',
    participateAnonymously: false
  });
  
  // Check if this is a host route
  const isHostRoute = location.pathname.includes('/host');

  const baseURL = process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:5000/api';

  const loadActivity = useCallback(async () => {
    if (!pin) {
      setError('No activity PIN provided');
      setLoading(false);
      return;
    }

    // Check if user is authenticated first
    if (!currentUser) {
      navigate('/login', { 
        state: { 
          from: location.pathname,
          message: 'Please log in to join this activity' 
        }
      });
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Attempting to load activity with PIN:', pin);
      console.log('🌐 API URL:', `${baseURL}/live/activities/pin/${pin}`);
      
      const response = await axios.get(`${baseURL}/live/activities/pin/${pin}`);
      console.log('✅ Activity loaded successfully:', response.data);
      const activityData = response.data.activity;
      
      setActivity(activityData);
      
      // Check if user is a host
      const userIsHost = currentUser && 
        (['ATL_ADMIN', 'ATL_Member_HKU_Staff', 'ATL_Member_HKU_Student', 'ATL_Member_General'].includes(currentUser.User_Role)) &&
        activityData.hostIds?.includes(currentUser.User_ID);
      
      setIsHost(userIsHost);

      // If this is a host route, ensure user has host permissions and load full activity data
      if (isHostRoute) {
        if (!currentUser) {
          setError('You must be logged in to access host controls');
          setLoading(false);
          return;
        }
        
        if (!userIsHost) {
          setError('You do not have permission to host this activity');
          setLoading(false);
          return;
        }
        
        // Load complete activity data for hosts (including all questions)
        try {
          const token = localStorage.getItem('token');
          const hostResponse = await axios.get(
            `${baseURL}/live/activities/host`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          const hostActivities = hostResponse.data.activities || [];
          const fullActivity = hostActivities.find(a => a.Act_ID === activityData.id);
          
          if (fullActivity) {
            console.log('✅ Loaded complete activity data for host:', fullActivity);
            setActivity(fullActivity);
          } else {
            console.warn('⚠️ Full activity data not found, using limited data');
          }
        } catch (hostError) {
          console.error('Failed to load complete activity data:', hostError);
          // Continue with limited activity data if host data fails
        }
      } else {
        // Regular participant route - user is authenticated, show join form
        setShowJoinForm(true);
        // Pre-fill with user's name
        setJoinData(prev => ({
          ...prev,
          nickname: currentUser.Nickname || currentUser.First_Name || ''
        }));
      }
      
    } catch (error) {
      console.error('❌ Error loading activity:', error);
      console.error('📊 Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        pin: pin,
        baseURL: baseURL,
        isHostRoute: isHostRoute,
        currentUser: currentUser?.User_ID,
        url: error.config?.url
      });
      
      if (error.response?.status === 404) {
        if (isHostRoute) {
          setError(`Cannot resume host mode. The activity with PIN ${pin} may have been stopped or is no longer available. Please check your Activity Dashboard.`);
        } else {
          setError(`Activity with PIN ${pin} not found or not currently live. Please check the PIN and try again.`);
        }
      } else if (error.response?.status === 403) {
        setError('You do not have permission to access this activity.');
      } else {
        setError(error.response?.data?.error || 'Failed to load activity');
      }
    } finally {
      setLoading(false);
    }
  }, [pin, currentUser, baseURL, isHostRoute, navigate, location.pathname]);

  // Load activity and determine user role
  useEffect(() => {
    // Check if activity data was passed via navigation state (for host resumption)
    if (location.state?.activityData && location.state?.isResuming) {
      console.log('🎯 Using activity data from navigation state (host resuming)');
      const activityData = location.state.activityData;
      setActivity(activityData);
      
      // Check if user is a host
      const userIsHost = currentUser && 
        (['ATL_ADMIN', 'ATL_Member_HKU_Staff', 'ATL_Member_HKU_Student', 'ATL_Member_General'].includes(currentUser.User_Role)) &&
        activityData.hostIds?.includes(currentUser.User_ID);
      
      setIsHost(userIsHost);
      setLoading(false);
      return;
    }
    
    loadActivity();
  }, [pin, location.state, currentUser, loadActivity]);

  const joinActivity = async (nickname, participateAnonymously = false) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      console.log('🔐 Comprehensive Authentication Debug:', {
        tokenExists: !!token,
        tokenLength: token?.length,
        tokenPreview: token ? `${token.substring(0, 30)}...` : 'none',
        userExists: !!user,
        currentUserFromContext: currentUser?.User_ID,
        userFromStorage: user ? JSON.parse(user)?.User_ID : 'none',
        activityId: activity?.id,
        nickname: nickname,
        participateAnonymously: participateAnonymously,
        timestamp: new Date().toISOString(),
        baseURL: baseURL
      });
      
      if (!token) {
        console.error('❌ No token found in localStorage');
        setError('You must be logged in to join this activity');
        navigate('/login', { 
          state: { 
            from: location.pathname,
            message: 'Please log in to join this activity' 
          }
        });
        return;
      }

      if (!currentUser?.User_ID) {
        console.error('❌ No current user or User_ID found');
        console.error('Current user state:', currentUser);
        setError('User information not available. Please log in again.');
        navigate('/login');
        return;
      }

      // Retry mechanism for serverless cold starts
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          const response = await axios.post(
            `${baseURL}/live/activities/${activity.id}/join`,
            {
              nickname,
              participateAnonymously // New flag for anonymous responses
            },
            { 
              headers: { Authorization: `Bearer ${token}` },
              timeout: 30000 // 30 second timeout for serverless functions
            }
          );

          if (response.data.success) {
            setParticipantId(response.data.participantId);
            setShowJoinForm(false);
          }
          return; // Success, exit retry loop
          
        } catch (retryError) {
          retryCount++;
          console.error(`🔄 Join attempt ${retryCount} failed:`, {
            message: retryError.message,
            status: retryError.response?.status,
            statusText: retryError.response?.statusText,
            data: retryError.response?.data,
            headers: retryError.config?.headers,
            url: retryError.config?.url,
            timeout: retryError.code === 'ECONNABORTED'
          });
          
          if (retryCount > maxRetries) {
            throw retryError; // Re-throw the last error
          }
          
          // Wait before retry (exponential backoff)
          const delay = 1000 * retryCount;
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    } catch (error) {
      console.error('❌ Error joining activity:', error);
      console.error('📊 Join error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        headers: error.config?.headers
      });
      
      if (error.response?.status === 401) {
        setError('Authentication failed. Your session may have expired. Please log in again.');
        // Clear potentially expired token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login', { 
          state: { 
            from: location.pathname,
            message: 'Your session has expired. Please log in again.' 
          }
        });
      } else if (error.response?.status === 403) {
        setError('You do not have permission to join this activity.');
      } else if (error.response?.status === 404) {
        setError('Activity not found or no longer available.');
      } else {
        setError(error.response?.data?.error || 'Failed to join activity');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    if (!joinData.nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }

    await joinActivity(joinData.nickname, joinData.participateAnonymously);
  };

  const handleLeave = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <PageTemplate
        title="Live Activity"
        description="Join or host live interactive activities"
        loading={true}
      />
    );
  }

  if (error) {
    return (
      <PageTemplate
        title="Live Activity"
        description="Join or host live interactive activities"
      >
        <div className="max-w-md mx-auto">
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => {
                setError('');
                loadActivity();
              }}
              variant="primary"
              icon={FiRefreshCw}
            >
              Retry
            </Button>
            <Button
              onClick={handleLeave}
              variant="outline"
              icon={FiArrowLeft}
            >
              Go Back
            </Button>
          </div>
        </div>
      </PageTemplate>
    );
  }

  // Show join form for authenticated users
  if (showJoinForm) {
    return (
      <PageTemplate
        title="Join Live Activity"
        description="Enter your details to participate in this live session"
        icon={<FiActivity className="w-8 h-8" />}
        className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
      >
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-gradient-to-br from-success-500 to-success-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FiUser className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-elegant text-primary-900 dark:text-white mb-4 tracking-wide">
              Join {activity?.title}
            </h1>
            <p className="text-lg font-literary text-primary-600 dark:text-gray-300 max-w-lg mx-auto">
              You're about to join a live interactive session. Set up your participation preferences below.
            </p>
          </div>

          <Card shadow="xl" className="border-primary-200 dark:border-gray-700">
            <Card.Header className="text-center bg-gradient-to-r from-primary-50 to-white dark:from-gray-800 dark:to-gray-800 rounded-t-xl">
              <Card.Title className="text-2xl font-elegant text-primary-900 dark:text-white mb-2">
                Participation Setup
              </Card.Title>
              <h2 className="text-lg font-serif text-primary-700 dark:text-gray-300">
                {activity?.title}
              </h2>
              <div className="mt-3">
                <Badge variant="primary" size="lg" className="font-mono">
                  PIN: {pin}
                </Badge>
              </div>
            </Card.Header>
            <Card.Content className="p-6">
              <form onSubmit={handleJoinSubmit} className="space-y-6">
                <Input
                  label="Your Nickname"
                  type="text"
                  value={joinData.nickname}
                  onChange={(e) => setJoinData(prev => ({ 
                    ...prev, 
                    nickname: e.target.value 
                  }))}
                  placeholder="Enter a nickname..."
                  icon={FiUser}
                  maxLength={50}
                  required
                />

                <div className="bg-primary-50 dark:bg-gray-800 border border-primary-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="participateAnonymously"
                      checked={joinData.participateAnonymously}
                      onChange={(e) => setJoinData(prev => ({ 
                        ...prev, 
                        participateAnonymously: e.target.checked 
                      }))}
                      className="w-4 h-4 text-primary-600 bg-white border-primary-300 rounded focus:ring-primary-500 mt-0.5"
                    />
                    <label htmlFor="participateAnonymously" className="ml-3 text-sm">
                      <div className="font-serif font-medium text-primary-900 dark:text-white">Participate anonymously</div>
                      <div className="font-literary text-primary-600 dark:text-gray-400">Your responses and questions will not show your name</div>
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !joinData.nickname.trim()}
                  variant="success"
                  size="lg"
                  className="w-full"
                  icon={FiPlay}
                  loading={loading}
                >
                  {loading ? 'Joining...' : 'Join Activity'}
                </Button>
              </form>
            </Card.Content>
            <Card.Footer className="text-center">
              <Button
                onClick={handleLeave}
                variant="ghost"
                icon={FiArrowLeft}
              >
                Go Back
              </Button>
            </Card.Footer>
          </Card>
        </div>
      </PageTemplate>
    );
  }

  // Show host interface or participant interface based on role
  if (isHost) {
    return (
      <HostControlPanel 
        activity={activity}
        onClose={handleLeave}
      />
    );
  }

  if (participantId) {
    return (
      <ParticipantInterface
        activity={activity}
        participantId={participantId}
        onLeave={handleLeave}
      />
    );
  }

  return (
    <PageTemplate
      title="Live Activity"
      description="Setting up your session"
      loading={true}
    />
  );
};

export default LiveActivity;