import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
  const [token, setToken] = useState('');
  const [type, setType] = useState('reset');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  const location = useLocation();
  const navigate = useNavigate();


  const baseURL = process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:5000/api';

  const handleOneTimeAccess = useCallback(async (tokenToUse) => {
    setLoading(true);
    try {
      const response = await axios.post(`${baseURL}/auth/reset-password`, {
        token: tokenToUse,
        type: 'one_time'
      });

      if (response.data.token && response.data.user) {
        // Store the token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        setMessage('One-time access granted! Redirecting to dashboard...');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
          window.location.reload(); // Ensure auth context updates
        }, 2000);
      }
    } catch (error) {
      console.error('One-time access error:', error);
      setError(
        error.response?.data?.message || 
        'Error processing one-time access. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [baseURL, navigate]);

  const validateToken = useCallback(async (tokenToValidate, tokenType) => {
    try {
      const response = await axios.get(
        `${baseURL}/auth/validate-reset-token/${tokenToValidate}?type=${tokenType}`
      );

      if (response.data.valid) {
        setTokenValid(true);
        setEmail(response.data.email);
        
        // If it's one-time access, automatically process it
        if (tokenType === 'one_time') {
          await handleOneTimeAccess(tokenToValidate);
        }
      } else {
        setError(response.data.message || 'Invalid or expired token');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      setError(
        error.response?.data?.message || 
        'Error validating reset token. Please request a new recovery email.'
      );
    } finally {
      setValidating(false);
    }
  }, [baseURL, handleOneTimeAccess]);

  useEffect(() => {
    // Extract token and type from URL parameters
    const urlParams = new URLSearchParams(location.search);
    const tokenFromUrl = urlParams.get('token');
    const typeFromUrl = urlParams.get('type') || 'reset';

    if (!tokenFromUrl) {
      setError('Invalid reset link. Please request a new recovery email.');
      setValidating(false);
      return;
    }

    setToken(tokenFromUrl);
    setType(typeFromUrl);
    validateToken(tokenFromUrl, typeFromUrl);
  }, [location, validateToken]);

  const handlePasswordReset = async (e) => {
    e.preventDefault();

    if (!newPassword.trim()) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${baseURL}/auth/reset-password`, {
        token,
        newPassword,
        type: 'reset'
      });

      setMessage(response.data.message);
      
      // Redirect to login after successful reset
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error) {
      console.error('Password reset error:', error);
      setError(
        error.response?.data?.message || 
        'Error resetting password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 'none', label: '', color: '' };
    if (password.length < 6) return { strength: 'weak', label: 'Weak', color: 'text-red-500' };
    if (password.length < 8) return { strength: 'fair', label: 'Fair', color: 'text-yellow-500' };
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { strength: 'good', label: 'Good', color: 'text-blue-500' };
    }
    return { strength: 'strong', label: 'Strong', color: 'text-green-500' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Validating Link</h2>
          <p className="text-gray-600">Please wait while we verify your reset link...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-2xl text-red-600">❌</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Invalid Link</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Request New Recovery Email
          </button>
        </div>
      </div>
    );
  }

  if (type === 'one_time') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-2xl text-green-600">
              {loading ? '⏳' : message ? '✅' : '🔑'}
            </span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {loading ? 'Processing Access...' : 'One-Time Access'}
          </h2>
          
          {loading && (
            <div className="space-y-4">
              <div className="animate-pulse">
                <div className="h-2 bg-green-200 rounded w-3/4 mx-auto mb-2"></div>
                <div className="h-2 bg-green-200 rounded w-1/2 mx-auto"></div>
              </div>
              <p className="text-gray-600">Granting access to your account...</p>
            </div>
          )}

          {message && (
            <div className="space-y-4">
              <p className="text-green-700">{message}</p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              </div>
            </div>
          )}

          {error && (
            <div className="space-y-4">
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => navigate('/forgot-password')}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Request New Access Link
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-2xl text-white">🔑</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Reset Password</h1>
          <p className="text-gray-600">
            Create a new password for {email}
          </p>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <p className="text-green-700 text-sm">{message}</p>
            </div>
            <div className="mt-2 text-xs text-green-600">
              Redirecting to login page...
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">❌</span>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {!message && (
          <form onSubmit={handlePasswordReset} className="space-y-6">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your new password"
                required
                disabled={loading}
              />
              {newPassword && (
                <div className="mt-2 flex items-center justify-between">
                  <div className={`text-xs ${passwordStrength.color}`}>
                    Strength: {passwordStrength.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {newPassword.length} characters
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Confirm your new password"
                required
                disabled={loading}
              />
              {confirmPassword && (
                <div className="mt-2">
                  {newPassword === confirmPassword ? (
                    <div className="text-xs text-green-600 flex items-center">
                      <span className="mr-1">✅</span>
                      Passwords match
                    </div>
                  ) : (
                    <div className="text-xs text-red-600 flex items-center">
                      <span className="mr-1">❌</span>
                      Passwords do not match
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Password Requirements:</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li className="flex items-center">
                  <span className={`mr-2 ${newPassword.length >= 6 ? 'text-green-600' : 'text-gray-400'}`}>
                    {newPassword.length >= 6 ? '✅' : '○'}
                  </span>
                  At least 6 characters
                </li>
                <li className="flex items-center">
                  <span className={`mr-2 ${/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                    {/[A-Z]/.test(newPassword) ? '✅' : '○'}
                  </span>
                  One uppercase letter (recommended)
                </li>
                <li className="flex items-center">
                  <span className={`mr-2 ${/\d/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                    {/\d/.test(newPassword) ? '✅' : '○'}
                  </span>
                  One number (recommended)
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Resetting Password...
                </div>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;