import React from 'react';
import useFastScroll from '../hooks/useFastScroll';

/**
 * A reusable ScrollToTop component that displays a button to scroll back to the top
 * when the user has scrolled down the page.
 * 
 * @param {Object} props - Component props
 * @param {string} props.position - Button position ('bottom-right', 'bottom-left', etc.) (default: 'bottom-right')
 * @param {number} props.threshold - Scroll position threshold to show button (default: 300)
 * @param {string} props.behavior - Scroll behavior (default: 'smooth')
 * @returns {JSX.Element|null} - ScrollToTop button or null if not visible
 */
const ScrollToTop = ({
  position = 'bottom-right',
  threshold = 300,
  behavior = 'smooth',
}) => {
  const { showScroll, scrollToTop } = useFastScroll({ 
    threshold,
    behavior
  });
  
  // Position classes based on the position prop
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-24 right-6',
    'top-left': 'top-24 left-6',
  };
  
  const buttonClasses = `
    fixed ${positionClasses[position] || positionClasses['bottom-right']}
    w-12 h-12 rounded-full bg-blue-500 text-white shadow-lg
    flex items-center justify-center z-50
    hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300
    transform hover:scale-110 transition-all duration-200
    ${showScroll ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}
  `;
  
  return (
    <button
      className={buttonClasses}
      onClick={scrollToTop}
      aria-label="Scroll to top"
      title="Scroll to top"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    </button>
  );
};

export default ScrollToTop;
