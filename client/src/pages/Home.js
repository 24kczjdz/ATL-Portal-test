import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Badge } from '../components/ui';
import { 
  FiCalendar, 
  FiUsers, 
  FiFolderPlus, 
  FiActivity, 
  FiArrowRight,
  FiBook,
  FiMapPin,
  FiClock
} from 'react-icons/fi';

function Home() {
  const { isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();

  const events = [
    { name: "Harvard University", date: "2025.05.10", type: "Conference", status: "upcoming" },
    { name: "MIT", date: "2025.05.21", type: "Workshop", status: "upcoming" },
    { name: "Stanford University", date: "2025.05.29", type: "Seminar", status: "upcoming" },
    { name: "Oxford University", date: "2025.06.14", type: "Collaboration", status: "upcoming" }
  ];

  const quickActions = [
    { 
      name: "Book Equipment", 
      description: "Reserve lab equipment for your projects",
      icon: FiCalendar,
      link: "/booking/equipment",
      color: "primary"
    },
    { 
      name: "Join Project", 
      description: "Collaborate on exciting projects",
      icon: FiFolderPlus,
      link: "/projects",
      color: "success"
    },
    { 
      name: "Find Community", 
      description: "Connect with student interest groups",
      icon: FiUsers,
      link: "/student-interest-group",
      color: "warning"
    },
    { 
      name: "Join Activities", 
      description: "Participate in live lab activities",
      icon: FiActivity,
      link: "/join",
      color: "primary"
    }
  ];

  const stats = [
    { label: "Active Users", value: "150+", icon: FiUsers },
    { label: "Ongoing Projects", value: "23", icon: FiFolderPlus },
    { label: "Equipment Items", value: "85", icon: FiBook },
    { label: "Venue Spaces", value: "12", icon: FiMapPin }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="bg-white dark:bg-gray-800 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-20 text-center">
            <h1 className="text-5xl md:text-6xl font-elegant text-primary-900 dark:text-white mb-6 tracking-wide">
              {isAuthenticated ? `Welcome back, ${currentUser?.First_Name || 'User'}!` : 'Arts Tech Lab'}
            </h1>
            <h2 className="text-2xl md:text-3xl font-script text-primary-700 dark:text-gray-300 mb-8 italic">
              Where Technology Meets Creativity
            </h2>
            <p className="text-xl font-literary text-primary-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Welcome to the Arts Technology Lab at HKU. Explore cutting-edge equipment, collaborate on innovative projects, 
              and connect with a vibrant community of creators and technologists.
            </p>
            
            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  icon={FiArrowRight} 
                  onClick={() => navigate('/register')}
                  className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                >
                  Get Started
                </Button>
                <Button 
                  variant="secondary" 
                  size="lg" 
                  onClick={() => navigate('/login')}
                  className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                >
                  Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} hover={false} className="text-center">
              <Card.Content className="p-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/20">
                    <stat.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
                <div className="text-3xl font-elegant text-primary-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm font-serif text-primary-600 dark:text-gray-300">
                  {stat.label}
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Quick Actions */}
          <div>
            <h2 className="text-3xl font-elegant text-primary-900 dark:text-white mb-8">
              Quick Actions
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {quickActions.map((action, index) => (
                <Card 
                  key={index} 
                  hover 
                  className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  <Card.Content className="p-6">
                    <div className="flex items-center mb-4">
                      <div className={`p-3 rounded-xl bg-${action.color}-100 dark:bg-${action.color}-900/20 mr-4`}>
                        <action.icon className={`w-6 h-6 text-${action.color}-600 dark:text-${action.color}-400`} />
                      </div>
                      <h3 className="font-serif text-primary-900 dark:text-white text-lg">
                        {action.name}
                      </h3>
                    </div>
                    <p className="font-literary text-primary-600 dark:text-gray-300 mb-4">
                      {action.description}
                    </p>
                    <Button
                      onClick={() => navigate(action.link)}
                      variant="ghost"
                      size="sm"
                      icon={FiArrowRight}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200"
                    >
                      Learn more
                    </Button>
                  </Card.Content>
                </Card>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div>
            <h2 className="text-3xl font-elegant text-primary-900 dark:text-white mb-8">
              Upcoming Events
            </h2>
            <Card>
              <Card.Content className="p-6">
                <div className="space-y-6">
                  {events.map((event, index) => (
                    <div key={index} className="flex items-center justify-between py-4 border-b border-primary-100 dark:border-gray-700 last:border-b-0">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/20">
                          <FiCalendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <h3 className="font-serif text-primary-900 dark:text-white">
                            {event.name}
                          </h3>
                          <p className="text-sm font-sans text-primary-500 dark:text-gray-400">
                            {event.type}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="primary" size="sm">
                          {event.date}
                        </Badge>
                        <div className="flex items-center mt-1 text-xs text-primary-400 dark:text-gray-500">
                          <FiClock className="w-3 h-3 mr-1" />
                          {event.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <Button variant="ghost" icon={FiArrowRight}>
                    View All Events
                  </Button>
                </div>
              </Card.Content>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        {isAuthenticated && (
          <div className="mt-20 text-center">
            <Card className="bg-gradient-to-r from-primary-900 to-primary-800 dark:from-primary-800 dark:to-primary-900 border-0">
              <Card.Content className="p-12">
                <h2 className="text-3xl font-elegant text-white mb-4">
                  Ready to Create Something Amazing?
                </h2>
                <p className="text-xl font-literary text-primary-100 mb-8 max-w-2xl mx-auto">
                  Access our state-of-the-art equipment, join collaborative projects, and bring your ideas to life.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    variant="secondary" 
                    size="lg" 
                    className="bg-white dark:bg-gray-100 text-primary-900 dark:!text-black hover:bg-primary-50 dark:hover:bg-gray-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                    onClick={() => navigate('/booking/equipment')}
                  >
                    Start Booking
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="lg" 
                    className="text-white border-white hover:bg-white hover:text-primary-900 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                    onClick={() => navigate('/projects')}
                  >
                    Explore Projects
                  </Button>
                </div>
              </Card.Content>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;