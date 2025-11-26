import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Badge, PageTemplate, Alert } from '../components/ui';
import { FiFolder, FiPlus, FiEdit3, FiTrash2, FiUsers, FiCalendar, FiActivity } from 'react-icons/fi';

function ManageProjects() {
    const { currentUser } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingProject, setEditingProject] = useState(null);

    // Project form state
    const [projectForm, setProjectForm] = useState({
        proj_name: '',
        proj_type: '',
        proj_desc: '',
        proj_start_date: '',
        proj_end_date: '',
        proj_status: 'planning',
        project_leader: ''
    });

    const projectTypes = [
        'Research',
        'Development', 
        'Art Installation',
        'Workshop',
        'Exhibition',
        'Community Outreach',
        'Other'
    ];

    const projectStatuses = [
        'planning',
        'active',
        'completed',
        'cancelled'
    ];

    const statusColors = {
        'planning': 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-200',
        'active': 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-200',
        'completed': 'bg-primary-100 text-primary-800 dark:bg-gray-700 dark:text-gray-200',
        'cancelled': 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-200'
    };

    useEffect(() => {
        if (currentUser?.User_Role === 'ATL_ADMIN') {
            fetchProjects();
        }
    }, [currentUser]);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/projects/admin', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setProjects(data);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitProject = async (e) => {
        e.preventDefault();
        try {
            const method = editingProject ? 'PUT' : 'POST';
            const url = editingProject ? `/api/projects/${editingProject._id}` : '/api/projects/admin';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(projectForm)
            });

            if (response.ok) {
                fetchProjects();
                resetForm();
                alert(editingProject ? 'Project updated successfully' : 'Project created successfully');
            } else {
                const error = await response.json();
                alert(`Error: ${error.message}`);
            }
        } catch (error) {
            console.error('Error saving project:', error);
            alert('Error saving project');
        }
    };

    const handleEditProject = (project) => {
        setProjectForm({
            proj_name: project.proj_name || '',
            proj_type: project.proj_type || '',
            proj_desc: project.proj_desc || '',
            proj_start_date: project.proj_start_date ? project.proj_start_date.split('T')[0] : '',
            proj_end_date: project.proj_end_date ? project.proj_end_date.split('T')[0] : '',
            proj_status: project.proj_status || 'planning',
            project_leader: project.project_leader || ''
        });
        setEditingProject(project);
        setShowAddForm(true);
    };

    const handleDeleteProject = async (projectId) => {
        if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;

        try {
            const response = await fetch(`/api/projects/${projectId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                fetchProjects();
                alert('Project deleted successfully');
            } else {
                alert('Error deleting project');
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            alert('Error deleting project');
        }
    };

    const handleRemoveMember = async (projectId, memberId) => {
        if (!window.confirm('Are you sure you want to remove this member from the project?')) return;

        try {
            const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                fetchProjects();
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
        setProjectForm({
            proj_name: '',
            proj_type: '',
            proj_desc: '',
            proj_start_date: '',
            proj_end_date: '',
            proj_status: 'planning',
            project_leader: ''
        });
        setEditingProject(null);
        setShowAddForm(false);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (currentUser?.User_Role !== 'ATL_ADMIN') {
        return (
            <PageTemplate
                title="Manage Projects"
                description="Project management and administration"
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
                title="Manage Projects"
                description="Project management and administration"
                loading={true}
            />
        );
    }

    return (
        <PageTemplate
            title="Manage Projects"
            description="Project management and administration"
            icon="📁"
        >
            <div className="max-w-7xl mx-auto space-y-6">
                <Card>
                    <Card.Header>
                        <div className="flex justify-between items-center">
                            <div>
                                <Card.Title className="flex items-center font-serif">
                                    <FiFolder className="mr-2" />
                                    Project Management
                                </Card.Title>
                                <p className="font-literary text-primary-600 dark:text-gray-300 mt-1">
                                    Comprehensive project administration and oversight
                                </p>
                            </div>
                            <Button
                                onClick={() => setShowAddForm(!showAddForm)}
                                variant={showAddForm ? "outline" : "primary"}
                                className="flex items-center gap-2"
                            >
                                <FiPlus className="w-4 h-4" />
                                {showAddForm ? 'Cancel' : 'Add Project'}
                            </Button>
                        </div>
                    </Card.Header>

                    {/* Add/Edit Project Form */}
                    {showAddForm && (
                        <Card.Content className="border-t border-gray-200 dark:border-gray-600">
                            <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <h3 className="text-lg font-serif font-semibold text-primary-900 dark:text-white mb-4 flex items-center">
                                    <FiEdit3 className="mr-2" />
                                    {editingProject ? 'Edit Project' : 'Add New Project'}
                                </h3>
                                <form onSubmit={handleSubmitProject} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Project Name
                                            </label>
                                            <input
                                                type="text"
                                                value={projectForm.proj_name}
                                                onChange={(e) => setProjectForm({...projectForm, proj_name: e.target.value})}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Project Type
                                            </label>
                                            <select
                                                value={projectForm.proj_type}
                                                onChange={(e) => setProjectForm({...projectForm, proj_type: e.target.value})}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            >
                                                <option value="">Select Type</option>
                                                {projectTypes.map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Project Leader
                                            </label>
                                            <input
                                                type="text"
                                                value={projectForm.project_leader}
                                                onChange={(e) => setProjectForm({...projectForm, project_leader: e.target.value})}
                                                placeholder="Enter project leader name"
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Start Date
                                            </label>
                                            <input
                                                type="date"
                                                value={projectForm.proj_start_date}
                                                onChange={(e) => setProjectForm({...projectForm, proj_start_date: e.target.value})}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                End Date
                                            </label>
                                            <input
                                                type="date"
                                                value={projectForm.proj_end_date}
                                                onChange={(e) => setProjectForm({...projectForm, proj_end_date: e.target.value})}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Status
                                            </label>
                                            <select
                                                value={projectForm.proj_status}
                                                onChange={(e) => setProjectForm({...projectForm, proj_status: e.target.value})}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {projectStatuses.map(status => (
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
                                            value={projectForm.proj_desc}
                                            onChange={(e) => setProjectForm({...projectForm, proj_desc: e.target.value})}
                                            rows="4"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            type="submit"
                                            variant="success"
                                            className="flex items-center gap-2"
                                        >
                                            <FiFolder className="w-4 h-4" />
                                            {editingProject ? 'Update' : 'Create'} Project
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

                    {/* Projects Table */}
                    <Card.Content className="p-0">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase">Project</th>
                                        <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase">Leader</th>
                                        <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase">Duration</th>
                                        <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase">Members</th>
                                        <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-600">
                                    {projects.map((project) => (
                                        <tr key={project._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-serif font-medium text-gray-900 dark:text-white">{project.proj_name}</div>
                                                    <div className="text-sm font-literary text-gray-500 dark:text-gray-400 mt-1">{project.proj_desc?.substring(0, 60)}...</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant="secondary" size="sm">
                                                    {project.proj_type}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-literary text-gray-900 dark:text-gray-200">
                                                {project.project_leader || `${project.creator?.First_Name} ${project.creator?.Last_Name}`}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-literary text-gray-900 dark:text-gray-200">
                                                <div className="flex items-center text-xs mb-1">
                                                    <FiCalendar className="w-3 h-3 mr-1" />
                                                    Start: {formatDate(project.proj_start_date)}
                                                </div>
                                                <div className="flex items-center text-xs">
                                                    <FiCalendar className="w-3 h-3 mr-1" />
                                                    End: {formatDate(project.proj_end_date)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                                <div className="flex items-center">
                                                    <Badge variant="primary" size="sm" className="mr-2">
                                                        <FiUsers className="w-3 h-3 mr-1" />
                                                        {project.members?.length || 0}
                                                    </Badge>
                                                    {project.members?.length > 0 && (
                                                        <details className="relative">
                                                            <summary className="cursor-pointer text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 text-xs">
                                                                View
                                                            </summary>
                                                            <div className="absolute top-6 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 z-10 min-w-48">
                                                                {project.members.map((member) => (
                                                                    <div key={member.User_ID || member._id} className="flex justify-between items-center py-1">
                                                                        <span className="text-sm font-literary text-gray-900 dark:text-gray-200">
                                                                            {member.First_Name} {member.Last_Name}
                                                                            <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">({member.User_ID})</span>
                                                                        </span>
                                                                        <Button
                                                                            onClick={() => handleRemoveMember(project._id, member.User_ID || member._id)}
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
                                                        project.proj_status === 'active' ? 'success' :
                                                        project.proj_status === 'planning' ? 'warning' :
                                                        project.proj_status === 'completed' ? 'secondary' : 'danger'
                                                    }
                                                    size="sm"
                                                >
                                                    {project.proj_status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() => handleEditProject(project)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex items-center gap-1"
                                                    >
                                                        <FiEdit3 className="w-3 h-3" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleDeleteProject(project._id)}
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
                        
                        {projects.length === 0 && (
                            <div className="text-center py-8">
                                <p className="font-literary text-gray-500 dark:text-gray-400">No projects found. Create your first project to get started.</p>
                            </div>
                        )}
                    </Card.Content>
                </Card>
            </div>
        </PageTemplate>
    );
}

export default ManageProjects;