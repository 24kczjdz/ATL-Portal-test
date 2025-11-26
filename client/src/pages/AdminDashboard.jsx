import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import EmailTemplateEditor from '../components/EmailTemplateEditor';
import { Card, Button, Badge, LoadingSpinner, Alert } from '../components/ui';
import { 
  FiBarChart, 
  FiMail, 
  FiClock, 
  FiDatabase, 
  FiUsers, 
  FiCalendar, 
  FiFolderPlus, 
  FiPlus,
  FiTrendingUp,
  FiActivity,
  FiSettings,
  FiRefreshCw,
  FiInbox
} from 'react-icons/fi';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [emailNotifications, setEmailNotifications] = useState([]);
  const [receivedEmails, setReceivedEmails] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 150,
    totalBookings: 89,
    totalProjects: 23,
    totalSIGs: 8,
    emailsSent: 234
  });

  // Check if user is admin
  useEffect(() => {
    if (currentUser?.User_Role !== 'ATL_ADMIN') {
      window.location.href = '/';
    }
  }, [currentUser]);

  // Fetch dashboard data
  useEffect(() => {
    if (activeTab === 'templates') {
      fetchEmailTemplates();
    } else if (activeTab === 'notifications') {
      fetchEmailNotifications();
    } else if (activeTab === 'received') {
      fetchReceivedEmails();
    } else if (activeTab === 'overview') {
      fetchDashboardStats();
      fetchRecentActivity();
    }
  }, [activeTab]);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/dashboard-stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/email-templates');
      const data = await response.json();
      if (data.success) {
        setEmailTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error fetching email templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/email-notifications');
      const data = await response.json();
      if (data.success) {
        setEmailNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching email notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReceivedEmails = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/received-emails');
      const data = await response.json();
      if (data.success) {
        setReceivedEmails(data.emails);
      }
    } catch (error) {
      console.error('Error fetching received emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/recent-activity');
      const data = await response.json();
      if (data.success) {
        setRecentActivity(data.activities);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      // Fallback to mock data if API fails
      setRecentActivity([
        { action: 'New user registration', user: 'John Doe', time: '2 minutes ago', type: 'user' },
        { action: 'Equipment booking approved', user: 'Jane Smith', time: '15 minutes ago', type: 'booking' },
        { action: 'Project created', user: 'Alex Johnson', time: '1 hour ago', type: 'project' },
        { action: 'Email template updated', user: 'Admin', time: '2 hours ago', type: 'email' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, color = 'primary' }) => (
    <Card hover={false} className="group">
      <Card.Content className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-serif text-primary-500 dark:text-gray-400 mb-1">
              {title}
            </p>
            <p className="text-3xl font-elegant text-primary-900 dark:text-white">
              {value}
            </p>
            {trend && (
              <div className="flex items-center mt-2">
                <FiTrendingUp className="w-4 h-4 text-success-600 mr-1" />
                <span className="text-sm font-sans text-success-600">+{trend}%</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl bg-${color}-100 dark:bg-${color}-900/20 group-hover:scale-110 transition-transform`}>
            <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
          </div>
        </div>
      </Card.Content>
    </Card>
  );

  const TabButton = ({ tab, isActive, onClick }) => (
    <Button
      onClick={onClick}
      variant={isActive ? 'primary' : 'ghost'}
      className="w-full justify-center"
      icon={tab.icon}
    >
      {tab.name}
    </Button>
  );

  const tabs = [
    { id: 'overview', name: 'Overview', icon: FiBarChart },
    { id: 'templates', name: 'Email Templates', icon: FiMail },
    { id: 'received', name: 'Email Received', icon: FiInbox },
    { id: 'notifications', name: 'Email Logs', icon: FiClock },
    { id: 'database', name: 'Database Management', icon: FiDatabase }
  ];

  const renderTabContent = () => {
    if (loading) {
      return (
        <Card className="min-h-96">
          <Card.Content className="flex items-center justify-center h-96">
            <LoadingSpinner size="lg" text="Loading dashboard data..." />
          </Card.Content>
        </Card>
      );
    }

    switch (activeTab) {
      case 'overview':
  return (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Users"
                value={stats.totalUsers}
                icon={FiUsers}
                trend={12}
                color="primary"
              />
              <StatCard
                title="Active Bookings"
                value={stats.totalBookings}
                icon={FiCalendar}
                trend={8}
                color="success"
              />
              <StatCard
                title="Projects"
                value={stats.totalProjects}
                icon={FiFolderPlus}
                trend={15}
                color="warning"
              />
              <StatCard
                title="Student Groups"
                value={stats.totalSIGs}
                icon={FiUsers}
                trend={5}
                color="primary"
              />
            </div>

            {/* Recent Activity */}
            <Card>
              <Card.Header>
                <Card.Title>Recent Activity</Card.Title>
                <Card.Description>Latest actions in the system</Card.Description>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-8">
                      <FiActivity className="w-12 h-12 text-primary-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="font-literary text-primary-500 dark:text-gray-400">No recent activity found</p>
                    </div>
                  ) : (
                    recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-primary-100 dark:border-gray-700 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/20">
                          {activity.type === 'user' && <FiUsers className="w-4 h-4 text-primary-600 dark:text-primary-400" />}
                          {activity.type === 'booking' && <FiCalendar className="w-4 h-4 text-success-600 dark:text-success-400" />}
                          {activity.type === 'project' && <FiFolderPlus className="w-4 h-4 text-warning-600 dark:text-warning-400" />}
                          {activity.type === 'group' && <FiUsers className="w-4 h-4 text-info-600 dark:text-info-400" />}
                          {activity.type === 'email' && <FiMail className="w-4 h-4 text-primary-600 dark:text-primary-400" />}
                        </div>
                        <div>
                          <p className="font-serif text-primary-900 dark:text-white">{activity.action}</p>
                          <p className="text-sm font-sans text-primary-500 dark:text-gray-400">by {activity.user}</p>
          </div>
        </div>
                      <Badge variant="neutral" size="sm">{activity.time}</Badge>
                    </div>
                    ))
                  )}
                </div>
              </Card.Content>
            </Card>
      </div>
        );

      case 'templates':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-elegant text-primary-900 dark:text-white">Email Templates</h2>
                <p className="font-literary text-primary-600 dark:text-gray-300">Manage automated email templates</p>
              </div>
              <Button
                icon={FiPlus}
                onClick={() => setShowTemplateEditor(true)}
              >
                Create Template
              </Button>
        </div>

            {showTemplateEditor && (
              <Card>
                <Card.Content>
                  <EmailTemplateEditor
                    template={editingTemplate}
                    onSave={(template) => {
                      // Handle template save
                      setShowTemplateEditor(false);
                      setEditingTemplate(null);
                    }}
                    onCancel={() => {
                      setShowTemplateEditor(false);
                      setEditingTemplate(null);
                    }}
                  />
                </Card.Content>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {emailTemplates.map((template, index) => (
                <Card key={index} hover>
                  <Card.Content className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant={template.isActive ? 'success' : 'neutral'}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={FiSettings}
                        onClick={() => {
                          setEditingTemplate(template);
                          setShowTemplateEditor(true);
                        }}
                      />
                </div>
                    <h3 className="font-serif text-primary-900 dark:text-white mb-2">
                      {template.name || `Template ${index + 1}`}
                    </h3>
                    <p className="font-literary text-primary-600 dark:text-gray-300 text-sm">
                      {template.description || 'Email template for automated notifications'}
                    </p>
                  </Card.Content>
                </Card>
              ))}
                </div>
              </div>
        );

      case 'received':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-elegant text-primary-900 dark:text-white">Received Emails</h2>
                <p className="font-literary text-primary-600 dark:text-gray-300">View and manage incoming emails</p>
              </div>
              <Button
                variant="secondary"
                icon={FiRefreshCw}
                onClick={fetchReceivedEmails}
              >
                Refresh
              </Button>
            </div>

            <Card>
              <Card.Content>
                <div className="space-y-4">
                  {receivedEmails.length === 0 ? (
                    <div className="text-center py-12">
                      <FiInbox className="w-12 h-12 text-primary-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="font-literary text-primary-500 dark:text-gray-400">No received emails found</p>
                    </div>
                  ) : (
                    receivedEmails.map((email, index) => (
                      <div key={index} className="flex items-center justify-between py-4 border-b border-primary-100 dark:border-gray-700 last:border-b-0">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/20">
                            <FiInbox className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-serif text-primary-900 dark:text-white truncate">{email.subject}</p>
                            <p className="text-sm font-sans text-primary-500 dark:text-gray-400">
                              from {email.sender}
                            </p>
                            {email.body && (
                              <p className="text-xs font-sans text-primary-400 dark:text-gray-500 mt-1 truncate">
                                {email.body.substring(0, 100)}...
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <Badge 
                            variant={email.isRead ? 'neutral' : 'primary'}
                            size="sm"
                          >
                            {email.isRead ? 'Read' : 'Unread'}
                          </Badge>
                          <p className="text-xs font-sans text-primary-400 dark:text-gray-500 mt-1">
                            {new Date(email.receivedAt).toLocaleDateString()} {new Date(email.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card.Content>
            </Card>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-elegant text-primary-900 dark:text-white">Email Logs</h2>
                <p className="font-literary text-primary-600 dark:text-gray-300">Track sent email notifications</p>
                </div>
              <Button
                variant="secondary"
                icon={FiRefreshCw}
                onClick={fetchEmailNotifications}
              >
                Refresh
              </Button>
            </div>

            <Card>
              <Card.Content>
                <div className="space-y-4">
                  {emailNotifications.length === 0 ? (
                    <div className="text-center py-12">
                      <FiMail className="w-12 h-12 text-primary-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="font-literary text-primary-500 dark:text-gray-400">No email notifications found</p>
                </div>
                  ) : (
                    emailNotifications.map((notification, index) => (
                      <div key={index} className="flex items-center justify-between py-3 border-b border-primary-100 dark:border-gray-700 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/20">
                            <FiMail className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                          <div>
                            <p className="font-serif text-primary-900 dark:text-white">{notification.subject}</p>
                            <p className="text-sm font-sans text-primary-500 dark:text-gray-400">
                              to {notification.recipient}
                            </p>
              </div>
            </div>
                        <div className="text-right">
                          <Badge 
                            variant={notification.status === 'sent' ? 'success' : 'error'}
                            size="sm"
                          >
                            {notification.status}
                          </Badge>
                          <p className="text-xs font-sans text-primary-400 dark:text-gray-500 mt-1">
                            {notification.sentAt}
                          </p>
                </div>
              </div>
                    ))
                  )}
            </div>
              </Card.Content>
            </Card>
          </div>
        );

      case 'database':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-elegant text-primary-900 dark:text-white mb-2">Database Management</h2>
              <p className="font-literary text-primary-600 dark:text-gray-300">System administration tools</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'User Management', icon: FiUsers, description: 'Manage user accounts and permissions', link: '/database/user' },
                { name: 'Booking Management', icon: FiCalendar, description: 'Oversee equipment and venue bookings', link: '/database/booking' },
                { name: 'Project Management', icon: FiFolderPlus, description: 'Manage collaborative projects', link: '/database/projects' },
                { name: 'Activity Management', icon: FiActivity, description: 'Control live activities and events', link: '/database/activity' },
                { name: 'Database Management', icon: FiDatabase, description: 'System administration tools', link: '/admin-dashboard' },
                { name: 'Token Management', icon: FiSettings, description: 'Manage API tokens and access keys', link: '/database/tokens' }
              ].map((tool, index) => (
                <Card 
                  key={index} 
                  hover 
                  className="cursor-pointer transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-1 border-2 border-transparent hover:border-primary-200 dark:hover:border-primary-700"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Navigating to:', tool.link);
                    try {
                      if (tool.link && tool.link !== '#') {
                        navigate(tool.link);
                      }
                    } catch (error) {
                      console.error('Navigation error:', error);
                      // Fallback to window location if navigate fails
                      window.location.href = tool.link;
                    }
                  }}
                >
                  <Card.Content className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/20 mr-4 transition-all duration-200 group-hover:scale-110">
                        <tool.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <h3 className="font-serif text-primary-900 dark:text-white">{tool.name}</h3>
                    </div>
                    <p className="font-literary text-primary-600 dark:text-gray-300 text-sm">
                      {tool.description}
                    </p>
                    <div className="mt-4 flex items-center text-primary-500 dark:text-primary-400 text-sm">
                      <span>Click to manage →</span>
                    </div>
                  </Card.Content>
                </Card>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (currentUser?.User_Role !== 'ATL_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert type="error" title="Access Denied">
          You don't have permission to access the admin dashboard.
        </Alert>
                </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-soft border-b border-primary-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-elegant text-primary-900 dark:text-white mb-2">
                  Admin Dashboard
                </h1>
                <p className="font-literary text-primary-600 dark:text-gray-300 text-lg">
                  Welcome back, {currentUser?.First_Name || 'Admin'}
                </p>
                </div>

            </div>
                </div>
              </div>
            </div>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card padding="lg">
              <div className="space-y-2">
                {tabs.map((tab) => (
                  <TabButton
                    key={tab.id}
                    tab={tab}
                    isActive={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                  />
                ))}
                </div>
            </Card>
            </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderTabContent()}
            </div>
          </div>
      </div>
    </div>
  );
};

export default AdminDashboard;