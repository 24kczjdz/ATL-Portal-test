import React, { useState, useEffect } from 'react';

const QANavigation = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [currentQAIndex, setCurrentQAIndex] = useState(-1);
    const [qaPositions, setQAPositions] = useState([]);

    useEffect(() => {
        const updateQAPositions = () => {
            const chatContainer = document.getElementById('chatContainer');
            if (!chatContainer) return;

            // Find all Q&A pairs (user message followed by bot response)
            const chatMessages = Array.from(chatContainer.querySelectorAll('.chat-message'));
            const positions = [];
            
            for (let i = 0; i < chatMessages.length - 1; i++) {
                const userMessage = chatMessages[i];
                const botMessage = chatMessages[i + 1];
                
                // Check if this is a user message followed by a bot message
                const isUserMessage = userMessage.querySelector('.bg-blue-500');
                const isBotMessage = botMessage.querySelector('.fa-user-graduate') || 
                                   botMessage.textContent.includes('ATLab');
                
                if (isUserMessage && isBotMessage) {
                    positions.push({
                        userIndex: i,
                        botIndex: i + 1,
                        userElement: userMessage,
                        botElement: botMessage,
                        position: userMessage.offsetTop
                    });
                }
            }
            
            setQAPositions(positions);
            setIsVisible(positions.length > 1); // Show only if there are multiple Q&A pairs
        };

        // Update positions when messages change
        const observer = new MutationObserver(updateQAPositions);
        const chatContainer = document.getElementById('chatContainer');
        
        if (chatContainer) {
            observer.observe(chatContainer, { 
                childList: true, 
                subtree: true,
                attributes: false
            });
            updateQAPositions();
        }

        // Also update on scroll to track current position
        const handleScroll = () => {
            if (qaPositions.length === 0) return;
            
            const container = document.getElementById('chatContainer');
            if (!container) return;
            
            const scrollTop = container.scrollTop;
            const containerHeight = container.clientHeight;
            const viewportCenter = scrollTop + containerHeight / 2;
            
            // Find which Q&A pair is currently in view
            let closestIndex = -1;
            let closestDistance = Infinity;
            
            qaPositions.forEach((qa, index) => {
                const distance = Math.abs(qa.position - viewportCenter);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = index;
                }
            });
            
            setCurrentQAIndex(closestIndex);
        };

        const scrollContainer = document.getElementById('chatContainer');
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll);
        }

        return () => {
            observer.disconnect();
            if (scrollContainer) {
                scrollContainer.removeEventListener('scroll', handleScroll);
            }
        };
    }, [qaPositions]);

    const scrollToQA = (index) => {
        if (index < 0 || index >= qaPositions.length) return;
        
        const qa = qaPositions[index];
        const container = document.getElementById('chatContainer');
        
        if (container && qa) {
            container.scrollTo({
                top: qa.position - 20, // Small offset from top
                behavior: 'smooth'
            });
            setCurrentQAIndex(index);
        }
    };

    const scrollToPrevious = () => {
        const prevIndex = Math.max(0, currentQAIndex - 1);
        scrollToQA(prevIndex);
    };

    const scrollToNext = () => {
        const nextIndex = Math.min(qaPositions.length - 1, currentQAIndex + 1);
        scrollToQA(nextIndex);
    };

    if (!isVisible || qaPositions.length <= 1) {
        return null;
    }

    return (
        <div className="fixed left-6 top-1/2 transform -translate-y-1/2 z-40 flex flex-col gap-2">
            {/* Previous Q&A Button */}
            <button
                onClick={scrollToPrevious}
                disabled={currentQAIndex <= 0}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                title="Previous Question & Answer"
                aria-label="Scroll to previous question and answer"
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
                        d="M5 15l7-7 7 7"
                    />
                </svg>
            </button>

            {/* Q&A Counter */}
            <div className="bg-white bg-opacity-90 text-purple-700 px-2 py-1 rounded-full text-xs font-medium shadow-md text-center min-w-[50px]">
                {currentQAIndex + 1} / {qaPositions.length}
            </div>

            {/* Next Q&A Button */}
            <button
                onClick={scrollToNext}
                disabled={currentQAIndex >= qaPositions.length - 1}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                title="Next Question & Answer"
                aria-label="Scroll to next question and answer"
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
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>
        </div>
    );
};

export default QANavigation;