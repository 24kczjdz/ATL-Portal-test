import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Input, Alert } from '../components/ui';
import { FiMail, FiLock, FiLogIn, FiMapPin } from 'react-icons/fi';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(email, password);
            if (result.success) {
                navigate('/');
            } else {
                // Show specific error message based on account status
                if (result.accountStatus === 'pending_approval') {
                    setError('Account not yet approved, please contact our admin in the lab.');
                } else {
                    setError(result.message || 'Invalid email or password');
                }
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Card className="max-w-md w-full">
                <Card.Content className="p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <img 
                            src="/asset/images/logo.png" 
                            alt="ATL Logo" 
                            className="h-16 w-16 mx-auto mb-4"
                        />
                        <h1 className="text-3xl font-elegant text-primary-900 dark:text-white mb-2">
                            Welcome Back
                        </h1>
                        <p className="font-literary text-primary-600 dark:text-gray-300">
                            Sign in to your ATL account
                        </p>
                    </div>

                    {/* New User Information - Moved to top */}
                    <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="flex items-start gap-3">
                            <FiMapPin className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-serif font-medium text-amber-800 dark:text-amber-300 mb-1">
                                    New User?
                                </p>
                                <p className="font-literary text-amber-700 dark:text-amber-400 text-sm leading-relaxed mb-3">
                                    Please submit your registration information and bring your student ID card to <strong>Run Run Shaw Tower 4.40-4.41 Arts Tech Lab</strong> for account approval.
                                </p>
                                <Link
                                    to="/register"
                                    className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-serif text-sm rounded-lg transition-colors"
                                >
                                    Register New Account
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-6">
                            <Alert type="error" onClose={() => setError('')}>
                                {error}
                            </Alert>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Email Address"
                            type="email"
                            icon={FiMail}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            icon={FiLock}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            showPasswordToggle
                            required
                        />

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-primary-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm font-sans text-primary-600 dark:text-gray-300">
                                    Remember me
                                </label>
                            </div>

                            <Link
                                to="/forgot-password"
                                className="text-sm font-serif text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full"
                            icon={FiLogIn}
                            loading={loading}
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>
                </Card.Content>
            </Card>
        </div>
    );
}

export default Login; 