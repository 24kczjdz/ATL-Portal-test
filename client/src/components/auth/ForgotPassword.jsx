import React, { useState } from 'react';
import axios from 'axios';

const ForgotPassword = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [selectedType, setSelectedType] = useState('reset'); // 'reset' or 'one_time'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState('choose'); // 'choose' or 'submit'

  const baseURL = process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:5000/api';

  const handleTypeSelection = (type) => {
    setSelectedType(type);
    setStep('submit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post(`${baseURL}/auth/forgot-password`, {
        email: email.trim(),
        type: selectedType
      });

      setMessage(response.data.message);
      console.log('Password recovery request successful:', response.data);

    } catch (error) {
      console.error('Password recovery error:', error);
      setError(
        error.response?.data?.message || 
        'An error occurred while sending the recovery email. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('choose');
    setEmail('');
    setMessage('');
    setError('');
    setSelectedType('reset');
  };

  if (step === 'choose') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-2xl text-white">🔐</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Account Recovery
            </h1>
            <p className="text-gray-600">
              Choose how you'd like to access your account
            </p>
          </div>

          <div className="space-y-4">
            {/* Password Reset Option */}
            <button
              onClick={() => handleTypeSelection('reset')}
              className="w-full p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl hover:from-blue-100 hover:to-blue-200 hover:border-blue-300 transition-all duration-200 text-left group"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                  <span className="text-xl text-white">🔑</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    Reset Password
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Create a new password for your account. This will permanently change your password.
                  </p>
                  <div className="mt-2 flex items-center text-xs text-blue-600">
                    <span className="mr-1">⏰</span>
                    <span>Link expires in 1 hour</span>
                  </div>
                </div>
              </div>
            </button>

            {/* One-Time Access Option */}
            <button
              onClick={() => handleTypeSelection('one_time')}
              className="w-full p-6 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-xl hover:from-green-100 hover:to-green-200 hover:border-green-300 transition-all duration-200 text-left group"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center group-hover:bg-green-600 transition-colors">
                  <span className="text-xl text-white">⚡</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    One-Time Access
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Get immediate access without changing your password. Perfect for quick access.
                  </p>
                  <div className="mt-2 flex items-center text-xs text-green-600">
                    <span className="mr-1">⏰</span>
                    <span>Link expires in 30 minutes</span>
                  </div>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={onBack}
              className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-2xl text-white">
              {selectedType === 'reset' ? '🔑' : '⚡'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {selectedType === 'reset' ? 'Reset Password' : 'One-Time Access'}
          </h1>
          <p className="text-gray-600">
            {selectedType === 'reset' 
              ? 'Enter your email to receive a password reset link'
              : 'Enter your email to receive a one-time access link'
            }
          </p>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <p className="text-green-700 text-sm">{message}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-green-200">
              <button
                onClick={resetForm}
                className="text-sm text-green-600 hover:text-green-700 underline"
              >
                Send another recovery email
              </button>
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your email address"
                required
                disabled={loading}
              />
            </div>

            {/* Selected Option Display */}
            <div className={`p-4 rounded-lg border-2 ${
              selectedType === 'reset' 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center space-x-3">
                <span className="text-xl">
                  {selectedType === 'reset' ? '🔑' : '⚡'}
                </span>
                <div>
                  <p className="font-medium text-gray-800">
                    {selectedType === 'reset' ? 'Password Reset' : 'One-Time Access'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedType === 'reset' 
                      ? 'You\'ll receive a link to create a new password'
                      : 'You\'ll receive a link for immediate access'
                    }
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                selectedType === 'reset'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Sending Email...
                </div>
              ) : (
                `Send ${selectedType === 'reset' ? 'Reset' : 'Access'} Email`
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center space-y-2">
          <button
            onClick={resetForm}
            className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            ← Choose Different Option
          </button>
          <br />
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;