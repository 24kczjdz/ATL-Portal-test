import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Badge, PageTemplate, LoadingSpinner, Alert } from '../components/ui';
import { FiUsers, FiUser, FiMail, FiPhone, FiEye, FiTrash2, FiDownload, FiRefreshCw, FiFilter, FiX } from 'react-icons/fi';

function USER() {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [filters, setFilters] = useState({
        userRole: '',
        dateFrom: '',
        dateTo: '',
        marketingOnly: false
    });

    // Check if user is staff
    const staffRoles = ['ATL_ADMIN', 'ATL_Member_HKU_Staff', 'Non_ATL_HKU_Staff'];
    const isStaff = staffRoles.includes(currentUser?.User_Role);

    useEffect(() => {
        if (isStaff) {
            fetchUsers();
        }
    }, [isStaff]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('/api/users', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data.users || []);
                setStats(data.stats || {});
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to fetch users');
            }
        } catch (err) {
            setError('Network error occurred while fetching users');
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setUsers(users.filter(user => user.User_ID !== userId));
                alert('User deleted successfully');
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Failed to delete user');
            }
        } catch (err) {
            alert('Network error occurred while deleting user');
            console.error('Error deleting user:', err);
        }
    };

    const viewUserDetails = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/users/${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSelectedUser(data.user);
                setShowDetails(true);
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Failed to fetch user details');
            }
        } catch (err) {
            alert('Network error occurred while fetching user details');
            console.error('Error fetching user details:', err);
        }
    };

    const exportUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/users/export', {
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
                a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Failed to export users');
            }
        } catch (err) {
            alert('Network error occurred while exporting users');
            console.error('Error exporting users:', err);
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

    const getUserRoleBadge = (userRole) => {
        const roleColors = {
            Sta: 'bg-blue-100 text-blue-800',
            Stu: 'bg-green-100 text-green-800',
            Mem: 'bg-purple-100 text-purple-800'
        };
        
        const roleNames = {
            Sta: 'Staff',
            Stu: 'Student',
            Mem: 'Member'
        };
        
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[userRole] || 'bg-gray-100 text-gray-800'}`}>
                {roleNames[userRole] || userRole || 'N/A'}
            </span>
        );
    };

    const getUserDisplayName = (user) => {
        if (user.Last_Name && user.First_Name) {
            return `${user.Last_Name} ${user.First_Name}`;
        } else if (user.Nickname) {
            return user.Nickname;
        }
        return 'Unknown';
    };

    if (!isStaff) {
        return (
            <PageTemplate
                title="User Management"
                description="Manage system users and members"
            >
                <Alert variant="error">
                    Access denied. You need staff privileges to access user management.
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
                description="Manage system users and members"
                loading={true}
            />
        );
    }

    return (
        <PageTemplate
            title="User Management"
            description="Manage system users and members"
            icon="👥"
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
                                    <FiUsers className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                </div>
                                <h3 className="text-lg font-serif font-medium text-primary-900 dark:text-white mb-2">Total Users</h3>
                                <p className="text-3xl font-elegant font-bold text-primary-600 dark:text-primary-400">{stats.totalUsers || 0}</p>
                            </Card.Content>
                        </Card>
                        <Card hover>
                            <Card.Content className="p-6 text-center">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <FiUser className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-lg font-serif font-medium text-primary-900 dark:text-white mb-2">Staff</h3>
                                <p className="text-3xl font-elegant font-bold text-green-600 dark:text-green-400">{stats.staffUsers || 0}</p>
                            </Card.Content>
                        </Card>
                        <Card hover>
                            <Card.Content className="p-6 text-center">
                                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <FiUser className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <h3 className="text-lg font-serif font-medium text-primary-900 dark:text-white mb-2">Students</h3>
                                <p className="text-3xl font-elegant font-bold text-yellow-600 dark:text-yellow-400">{stats.studentUsers || 0}</p>
                            </Card.Content>
                        </Card>
                        <Card hover>
                            <Card.Content className="p-6 text-center">
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <FiUsers className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-lg font-serif font-medium text-primary-900 dark:text-white mb-2">Members</h3>
                                <p className="text-3xl font-elegant font-bold text-purple-600 dark:text-purple-400">{stats.memberUsers || 0}</p>
                            </Card.Content>
                        </Card>
                    </div>
                )}

                {/* Controls */}
                <Card>
                    <Card.Header>
                        <Card.Title className="flex items-center font-serif">
                            <FiFilter className="mr-2" />
                            User Filters & Controls
                        </Card.Title>
                        <p className="font-literary text-primary-600 dark:text-gray-300 mt-1">
                            Filter users and export data
                        </p>
                    </Card.Header>
                    <Card.Content className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Filter by Role
                                </label>
                                <select
                                    value={filters.userRole}
                                    onChange={(e) => setFilters({...filters, userRole: e.target.value})}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="">All Roles</option>
                                    <option value="Sta">Staff</option>
                                    <option value="Stu">Student</option>
                                    <option value="Mem">Member</option>
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
                                        id="marketingOnly"
                                        checked={filters.marketingOnly}
                                        onChange={(e) => setFilters({...filters, marketingOnly: e.target.checked})}
                                        className="mr-2 rounded text-primary-600 focus:ring-primary-500"
                                    />
                                    <label htmlFor="marketingOnly" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Marketing Opted-in Only
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button
                                onClick={fetchUsers}
                                variant="primary"
                                className="flex items-center gap-2"
                            >
                                <FiRefreshCw className="w-4 h-4" />
                                Refresh
                            </Button>
                            <Button
                                onClick={exportUsers}
                                variant="success"
                                className="flex items-center gap-2"
                            >
                                <FiDownload className="w-4 h-4" />
                                Export CSV
                            </Button>
                        </div>
                    </Card.Content>
                </Card>

                {/* Users Table */}
                <Card>
                    <Card.Header>
                        <div className="flex items-center justify-between">
                            <Card.Title className="flex items-center font-serif">
                                <FiUsers className="mr-2" />
                                Users ({users.length})
                            </Card.Title>
                            <Badge variant="primary" size="lg">
                                {users.length} Total
                            </Badge>
                        </div>
                    </Card.Header>
                    
                    {users.length === 0 ? (
                        <Card.Content className="p-6 text-center">
                            <p className="font-literary text-gray-500 dark:text-gray-400">No users found</p>
                        </Card.Content>
                    ) : (
                        <Card.Content className="p-0">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                User ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Email
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Role
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
                                        {users.map((user) => (
                                            <tr key={user.User_ID} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 dark:text-gray-400">
                                                    {user.User_ID}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-serif font-medium text-gray-900 dark:text-white">
                                                        {getUserDisplayName(user)}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        {user.Title && (
                                                            <Badge variant="secondary" size="sm">
                                                                {user.Title}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-literary text-gray-500 dark:text-gray-400">
                                                    <div className="flex items-center">
                                                        <FiMail className="w-3 h-3 mr-1" />
                                                        {user.Email_Address || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getUserRoleBadge(user.User_Role)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-literary text-gray-500 dark:text-gray-400">
                                                    {formatDate(user.createdAt)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => viewUserDetails(user.User_ID)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex items-center gap-1"
                                                        >
                                                            <FiEye className="w-3 h-3" />
                                                            View
                                                        </Button>
                                                        <Button
                                                            onClick={() => deleteUser(user.User_ID)}
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

                {/* User Details Modal */}
                {showDetails && selectedUser && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border border-primary-200 dark:border-gray-600 w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
                            <div className="mt-3">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-primary-900 dark:text-white">User Details</h3>
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
                                        <h4 className="font-medium text-gray-900">Basic Information</h4>
                                        <p className="text-sm text-gray-600">ID: {selectedUser.User_ID}</p>
                                        <p className="text-sm text-gray-600">Name: {getUserDisplayName(selectedUser)}</p>
                                        <p className="text-sm text-gray-600">First Name: {selectedUser.First_Name || 'N/A'}</p>
                                        <p className="text-sm text-gray-600">Last Name: {selectedUser.Last_Name || 'N/A'}</p>
                                        <p className="text-sm text-gray-600">Nickname: {selectedUser.Nickname || 'N/A'}</p>
                                        <p className="text-sm text-gray-600">Title: {selectedUser.Title || 'N/A'}</p>
                                        <p className="text-sm text-gray-600">Gender: {selectedUser.Gender || 'N/A'}</p>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-medium text-gray-900">Contact Information</h4>
                                        <p className="text-sm text-gray-600">Email: {selectedUser.Email_Address || 'N/A'}</p>
                                        <p className="text-sm text-gray-600">Phone: {selectedUser.Tel || 'N/A'}</p>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-medium text-gray-900">System Information</h4>
                                        <p className="text-sm text-gray-600">Role: {getUserRoleBadge(selectedUser.User_Role)}</p>
                                        <p className="text-sm text-gray-600">Card ID: {selectedUser.card_id || 'N/A'}</p>
                                        <p className="text-sm text-gray-600">
                                            Direct Marketing: {selectedUser.direct_marketing ? 
                                                <span className="text-green-600">Yes</span> : 
                                                <span className="text-red-600">No</span>
                                            }
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Email List: {selectedUser.email_list ? 
                                                <span className="text-green-600">Yes</span> : 
                                                <span className="text-red-600">No</span>
                                            }
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-medium text-gray-900">Timestamps</h4>
                                        <p className="text-sm text-gray-600">Created: {formatDate(selectedUser.createdAt)}</p>
                                        <p className="text-sm text-gray-600">Last Login: {formatDate(selectedUser.lastLogin)}</p>
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

export default USER;