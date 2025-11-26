import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const OnboardingGuide = ({ userRole, onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const hostSteps = [
        {
            title: "Welcome to Activity Dashboard! 🎯",
            content: (
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-3xl">👋</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">You're ready to create interactive activities!</h3>
                    <p className="text-gray-600">
                        As a host, you can create both regular activities (surveys/forms) and live activities (real-time interactive sessions like polls and Q&A).
                    </p>
                </div>
            )
        },
        {
            title: "Two Types of Activities 📋⚡",
            content: (
                <div>
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-blue-900 mb-2">📋 Regular Activities</h4>
                            <p className="text-blue-700 text-sm">Traditional surveys, forms, and questionnaires that participants complete at their own pace.</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-green-900 mb-2">⚡ Live Activities</h4>
                            <p className="text-green-700 text-sm">Real-time interactive sessions with live polls, Q&A, word clouds, and instant results. Perfect for presentations and workshops!</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "How to Create Live Activities ⚡",
            content: (
                <div>
                    <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                            <p className="text-sm">Click "Create Live Activity" or go to the "Live Activities" tab</p>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                            <p className="text-sm">Add your questions (multiple choice, open text, ratings, word clouds)</p>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                            <p className="text-sm">Get a unique 6-digit PIN that participants can use to join</p>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                            <p className="text-sm">Start the activity and share the PIN with your audience</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Managing Your Activities 📊",
            content: (
                <div>
                    <p className="text-gray-600 mb-4">Your dashboard shows:</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 p-3 rounded text-center">
                            <div className="text-2xl mb-1">📋</div>
                            <div className="text-xs font-medium">Total Activities</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded text-center">
                            <div className="text-2xl mb-1">🟢</div>
                            <div className="text-xs font-medium">Live Activities</div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded text-center">
                            <div className="text-2xl mb-1">👥</div>
                            <div className="text-xs font-medium">Participants</div>
                        </div>
                        <div className="bg-orange-50 p-3 rounded text-center">
                            <div className="text-2xl mb-1">💬</div>
                            <div className="text-xs font-medium">Responses</div>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    const participantSteps = [
        {
            title: "Welcome! Ready to Participate? 🎉",
            content: (
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-3xl">🎯</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Join Interactive Activities</h3>
                    <p className="text-gray-600">
                        Participate in live polls, Q&A sessions, and interactive activities using simple PIN codes.
                    </p>
                </div>
            )
        },
        {
            title: "How to Join an Activity 📱",
            content: (
                <div>
                    <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                            <p className="text-sm">Get the 6-digit PIN from your activity host</p>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                            <p className="text-sm">Click "Join Activity" in the navigation</p>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                            <p className="text-sm">Enter the PIN and start participating!</p>
                        </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                            <strong>Tip:</strong> You can participate anonymously or with your account for a personalized experience.
                        </p>
                    </div>
                </div>
            )
        }
    ];

    const steps = userRole === 'host' ? hostSteps : participantSteps;

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2">
                            <span className="text-2xl">🌟</span>
                            <h2 className="text-xl font-bold text-gray-900">Getting Started</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-xl"
                        >
                            ×
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                                Step {currentStep + 1} of {steps.length}
                            </span>
                            <span className="text-sm text-gray-500">
                                {Math.round(((currentStep + 1) / steps.length) * 100)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="mb-8 min-h-[200px]">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            {steps[currentStep].title}
                        </h3>
                        {steps[currentStep].content}
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between">
                        <button
                            onClick={prevStep}
                            disabled={currentStep === 0}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ← Previous
                        </button>
                        
                        <div className="flex space-x-2">
                            {currentStep < steps.length - 1 ? (
                                <button
                                    onClick={nextStep}
                                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    Next →
                                </button>
                            ) : (
                                <div className="flex space-x-2">
                                    {userRole === 'host' ? (
                                        <Link
                                            to="/activity/host"
                                            onClick={onClose}
                                            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                        >
                                            Go to Dashboard
                                        </Link>
                                    ) : (
                                        <Link
                                            to="/join"
                                            onClick={onClose}
                                            className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                                        >
                                            Join Activity
                                        </Link>
                                    )}
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                    >
                                        Skip
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingGuide;