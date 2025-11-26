import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DBTable from '../handlers/DatabaseHandler';
import ActivityForm from '../components/ActivityForm';
import ActivityHostView from '../components/ActivityHostView';
import { Card, Button, PageTemplate, LoadingSpinner, Alert } from '../components/ui';
import { FiActivity, FiArrowLeft, FiEye, FiPlay } from 'react-icons/fi';

function ActivityViewer() {
    const { id } = useParams();
    const navigate = useNavigate();
    const activityTable = new DBTable('ACTIVITY', 'Act_ID', {
        Act_ID: "LOADER",
        Title: "ATL Activity",
        Pointer: 0,
        Ending: 0,
        Questions: [],
        Live: false,
        Creator_ID: []
    });

    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isHost, setIsHost] = useState(false);

    const fetchActivity = async () => {
        try {
            setLoading(true);
            const fetchedActivity = await activityTable.handleRead({ Act_ID: id }, false);
            if (fetchedActivity) {
                setActivity(fetchedActivity);
                
                // Check if current user is a host
                const user = JSON.parse(localStorage.getItem('user'));
                if (user && fetchedActivity.Creator_ID.includes(user.User_ID)) {
                    setIsHost(true);
                } else {
                    // Redirect non-hosts to the general activity page
                    navigate('/activity');
                }
            } else {
                setError('Activity not found');
            }
        } catch (err) {
            setError('Failed to load activity');
            console.error('Error fetching activity:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivity();
    }, [id, navigate]);

    const handleUpdate = () => {
        // Refresh activity data
        fetchActivity();
    };

    if (loading) {
        return (
            <PageTemplate
                title="Activity Viewer"
                description="View and participate in activities"
                loading={true}
            />
        );
    }

    if (error) {
        return (
            <PageTemplate
                title="Activity Viewer"
                description="View and participate in activities"
            >
                <Alert variant="error">
                    {error}
                </Alert>
            </PageTemplate>
        );
    }

    if (!activity) {
        return (
            <PageTemplate
                title="Activity Viewer"
                description="View and participate in activities"
            >
                <Alert variant="warning">
                    Activity not found
                </Alert>
            </PageTemplate>
        );
    }

    return (
        <PageTemplate
            title={activity.Title || "Activity Viewer"}
            description={isHost ? "Manage your live activity" : "Participate in the activity"}
            icon={isHost ? "🎯" : "📝"}
            headerActions={
                <Button
                    onClick={() => window.history.back()}
                    variant="outline"
                    icon={FiArrowLeft}
                >
                    Back
                </Button>
            }
        >
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Activity Info Card */}
                <Card>
                    <Card.Header>
                        <Card.Title className="flex items-center font-serif">
                            {isHost ? (
                                <>
                                    <FiPlay className="mr-2" />
                                    Host View: {activity.Title}
                                </>
                            ) : (
                                <>
                                    <FiEye className="mr-2" />
                                    Participating: {activity.Title}
                                </>
                            )}
                        </Card.Title>
                        <p className="font-literary text-primary-600 dark:text-gray-300 mt-1">
                            {isHost 
                                ? "Monitor participants and manage the activity in real-time"
                                : "Answer questions and participate in the live activity"
                            }
                        </p>
                    </Card.Header>
                    <Card.Content className="p-6">
                        {isHost ? (
                            <ActivityHostView 
                                activity={activity}
                                onClose={() => window.history.back()}
                                onUpdate={handleUpdate}
                            />
                        ) : (
                            <ActivityForm 
                                server={activityTable}
                                table={new DBTable("PARTICIPANT", "Parti_ID", {
                                    Parti_ID: {
                                        User_ID: "",
                                        Act_ID: ""
                                    },
                                    Nickname: "",
                                    Answers: [],
                                    Scores: []
                                })}
                            />
                        )}
                    </Card.Content>
                </Card>
            </div>
        </PageTemplate>
    );
}

export default ActivityViewer; 