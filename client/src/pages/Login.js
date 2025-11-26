import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Input, Alert } from '../components/ui';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';

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
            const success = await login(email, password);
            if (success) {
                navigate('/');
            } else {
                setError('Invalid email or password');
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

                    {/* Register Link */}
                    <div className="mt-8 text-center">
                        <p className="font-literary text-primary-600 dark:text-gray-300">
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                className="font-serif text-primary-900 dark:text-white hover:text-primary-700 dark:hover:text-gray-300 transition-colors"
                            >
                                Sign up here
                            </Link>
                        </p>
                    </div>
                </Card.Content>
            </Card>
        </div>
    );
}

export default Login; 