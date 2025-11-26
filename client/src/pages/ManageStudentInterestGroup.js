import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Badge, PageTemplate, Alert } from '../components/ui';
import { FiUsers, FiPlus, FiEdit3, FiTrash2, FiUserCheck, FiCalendar, FiInfo } from 'react-icons/fi';

function ManageStudentInterestGroup() {
    const { currentUser } = useAuth();
    const [sigs, setSigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingSig, setEditingSig] = useState(null);

    // SIG form state
    const [sigForm, setSigForm] = useState({
        sig_name: '',
        sig_abbrev: '',
        sig_desc: '',
        sig_status: 'recruiting'
    });

    const sigStatuses = [
        'recruiting',
        'active',
        'inactive'
    ];

    const statusColors = {
        'recruiting': 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200',
        'active': 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-200',
        'inactive': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };

    useEffect(() => {
        if (currentUser?.User_Role === 'ATL_ADMIN') {
            fetchSigs();
        }
    }, [currentUser]);

    const fetchSigs = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/student-interest-groups/admin', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setSigs(data);
            }
        } catch (error) {
            console.error('Error fetching SIGs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitSig = async (e) => {
        e.preventDefault();
        try {
            const method = editingSig ? 'PUT' : 'POST';
            const url = editingSig ? `/api/student-interest-groups/${editingSig._id}` : '/api/student-interest-groups';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(sigForm)
            });

            if (response.ok) {
                fetchSigs();
                resetForm();
                alert(editingSig ? 'Student Interest Group updated successfully' : 'Student Interest Group created successfully');
            } else {
                const error = await response.json();
                alert(`Error: ${error.message}`);
            }
        } catch (error) {
            console.error('Error saving SIG:', error);
            alert('Error saving Student Interest Group');
        }
    };

    const handleEditSig = (sig) => {
        setSigForm({
            sig_name: sig.sig_name || '',
            sig_abbrev: sig.sig_abbrev || '',
            sig_desc: sig.sig_desc || '',
            sig_status: sig.sig_status || 'recruiting'
        });
        setEditingSig(sig);
        setShowAddForm(true);
    };

    const handleDeleteSig = async (sigId) => {
        if (!window.confirm('Are you sure you want to delete this Student Interest Group? This action cannot be undone.')) return;

        try {
            const response = await fetch(`/api/student-interest-groups/${sigId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                fetchSigs();
                alert('Student Interest Group deleted successfully');
            } else {
                alert('Error deleting Student Interest Group');
            }
        } catch (error) {
            console.error('Error deleting SIG:', error);
            alert('Error deleting Student Interest Group');
        }
    };

    const handleRemoveMember = async (sigId, memberId) => {
        if (!window.confirm('Are you sure you want to remove this member from the Student Interest Group?')) return;

        try {
            const response = await fetch(`/api/student-interest-groups/${sigId}/members/${memberId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                fetchSigs();
                alert('Member removed successfully');
            } else {
                alert('Error removing member');
            }
        } catch (error) {
            console.error('Error removing member:', error);
            alert('Error removing member');
        }
    };

    const resetForm = () => {
        setSigForm({
            sig_name: '',
            sig_abbrev: '',
            sig_desc: '',
            sig_status: 'recruiting'
        });
        setEditingSig(null);
        setShowAddForm(false);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (currentUser?.User_Role !== 'ATL_ADMIN') {
        return (
            <PageTemplate
                title="Manage Student Interest Groups"
                description="Oversee and coordinate student interest groups"
            >
                <Alert variant="error">
                    Access denied. Admin privileges required.
                    <br />
                    <span className="text-sm">Current role: {currentUser?.User_Role || 'None'}</span>
                </Alert>
            </PageTemplate>
        );
    }

    if (loading) {
        return (
            <PageTemplate
                title="Manage Student Interest Groups"
                description="Oversee and coordinate student interest groups"
                loading={true}
            />
        );
    }

    return (
        <PageTemplate
            title="Manage Student Interest Groups"
            description="Oversee and coordinate student interest groups"
            icon="👥"
        >
            <div className="max-w-7xl mx-auto space-y-6">
                <Card>
                    <Card.Header>
                        <div className="flex justify-between items-center">
                            <div>
                                <Card.Title className="flex items-center font-serif">
                                    <FiUsers className="mr-2" />
                                    Student Interest Groups Management
                                </Card.Title>
                                <p className="font-literary text-primary-600 dark:text-gray-300 mt-1">
                                    Create and manage student communities and special interest groups
                                </p>
                            </div>
                            <Button
                                onClick={() => setShowAddForm(!showAddForm)}
                                variant={showAddForm ? "outline" : "primary"}
                                className="flex items-center gap-2"
                            >
                                <FiPlus className="w-4 h-4" />
                                {showAddForm ? 'Cancel' : 'Add Interest Group'}
                            </Button>
                        </div>
                    </Card.Header>

                    {/* Add/Edit SIG Form */}
                    {showAddForm && (
                        <Card.Content className="border-t border-gray-200 dark:border-gray-600">
                            <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <h3 className="text-lg font-serif font-semibold text-primary-900 dark:text-white mb-4 flex items-center">
                                    <FiEdit3 className="mr-2" />
                                    {editingSig ? 'Edit Student Interest Group' : 'Add New Student Interest Group'}
                                </h3>
                                <form onSubmit={handleSubmitSig} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Group Name
                                            </label>
                                            <input
                                                type="text"
                                                value={sigForm.sig_name}
                                                onChange={(e) => setSigForm({...sigForm, sig_name: e.target.value})}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                placeholder="e.g., Artificial Intelligence Interest Group"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Abbreviation
                                            </label>
                                            <input
                                                type="text"
                                                value={sigForm.sig_abbrev}
                                                onChange={(e) => setSigForm({...sigForm, sig_abbrev: e.target.value.toUpperCase()})}
                                                required
                                                maxLength="10"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="e.g., AIIG"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Status
                                            </label>
                                            <select
                                                value={sigForm.sig_status}
                                                onChange={(e) => setSigForm({...sigForm, sig_status: e.target.value})}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {sigStatuses.map(status => (
                                                    <option key={status} value={status}>
                                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            value={sigForm.sig_desc}
                                            onChange={(e) => setSigForm({...sigForm, sig_desc: e.target.value})}
                                            rows="4"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Describe the purpose, activities, and goals of this Student Interest Group..."
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            type="submit"
                                            variant="success"
                                            className="flex items-center gap-2"
                                        >
                                            <FiUsers className="w-4 h-4" />
                                            {editingSig ? 'Update' : 'Create'} Group
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={resetForm}
                                            variant="outline"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </Card.Content>
                    )}

                    {/* SIGs Table */}
                    <Card.Content className="p-0">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase">Group Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase">Abbreviation</th>
                                        <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase">Members</th>
                                        <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase">Created</th>
                                        <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-600">
                                    {sigs.map((sig) => (
                                        <tr key={sig._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-serif font-medium text-gray-900 dark:text-white">{sig.sig_name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant="secondary" size="sm" className="font-mono">
                                                    {sig.sig_abbrev}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-literary text-gray-900 dark:text-gray-200 max-w-xs">
                                                    {sig.sig_desc?.substring(0, 100)}
                                                    {sig.sig_desc?.length > 100 && '...'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                                <div className="flex items-center">
                                                    <Badge variant="primary" size="sm" className="mr-2">
                                                        <FiUsers className="w-3 h-3 mr-1" />
                                                        {sig.members?.length || 0}
                                                    </Badge>
                                                    {sig.members?.length > 0 && (
                                                        <details className="relative">
                                                            <summary className="cursor-pointer text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 text-xs">
                                                                View
                                                            </summary>
                                                            <div className="absolute top-6 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 z-10 min-w-48">
                                                                {sig.members.map((member) => (
                                                                    <div key={member.User_ID || member._id} className="flex justify-between items-center py-1">
                                                                        <span className="text-sm font-literary text-gray-900 dark:text-gray-200">
                                                                            {member.First_Name} {member.Last_Name}
                                                                            <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">({member.User_ID})</span>
                                                                        </span>
                                                                        <Button
                                                                            onClick={() => handleRemoveMember(sig._id, member.User_ID || member._id)}
                                                                            variant="danger"
                                                                            size="sm"
                                                                            className="ml-2 text-xs"
                                                                        >
                                                                            Remove
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </details>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge 
                                                    variant={
                                                        sig.sig_status === 'active' ? 'success' :
                                                        sig.sig_status === 'recruiting' ? 'primary' : 'secondary'
                                                    }
                                                    size="sm"
                                                >
                                                    {sig.sig_status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-literary text-gray-900 dark:text-gray-200">
                                                <div className="flex items-center">
                                                    <FiCalendar className="w-3 h-3 mr-1" />
                                                    {formatDate(sig.createdAt)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() => handleEditSig(sig)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex items-center gap-1"
                                                    >
                                                        <FiEdit3 className="w-3 h-3" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleDeleteSig(sig._id)}
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
                        
                        {sigs.length === 0 && (
                            <div className="text-center py-8">
                                <div className="text-gray-400 dark:text-gray-500 mb-4">
                                    <FiUsers className="mx-auto h-12 w-12" />
                                </div>
                                <p className="font-literary text-gray-500 dark:text-gray-400">No Student Interest Groups found.</p>
                                <p className="font-literary text-gray-400 dark:text-gray-500 text-sm mt-2">Create your first group to get started!</p>
                            </div>
                        )}
                    </Card.Content>
                </Card>

                {/* Info Section */}
                <Card>
                    <Card.Header>
                        <Card.Title className="flex items-center font-serif">
                            <FiInfo className="mr-2" />
                            Managing Student Interest Groups
                        </Card.Title>
                        <p className="font-literary text-primary-600 dark:text-gray-300 mt-1">
                            Guidelines and best practices for group management
                        </p>
                    </Card.Header>
                    <Card.Content className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <h4 className="font-serif font-medium mb-3 text-primary-900 dark:text-white">Status Guide</h4>
                                <ul className="space-y-2 font-literary text-sm">
                                    <li className="flex items-center">
                                        <Badge variant="primary" size="sm" className="mr-2">recruiting</Badge>
                                        <span className="text-gray-700 dark:text-gray-300">Open for new members</span>
                                    </li>
                                    <li className="flex items-center">
                                        <Badge variant="success" size="sm" className="mr-2">active</Badge>
                                        <span className="text-gray-700 dark:text-gray-300">Currently running activities</span>
                                    </li>
                                    <li className="flex items-center">
                                        <Badge variant="secondary" size="sm" className="mr-2">inactive</Badge>
                                        <span className="text-gray-700 dark:text-gray-300">Temporarily paused</span>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-serif font-medium mb-3 text-primary-900 dark:text-white">Member Management</h4>
                                <p className="font-literary text-sm text-gray-700 dark:text-gray-300">
                                    Click "View" next to member count to see and manage individual members. You can remove members directly from the dropdown.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-serif font-medium mb-3 text-primary-900 dark:text-white">Best Practices</h4>
                                <p className="font-literary text-sm text-gray-700 dark:text-gray-300">
                                    Use clear, descriptive names and keep abbreviations short and memorable. Regular status updates help maintain engagement.
                                </p>
                            </div>
                        </div>
                    </Card.Content>
                </Card>
            </div>
        </PageTemplate>
    );
}

export default ManageStudentInterestGroup;