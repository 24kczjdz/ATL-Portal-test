import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DBTable from '../handlers/DatabaseHandler';
import ActivityEditorComponent from '../components/ActivityEditor';
import { Card, Button, PageTemplate, LoadingSpinner, Alert } from '../components/ui';
import { FiEdit3, FiArrowLeft, FiSave, FiX } from 'react-icons/fi';

function ActivityEditor() {
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

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                setLoading(true);
                const fetchedActivity = await activityTable.handleRead({ Act_ID: id }, false);
                if (fetchedActivity) {
                    setActivity(fetchedActivity);
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

        fetchActivity();
    }, [id]);

    const handleSuccess = () => {
        navigate('/activity/host');
    };

    const handleCancel = () => {
        navigate('/activity/host');
    };

    if (loading) {
        return (
            <PageTemplate
                title="Activity Editor"
                description="Edit activity content and settings"
                loading={true}
            />
        );
    }

    if (error) {
        return (
            <PageTemplate
                title="Activity Editor"
                description="Edit activity content and settings"
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
                title="Activity Editor"
                description="Edit activity content and settings"
            >
                <Alert variant="warning">
                    Activity not found
                </Alert>
            </PageTemplate>
        );
    }

    return (
        <PageTemplate
            title={`Editing: ${activity.Title || 'Activity'}`}
            description="Modify activity questions, settings, and configuration"
            icon="✏️"
            headerActions={
                <div className="flex gap-2">
                    <Button
                        onClick={handleCancel}
                        variant="outline"
                        icon={FiArrowLeft}
                    >
                        Back to Host
                    </Button>
                </div>
            }
        >
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Activity Editor Card */}
                <Card>
                    <Card.Header>
                        <Card.Title className="flex items-center font-serif">
                            <FiEdit3 className="mr-2" />
                            Activity Editor
                        </Card.Title>
                        <p className="font-literary text-primary-600 dark:text-gray-300 mt-1">
                            Customize questions, settings, and activity flow
                        </p>
                    </Card.Header>
                    <Card.Content className="p-6">
                        <ActivityEditorComponent 
                            activity={activity}
                            onCancel={handleCancel}
                            onSuccess={handleSuccess}
                        />
                    </Card.Content>
                </Card>
            </div>
        </PageTemplate>
    );
}

export default ActivityEditor; 