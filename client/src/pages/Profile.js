import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Input, PageTemplate, Alert, Badge } from '../components/ui';
import { FiUser, FiEdit3, FiSave, FiX, FiMail, FiPhone, FiTag } from 'react-icons/fi';

function Profile() {
    const navigate = useNavigate();
    const { isAuthenticated, currentUser } = useAuth();
    const [userData, setUserData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadUserData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (!currentUser) {
                console.log('No current user found, redirecting to login');
                navigate('/login');
                return;
            }

            // Fetch user profile data from the dedicated profile endpoint
            console.log('Attempting to fetch profile data for ID:', currentUser.User_ID);
            const response = await fetch('/api/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const result = data.user;
                console.log('Raw result from profile API:', result);

                if (result) {
                    // Ensure all fields are present with default values if missing
                    const completeUserData = {
                        User_ID: result.User_ID || currentUser.User_ID,
                        First_Name: result.First_Name || currentUser.First_Name || '',
                        Last_Name: result.Last_Name || currentUser.Last_Name || '',
                        Nickname: result.Nickname || currentUser.Nickname || '',
                        Title: result.Title || currentUser.Title || '',
                        Gender: result.Gender || currentUser.Gender || '',
                        Email_Address: result.Email_Address || currentUser.Email_Address || '',
                        Tel: result.Tel || currentUser.Tel || '',
                        User_Role: result.User_Role || currentUser.User_Role || 'Non_ATL_General',
                        ATL_Member: result.ATL_Member || currentUser.ATL_Member || false,
                        Member_ID: result.Member_ID || currentUser.Member_ID || '',
                        UID: result.UID || currentUser.UID || '',
                        direct_marketing: result.direct_marketing || currentUser.direct_marketing || false,
                        email_list: result.email_list || currentUser.email_list || false,
                        card_id: result.card_id || currentUser.card_id || '',
                        createdAt: result.createdAt || currentUser.createdAt || new Date().toISOString(),
                        lastLogin: result.lastLogin || currentUser.lastLogin || new Date().toISOString()
                    };

                    console.log('Complete user data to be set:', completeUserData);
                    setUserData(completeUserData);
                    setFormData(completeUserData);
                } else {
                    console.log('No data returned from profile API, using currentUser data');
                    setUserData(currentUser);
                    setFormData(currentUser);
                }
            } else {
                console.log('Profile API request failed, using currentUser data');
                setUserData(currentUser);
                setFormData(currentUser);
            }
        } catch (err) {
            console.error('Error in loadUserData:', err);
            setError('Failed to load user data');
            // Fallback to currentUser data
            setUserData(currentUser);
            setFormData(currentUser);
        } finally {
            setLoading(false);
        }
    }, [currentUser, navigate]);

    useEffect(() => {
        if (!isAuthenticated || !currentUser) {
            navigate('/login');
            return;
        }
        loadUserData();
    }, [isAuthenticated, currentUser, loadUserData, navigate]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('Saving form data:', formData);
            
            // Use the dedicated profile update endpoint
            const response = await fetch(`/api/user/${formData.User_ID}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Profile update response:', data);
                
                // Update local state with the response data
                setUserData(data.user);
                setFormData(data.user);
                setIsEditing(false);
                
                // Update localStorage with new user data
                const updatedUser = { ...currentUser, ...data.user };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                console.log('Successfully saved and updated localStorage');
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to save changes');
            }
        } catch (err) {
            console.error('Error in handleSave:', err);
            setError('Failed to save changes');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <PageTemplate
                title="Profile"
                description="Manage your account information"
                loading={true}
            />
        );
    }

    if (!userData) {
        return (
            <PageTemplate
                title="Profile"
                description="Manage your account information"
            >
                <Alert variant="error">
                    User data not found. Please try logging in again.
                </Alert>
            </PageTemplate>
        );
    }

    console.log('Rendering with userData:', userData); // Debug log

    return (
        <PageTemplate
            title="Profile"
            description="Manage your account information"
            icon="👤"
        >
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Profile Header */}
                <Card>
                    <Card.Header>
                        <div className="flex justify-between items-center">
                            <div>
                                <Card.Title className="text-2xl font-serif flex items-center">
                                    <FiUser className="mr-2" />
                                    Profile Information
                                </Card.Title>
                                <p className="font-literary text-primary-600 dark:text-gray-300 mt-1">
                                    {userData.First_Name} {userData.Last_Name} 
                                    {userData.User_Role && (
                                        <Badge variant="primary" className="ml-2">
                                            {userData.User_Role.replace(/_/g, ' ')}
                                        </Badge>
                                    )}
                                </p>
                            </div>
                            <Button
                                onClick={() => setIsEditing(!isEditing)}
                                variant={isEditing ? "secondary" : "primary"}
                                icon={isEditing ? FiX : FiEdit3}
                            >
                                {isEditing ? 'Cancel' : 'Edit Profile'}
                            </Button>
                        </div>
                    </Card.Header>
                    <Card.Content>
                        {error && (
                            <Alert variant="error" className="mb-6">
                                {error}
                            </Alert>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-serif font-medium text-primary-900 dark:text-white mb-4 flex items-center">
                                    <FiUser className="mr-2" />
                                    Basic Information
                                </h3>
                                {isEditing ? (
                                    <Input
                                        label="First Name"
                                        name="First_Name"
                                        value={formData.First_Name}
                                        onChange={(e) => handleInputChange(e)}
                                        icon={FiUser}
                                    />
                                ) : (
                                    <div>
                                        <label className="block text-sm font-serif font-medium text-primary-700 dark:text-gray-300 mb-2">First Name</label>
                                        <div className="font-literary text-primary-900 dark:text-white">{userData.First_Name || 'Not set'}</div>
                                    </div>
                                )}

                                {isEditing ? (
                                    <Input
                                        label="Last Name"
                                        name="Last_Name"
                                        value={formData.Last_Name}
                                        onChange={(e) => handleInputChange(e)}
                                        icon={FiUser}
                                    />
                                ) : (
                                    <div>
                                        <label className="block text-sm font-serif font-medium text-primary-700 dark:text-gray-300 mb-2">Last Name</label>
                                        <div className="font-literary text-primary-900 dark:text-white">{userData.Last_Name || 'Not set'}</div>
                                    </div>
                                )}

                                {isEditing ? (
                                    <Input
                                        label="Nickname"
                                        name="Nickname"
                                        value={formData.Nickname}
                                        onChange={(e) => handleInputChange(e)}
                                        icon={FiTag}
                                    />
                                ) : (
                                    <div>
                                        <label className="block text-sm font-serif font-medium text-primary-700 dark:text-gray-300 mb-2">Nickname</label>
                                        <div className="font-literary text-primary-900 dark:text-white">{userData.Nickname || 'Not set'}</div>
                                    </div>
                                )}

                                {isEditing ? (
                                    <Input
                                        label="Title"
                                        name="Title"
                                        value={formData.Title}
                                        onChange={(e) => handleInputChange(e)}
                                        placeholder="e.g. Dr., Prof., Mr., Ms."
                                    />
                                ) : (
                                    <div>
                                        <label className="block text-sm font-serif font-medium text-primary-700 dark:text-gray-300 mb-2">Title</label>
                                        <div className="font-literary text-primary-900 dark:text-white">{userData.Title || 'Not set'}</div>
                                    </div>
                                )}
                            </div>

                            {/* Contact Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-serif font-medium text-primary-900 dark:text-white mb-4 flex items-center">
                                    <FiMail className="mr-2" />
                                    Contact Information
                                </h3>
                                {isEditing ? (
                                    <Input
                                        label="Email Address"
                                        type="email"
                                        name="Email_Address"
                                        value={formData.Email_Address}
                                        onChange={(e) => handleInputChange(e)}
                                        icon={FiMail}
                                    />
                                ) : (
                                    <div>
                                        <label className="block text-sm font-serif font-medium text-primary-700 dark:text-gray-300 mb-2">Email Address</label>
                                        <div className="font-literary text-primary-900 dark:text-white">{userData.Email_Address || 'Not set'}</div>
                                    </div>
                                )}

                                {isEditing ? (
                                    <Input
                                        label="Phone Number"
                                        type="tel"
                                        name="Tel"
                                        value={formData.Tel}
                                        onChange={(e) => handleInputChange(e)}
                                        icon={FiPhone}
                                    />
                                ) : (
                                    <div>
                                        <label className="block text-sm font-serif font-medium text-primary-700 dark:text-gray-300 mb-2">Phone Number</label>
                                        <div className="font-literary text-primary-900 dark:text-white">{userData.Tel || 'Not set'}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            <div className="space-y-4">
                                <h3 className="text-lg font-serif font-medium text-primary-900 dark:text-white mb-4 flex items-center">
                                    <FiTag className="mr-2" />
                                    Additional Information
                                </h3>
                                {isEditing ? (
                                    <div>
                                        <label className="block text-sm font-serif font-medium text-primary-700 dark:text-gray-300 mb-2">Gender</label>
                                        <select
                                            name="Gender"
                                            value={formData.Gender || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 font-literary border border-primary-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-primary-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-primary-500/20 dark:focus:ring-primary-400/20 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-300"
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-serif font-medium text-primary-700 dark:text-gray-300 mb-2">Gender</label>
                                        <div className="font-literary text-primary-900 dark:text-white">{userData.Gender || 'Not set'}</div>
                                    </div>
                                )}

                                {isEditing ? (
                                    <Input
                                        label="Card ID"
                                        name="card_id"
                                        value={formData.card_id || ''}
                                        onChange={handleInputChange}
                                        placeholder="Card identification number"
                                    />
                                ) : (
                                    <div>
                                        <label className="block text-sm font-serif font-medium text-primary-700 dark:text-gray-300 mb-2">Card ID</label>
                                        <div className="font-literary text-primary-900 dark:text-white">{userData.card_id || 'Not set'}</div>
                                    </div>
                                )}

                                {isEditing ? (
                                    <Input
                                        label="Member ID"
                                        name="Member_ID"
                                        value={formData.Member_ID || ''}
                                        onChange={handleInputChange}
                                        placeholder="Membership identification"
                                    />
                                ) : (
                                    <div>
                                        <label className="block text-sm font-serif font-medium text-primary-700 dark:text-gray-300 mb-2">Member ID</label>
                                        <div className="font-literary text-primary-900 dark:text-white">{userData.Member_ID || 'Not set'}</div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-serif font-medium text-primary-900 dark:text-white mb-4">Preferences</h3>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            name="ATL_Member"
                                            checked={formData.ATL_Member || false}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                        />
                                        <label className="text-sm font-serif font-medium text-primary-700 dark:text-gray-300">
                                            ATL Member
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            name="direct_marketing"
                                            checked={formData.direct_marketing || false}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                        />
                                        <label className="text-sm font-serif font-medium text-primary-700 dark:text-gray-300">
                                            Direct Marketing Communications
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            name="email_list"
                                            checked={formData.email_list || false}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                        />
                                        <label className="text-sm font-serif font-medium text-primary-700 dark:text-gray-300">
                                            Subscribe to Email Lists
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isEditing && (
                            <Card.Footer className="pt-6">
                                <div className="flex justify-end">
                                    <Button
                                        onClick={handleSave}
                                        variant="success"
                                        icon={FiSave}
                                        loading={loading}
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            </Card.Footer>
                        )}
                    </Card.Content>
                </Card>
            </div>
        </PageTemplate>
    );
}

export default Profile; 