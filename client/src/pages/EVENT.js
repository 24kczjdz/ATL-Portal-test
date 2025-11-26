import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Badge, PageTemplate, Alert } from '../components/ui';
import { FiCalendar, FiUsers, FiDownload, FiRefreshCw, FiEye, FiTrash2, FiFilter, FiActivity } from 'react-icons/fi';

function EVENT() {
    const { currentUser } = useAuth();
    const [events, setEvents] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [filters, setFilters] = useState({
        eventType: '',
        dateFrom: '',
        dateTo: '',
        activeOnly: false
    });

    // Check if user is staff
    const staffRoles = ['ATL_ADMIN', 'ATL_Member_HKU_Staff', 'Non_ATL_HKU_Staff'];
    const isStaff = staffRoles.includes(currentUser?.User_Role);

    useEffect(() => {
        if (isStaff) {
            fetchEvents();
        }
    }, [isStaff]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('/api/events', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setEvents(data.events || []);
                setStats(data.stats || {});
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to fetch events');
            }
        } catch (err) {
            setError('Network error occurred while fetching events');
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    };

    const deleteEvent = async (eventId) => {
        if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/events/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setEvents(events.filter(event => event.Event_ID !== eventId));
                alert('Event deleted successfully');
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Failed to delete event');
            }
        } catch (err) {
            alert('Network error occurred while deleting event');
            console.error('Error deleting event:', err);
        }
    };

    const viewEventDetails = async (eventId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/events/${eventId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSelectedEvent(data.event);
                setShowDetails(true);
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Failed to fetch event details');
            }
        } catch (err) {
            alert('Network error occurred while fetching event details');
            console.error('Error fetching event details:', err);
        }
    };

    const exportEvents = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/events/export', {
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
                a.download = `events_export_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Failed to export events');
            }
        } catch (err) {
            alert('Network error occurred while exporting events');
            console.error('Error exporting events:', err);
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

    const getEventTypeBadge = (eventType) => {
        const typeColors = {
            workshop: 'bg-blue-100 text-blue-800',
            seminar: 'bg-green-100 text-green-800',
            conference: 'bg-purple-100 text-purple-800',
            meeting: 'bg-yellow-100 text-yellow-800',
            other: 'bg-gray-100 text-gray-800'
        };
        
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[eventType] || 'bg-gray-100 text-gray-800'}`}>
                {eventType || 'N/A'}
            </span>
        );
    };

    const isEventActive = (startDate, endDate) => {
        const now = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);
        return now >= start && now <= end;
    };

    if (!isStaff) {
        return (
            <PageTemplate
                title="Event Management"
                description="Manage events and conferences"
            >
                <Alert variant="error">
                    Access denied. You need staff privileges to access event management.
                    <br />
                    <span className="text-sm">Current role: {currentUser?.User_Role || 'None'}</span>
                </Alert>
            </PageTemplate>
        );
    }

    if (loading) {
        return (
            <PageTemplate
                title="Event Management"
                description="Manage events and conferences"
                loading={true}
            />
        );
    }

    return (
        <PageTemplate
            title="Event Management"
            description="Manage events and conferences"
            icon="📅"
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
                                    <FiCalendar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                </div>
                                <h3 className="text-lg font-serif font-medium text-primary-900 dark:text-white mb-2">Total Events</h3>
                                <p className="text-3xl font-elegant font-bold text-primary-600 dark:text-primary-400">{stats.totalEvents || 0}</p>
                            </Card.Content>
                        </Card>
                        <Card hover>
                            <Card.Content className="p-6 text-center">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <FiActivity className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-lg font-serif font-medium text-primary-900 dark:text-white mb-2">Active Events</h3>
                                <p className="text-3xl font-elegant font-bold text-green-600 dark:text-green-400">{stats.activeEvents || 0}</p>
                            </Card.Content>
                        </Card>
                        <Card hover>
                            <Card.Content className="p-6 text-center">
                                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <FiCalendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <h3 className="text-lg font-serif font-medium text-primary-900 dark:text-white mb-2">Upcoming Events</h3>
                                <p className="text-3xl font-elegant font-bold text-orange-600 dark:text-orange-400">{stats.upcomingEvents || 0}</p>
                            </Card.Content>
                        </Card>
                        <Card hover>
                            <Card.Content className="p-6 text-center">
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <FiUsers className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-lg font-serif font-medium text-primary-900 dark:text-white mb-2">This Month</h3>
                                <p className="text-3xl font-elegant font-bold text-purple-600 dark:text-purple-400">{stats.thisMonth || 0}</p>
                            </Card.Content>
                        </Card>
                    </div>
                )}

                {/* Controls */}
                <Card>
                    <Card.Header>
                        <Card.Title className="flex items-center font-serif">
                            <FiFilter className="mr-2" />
                            Event Filters & Controls
                        </Card.Title>
                        <p className="font-literary text-primary-600 dark:text-gray-300 mt-1">
                            Filter events and export data
                        </p>
                    </Card.Header>
                    <Card.Content className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Filter by Type
                                </label>
                                <select
                                    value={filters.eventType}
                                    onChange={(e) => setFilters({...filters, eventType: e.target.value})}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="">All Types</option>
                                    <option value="workshop">Workshop</option>
                                    <option value="seminar">Seminar</option>
                                    <option value="conference">Conference</option>
                                    <option value="meeting">Meeting</option>
                                    <option value="other">Other</option>
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
                                        id="activeOnly"
                                        checked={filters.activeOnly}
                                        onChange={(e) => setFilters({...filters, activeOnly: e.target.checked})}
                                        className="mr-2 rounded text-primary-600 focus:ring-primary-500"
                                    />
                                    <label htmlFor="activeOnly" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Active Events Only
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button
                                onClick={fetchEvents}
                                variant="primary"
                                className="flex items-center gap-2"
                            >
                                <FiRefreshCw className="w-4 h-4" />
                                Refresh
                            </Button>
                            <Button
                                onClick={exportEvents}
                                variant="success"
                                className="flex items-center gap-2"
                            >
                                <FiDownload className="w-4 h-4" />
                                Export CSV
                            </Button>
                        </div>
                    </Card.Content>
                </Card>

                {/* Events Table */}
                <Card>
                    <Card.Header>
                        <div className="flex items-center justify-between">
                            <Card.Title className="flex items-center font-serif">
                                <FiCalendar className="mr-2" />
                                Events ({events.length})
                            </Card.Title>
                            <Badge variant="primary" size="lg">
                                {events.length} Total
                            </Badge>
                        </div>
                    </Card.Header>
                    
                    {events.length === 0 ? (
                        <Card.Content className="p-6 text-center">
                            <p className="font-literary text-gray-500 dark:text-gray-400">No events found</p>
                        </Card.Content>
                    ) : (
                        <Card.Content className="p-0">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider font-elegant">
                                                Event ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider font-elegant">
                                                Title
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider font-elegant">
                                                Type
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider font-elegant">
                                                Start Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider font-elegant">
                                                End Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider font-elegant">
                                                Host ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider font-elegant">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-600">
                                        {events.map((event) => (
                                            <tr key={event.Event_ID} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 dark:text-gray-400">
                                                    {event.Event_ID}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-serif font-medium text-gray-900 dark:text-white">
                                                        {event.Event_Title || 'Untitled'}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        {isEventActive(event.Event_StartDate, event.Event_EndDate) && (
                                                            <Badge variant="success" size="sm">
                                                                Active
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getEventTypeBadge(event.Event_Type)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-literary text-gray-500 dark:text-gray-400">
                                                    {formatDate(event.Event_StartDate)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-literary text-gray-500 dark:text-gray-400">
                                                    {formatDate(event.Event_EndDate)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 dark:text-gray-400">
                                                    {event.Host_ID || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => viewEventDetails(event.Event_ID)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex items-center gap-1"
                                                        >
                                                            <FiEye className="w-3 h-3" />
                                                            View
                                                        </Button>
                                                        <Button
                                                            onClick={() => deleteEvent(event.Event_ID)}
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

                {/* Event Details Modal */}
                {showDetails && selectedEvent && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                            <div className="mt-3">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">Event Details</h3>
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
                                        <p className="text-sm text-gray-600">ID: {selectedEvent.Event_ID}</p>
                                        <p className="text-sm text-gray-600">Title: {selectedEvent.Event_Title || 'N/A'}</p>
                                        <p className="text-sm text-gray-600">Type: {getEventTypeBadge(selectedEvent.Event_Type)}</p>
                                        <p className="text-sm text-gray-600">Host ID: {selectedEvent.Host_ID || 'N/A'}</p>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-medium text-gray-900">Schedule</h4>
                                        <p className="text-sm text-gray-600">Start: {formatDate(selectedEvent.Event_StartDate)}</p>
                                        <p className="text-sm text-gray-600">End: {formatDate(selectedEvent.Event_EndDate)}</p>
                                        <p className="text-sm text-gray-600">
                                            Status: {isEventActive(selectedEvent.Event_StartDate, selectedEvent.Event_EndDate) 
                                                ? <span className="text-green-600 font-medium">Active</span>
                                                : <span className="text-gray-600">Inactive</span>
                                            }
                                        </p>
                                    </div>
                                    
                                    {selectedEvent.Event_Description && (
                                        <div>
                                            <h4 className="font-medium text-gray-900">Description</h4>
                                            <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded">
                                                {selectedEvent.Event_Description}
                                            </p>
                                        </div>
                                    )}
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

export default EVENT;