import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, PageTemplate, Alert } from '../components/ui';
import { FiUsers, FiUserPlus, FiCalendar, FiUser, FiAlertCircle } from 'react-icons/fi';

function StudentInterestGroup() {

    const [sigs, setSigs] = useState([]);
    const [mySigs, setMySigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(null);

    const statusVariants = {
        'active': 'success',
        'inactive': 'neutral',
        'recruiting': 'primary'
    };

    useEffect(() => {
        fetchSigs();
        fetchMySigs();
    }, []);

    const fetchSigs = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/student-interest-groups', {
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

    const fetchMySigs = async () => {
        try {
            const response = await fetch('/api/student-interest-groups/my-groups', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setMySigs(data);
            }
        } catch (error) {
            console.error('Error fetching my SIGs:', error);
        }
    };

    const handleJoinSig = async (sigId) => {
        setJoining(sigId);
        try {
            const response = await fetch(`/api/student-interest-groups/${sigId}/join`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                alert('Successfully joined Student Interest Group!');
                fetchMySigs();
            } else {
                const error = await response.json();
                alert(`Error: ${error.message}`);
            }
        } catch (error) {
            console.error('Error joining SIG:', error);
            alert('Error joining Student Interest Group');
        } finally {
            setJoining(null);
        }
    };

    const handleLeaveSig = async (sigId) => {
        if (!window.confirm('Are you sure you want to leave this Student Interest Group?')) return;

        try {
            const response = await fetch(`/api/student-interest-groups/${sigId}/leave`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                alert('Successfully left Student Interest Group');
                fetchMySigs();
            } else {
                alert('Error leaving Student Interest Group');
            }
        } catch (error) {
            console.error('Error leaving SIG:', error);
            alert('Error leaving Student Interest Group');
        }
    };

    const isSigMember = (sigId) => {
        return mySigs.some(sig => sig._id === sigId);
    };

    if (loading) {
        return (
            <PageTemplate
                title="Student Interest Groups"
                description="Connect with like-minded peers and join specialized communities"
                loading={true}
            />
        );
    }

    return (
        <PageTemplate
            title="Student Interest Groups"
            description="Connect with like-minded peers and join specialized communities"
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* All Student Interest Groups */}
                <div>
                    <h2 className="text-2xl font-serif text-primary-900 dark:text-white mb-6">Available Groups</h2>
                    {sigs.length === 0 ? (
                        <Card>
                            <Card.Content className="p-12 text-center">
                                <FiUsers className="w-12 h-12 text-primary-300 dark:text-gray-600 mx-auto mb-4" />
                                <p className="font-literary text-primary-500 dark:text-gray-400">No Student Interest Groups available</p>
                            </Card.Content>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {sigs.map((sig) => (
                                <Card key={sig._id} hover>
                                    <Card.Content className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-serif text-xl text-primary-900 dark:text-white">{sig.sig_name}</h3>
                                                <p className="text-sm font-sans text-primary-600 dark:text-gray-400 font-mono">{sig.sig_abbrev}</p>
                                            </div>
                                            <Badge variant={statusVariants[sig.sig_status]}>
                                                {sig.sig_status}
                                            </Badge>
                                        </div>
                                                
                                        <p className="font-literary text-primary-700 dark:text-gray-300 mb-4">{sig.sig_desc}</p>
                                        
                                        <div className="text-sm font-sans text-primary-600 dark:text-gray-400 space-y-1 mb-4">
                                            <p><FiUsers className="inline w-4 h-4 mr-2" />Members: {sig.memberCount || 0}</p>
                                            <p><FiCalendar className="inline w-4 h-4 mr-2" />Created: {new Date(sig.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        
                                        {isSigMember(sig._id) ? (
                                            <div className="flex items-center gap-3">
                                                <Badge variant="success" className="flex items-center">
                                                    ✓ Member
                                                </Badge>
                                                <Button
                                                    onClick={() => handleLeaveSig(sig._id)}
                                                    variant="danger"
                                                    size="sm"
                                                >
                                                    Leave Group
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                onClick={() => handleJoinSig(sig._id)}
                                                disabled={joining === sig._id || sig.sig_status === 'inactive'}
                                                variant="primary"
                                                size="sm"
                                                loading={joining === sig._id}
                                                icon={FiUserPlus}
                                            >
                                                {joining === sig._id ? 'Joining...' : 'Join Group'}
                                            </Button>
                                        )}
                                    </Card.Content>
                                </Card>
                                        ))}
                                    </div>
                                )}
                            </div>

                {/* My Student Interest Groups */}
                <div>
                    <h2 className="text-2xl font-serif text-primary-900 dark:text-white mb-6">My Groups</h2>
                    {mySigs.length === 0 ? (
                        <Card>
                            <Card.Content className="p-12 text-center">
                                <FiAlertCircle className="w-12 h-12 text-primary-300 dark:text-gray-600 mx-auto mb-4" />
                                <p className="font-literary text-primary-500 dark:text-gray-400 mb-2">You haven't joined any Student Interest Groups yet</p>
                                <p className="text-sm font-sans text-primary-400 dark:text-gray-500">Browse the available groups to get started!</p>
                            </Card.Content>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {mySigs.map((sig) => (
                                <Card key={sig._id} hover className="border-primary-300 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/20">
                                    <Card.Content className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-serif text-xl text-primary-900 dark:text-white">{sig.sig_name}</h3>
                                                <p className="text-sm font-sans text-primary-600 dark:text-gray-400 font-mono">{sig.sig_abbrev}</p>
                                            </div>
                                            <Badge variant={statusVariants[sig.sig_status]}>
                                                {sig.sig_status}
                                            </Badge>
                                        </div>
                                        
                                        <p className="font-literary text-primary-700 dark:text-gray-300 mb-4">{sig.sig_desc}</p>
                                        
                                        <div className="text-sm font-sans text-primary-600 dark:text-gray-400 space-y-1 mb-4">
                                            <p><FiUsers className="inline w-4 h-4 mr-2" />Members: {sig.memberCount || 0}</p>
                                            <p><FiCalendar className="inline w-4 h-4 mr-2" />Joined: {new Date(sig.joinedAt).toLocaleDateString()}</p>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <Badge variant="success" className="flex items-center">
                                                ✓ Active Member
                                            </Badge>
                                            <Button
                                                onClick={() => handleLeaveSig(sig._id)}
                                                variant="danger"
                                                size="sm"
                                            >
                                                Leave Group
                                            </Button>
                                        </div>
                                    </Card.Content>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Info Section */}
            <Card className="mt-8 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700">
                <Card.Header>
                    <Card.Title className="font-serif text-primary-900 dark:text-white">About Student Interest Groups</Card.Title>
                </Card.Header>
                <Card.Content>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                        <div>
                            <h4 className="font-serif font-medium text-primary-900 dark:text-white mb-2 flex items-center">
                                <FiUsers className="mr-2" />
                                Connect
                            </h4>
                            <p className="font-literary text-primary-600 dark:text-gray-300">Meet students who share your interests and passions.</p>
                        </div>
                        <div>
                            <h4 className="font-serif font-medium text-primary-900 dark:text-white mb-2 flex items-center">
                                <FiUser className="mr-2" />
                                Learn
                            </h4>
                            <p className="font-literary text-primary-600 dark:text-gray-300">Participate in workshops, seminars, and collaborative learning.</p>
                        </div>
                        <div>
                            <h4 className="font-serif font-medium text-primary-900 dark:text-white mb-2 flex items-center">
                                <FiUserPlus className="mr-2" />
                                Create
                            </h4>
                            <p className="font-literary text-primary-600 dark:text-gray-300">Work together on projects and showcase your collective achievements.</p>
                        </div>
                    </div>
                </Card.Content>
            </Card>
        </PageTemplate>
    );
}

export default StudentInterestGroup;