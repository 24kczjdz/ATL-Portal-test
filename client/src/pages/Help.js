import React from 'react';
import { Link } from 'react-router-dom';
import { Card, PageTemplate } from '../components/ui';
import { 
  FiPlay, 
  FiUsers, 
  FiMessageSquare,
  FiActivity,
  FiCalendar,
  FiBookOpen,
  FiHelpCircle,
  FiMail
} from 'react-icons/fi';

const Help = () => {
  const quickActions = [
    {
      title: 'Activities Dashboard',
      description: 'Create and manage interactive live activities',
      icon: FiActivity,
      link: '/live-dashboard',
      color: 'bg-primary-500 hover:bg-primary-600'
    },
    {
      title: 'Join Activity',
      description: 'Participate in live sessions with a PIN',
      icon: FiPlay,
      link: '/join',
      color: 'bg-success-500 hover:bg-success-600'
    },
    {
      title: 'Equipment Booking',
      description: 'Reserve lab equipment for projects',
      icon: FiCalendar,
      link: '/booking/equipment',
      color: 'bg-info-500 hover:bg-info-600 dark:bg-info-600 dark:hover:bg-info-700'
    },
    {
      title: 'AI Assistant',
      description: 'Get help from our intelligent chatbot',
      icon: FiMessageSquare,
      link: '/chatbot',
      color: 'bg-warning-500 hover:bg-warning-600'
    }
  ];

  const helpTopics = [
    {
      title: 'Getting Started',
      icon: FiBookOpen,
      items: [
        'Create your first account and set up your profile',
        'Navigate the main dashboard and key features',
        'Understand user roles and permissions',
        'Basic platform navigation and settings'
      ]
    },
    {
      title: 'Activities',
      icon: FiActivity,
      items: [
        'Create interactive polls and Q&A sessions',
        'Start and manage live activities',
        'View participant responses and analytics',
        'Export activity data and results'
      ]
    },
    {
      title: 'Booking System',
      icon: FiCalendar,
      items: [
        'Browse available equipment and venues',
        'Make and manage booking requests',
        'Check booking status and confirmations',
        'Cancel or modify existing bookings'
      ]
    },
    {
      title: 'Projects & Community',
      icon: FiUsers,
      items: [
        'Join collaborative projects',
        'Create and manage project teams',
        'Participate in student interest groups',
        'Connect with other lab members'
      ]
    }
  ];

  return (
    <PageTemplate
      title="Help & Support Center"
      description="Find answers and get help with the Arts Technology Lab platform"
    >
      {/* Quick Actions */}
      <Card className="mb-8">
        <Card.Header>
          <Card.Title>Quick Actions</Card.Title>
          <Card.Description>Jump right into platform features</Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className={`p-6 rounded-lg transition-colors duration-200 ${action.color} hover:transform hover:scale-105`}
              >
                <div className="text-center">
                  <action.icon className="w-8 h-8 mx-auto mb-3 text-gray-900 dark:text-white" />
                  <h3 className="font-serif font-medium text-lg mb-2 text-gray-900 dark:text-white">{action.title}</h3>
                  <p className="text-sm text-gray-800 dark:text-gray-200 opacity-90">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card.Content>
      </Card>

      {/* Help Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {helpTopics.map((topic, index) => (
          <Card key={index}>
            <Card.Header>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/20">
                  <topic.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <Card.Title className="text-lg">{topic.title}</Card.Title>
              </div>
            </Card.Header>
            <Card.Content>
              <ul className="space-y-2">
                {topic.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start space-x-2 text-sm">
                    <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span className="font-literary text-primary-600 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </Card.Content>
          </Card>
        ))}
      </div>

      {/* Support Section */}
      <Card>
        <Card.Header>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-success-100 dark:bg-success-900/20">
              <FiHelpCircle className="w-5 h-5 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <Card.Title>Need More Help?</Card.Title>
              <Card.Description>Get personalized assistance</Card.Description>
            </div>
          </div>
        </Card.Header>
        <Card.Content>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/chatbot"
              className="flex-1 inline-flex items-center justify-center px-6 py-3 text-base font-serif font-medium bg-primary-900 text-white hover:bg-primary-800 focus:ring-primary-500 shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              <FiMessageSquare className="w-5 h-5 mr-2" />
              Chat with AI Assistant
            </Link>
            <Link
              to="/contact"
              className="flex-1 inline-flex items-center justify-center px-6 py-3 text-base font-serif font-medium border-2 border-primary-900 dark:border-white text-primary-900 dark:text-white hover:bg-primary-900 dark:hover:bg-white hover:text-white dark:hover:text-primary-900 focus:ring-primary-500 hover:-translate-y-0.5 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              <FiMail className="w-5 h-5 mr-2" />
              Contact Support
            </Link>
          </div>
          <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <p className="text-sm font-literary text-primary-600 dark:text-gray-300">
              Our AI assistant is available 24/7 to provide instant help and guide you through any platform features.
            </p>
          </div>
        </Card.Content>
      </Card>
    </PageTemplate>
  );
};

export default Help;