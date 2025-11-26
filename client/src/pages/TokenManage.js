import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Badge, PageTemplate, Alert } from '../components/ui';
import { FiKey, FiPlus, FiCopy, FiEye, FiTrash2, FiDownload, FiRefreshCw, FiClock, FiCheck, FiX } from 'react-icons/fi';

function TokenManage() {
    const { currentUser } = useAuth();
    const [tokens, setTokens] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedToken, setSelectedToken] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createForm, setCreateForm] = useState({
        description: '',
        expiresInHours: ''
    });

    // Check if user is admin (only admins can manage tokens)
    const isAdmin = currentUser?.User_Role === 'ATL_ADMIN';

    useEffect(() => {
        if (isAdmin) {
            fetchTokens();
        }
    }, [isAdmin]);

    const fetchTokens = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('/api/tokens', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setTokens(data.tokens || []);
                setStats(data.stats || {});
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to fetch tokens');
            }
        } catch (err) {
            setError('Network error occurred while fetching tokens');
            console.error('Error fetching tokens:', err);
        } finally {
            setLoading(false);
        }
    };

    const createToken = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/tokens', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: createForm.description,
                    expiresInHours: createForm.expiresInHours ? parseInt(createForm.expiresInHours) : null
                })
            });

            if (response.ok) {
                const data = await response.json();
                setTokens([data.token, ...tokens]);
                setShowCreateForm(false);
                setCreateForm({ description: '', expiresInHours: '' });
                alert('Token created successfully!');
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Failed to create token');
            }
        } catch (err) {
            alert('Network error occurred while creating token');
            console.error('Error creating token:', err);
        }
    };

    const deleteToken = async (tokenId) => {
        if (!window.confirm('Are you sure you want to delete this token? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/tokens/${tokenId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setTokens(tokens.filter(t => t.Token_ID !== tokenId));
                alert('Token deleted successfully');
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Failed to delete token');
            }
        } catch (err) {
            alert('Network error occurred while deleting token');
            console.error('Error deleting token:', err);
        }
    };

    const exportTokens = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/tokens/export', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `admin_tokens_export_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Failed to export tokens');
            }
        } catch (err) {
            alert('Network error occurred while exporting tokens');
            console.error('Error exporting tokens:', err);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (token) => {
        const now = new Date();
        
        if (token.Is_Used) {
            return <Badge variant="secondary" size="sm">Used</Badge>;
        }
        
        if (token.Expires_At && new Date(token.Expires_At) < now) {
            return <Badge variant="danger" size="sm">Expired</Badge>;
        }
        
        return <Badge variant="success" size="sm">Active</Badge>;
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            alert('Token copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy:', err);
            alert('Failed to copy token to clipboard');
        }
    };

    if (!isAdmin) {
        return (
            <PageTemplate
                title="Token Management"
                description="Manage admin registration tokens"
            >
                <Alert variant="error">
                    Access denied. You need admin privileges to access token management.
                    <br />
                    <span className="text-sm">Current role: {currentUser?.User_Role || 'None'}</span>
                </Alert>
            </PageTemplate>
        );
    }

    if (loading) {
        return (
            <PageTemplate
                title="Token Management"
                description="Manage admin registration tokens"
                loading={true}
            />
        );
    }

    return (
        <PageTemplate
            title="Token Management"
            description="Manage admin registration tokens"
            icon="🔑"
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
                                    <FiKey className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                </div>
                                <h3 className="text-lg font-serif font-medium text-primary-900 dark:text-white mb-2">Total Tokens</h3>
                                <p className="text-3xl font-elegant font-bold text-primary-600 dark:text-primary-400">{stats.totalTokens || 0}</p>
                            </Card.Content>
                        </Card>
                        <Card hover>
                            <Card.Content className="p-6 text-center">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <FiCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-lg font-serif font-medium text-primary-900 dark:text-white mb-2">Active Tokens</h3>
                                <p className="text-3xl font-elegant font-bold text-green-600 dark:text-green-400">{stats.activeTokens || 0}</p>
                            </Card.Content>
                        </Card>
                        <Card hover>
                            <Card.Content className="p-6 text-center">
                                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <FiKey className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                </div>
                                <h3 className="text-lg font-serif font-medium text-primary-900 dark:text-white mb-2">Used Tokens</h3>
                                <p className="text-3xl font-elegant font-bold text-gray-600 dark:text-gray-400">{stats.usedTokens || 0}</p>
                            </Card.Content>
                        </Card>
                        <Card hover>
                            <Card.Content className="p-6 text-center">
                                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <FiClock className="w-6 h-6 text-red-600 dark:text-red-400" />
                                </div>
                                <h3 className="text-lg font-serif font-medium text-primary-900 dark:text-white mb-2">Expired Tokens</h3>
                                <p className="text-3xl font-elegant font-bold text-red-600 dark:text-red-400">{stats.expiredTokens || 0}</p>
                            </Card.Content>
                        </Card>
                    </div>
                )}

                {/* Controls */}
                <Card>
                    <Card.Header>
                        <Card.Title className="flex items-center font-serif">
                            <FiKey className="mr-2" />
                            Token Controls
                        </Card.Title>
                        <p className="font-literary text-primary-600 dark:text-gray-300 mt-1">
                            Manage admin registration tokens for creating new admin accounts
                        </p>
                    </Card.Header>
                    <Card.Content className="p-6">
                        <div className="flex flex-wrap gap-3">
                            <Button
                                onClick={() => setShowCreateForm(true)}
                                variant="success"
                                className="flex items-center gap-2"
                            >
                                <FiPlus className="w-4 h-4" />
                                Create Token
                            </Button>
                            <Button
                                onClick={fetchTokens}
                                variant="primary"
                                className="flex items-center gap-2"
                            >
                                <FiRefreshCw className="w-4 h-4" />
                                Refresh
                            </Button>
                            <Button
                                onClick={exportTokens}
                                variant="secondary"
                                className="flex items-center gap-2"
                            >
                                <FiDownload className="w-4 h-4" />
                                Export CSV
                            </Button>
                        </div>
                    </Card.Content>
                </Card>

                {/* Tokens Table */}
                <Card>
                    <Card.Header>
                        <div className="flex items-center justify-between">
                            <Card.Title className="flex items-center font-serif">
                                <FiKey className="mr-2" />
                                Admin Registration Tokens ({tokens.length})
                            </Card.Title>
                            <Badge variant="primary" size="lg">
                                {tokens.length} Total
                            </Badge>
                        </div>
                    </Card.Header>
                    
                    {tokens.length === 0 ? (
                        <Card.Content className="p-6 text-center">
                            <p className="font-literary text-gray-500 dark:text-gray-400">No tokens found</p>
                        </Card.Content>
                    ) : (
                        <Card.Content className="p-0">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Token ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Token Value
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Created
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Expires
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-elegant font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-600">
                                        {tokens.map((token) => (
                                            <tr key={token.Token_ID} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 dark:text-gray-400">
                                                    {token.Token_ID}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono max-w-xs truncate mr-2 text-gray-900 dark:text-gray-200">
                                                            {token.Token_Value}
                                                        </code>
                                                        <Button
                                                            onClick={() => copyToClipboard(token.Token_Value)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex items-center gap-1"
                                                            title="Copy to clipboard"
                                                        >
                                                            <FiCopy className="w-3 h-3" />
                                                            Copy
                                                        </Button>
                                                    </div>
                                                    {token.Description && (
                                                        <div className="text-sm font-literary text-gray-500 dark:text-gray-400 truncate max-w-xs mt-1">
                                                            {token.Description}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(token)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-literary text-gray-500 dark:text-gray-400">
                                                    {formatDate(token.Created_At)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-literary text-gray-500 dark:text-gray-400">
                                                    {formatDate(token.Expires_At)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => {
                                                                setSelectedToken(token);
                                                                setShowDetails(true);
                                                            }}
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex items-center gap-1"
                                                        >
                                                            <FiEye className="w-3 h-3" />
                                                            View
                                                        </Button>
                                                        <Button
                                                            onClick={() => deleteToken(token.Token_ID)}
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

                {/* Create Token Modal */}
                {showCreateForm && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
                            <div className="mt-3">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">Create New Admin Token</h3>
                                    <button
                                        onClick={() => setShowCreateForm(false)}
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={createForm.description}
                                            onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                                            placeholder="Purpose of this token..."
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Expires in Hours (Optional)
                                        </label>
                                        <input
                                            type="number"
                                            value={createForm.expiresInHours}
                                            onChange={(e) => setCreateForm({...createForm, expiresInHours: e.target.value})}
                                            placeholder="Leave empty for no expiration"
                                            min="1"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>
                                
                                <div className="mt-6 flex justify-end gap-2">
                                    <button
                                        onClick={() => setShowCreateForm(false)}
                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={createToken}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        Create Token
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Token Details Modal */}
                {showDetails && selectedToken && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                            <div className="mt-3">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">Token Details</h3>
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
                                        <h4 className="font-medium text-gray-900">Token Information</h4>
                                        <p className="text-sm text-gray-600">ID: {selectedToken.Token_ID}</p>
                                        <p className="text-sm text-gray-600">Type: {selectedToken.Token_Type}</p>
                                        <p className="text-sm text-gray-600">Status: {getStatusBadge(selectedToken)}</p>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-medium text-gray-900">Token Value</h4>
                                        <div className="flex items-center mt-1">
                                            <code className="text-sm bg-gray-100 p-2 rounded font-mono break-all mr-2">
                                                {selectedToken.Token_Value}
                                            </code>
                                            <button
                                                onClick={() => copyToClipboard(selectedToken.Token_Value)}
                                                className="text-blue-600 hover:text-blue-900 text-sm"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {selectedToken.Description && (
                                        <div>
                                            <h4 className="font-medium text-gray-900">Description</h4>
                                            <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded">
                                                {selectedToken.Description}
                                            </p>
                                        </div>
                                    )}
                                    
                                    <div>
                                        <h4 className="font-medium text-gray-900">Usage Information</h4>
                                        <p className="text-sm text-gray-600">Created: {formatDate(selectedToken.Created_At)}</p>
                                        <p className="text-sm text-gray-600">Created By: {selectedToken.Created_By}</p>
                                        <p className="text-sm text-gray-600">Expires: {formatDate(selectedToken.Expires_At)}</p>
                                        {selectedToken.Is_Used && (
                                            <>
                                                <p className="text-sm text-gray-600">Used By: {selectedToken.Used_By}</p>
                                                <p className="text-sm text-gray-600">Used At: {formatDate(selectedToken.Used_At)}</p>
                                            </>
                                        )}
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

export default TokenManage;