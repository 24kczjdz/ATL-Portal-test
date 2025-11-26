import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Input, PageTemplate, Alert, Badge } from '../components/ui';
import { FiActivity, FiPlay, FiUsers, FiShield, FiSmartphone, FiHelpCircle } from 'react-icons/fi';

const JoinActivity = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const baseURL = process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:5000/api';

  // Check if user is authenticated, redirect to login if not
  useEffect(() => {

    if (!currentUser) {
      navigate('/login', { 
        state: { 
          from: '/join',
          message: 'Please log in to join activities' 
        }
      });
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!pin.trim()) {
      setError('Please enter an activity PIN');
      return;
    }

    if (pin.length !== 6 || !/^\d+$/.test(pin)) {
      setError('PIN must be 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if activity exists and is live
      const response = await axios.get(`${baseURL}/live/activities/pin/${pin}`);
      
      if (response.data.activity) {
        // Navigate to the activity page
        navigate(`/live/${pin}`);
      }
    } catch (error) {
      console.error('Error checking activity:', error);
      if (error.response?.status === 404) {
        setError('Activity not found or not currently live. Please check the PIN or ask the host to start the activity.');
      } else if (error.response?.status === 500) {
        setError('Server error. Please try again or contact support.');
      } else {
        setError('Failed to join activity. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setPin(value);
      setError(''); // Clear error when user starts typing
    }
  };

  const formatPin = (value) => {
    // Format as XXX-XXX for better readability
    if (value.length > 3) {
      return `${value.slice(0, 3)}-${value.slice(3)}`;
    }
    return value;
  };

  return (
    <PageTemplate
      title="Join Activity"
      description="Enter the activity PIN to participate in live interactive sessions"
      icon={<FiActivity className="w-8 h-8" />}
      className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <FiActivity className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-elegant text-primary-900 dark:text-white mb-4 tracking-wide">
            Join Activity
          </h1>
          <p className="text-xl font-literary text-primary-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Enter the activity PIN to participate in live interactive sessions and engage with your community
          </p>
        </div>

        {/* Join Form */}
        <Card shadow="xl" className="border-primary-200 dark:border-gray-700">
          <Card.Header className="text-center bg-gradient-to-r from-primary-50 to-white dark:from-gray-800 dark:to-gray-800 rounded-t-xl">
            <Card.Title className="text-3xl font-elegant text-primary-900 dark:text-white mb-2">
              Enter Activity PIN
            </Card.Title>
            <p className="font-literary text-primary-600 dark:text-gray-300 text-lg">
              Get the 6-digit PIN from your host to participate
            </p>
          </Card.Header>
          <Card.Content className="p-8 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                <label className="block text-lg font-serif font-medium text-primary-700 dark:text-gray-300 mb-4 text-center">
                  Activity PIN
                </label>
                <div className="relative max-w-sm mx-auto">
                  <Input
                    type="text"
                    value={pin}
                    onChange={handlePinChange}
                    placeholder="000000"
                    className={`text-3xl font-mono text-center tracking-widest py-6 bg-gradient-to-r from-primary-50 to-white dark:from-gray-700 dark:to-gray-800 border-2 ${
                      error ? 'border-error-400 focus:border-error-500' : 'border-primary-300 dark:border-gray-600 focus:border-primary-500'
                    } shadow-inner transition-all duration-300`}
                    maxLength={6}
                    size="xl"
                  />
                  <div className="absolute top-2 right-4 flex items-center">
                    <Badge variant="outline" size="sm" className="font-mono">
                      {pin.length}/6
                    </Badge>
                  </div>
                </div>
                
                {pin && pin.length === 6 && (
                  <div className="text-center animate-fade-in">
                    <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20 px-6 py-3 rounded-xl border border-success-200 dark:border-success-700">
                      <FiActivity className="w-5 h-5 text-success-600 dark:text-success-400" />
                      <Badge variant="success" size="lg" className="font-mono text-xl tracking-widest">
                        {formatPin(pin)}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <Alert variant="error" className="animate-slide-up">
                  {error}
                </Alert>
              )}

              <div className="space-y-4">
                <Button
                  type="submit"
                  disabled={loading || pin.length !== 6}
                  variant="success"
                  size="xl"
                  className="w-full py-4 text-lg font-serif tracking-wide shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                  icon={FiPlay}
                  loading={loading}
                >
                  {loading ? 'Joining Activity...' : 'Join Activity'}
                </Button>
                
                <p className="text-center font-literary text-primary-500 dark:text-gray-400 text-sm">
                  Powered by Arts Technology Lab
                </p>
              </div>
            </form>

            {/* Quick PIN buttons for demo/testing */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 pt-6 border-t border-primary-200 dark:border-gray-600">
                <p className="text-xs font-serif text-primary-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                  Quick join (development only):
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {['123456', '654321', '999999'].map((demoPin) => (
                    <Button
                      key={demoPin}
                      type="button"
                      onClick={() => setPin(demoPin)}
                      variant="ghost"
                      size="sm"
                      className="font-mono text-xs"
                    >
                      {demoPin}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Feature Cards Section */}
        <div className="space-y-8">
          {/* ATL Member Special Card */}
          {currentUser && ['ATL_ADMIN', 'ATL_Member_HKU_Staff', 'ATL_Member_HKU_Student', 'ATL_Member_General'].includes(currentUser.User_Role) && (
            <Card shadow="lg" className="bg-gradient-to-r from-primary-50 via-white to-primary-50 dark:from-primary-900/20 dark:via-gray-800 dark:to-primary-900/20 border-primary-200 dark:border-primary-700">
              <Card.Content className="p-8">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <FiUsers className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-elegant font-bold text-primary-900 dark:text-white mb-3">ATL Member Portal</h3>
                    <p className="font-literary text-primary-700 dark:text-gray-300 mb-6 text-lg leading-relaxed">
                      As an ATL member, you can both join activities as a participant and create your own interactive sessions for the community.
                    </p>
                    <Button
                      onClick={() => navigate('/activity/host')}
                      variant="primary"
                      size="lg"
                      icon={FiActivity}
                      className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                    >
                      Create Your Own Activities
                    </Button>
                  </div>
                </div>
              </Card.Content>
            </Card>
          )}
          
          {/* Information Cards Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            <Card hover shadow="lg" className="border-info-200 dark:border-info-700 hover:border-info-300 dark:hover:border-info-600 transition-all duration-300">
              <Card.Content className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-info-100 to-info-200 dark:from-info-900/40 dark:to-info-800/40 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                  <FiHelpCircle className="w-8 h-8 text-info-600 dark:text-info-400" />
                </div>
                <h3 className="text-xl font-serif font-bold text-primary-900 dark:text-white">How to Join</h3>
                <p className="font-literary text-primary-600 dark:text-gray-300 leading-relaxed">
                  Get the 6-digit PIN from your host and enter it above to participate in live polls, Q&A sessions, and interactive activities in real-time.
                </p>
              </Card.Content>
            </Card>

            <Card hover shadow="lg" className="border-success-200 dark:border-success-700 hover:border-success-300 dark:hover:border-success-600 transition-all duration-300">
              <Card.Content className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-success-100 to-success-200 dark:from-success-900/40 dark:to-success-800/40 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                  <FiShield className="w-8 h-8 text-success-600 dark:text-success-400" />
                </div>
                <h3 className="text-xl font-serif font-bold text-primary-900 dark:text-white">Privacy First</h3>
                <p className="font-literary text-primary-600 dark:text-gray-300 leading-relaxed">
                  Login required for security, but you can choose to participate anonymously once inside the activity to protect your privacy.
                </p>
              </Card.Content>
            </Card>

            <Card hover shadow="lg" className="border-warning-200 dark:border-warning-700 hover:border-warning-300 dark:hover:border-warning-600 transition-all duration-300">
              <Card.Content className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-warning-100 to-warning-200 dark:from-warning-900/40 dark:to-warning-800/40 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                  <FiSmartphone className="w-8 h-8 text-warning-600 dark:text-warning-400" />
                </div>
                <h3 className="text-xl font-serif font-bold text-primary-900 dark:text-white">Any Device</h3>
                <p className="font-literary text-primary-600 dark:text-gray-300 leading-relaxed">
                  Optimized for all devices - desktop, tablet, or mobile. Join from anywhere and participate seamlessly in real-time.
                </p>
              </Card.Content>
            </Card>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
};

export default JoinActivity;