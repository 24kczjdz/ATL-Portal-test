import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Input, Badge, PageTemplate, LoadingSpinner, Alert } from '../components/ui';
import { 
    FiUsers, 
    FiSearch, 
    FiDownload, 
    FiMail,
    FiPhone,
    FiCalendar,
    FiBarChart,
    FiX,
    FiCheck,
    FiAlertCircle
} from 'react-icons/fi';

function UserManage() {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userActivity, setUserActivity] = useState({});
    const [loading, setLoading] = useState(true);
    const [activityLoading, setActivityLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [approvalFilter, setApprovalFilter] = useState(''); // 'pending', 'approved', ''
    const [sortBy, setSortBy] = useState('name');
    const [approvingUser, setApprovingUser] = useState(null);
    const [activityView, setActivityView] = useState('summary'); // 'summary', 'timeline', 'analytics'
    const [dateRange, setDateRange] = useState('30'); // days
    const [activityFilter, setActivityFilter] = useState('all'); // 'all', 'equipment', 'venue', 'projects', etc.
    const [exportLoading, setExportLoading] = useState(false);
    const usersAbortRef = useRef(null);
    const activityAbortRef = useRef(null);

    // Check if user is admin or has user management permissions
    const canManageUsers = currentUser?.User_Role === 'ATL_ADMIN' || 
                          currentUser?.User_Role === 'ATL_Member_HKU_Staff';

    useEffect(() => {
        if (canManageUsers) {
            fetchUsers();
        }
    }, [canManageUsers]);

    // Filter and search users
    useEffect(() => {
        let filtered = users.filter(user => {
            const fullName = `${user.First_Name || ''} ${user.Last_Name || ''}`.toLowerCase();
            const searchLower = searchTerm.toLowerCase();
            
            const matchesSearch = searchTerm === '' || 
                fullName.includes(searchLower) ||
                user.User_ID?.toLowerCase().includes(searchLower) ||
                user.Email_Address?.toLowerCase().includes(searchLower);
            
            const matchesRole = roleFilter === '' || user.User_Role === roleFilter;
            
            const matchesApproval = approvalFilter === '' || 
                (approvalFilter === 'pending' && user.approved === false) ||
                (approvalFilter === 'approved' && user.approved !== false);
            
            return matchesSearch && matchesRole && matchesApproval;
        });

        // Sort users
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return `${a.First_Name} ${a.Last_Name}`.localeCompare(`${b.First_Name} ${b.Last_Name}`);
                case 'role':
                    return a.User_Role.localeCompare(b.User_Role);
                case 'recent':
                    return new Date(b.Last_Login || 0) - new Date(a.Last_Login || 0);
                default:
                    return 0;
            }
        });

        setFilteredUsers(filtered);
    }, [users, searchTerm, roleFilter, approvalFilter, sortBy]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            // Abort any in-flight users request
            if (usersAbortRef.current) {
                usersAbortRef.current.abort();
            }
            const controller = new AbortController();
            usersAbortRef.current = controller;
            
            // Start with the working endpoint
            let response = await fetch('/api/users', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                signal: controller.signal
            });

            if (response.ok) {
                const data = await response.json();
                
                // Handle different response formats
                if (Array.isArray(data)) {
                    setUsers(data);
                } else if (data.users && Array.isArray(data.users)) {
                    setUsers(data.users);
                } else if (data.data && Array.isArray(data.data)) {
                    setUsers(data.data);
                } else if (data.result && Array.isArray(data.result)) {
                    setUsers(data.result);
                } else {
                    console.error('Unexpected response format:', data);
                    setUsers([]);
                }
            } else {
                console.error('Failed to fetch users:', response.status, response.statusText);
                setUsers([]);
            }
        } catch (error) {
            if (error.name === 'AbortError') return;
            console.error('Error fetching users:', error);
        } finally {
            usersAbortRef.current = null;
            setLoading(false);
        }
    };

    const fetchUserActivity = useCallback(async (userId) => {
        try {
            setActivityLoading(true);
            // Abort any in-flight activity request
            if (activityAbortRef.current) {
                activityAbortRef.current.abort();
            }
            const controller = new AbortController();
            activityAbortRef.current = controller;

            const response = await fetch(`/api/users/${userId}/activity`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                signal: controller.signal
            });

            if (response.ok) {
                const data = await response.json();
                setUserActivity(data);
            }
        } catch (error) {
            if (error.name === 'AbortError') return;
            console.error('Error fetching user activity:', error);
        } finally {
            activityAbortRef.current = null;
            setActivityLoading(false);
        }
    }, []);

    const handleApproveUser = async (userId) => {
        if (!window.confirm('Are you sure you want to approve this user account?')) {
            return;
        }

        setApprovingUser(userId);

        try {
            const response = await fetch(`/api/users/${userId}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                alert(`Account approved successfully for ${data.user?.First_Name} ${data.user?.Last_Name}`);
                // Refresh users list
                fetchUsers();
                // Update selected user if it's the one that was approved
                if (selectedUser?.User_ID === userId) {
                    setSelectedUser({ ...selectedUser, approved: true });
                }
            } else {
                alert(data.message || 'Failed to approve account');
            }
        } catch (err) {
            console.error('Error approving user:', err);
            alert('An error occurred while approving the account');
        } finally {
            setApprovingUser(null);
        }
    };

    const exportUserActivity = async (userId, format) => {
        try {
            setExportLoading(true);
            const response = await fetch(`/api/users/${userId}/activity/export?format=${format}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `user_activity_${userId}.${format}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Error exporting user activity:', error);
            alert('Failed to export user activity. Please try again.');
        } finally {
            setExportLoading(false);
        }
    };

    const renderActivityAnalytics = () => {
        return (
            <div className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                    <p>Activity analytics view coming soon...</p>
                    <p className="text-sm">This will show detailed analytics and charts.</p>
                </div>
            </div>
        );
    };

    const renderActivityTimeline = () => {
        return (
            <div className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                    <p>Activity timeline view coming soon...</p>
                    <p className="text-sm">This will show a chronological timeline of user activities.</p>
                </div>
            </div>
        );
    };

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        fetchUserActivity(user.User_ID);
    };

    // Refresh activity when selected user or filters change
    useEffect(() => {
        if (selectedUser?.User_ID) {
            fetchUserActivity(selectedUser.User_ID);
        }
    }, [selectedUser?.User_ID, dateRange, activityFilter, fetchUserActivity]);

    // Abort any pending requests on unmount
    useEffect(() => {
        return () => {
            if (usersAbortRef.current) usersAbortRef.current.abort();
            if (activityAbortRef.current) activityAbortRef.current.abort();
        };
    }, []);

    const getRoleVariant = (role) => {
        const variants = {
            'ATL_ADMIN': 'danger',
            'ATL_Member_HKU_Staff': 'primary',
            'ATL_Member_HKU_Student': 'success',
            'ATL_Member_General': 'warning',
            'Non_ATL_HKU_Staff': 'secondary'
        };
        return variants[role] || 'secondary';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!canManageUsers) {
        return (
            <PageTemplate
                title="User Management"
                description="User directory and management tools"
            >
                <Alert variant="error">
                    Access denied. You need admin or staff privileges to access this page.
                    <br />
                    <span className="text-sm">Current role: {currentUser?.User_Role || 'None'}</span>
                </Alert>
            </PageTemplate>
        );
    }

    if (loading) {
        return (
            <PageTemplate
                title="User Management"
                description="User directory and management tools"
                loading={true}
            />
        );
    }

    return (
        <PageTemplate
            title="User Management"
            description="User directory and management tools"
            icon="👥"
        >
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Stats */}
                <Card>
                    <Card.Header>
                        <div className="flex justify-between items-center">
                            <div>
                                <Card.Title className="text-2xl font-serif flex items-center">
                                    <FiUsers className="mr-2" />
                                    User Directory
                                </Card.Title>
                                <p className="font-literary text-primary-600 dark:text-gray-300 mt-1">
                                    Comprehensive user management and analytics
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <Badge variant="primary" size="lg">
                                    Total: {users.length}
                                </Badge>
                                <Badge variant="secondary" size="lg">
                                    Filtered: {filteredUsers.length}
                                </Badge>
                                <Badge variant="warning" size="lg">
                                    Pending: {users.filter(u => u.approved === false).length}
                                </Badge>
                            </div>
                        </div>
                    </Card.Header>

                    {/* Search and Filters */}
                    <Card.Content className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                            {/* Search Input */}
                            <div className="md:col-span-2">
                                <Input
                                    label="Search Users"
                                    type="text"
                                    placeholder="Search by name, User ID, or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    icon={FiSearch}
                                />
                            </div>

                            {/* Role Filter */}
                            <div>
                                <label className="block text-sm font-serif font-medium text-primary-700 dark:text-gray-300 mb-2">
                                    Filter by Role
                                </label>
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="w-full px-4 py-3 font-literary border border-primary-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-primary-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-primary-500/20 dark:focus:ring-primary-400/20 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-300"
                                >
                                    <option value="">All Roles</option>
                                    <option value="ATL_ADMIN">ATL Admin</option>
                                    <option value="ATL_Member_HKU_Staff">ATL Member (Staff)</option>
                                    <option value="ATL_Member_HKU_Student">ATL Member (Student)</option>
                                    <option value="ATL_Member_General">ATL Member (General)</option>
                                    <option value="Non_ATL_HKU_Staff">Non-ATL HKU Staff</option>
                                </select>
                            </div>

                            {/* Approval Status Filter */}
                            <div>
                                <label className="block text-sm font-serif font-medium text-primary-700 dark:text-gray-300 mb-2">
                                    Approval Status
                                </label>
                                <select
                                    value={approvalFilter}
                                    onChange={(e) => setApprovalFilter(e.target.value)}
                                    className="w-full px-4 py-3 font-literary border border-primary-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-primary-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-primary-500/20 dark:focus:ring-primary-400/20 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-300"
                                >
                                    <option value="">All Users</option>
                                    <option value="pending">Pending Approval</option>
                                    <option value="approved">Approved</option>
                                </select>
                            </div>

                            {/* Sort By */}
                            <div>
                                <label className="block text-sm font-serif font-medium text-primary-700 dark:text-gray-300 mb-2">
                                    Sort By
                                </label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full px-4 py-3 font-literary border border-primary-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-primary-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-primary-500/20 dark:focus:ring-primary-400/20 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-300"
                                >
                                    <option value="name">Name (A-Z)</option>
                                    <option value="role">Role</option>
                                    <option value="recent">Last Login</option>
                                </select>
                            </div>
                        </div>

                        {/* Clear Filters */}
                        <div className="flex justify-end">
                            {(searchTerm || roleFilter || approvalFilter) && (
                                <Button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setRoleFilter('');
                                        setApprovalFilter('');
                                    }}
                                    variant="ghost"
                                    size="sm"
                                    icon={FiX}
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    </Card.Content>
                </Card>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* User List - Smaller width */}
                    <div className="lg:col-span-2">
                        <Card>
                            <Card.Header>
                                <Card.Title className="text-lg font-serif flex items-center">
                                    <FiUsers className="mr-2" />
                                    Users ({filteredUsers.length})
                                </Card.Title>
                            </Card.Header>
                            
                            <Card.Content className="p-4">
                                {/* Simplified list view for smaller space */}
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {filteredUsers.map((user) => (
                                            <div
                                                key={user.User_ID}
                                                onClick={() => handleUserSelect(user)}
                                            className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                                                    selectedUser?.User_ID === user.User_ID 
                                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                                                    : 'border-primary-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-gray-500'
                                                }`}
                                            >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-serif font-medium text-primary-900 dark:text-white text-sm">
                                                                {user.First_Name} {user.Last_Name}
                                                    </h4>
                                                    {user.approved === false && (
                                                        <FiAlertCircle className="w-4 h-4 text-amber-500" title="Pending Approval" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-1 items-end">
                                                    <Badge variant={getRoleVariant(user.User_Role)} size="sm">
                                                        {user.User_Role.replace('ATL_', '').replace('_', ' ')}
                                                    </Badge>
                                                    {user.approved === false && (
                                                        <Badge variant="warning" size="sm">
                                                            Pending
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-xs font-literary text-primary-500 dark:text-gray-400 truncate">
                                                {user.Email_Address}
                                            </p>
                                            <p className="text-xs font-sans text-primary-400 dark:text-gray-500">
                                                Last: {formatDate(user.Last_Login)}
                                            </p>
                                            </div>
                                        ))}
                                    </div>

                                {filteredUsers.length === 0 && (
                                    <div className="text-center py-8">
                                        <p className="font-literary text-gray-500 dark:text-gray-400">No users found matching your search criteria.</p>
                                    </div>
                                )}
                            </Card.Content>
                        </Card>
                    </div>

                    {/* User Details Panel - Larger width */}
                    <div className="lg:col-span-3">
                    <Card>
                        <Card.Header>
                            <div className="flex justify-between items-center">
                                    <Card.Title className="text-xl font-serif flex items-center">
                                    <FiBarChart className="mr-2" />
                                        User Details & Analytics
                                </Card.Title>
                                {selectedUser && (
                                    <div className="flex space-x-2">
                                        <Button
                                            onClick={() => exportUserActivity(selectedUser.User_ID, 'csv')}
                                            disabled={exportLoading}
                                            variant="success"
                                            size="sm"
                                            icon={FiDownload}
                                        >
                                            {exportLoading ? 'Exporting...' : 'Export CSV'}
                                        </Button>
                                        <Button
                                            onClick={() => exportUserActivity(selectedUser.User_ID, 'pdf')}
                                            disabled={exportLoading}
                                            variant="primary"
                                            size="sm"
                                            icon={FiDownload}
                                        >
                                            Export PDF
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card.Header>
                        
                        {selectedUser ? (
                            <Card.Content className="p-8">
                                {/* User Info Header */}
                                <div className="mb-8">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                                        <div className="flex items-center space-x-4 mb-4 md:mb-0">
                                            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-xl flex items-center justify-center">
                                                <FiUsers className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-2xl font-serif font-bold text-primary-900 dark:text-white">
                                                {selectedUser.First_Name} {selectedUser.Last_Name}
                                            </h3>
                                                    {selectedUser.approved === false && (
                                                        <FiAlertCircle className="w-6 h-6 text-amber-500" title="Pending Approval" />
                                                    )}
                                                </div>
                                                <p className="font-literary text-primary-600 dark:text-gray-300">
                                                    {selectedUser.Title || 'User'} | {selectedUser.User_ID}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 items-end">
                                            <Badge variant={getRoleVariant(selectedUser.User_Role)} size="lg">
                                                {selectedUser.User_Role.replace('_', ' ')}
                                            </Badge>
                                            {selectedUser.approved === false ? (
                                                <Badge variant="warning" size="lg">
                                                    Pending Approval
                                                </Badge>
                                            ) : (
                                                <Badge variant="success" size="lg">
                                                    Approved
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Approval Action */}
                                    {selectedUser.approved === false && (
                                        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="font-serif font-medium text-amber-800 dark:text-amber-300 mb-1">
                                                        Account Pending Approval
                                                    </h4>
                                                    <p className="text-sm font-literary text-amber-700 dark:text-amber-400">
                                                        This user's account is waiting for admin approval. Review their information and approve to grant access.
                                                    </p>
                                                </div>
                                                <Button
                                                    onClick={() => handleApproveUser(selectedUser.User_ID)}
                                                    disabled={approvingUser === selectedUser.User_ID}
                                                    loading={approvingUser === selectedUser.User_ID}
                                                    variant="success"
                                                    icon={FiCheck}
                                                    className="ml-4"
                                                >
                                                    Approve User
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* User Details Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <FiMail className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                                <div>
                                                    <p className="text-sm font-serif text-primary-500 dark:text-gray-400">Email</p>
                                                    <p className="font-literary text-primary-900 dark:text-white">{selectedUser.Email_Address}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-success-50 dark:bg-success-900/20 p-4 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <FiPhone className="w-5 h-5 text-success-600 dark:text-success-400" />
                                                <div>
                                                    <p className="text-sm font-serif text-success-500 dark:text-gray-400">Phone</p>
                                                    <p className="font-literary text-success-900 dark:text-white">{selectedUser.Tel || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-warning-50 dark:bg-warning-900/20 p-4 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <FiCalendar className="w-5 h-5 text-warning-600 dark:text-warning-400" />
                                                <div>
                                                    <p className="text-sm font-serif text-warning-500 dark:text-gray-400">Last Login</p>
                                                    <p className="font-literary text-warning-900 dark:text-white">{formatDate(selectedUser.Last_Login)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Activity Controls */}
                                    <Card className="mt-4 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700">
                                        <Card.Content className="p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div>
                                                    <label className="block text-xs font-serif font-medium text-primary-700 dark:text-gray-300 mb-1">Date Range</label>
                                                    <select
                                                        value={dateRange}
                                                        onChange={(e) => setDateRange(e.target.value)}
                                                        className="w-full text-xs px-3 py-2 font-literary border border-primary-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-400/20 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-300"
                                                    >
                                                        <option value="7">Last 7 days</option>
                                                        <option value="30">Last 30 days</option>
                                                        <option value="90">Last 90 days</option>
                                                        <option value="365">Last year</option>
                                                        <option value="all">All time</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-serif font-medium text-primary-700 dark:text-gray-300 mb-1">Activity Type</label>
                                                    <select
                                                        value={activityFilter}
                                                        onChange={(e) => setActivityFilter(e.target.value)}
                                                        className="w-full text-xs px-3 py-2 font-literary border border-primary-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-400/20 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-300"
                                                    >
                                                        <option value="all">All Activities</option>
                                                        <option value="equipment">Equipment</option>
                                                        <option value="venue">Venue</option>
                                                        <option value="projects">Projects</option>
                                                        <option value="sig">SIG</option>
                                                        <option value="events">Events</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-serif font-medium text-primary-700 dark:text-gray-300 mb-1">View Mode</label>
                                                    <select
                                                        value={activityView}
                                                        onChange={(e) => setActivityView(e.target.value)}
                                                        className="w-full text-xs px-3 py-2 font-literary border border-primary-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-400/20 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-300"
                                                    >
                                                        <option value="summary">Summary</option>
                                                        <option value="timeline">Timeline</option>
                                                        <option value="analytics">Analytics</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => fetchUserActivity(selectedUser.User_ID)}
                                                variant="primary"
                                                size="sm"
                                                className="mt-3 w-full"
                                                icon={FiBarChart}
                                            >
                                                Refresh Activity Data
                                            </Button>
                                        </Card.Content>
                                    </Card>
                                </div>

                                {/* Activity Summary */}
                                {activityLoading ? (
                                    <div className="text-center py-4">
                                        <div className="animate-pulse">
                                            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
                                            <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
                                        </div>
                                        <div className="text-sm text-gray-500 mt-2">Loading activity...</div>
                                    </div>
                                ) : userActivity && Object.keys(userActivity).length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-semibold text-gray-900">
                                                {activityView === 'summary' && 'Activity Summary'}
                                                {activityView === 'timeline' && 'Activity Timeline'}
                                                {activityView === 'analytics' && 'Activity Analytics'}
                                            </h4>
                                            <span className="text-xs text-gray-500">
                                                {dateRange === 'all' ? 'All time' : `Last ${dateRange} days`}
                                            </span>
                                        </div>
                                        
                                        {/* Render different views based on activityView */}
                                        {activityView === 'analytics' ? (
                                            renderActivityAnalytics()
                                        ) : activityView === 'timeline' ? (
                                            renderActivityTimeline()
                                        ) : (
                                            <>
                                                {/* Quick Stats */}
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    <div className="bg-blue-50 p-3 rounded-lg">
                                                        <p className="text-sm text-blue-600">Equipment Bookings</p>
                                                        <p className="text-2xl font-bold text-blue-900">
                                                            {userActivity.equipmentBookings?.length || 0}
                                                        </p>
                                                    </div>
                                                    <div className="bg-green-50 p-3 rounded-lg">
                                                        <p className="text-sm text-green-600">Venue Bookings</p>
                                                        <p className="text-2xl font-bold text-green-900">
                                                            {userActivity.venueBookings?.length || 0}
                                                        </p>
                                                    </div>
                                                    <div className="bg-purple-50 p-3 rounded-lg">
                                                        <p className="text-sm text-purple-600">Projects</p>
                                                        <p className="text-2xl font-bold text-purple-900">
                                                            {userActivity.projects?.length || 0}
                                                        </p>
                                                    </div>
                                                    <div className="bg-yellow-50 p-3 rounded-lg">
                                                        <p className="text-sm text-yellow-600">SIG Memberships</p>
                                                        <p className="text-2xl font-bold text-yellow-900">
                                                            {userActivity.sigMemberships?.length || 0}
                                                        </p>
                                                    </div>
                                                    <div className="bg-indigo-50 p-3 rounded-lg">
                                                        <p className="text-sm text-indigo-600">Survey Responses</p>
                                                        <p className="text-2xl font-bold text-indigo-900">
                                                            {userActivity.surveys?.length || 0}
                                                        </p>
                                                    </div>
                                                    <div className="bg-orange-50 p-3 rounded-lg">
                                                        <p className="text-sm text-orange-600">Event Participation</p>
                                                        <p className="text-2xl font-bold text-orange-900">
                                                            {userActivity.events?.length || 0}
                                                        </p>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {/* Recent Activity - only show in summary view */}
                                        {activityView === 'summary' && (
                                            <>
                                                <div>
                                                    <h5 className="font-medium text-gray-900 mb-3">Recent Equipment Bookings</h5>
                                                    {userActivity.equipmentBookings?.slice(0, 3).map((booking, index) => (
                                                        <div key={index} className="border-l-4 border-info-400 dark:border-info-500 pl-3 py-2 mb-2">
                                                            <p className="text-sm font-medium">{booking.equipment_name}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {formatDate(booking.eqm_booking_date)} - {booking.status}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div>
                                                    <h5 className="font-medium text-gray-900 mb-3">Recent Venue Bookings</h5>
                                                    {userActivity.venueBookings?.slice(0, 3).map((booking, index) => (
                                                        <div key={index} className="border-l-4 border-success-400 dark:border-success-500 pl-3 py-2 mb-2">
                                                            <p className="text-sm font-medium">{booking.venue_name}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {formatDate(booking.booking_date)} - ${booking.total_pay}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}

                                        {/* Additional Activity Details - only show in summary view */}
                                        {activityView === 'summary' && (
                                            <>
                                                {/* Survey Activity */}
                                                {userActivity.surveys && userActivity.surveys.length > 0 && (
                                                    <div>
                                                        <h5 className="font-medium text-gray-900 mb-3">Recent Survey Responses</h5>
                                                        {userActivity.surveys.slice(0, 3).map((survey, index) => (
                                                            <div key={index} className="border-l-4 border-primary-400 dark:border-primary-500 pl-3 py-2 mb-2">
                                                                <p className="text-sm font-medium">Survey #{survey.session_id?.slice(-6) || 'Unknown'}</p>
                                                                <div className="flex justify-between items-center">
                                                                    <p className="text-xs text-gray-500">
                                                                        {survey.messageCount} messages - Rating: {survey.rating || 'N/A'}
                                                                    </p>
                                                                    {survey.feedback && (
                                                                        <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                                                                            Feedback Given
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Event Participation */}
                                                {userActivity.events && userActivity.events.length > 0 && (
                                                    <div>
                                                        <h5 className="font-medium text-gray-900 mb-3">Recent Event Participation</h5>
                                                        {userActivity.events.slice(0, 3).map((event, index) => (
                                                            <div key={index} className="border-l-4 border-warning-400 dark:border-warning-500 pl-3 py-2 mb-2">
                                                                <p className="text-sm font-medium">{event.activity_title || 'Event'}</p>
                                                                <p className="text-xs text-gray-500">
                                                                    {formatDate(event.activity_date)} - {event.status || 'Participated'}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Enhanced Project Activity */}
                                                {userActivity.projects && userActivity.projects.length > 0 && (
                                                    <div>
                                                        <h5 className="font-medium text-gray-900 mb-3">Project Involvement</h5>
                                                        {userActivity.projects.slice(0, 3).map((project, index) => (
                                                            <div key={index} className="border-l-4 border-secondary-400 dark:border-secondary-500 pl-3 py-2 mb-2">
                                                                <p className="text-sm font-medium">{project.name}</p>
                                                                <p className="text-xs text-gray-500">
                                                                    Role: {project.role} | Members: {project.memberCount}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    Status: {project.status} | Created: {formatDate(project.createdAt)}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Enhanced SIG Activity */}
                                                {userActivity.sigMemberships && userActivity.sigMemberships.length > 0 && (
                                                    <div>
                                                        <h5 className="font-medium text-gray-900 mb-3">Student Interest Groups</h5>
                                                        {userActivity.sigMemberships.slice(0, 3).map((sig, index) => (
                                                            <div key={index} className="border-l-4 border-warning-400 dark:border-warning-500 pl-3 py-2 mb-2">
                                                                <p className="text-sm font-medium">{sig.name}</p>
                                                                <p className="text-xs text-gray-500">
                                                                    Joined: {formatDate(sig.joinedAt)} | Members: {sig.memberCount}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    Status: {sig.status}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-gray-500">No activity data available</p>
                                    </div>
                                )}
                            </Card.Content>
                        ) : (
                                                                        <Card.Content className="p-8 text-center">
                                <div className="py-16">
                                    <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/20 rounded-xl flex items-center justify-center mx-auto mb-6">
                                        <FiUsers className="w-12 h-12 text-primary-300 dark:text-primary-600" />
                                    </div>
                                    <h3 className="text-xl font-serif font-semibold text-primary-900 dark:text-white mb-2">
                                        Select a User
                                    </h3>
                                    <p className="font-literary text-primary-600 dark:text-gray-400">
                                        Choose a user from the list to view their detailed profile and activity analytics
                                    </p>
                                </div>
                            </Card.Content>
                        )}
                    </Card>
                    </div>
                </div>
            </div>
        </PageTemplate>
    );
}

export default UserManage;