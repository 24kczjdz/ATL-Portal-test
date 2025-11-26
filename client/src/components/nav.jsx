import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';
import { 
  FiCalendar, 
  FiUsers, 
  FiMessageSquare, 
  FiDatabase, 
  FiHelpCircle, 
  FiUser, 
  FiSettings, 
  FiLogOut, 
  FiMenu, 
  FiX,
  FiHome,
  FiFolderPlus,
  FiActivity
} from 'react-icons/fi';

function NavBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, currentUser, logout } = useAuth();
    const [dropdownStates, setDropdownStates] = useState({
        booking: false,
        activities: false,
        community: false,
        database: false,
        user: false
    });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


    const closeAllDropdowns = () => {
        setDropdownStates({
            booking: false,
            activities: false,
            community: false,
            database: false,
            user: false
        });
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
        closeAllDropdowns();
    };

    const isActivePath = (path) => {
        return location.pathname === path;
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // const handleProtectedLink = (e, path) => { // Commented out - unused
    //     if (!isAuthenticated) {
    //         e.preventDefault();
    //         navigate('/login');
    //     }
    // };

    const getUserDisplayName = () => {
        if (!currentUser) return 'User';
        return currentUser.Nickname || currentUser.First_Name || 'User';
    };

    return (
        <nav className="bg-white dark:bg-gray-800 shadow-soft border-b border-primary-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 gap-2">
                    {/* Logo Section */}
                    <div className="flex items-center flex-1 min-w-0">
                        <div className="flex-shrink-0">
                            <Link 
                                to="/" 
                                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
                            >
                                <img 
                                    src="/asset/images/logo.png" 
                                    alt="ATL logo" 
                                    className="h-10 w-10"
                                />
                                <span className="text-xl font-elegant text-primary-900 dark:text-white hidden sm:block">
                                    Arts Tech Lab
                                </span>
                            </Link>
                        </div>
                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex lg:items-center lg:space-x-2 ml-6">
                            {isAuthenticated ? (
                                <>
                                    {/* Home */}
                                    <Link 
                                        to="/" 
                                        className={`nav-link flex items-center px-3 py-2 rounded-lg ${isActivePath('/') ? 'nav-link-active' : ''}`}
                                    >
                                        <FiHome className="w-4 h-4 mr-2" />
                                        Home
                                    </Link>

                                    {/* Activities (for eligible users) */}
                                    {(currentUser?.User_Role === 'ATL_ADMIN' || 
                                      currentUser?.User_Role === 'ATL_Member_HKU_Staff' || 
                                      currentUser?.User_Role === 'ATL_Member_HKU_Student' ||
                                      currentUser?.User_Role === 'ATL_Member_General' ||
                                      currentUser?.User_Role === 'Non_ATL_HKU_Staff') && (
                                        <div 
                                            className="relative group"
                                            onMouseEnter={() => setDropdownStates(prev => ({ ...prev, activities: true }))}
                                            onMouseLeave={() => setTimeout(() => setDropdownStates(prev => ({ ...prev, activities: false })), 300)}
                                        >
                                            <button
                                                className="nav-link flex items-center px-3 py-2 rounded-lg group-hover:bg-primary-50 dark:group-hover:bg-gray-700 transition-all duration-200"
                                            >
                                                <FiActivity className="w-4 h-4 mr-2" />
                                                Activities
                                                <svg
                                                    className={`ml-1 h-4 w-4 transition-transform duration-200 ${dropdownStates.activities ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                            <div className={`absolute left-0 top-full mt-1 w-64 rounded-xl shadow-soft-xl bg-white dark:bg-gray-800 ring-1 ring-primary-200 dark:ring-gray-700 z-50 transition-all duration-200 ${
                                                dropdownStates.activities 
                                                    ? 'opacity-100 visible transform translate-y-0' 
                                                    : 'opacity-0 invisible transform -translate-y-2'
                                            }`}>
                                                <div className="py-3" role="menu">
                                                    <Link
                                                        to="/join"
                                                        className="flex items-center px-4 py-3 text-sm text-primary-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700"
                                                        role="menuitem"
                                                    >
                                                        <FiUsers className="w-4 h-4 mr-3" />
                                                        Join Activity
                                                    </Link>
                                                    <Link
                                                        to="/live-dashboard"
                                                        className="flex items-center px-4 py-3 text-sm text-primary-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700"
                                                        role="menuitem"
                                                    >
                                                        <FiActivity className="w-4 h-4 mr-3" />
                                                        Activity Dashboard
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Booking */}
                                    <div 
                                        className="relative group"
                                        onMouseEnter={() => setDropdownStates(prev => ({ ...prev, booking: true }))}
                                        onMouseLeave={() => setTimeout(() => setDropdownStates(prev => ({ ...prev, booking: false })), 300)}
                                    >
                                        <button
                                            className="nav-link flex items-center px-3 py-2 rounded-lg group-hover:bg-primary-50 dark:group-hover:bg-gray-700 transition-all duration-200"
                                        >
                                            <FiCalendar className="w-4 h-4 mr-2" />
                                            Booking
                                            <svg
                                                className={`ml-1 h-4 w-4 transition-transform duration-200 ${dropdownStates.booking ? 'rotate-180' : ''}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        <div className={`absolute left-0 top-full mt-1 w-64 rounded-xl shadow-soft-xl bg-white dark:bg-gray-800 ring-1 ring-primary-200 dark:ring-gray-700 z-50 transition-all duration-200 ${
                                            dropdownStates.booking 
                                                ? 'opacity-100 visible transform translate-y-0' 
                                                : 'opacity-0 invisible transform -translate-y-2'
                                        }`}>
                                            <div className="py-3" role="menu">
                                                    <Link
                                                        to="/booking/equipment"
                                                        className="flex items-center px-4 py-3 text-sm text-primary-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700"
                                                        role="menuitem"
                                                    >
                                                        <FiCalendar className="w-4 h-4 mr-3" />
                                                        Equipment Booking
                                                    </Link>
                                                    <Link
                                                        to="/booking/venue"
                                                        className="flex items-center px-4 py-3 text-sm text-primary-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700"
                                                        role="menuitem"
                                                    >
                                                        <FiHome className="w-4 h-4 mr-3" />
                                                        Venue Booking
                                                    </Link>
                                                </div>
                                            </div>
                                    </div>
                                    
                                    {/* Community */}
                                    <div 
                                        className="relative group"
                                        onMouseEnter={() => setDropdownStates(prev => ({ ...prev, community: true }))}
                                        onMouseLeave={() => setTimeout(() => setDropdownStates(prev => ({ ...prev, community: false })), 300)}
                                    >
                                        <button
                                            className="nav-link flex items-center px-3 py-2 rounded-lg group-hover:bg-primary-50 dark:group-hover:bg-gray-700 transition-all duration-200"
                                        >
                                            <FiUsers className="w-4 h-4 mr-2" />
                                            Community
                                            <svg
                                                className={`ml-1 h-4 w-4 transition-transform duration-200 ${dropdownStates.community ? 'rotate-180' : ''}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        <div className={`absolute left-0 top-full mt-1 w-64 rounded-xl shadow-soft-xl bg-white dark:bg-gray-800 ring-1 ring-primary-200 dark:ring-gray-700 z-50 transition-all duration-200 ${
                                            dropdownStates.community 
                                                ? 'opacity-100 visible transform translate-y-0' 
                                                : 'opacity-0 invisible transform -translate-y-2'
                                        }`}>
                                            <div className="py-3" role="menu">
                                                    <Link
                                                        to="/projects"
                                                        className="flex items-center px-4 py-3 text-sm text-primary-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700"
                                                        role="menuitem"
                                                    >
                                                        <FiFolderPlus className="w-4 h-4 mr-3" />
                                                        Projects
                                                    </Link>
                                                    <Link
                                                        to="/student-interest-group"
                                                        className="flex items-center px-4 py-3 text-sm text-primary-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700"
                                                        role="menuitem"
                                                    >
                                                        <FiUsers className="w-4 h-4 mr-3" />
                                                        Student Interest Groups
                                                    </Link>
                                                </div>
                                            </div>
                                    </div>
                                    
                                    {/* Chatbot */}
                                    <Link 
                                        to="/chatbot" 
                                        className={`nav-link flex items-center px-3 py-2 rounded-lg ${isActivePath('/chatbot') ? 'nav-link-active' : ''}`}
                                    >
                                        <FiMessageSquare className="w-4 h-4 mr-2" />
                                        Chatbot
                                    </Link>
                                    
                                    {/* Database navigation for ATL_ADMIN only */}
                                    {currentUser?.User_Role === 'ATL_ADMIN' && (
                                        <div 
                                            className="relative group"
                                            onMouseEnter={() => setDropdownStates(prev => ({ ...prev, database: true }))}
                                            onMouseLeave={() => setTimeout(() => setDropdownStates(prev => ({ ...prev, database: false })), 300)}
                                        >
                                            <button
                                                className="nav-link flex items-center px-3 py-2 rounded-lg group-hover:bg-primary-50 dark:group-hover:bg-gray-700 transition-all duration-200"
                                            >
                                                <FiDatabase className="w-4 h-4 mr-2" />
                                                Admin
                                                <svg
                                                    className={`ml-1 h-4 w-4 transition-transform duration-200 ${dropdownStates.database ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                            <div className={`absolute left-0 top-full mt-1 w-72 rounded-xl shadow-soft-xl bg-white dark:bg-gray-800 ring-1 ring-primary-200 dark:ring-gray-700 z-50 transition-all duration-200 ${
                                                dropdownStates.database 
                                                    ? 'opacity-100 visible transform translate-y-0' 
                                                    : 'opacity-0 invisible transform -translate-y-2'
                                            }`}>
                                                <div className="py-3" role="menu">
                                                        <Link
                                                            to="/database/activity"
                                                            className="flex items-center px-4 py-3 text-sm text-primary-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700"
                                                            role="menuitem"
                                                        >
                                                            <FiActivity className="w-4 h-4 mr-3" />
                                                            Manage Activities
                                                        </Link>
                                                        <Link
                                                            to="/database/event"
                                                            className="flex items-center px-4 py-3 text-sm text-primary-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700"
                                                            role="menuitem"
                                                        >
                                                            <FiCalendar className="w-4 h-4 mr-3" />
                                                            Manage Events
                                                        </Link>
                                                        <Link
                                                            to="/database/user"
                                                            className="flex items-center px-4 py-3 text-sm text-primary-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700"
                                                            role="menuitem"
                                                        >
                                                            <FiUsers className="w-4 h-4 mr-3" />
                                                            Manage Users
                                                        </Link>
                                                        <Link
                                                            to="/database/survey"
                                                            className="flex items-center px-4 py-3 text-sm text-primary-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700"
                                                            role="menuitem"
                                                        >
                                                            <FiMessageSquare className="w-4 h-4 mr-3" />
                                                            Manage Surveys
                                                        </Link>
                                                        <Link
                                                            to="/database/booking"
                                                            className="flex items-center px-4 py-3 text-sm text-primary-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700"
                                                            role="menuitem"
                                                        >
                                                            <FiCalendar className="w-4 h-4 mr-3" />
                                                            Manage Booking
                                                        </Link>
                                                        <Link
                                                            to="/database/projects"
                                                            className="flex items-center px-4 py-3 text-sm text-primary-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700"
                                                            role="menuitem"
                                                        >
                                                            <FiFolderPlus className="w-4 h-4 mr-3" />
                                                            Manage Projects
                                                        </Link>
                                                        <Link
                                                            to="/database/student-interest-group"
                                                            className="flex items-center px-4 py-3 text-sm text-primary-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700"
                                                            role="menuitem"
                                                        >
                                                            <FiUsers className="w-4 h-4 mr-3" />
                                                            Manage Student Groups
                                                        </Link>
                                                        <Link
                                                            to="/database/tokens"
                                                            className="flex items-center px-4 py-3 text-sm text-primary-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700"
                                                            role="menuitem"
                                                        >
                                                            <FiSettings className="w-4 h-4 mr-3" />
                                                            Manage Tokens
                                                        </Link>
                                                    </div>
                                                </div>
                                        </div>
                                    )}
                                    

                                </>
                            ) : (
                                <></>
                            )}
                        </div>
                    </div>

                    {/* Right Side - Mobile Menu Button, User Menu */}
                    <div className="flex items-center space-x-3 flex-shrink-0 min-w-max">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={toggleMobileMenu}
                            className="lg:hidden p-2 rounded-lg text-primary-600 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Toggle mobile menu"
                        >
                            {mobileMenuOpen ? (
                                <FiX className="w-6 h-6" />
                            ) : (
                                <FiMenu className="w-6 h-6" />
                            )}
                        </button>

                        {isAuthenticated ? (
                            <>
                                {/* User Menu */}
                                <div 
                                    className="relative group"
                                    onMouseEnter={() => setDropdownStates(prev => ({ ...prev, user: true }))}
                                    onMouseLeave={() => setTimeout(() => setDropdownStates(prev => ({ ...prev, user: false })), 300)}
                                >
                                    <button
                                        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-gray-700 transition-colors min-w-0"
                                    >
                                        <img
                                            src="/asset/images/avatar.jpg"
                                            alt="User profile"
                                            className="h-8 w-8 rounded-full border-2 border-primary-200 dark:border-gray-600 flex-shrink-0"
                                        />
                                        <span className="hidden md:block font-serif text-primary-900 dark:text-white truncate">
                                            {getUserDisplayName()}
                                        </span>
                                        {/* Theme Toggle */}
                                        <div className="hidden md:block flex-shrink-0">
                                            <ThemeToggle />
                                        </div>
                                        <svg
                                            className={`w-4 h-4 text-primary-600 dark:text-gray-300 transition-transform flex-shrink-0 ${dropdownStates.user ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    <div className={`absolute right-0 top-full mt-1 w-56 rounded-xl shadow-soft-xl bg-white dark:bg-gray-800 ring-1 ring-primary-200 dark:ring-gray-700 z-50 transition-all duration-200 ${
                                        dropdownStates.user 
                                            ? 'opacity-100 visible transform translate-y-0' 
                                            : 'opacity-0 invisible transform -translate-y-2'
                                    }`}>
                                        <div className="py-3" role="menu">
                                                <Link
                                                    to="/profile"
                                                    className="flex items-center px-4 py-3 text-sm text-primary-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700"
                                                    role="menuitem"
                                                >
                                                    <FiUser className="w-4 h-4 mr-3" />
                                                    Profile
                                                </Link>
                                                <Link
                                                    to="/help"
                                                    className="flex items-center px-4 py-3 text-sm text-primary-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700"
                                                    role="menuitem"
                                                >
                                                    <FiHelpCircle className="w-4 h-4 mr-3" />
                                                    Help
                                                </Link>
                                                {currentUser?.User_Role === 'ATL_ADMIN' && (
                                                    <Link
                                                        to="/admin-dashboard"
                                                        className="flex items-center px-4 py-3 text-sm text-primary-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700"
                                                        role="menuitem"
                                                    >
                                                        <FiSettings className="w-4 h-4 mr-3" />
                                                        Admin Dashboard
                                                    </Link>
                                                )}
                                                <div className="border-t border-primary-200 dark:border-gray-600 my-2"></div>
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center w-full px-4 py-3 text-sm text-primary-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700"
                                                    role="menuitem"
                                                >
                                                    <FiLogOut className="w-4 h-4 mr-3" />
                                                    Logout
                                                </button>
                                            </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="btn-ghost hidden sm:inline-flex"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn-primary hidden sm:inline-flex"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="lg:hidden border-t border-primary-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-slide-down">
                    <div className="px-4 py-3 space-y-2">
                        {isAuthenticated ? (
                            <>
                                <Link
                                    to="/"
                                    className="nav-link flex items-center px-3 py-3 rounded-lg"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <FiHome className="w-5 h-5 mr-3" />
                                    Home
                                </Link>

                                {/* Activities for eligible users */}
                                {(currentUser?.User_Role === 'ATL_ADMIN' || 
                                  currentUser?.User_Role === 'ATL_Member_HKU_Staff' || 
                                  currentUser?.User_Role === 'ATL_Member_HKU_Student' ||
                                  currentUser?.User_Role === 'ATL_Member_General' ||
                                  currentUser?.User_Role === 'Non_ATL_HKU_Staff') && (
                                    <>
                                        <div className="pl-3 py-2 text-xs font-serif font-medium text-primary-500 dark:text-gray-400 uppercase tracking-wider">
                                            Activities
                                        </div>
                                        <Link
                                            to="/join"
                                            className="nav-link flex items-center px-6 py-3 rounded-lg"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            <FiUsers className="w-5 h-5 mr-3" />
                                            Join Activity
                                        </Link>
                                        <Link
                                            to="/live-dashboard"
                                            className="nav-link flex items-center px-6 py-3 rounded-lg"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            <FiActivity className="w-5 h-5 mr-3" />
                                            Activity Dashboard
                                        </Link>
                                    </>
                                )}

                                {/* Booking */}
                                <div className="pl-3 py-2 text-xs font-serif font-medium text-primary-500 dark:text-gray-400 uppercase tracking-wider">
                                    Booking
                                </div>
                                <Link
                                    to="/booking/equipment"
                                    className="nav-link flex items-center px-6 py-3 rounded-lg"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <FiCalendar className="w-5 h-5 mr-3" />
                                    Equipment Booking
                                </Link>
                                <Link
                                    to="/booking/venue"
                                    className="nav-link flex items-center px-6 py-3 rounded-lg"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <FiHome className="w-5 h-5 mr-3" />
                                    Venue Booking
                                </Link>

                                {/* Community */}
                                <div className="pl-3 py-2 text-xs font-serif font-medium text-primary-500 dark:text-gray-400 uppercase tracking-wider">
                                    Community
                                </div>
                                <Link
                                    to="/projects"
                                    className="nav-link flex items-center px-6 py-3 rounded-lg"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <FiFolderPlus className="w-5 h-5 mr-3" />
                                    Projects
                                </Link>
                                <Link
                                    to="/student-interest-group"
                                    className="nav-link flex items-center px-6 py-3 rounded-lg"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <FiUsers className="w-5 h-5 mr-3" />
                                    Student Interest Groups
                                </Link>

                                <Link
                                    to="/chatbot"
                                    className="nav-link flex items-center px-3 py-3 rounded-lg"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <FiMessageSquare className="w-5 h-5 mr-3" />
                                    Chatbot
                                </Link>

                                {/* Admin section for admins */}
                                {currentUser?.User_Role === 'ATL_ADMIN' && (
                                    <>
                                        <div className="pl-3 py-2 text-xs font-serif font-medium text-primary-500 dark:text-gray-400 uppercase tracking-wider">
                                            Admin
                                        </div>
                                        <Link
                                            to="/database/activity"
                                            className="nav-link flex items-center px-6 py-3 rounded-lg"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            <FiActivity className="w-5 h-5 mr-3" />
                                            Manage Activities
                                        </Link>
                                        <Link
                                            to="/database/user"
                                            className="nav-link flex items-center px-6 py-3 rounded-lg"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            <FiUsers className="w-5 h-5 mr-3" />
                                            Manage Users
                                        </Link>
                                        <Link
                                            to="/admin-dashboard"
                                            className="nav-link flex items-center px-6 py-3 rounded-lg"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            <FiSettings className="w-5 h-5 mr-3" />
                                            Admin Dashboard
                                        </Link>
                                    </>
                                )}



                                <div className="border-t border-primary-200 dark:border-gray-600 mt-4 pt-4 space-y-3">
                                    {/* Theme Toggle for Mobile */}
                                    <div className="flex items-center justify-between px-3 py-2">
                                        <span className="font-serif text-primary-700 dark:text-gray-300 text-sm">Theme</span>
                                        <ThemeToggle />
                                    </div>
                                    
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="nav-link flex items-center px-3 py-3 rounded-lg w-full"
                                    >
                                        <FiLogOut className="w-5 h-5 mr-3" />
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="btn-ghost flex items-center justify-center py-3"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn-primary flex items-center justify-center py-3"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Register
                                </Link>
                                
                                {/* Theme Toggle for Mobile (unauthenticated) */}
                                <div className="border-t border-primary-200 dark:border-gray-600 mt-4 pt-4">
                                    <div className="flex items-center justify-between px-3 py-2">
                                        <span className="font-serif text-primary-700 dark:text-gray-300 text-sm">Theme</span>
                                        <ThemeToggle />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}

export default NavBar;