import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Badge, Alert, LoadingSpinner } from '../components/ui';
import { FiCheck, FiX, FiUser, FiMail, FiPhone, FiCalendar, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

function ManageAccountApprovals() {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [processingId, setProcessingId] = useState(null);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user is admin
        if (currentUser?.User_Role !== 'ATL_ADMIN') {
            navigate('/');
            return;
        }
        fetchPendingUsers();
    }, [currentUser, navigate]);

    const fetchPendingUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/users/pending-approvals', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                setPendingUsers(data.users || []);
            } else {
                setError(data.message || 'Failed to fetch pending users');
            }
        } catch (err) {
            console.error('Error fetching pending users:', err);
            setError('An error occurred while fetching pending users');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId) => {
        if (!window.confirm('Are you sure you want to approve this user account?')) {
            return;
        }

        setProcessingId(userId);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/users/${userId}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(`Account approved successfully for ${data.user?.First_Name} ${data.user?.Last_Name}`);
                // Refresh the list
                fetchPendingUsers();
            } else {
                setError(data.message || 'Failed to approve account');
            }
        } catch (err) {
            console.error('Error approving user:', err);
            setError('An error occurred while approving the account');
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getRoleBadgeColor = (role) => {
        if (role?.includes('Staff')) return 'primary';
        if (role?.includes('Student')) return 'success';
        if (role?.includes('ATL_Member')) return 'warning';
        return 'default';
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <Card.Content className="flex items-center justify-center h-64">
                        <LoadingSpinner size="lg" text="Loading pending accounts..." />
                    </Card.Content>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-elegant text-primary-900 dark:text-white mb-2">
                    Account Approval Management
                </h1>
                <p className="font-literary text-primary-600 dark:text-gray-300">
                    Review and approve pending user registration applications
                </p>
            </div>

            {/* Alerts */}
            {error && (
                <div className="mb-6">
                    <Alert type="error" onClose={() => setError('')}>
                        {error}
                    </Alert>
                </div>
            )}

            {success && (
                <div className="mb-6">
                    <Alert type="success" onClose={() => setSuccess('')}>
                        {success}
                    </Alert>
                </div>
            )}

            {/* Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <Card.Content className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-serif text-primary-500 dark:text-gray-400 mb-1">
                                    Pending Approvals
                                </p>
                                <p className="text-3xl font-elegant text-primary-900 dark:text-white">
                                    {pendingUsers.length}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/20">
                                <FiAlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                    </Card.Content>
                </Card>
            </div>

            {/* Pending Users List */}
            {pendingUsers.length === 0 ? (
                <Card>
                    <Card.Content className="p-12 text-center">
                        <FiCheckCircle className="w-16 h-16 text-success-500 mx-auto mb-4" />
                        <h3 className="text-xl font-serif text-primary-900 dark:text-white mb-2">
                            All Caught Up!
                        </h3>
                        <p className="font-literary text-primary-600 dark:text-gray-300">
                            There are no pending account approvals at this time.
                        </p>
                    </Card.Content>
                </Card>
            ) : (
                <div className="space-y-6">
                    {pendingUsers.map((user) => (
                        <Card key={user.User_ID} hover={false}>
                            <Card.Content className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    {/* User Info */}
                                    <div className="flex-1">
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/20">
                                                <FiUser className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-serif font-medium text-primary-900 dark:text-white">
                                                        {user.Title && `${user.Title} `}{user.First_Name} {user.Last_Name}
                                                    </h3>
                                                    <Badge variant={getRoleBadgeColor(user.User_Role)}>
                                                        {user.User_Role?.replace(/_/g, ' ')}
                                                    </Badge>
                                                    {user.ATL_Member && (
                                                        <Badge variant="success">ATL Member</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm font-literary text-primary-600 dark:text-gray-400 mb-1">
                                                    Username: <strong>{user.User_ID}</strong>
                                                </p>
                                                {user.Nickname && (
                                                    <p className="text-sm font-literary text-primary-600 dark:text-gray-400">
                                                        Nickname: {user.Nickname}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Contact Details */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                            <div className="flex items-center gap-2 text-sm font-literary text-primary-700 dark:text-gray-300">
                                                <FiMail className="w-4 h-4 text-primary-500" />
                                                <span>{user.Email_Address}</span>
                                            </div>
                                            {user.Tel && (
                                                <div className="flex items-center gap-2 text-sm font-literary text-primary-700 dark:text-gray-300">
                                                    <FiPhone className="w-4 h-4 text-primary-500" />
                                                    <span>{user.Tel}</span>
                                                </div>
                                            )}
                                            {user.UID && (
                                                <div className="flex items-center gap-2 text-sm font-literary text-primary-700 dark:text-gray-300">
                                                    <FiUser className="w-4 h-4 text-primary-500" />
                                                    <span>HKU UID: {user.UID}</span>
                                                </div>
                                            )}
                                            {user.Member_ID && (
                                                <div className="flex items-center gap-2 text-sm font-literary text-primary-700 dark:text-gray-300">
                                                    <FiUser className="w-4 h-4 text-primary-500" />
                                                    <span>Member ID: {user.Member_ID}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Registration Date */}
                                        <div className="flex items-center gap-2 text-xs font-literary text-primary-500 dark:text-gray-400">
                                            <FiCalendar className="w-3 h-3" />
                                            <span>Registered: {formatDate(user.createdAt)}</span>
                                        </div>

                                        {/* Marketing Preferences */}
                                        {(user.direct_marketing || user.email_list) && (
                                            <div className="mt-3 pt-3 border-t border-primary-200 dark:border-gray-700">
                                                <p className="text-xs font-serif text-primary-500 dark:text-gray-400 mb-1">
                                                    Marketing Preferences:
                                                </p>
                                                <div className="flex gap-2">
                                                    {user.direct_marketing && (
                                                        <Badge variant="default" size="sm">Direct Marketing</Badge>
                                                    )}
                                                    {user.email_list && (
                                                        <Badge variant="default" size="sm">Email List</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex md:flex-col gap-3">
                                        <Button
                                            variant="success"
                                            icon={FiCheck}
                                            onClick={() => handleApprove(user.User_ID)}
                                            disabled={processingId === user.User_ID}
                                            loading={processingId === user.User_ID}
                                            className="flex-1 md:w-32"
                                        >
                                            Approve
                                        </Button>
                                    </div>
                                </div>
                            </Card.Content>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ManageAccountApprovals;

