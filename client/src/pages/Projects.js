import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Input, Badge, Alert, PageTemplate } from '../components/ui';
import { 
  FiFolderPlus, 
  FiUsers, 
  FiCalendar, 
  FiPlus,
  FiEdit3,
  FiEye,
  FiUserPlus,
  FiSearch,
  FiFilter,
  FiUser
} from 'react-icons/fi';

function Projects() {
    const { currentUser } = useAuth();
    const [projects, setProjects] = useState([]);
    const [myProjects, setMyProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [joining, setJoining] = useState(null);

    // Project form state
    const [projectForm, setProjectForm] = useState({
        proj_name: '',
        proj_type: '',
        proj_desc: '',
        proj_start_date: '',
        proj_end_date: '',
        proj_status: 'planning'
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

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('all');

    const statusVariants = {
        'planning': 'warning',
        'active': 'success',
        'completed': 'neutral',
        'cancelled': 'error'
    };

    const statusColors = {
        'planning': 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200',
        'active': 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200',
        'completed': 'bg-primary-100 text-primary-800 dark:bg-gray-700 dark:text-gray-200',
        'cancelled': 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200'
    };

    useEffect(() => {
        fetchProjects();
        fetchMyProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/projects', {
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

    const fetchMyProjects = async () => {
        try {
            const response = await fetch('/api/projects/my-projects', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setMyProjects(data);
            }
        } catch (error) {
            console.error('Error fetching my projects:', error);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(projectForm)
            });

            if (response.ok) {
                alert('Project created successfully!');
                setProjectForm({
                    proj_name: '',
                    proj_type: '',
                    proj_desc: '',
                    proj_start_date: '',
                    proj_end_date: '',
                    proj_status: 'planning'
                });
                setShowCreateForm(false);
                fetchProjects();
                fetchMyProjects();
            } else {
                const error = await response.json();
                alert(`Error: ${error.message}`);
            }
        } catch (error) {
            console.error('Error creating project:', error);
            alert('Error creating project');
        }
    };

    const handleJoinProject = async (projectId) => {
        setJoining(projectId);
        try {
            const response = await fetch(`/api/projects/${projectId}/join`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                alert('Successfully joined project!');
                fetchMyProjects();
            } else {
                const error = await response.json();
                alert(`Error: ${error.message}`);
            }
        } catch (error) {
            console.error('Error joining project:', error);
            alert('Error joining project');
        } finally {
            setJoining(null);
        }
    };

    const handleLeaveProject = async (projectId) => {
        if (!window.confirm('Are you sure you want to leave this project?')) return;

        try {
            const response = await fetch(`/api/projects/${projectId}/leave`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                alert('Successfully left project');
                fetchMyProjects();
            } else {
                let message = 'Error leaving project';
                try {
                    const err = await response.json();
                    if (err?.message) message = err.message;
                } catch (_) {}
                console.error('Leave project failed:', response.status, response.statusText);
                alert(message);
            }
        } catch (error) {
            console.error('Error leaving project:', error);
            alert('Error leaving project');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const isProjectMember = (projectId) => {
        return myProjects.some(project => project._id === projectId);
    };

    const canCreateProject = () => {
        return currentUser?.User_Role === 'ATL_ADMIN' || 
               currentUser?.User_Role?.includes('ATL_Member');
    };

    if (loading) {
        return (
            <PageTemplate
                title="Projects"
                description="Collaborative projects and initiatives"
                loading={true}
            />
        );
    }

    return (
        <PageTemplate
            title="Projects"
            description="Collaborative projects and initiatives"
            headerActions={canCreateProject() && (
                <Button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    variant={showCreateForm ? 'ghost' : 'primary'}
                    icon={showCreateForm ? undefined : FiPlus}
                >
                    {showCreateForm ? 'Cancel' : 'Create Project'}
                </Button>
            )}
        >

            {/* Create Project Form */}
            {showCreateForm && (
                <Card className="mb-8">
                    <Card.Header>
                        <Card.Title className="text-xl font-serif">Create New Project</Card.Title>
                    </Card.Header>
                    <Card.Content>
                        <form onSubmit={handleCreateProject} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Project Name"
                                    type="text"
                                    value={projectForm.proj_name}
                                    onChange={(e) => setProjectForm({...projectForm, proj_name: e.target.value})}
                                    required
                                    placeholder="Enter project name"
                                />

                                <div>
                                    <label className="block text-sm font-serif font-medium text-primary-700 dark:text-gray-300 mb-2">
                                        Project Type
                                    </label>
                                    <select
                                        value={projectForm.proj_type}
                                        onChange={(e) => setProjectForm({...projectForm, proj_type: e.target.value})}
                                        required
                                        className="w-full px-4 py-3 font-literary border border-primary-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-primary-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-primary-500/20 dark:focus:ring-primary-400/20 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-300"
                                    >
                                        <option value="">Select Type</option>
                                        {projectTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                <Input
                                    label="Start Date"
                                    type="date"
                                    value={projectForm.proj_start_date}
                                    onChange={(e) => setProjectForm({...projectForm, proj_start_date: e.target.value})}
                                    required
                                    icon={FiCalendar}
                                />

                                <Input
                                    label="End Date"
                                    type="date"
                                    value={projectForm.proj_end_date}
                                    onChange={(e) => setProjectForm({...projectForm, proj_end_date: e.target.value})}
                                    required
                                    icon={FiCalendar}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-serif font-medium text-primary-700 dark:text-gray-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={projectForm.proj_desc}
                                    onChange={(e) => setProjectForm({...projectForm, proj_desc: e.target.value})}
                                    rows="4"
                                    required
                                    placeholder="Describe your project..."
                                    className="w-full px-4 py-3 font-literary border border-primary-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-primary-900 dark:text-white placeholder-primary-400 dark:placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-primary-500/20 dark:focus:ring-primary-400/20 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-300"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="submit"
                                    variant="success"
                                    icon={FiPlus}
                                >
                                    Create Project
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setShowCreateForm(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </Card.Content>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* All Projects */}
                <div>
                    <h2 className="text-2xl font-serif text-primary-900 dark:text-white mb-6">All Projects</h2>
                    {projects.length === 0 ? (
                        <Card>
                            <Card.Content className="p-12 text-center">
                                <FiFolderPlus className="w-12 h-12 text-primary-300 dark:text-gray-600 mx-auto mb-4" />
                                <p className="font-literary text-primary-500 dark:text-gray-400">No projects available</p>
                            </Card.Content>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {projects.map((project) => (
                                <Card key={project._id} hover>
                                    <Card.Content className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="font-serif text-xl text-primary-900 dark:text-white">{project.proj_name}</h3>
                                            <Badge variant={statusVariants[project.proj_status]}>
                                                {project.proj_status}
                                            </Badge>
                                        </div>
                                        <p className="font-sans text-sm text-primary-600 dark:text-gray-400 mb-3">{project.proj_type}</p>
                                        <p className="font-literary text-primary-700 dark:text-gray-300 mb-4">{project.proj_desc}</p>
                                        <div className="font-sans text-sm text-primary-600 dark:text-gray-400 space-y-1 mb-4">
                                            <p><FiCalendar className="inline w-4 h-4 mr-2" />Start: {formatDate(project.proj_start_date)}</p>
                                            <p><FiCalendar className="inline w-4 h-4 mr-2" />End: {formatDate(project.proj_end_date)}</p>
                                            <p><FiUser className="inline w-4 h-4 mr-2" />Leaded by: {project.project_leader || `${project.creator?.First_Name} ${project.creator?.Last_Name}`}</p>
                                            <p><FiUsers className="inline w-4 h-4 mr-2" />Members: {project.memberCount || 0}</p>
                                        </div>
                                        
                                        {isProjectMember(project._id) ? (
                                            <Button
                                                onClick={() => handleLeaveProject(project._id)}
                                                variant="danger"
                                                size="sm"
                                            >
                                                Leave Project
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => handleJoinProject(project._id)}
                                                disabled={joining === project._id || project.proj_status === 'completed' || project.proj_status === 'cancelled'}
                                                variant="primary"
                                                size="sm"
                                                loading={joining === project._id}
                                                icon={FiUserPlus}
                                            >
                                                {joining === project._id ? 'Joining...' : 'Join Project'}
                                            </Button>
                                        )}
                                    </Card.Content>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* My Projects */}
                <div>
                    <h2 className="text-2xl font-serif text-primary-900 dark:text-white mb-6">My Projects</h2>
                    {myProjects.length === 0 ? (
                        <Card>
                            <Card.Content className="p-12 text-center">
                                <FiUsers className="w-12 h-12 text-primary-300 dark:text-gray-600 mx-auto mb-4" />
                                <p className="font-literary text-primary-500 dark:text-gray-400">You haven't joined any projects yet</p>
                            </Card.Content>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {myProjects.map((project) => (
                                <Card key={project._id} hover className="border-primary-300 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/20">
                                    <Card.Content className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="font-serif text-xl text-primary-900 dark:text-white">{project.proj_name}</h3>
                                            <Badge variant={statusVariants[project.proj_status]}>
                                                {project.proj_status}
                                            </Badge>
                                        </div>
                                        <p className="font-sans text-sm text-primary-600 dark:text-gray-400 mb-3">{project.proj_type}</p>
                                        <p className="font-literary text-primary-700 dark:text-gray-300 mb-4">{project.proj_desc}</p>
                                        <div className="font-sans text-sm text-primary-600 dark:text-gray-400 space-y-1 mb-4">
                                            <p><FiCalendar className="inline w-4 h-4 mr-2" />Start: {formatDate(project.proj_start_date)}</p>
                                            <p><FiCalendar className="inline w-4 h-4 mr-2" />End: {formatDate(project.proj_end_date)}</p>
                                            <p><FiUser className="inline w-4 h-4 mr-2" />Leaded by: {project.creator?.First_Name} {project.creator?.Last_Name}</p>
                                        </div>
                                        
                                        <Button
                                            onClick={() => handleLeaveProject(project._id)}
                                            variant="danger"
                                            size="sm"
                                        >
                                            Leave Project
                                        </Button>
                                    </Card.Content>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PageTemplate>
    );
}

export default Projects;