import React, { useState } from 'react';

const ShortcutsHelp = () => {
    const [isVisible, setIsVisible] = useState(false);

    const shortcuts = [
        { keys: 'End / PageDown', description: 'Scroll to bottom (smooth)' },
        { keys: 'Ctrl + End / PageDown', description: 'Scroll to bottom (instant)' },
        { keys: 'Home / PageUp', description: 'Scroll to top (smooth)' },
        { keys: 'Ctrl + Home / PageUp', description: 'Scroll to top (instant)' },
        { keys: 'Ctrl + J', description: 'Scroll down one page' },
        { keys: 'Ctrl + K', description: 'Scroll up one page' },
        { keys: '↑ button', description: 'Scroll to top button (appears when scrolled down)' },
        { keys: '↓ buttons', description: 'Scroll to bottom buttons (smooth/fast)' },
    ];

    return (
        <div className="fixed bottom-6 left-6 z-50">
            <button
                onClick={() => setIsVisible(!isVisible)}
                className="bg-gray-700 hover:bg-gray-800 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                title="Keyboard shortcuts help"
                aria-label="Show keyboard shortcuts"
            >
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            </button>

            {isVisible && (
                <div className="absolute bottom-16 left-0 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80 max-w-sm">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-gray-800">Keyboard Shortcuts</h3>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    </div>
                    <div className="space-y-2">
                        {shortcuts.map((shortcut, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                                    {shortcut.keys}
                                </span>
                                <span className="text-gray-600 ml-2">{shortcut.description}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                            💡 Shortcuts work when not typing in input fields
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShortcutsHelp;
