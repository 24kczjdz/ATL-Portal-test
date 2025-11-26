import { useState, useEffect, useCallback } from 'react';

/**
 * A custom React hook for efficient scrolling with throttled scroll event handling
 * and smooth animations for improved performance.
 * 
 * @param {Object} options - Configuration options for the fast scroll behavior
 * @param {number} options.threshold - Distance in pixels from the top before showing scroll UI (default: 200)
 * @param {string} options.behavior - Scroll behavior ('auto', 'smooth') (default: 'smooth')
 * @param {number} options.throttleMs - Throttle time for scroll events in milliseconds (default: 100)
 * @returns {Object} - Object containing scrolling state and scroll functions
 */
const useFastScroll = (options = {}) => {
  const {
    threshold = 200,
    behavior = 'smooth',
    throttleMs = 100
  } = options;
  
  const [showScroll, setShowScroll] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  
  // Throttled scroll handler for performance optimization
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    setScrollY(currentScrollY);
    setShowScroll(currentScrollY > threshold);
  }, [threshold]);
  
  // Throttling implementation
  useEffect(() => {
    let lastCall = 0;
    let requestId = null;
    
    const throttledScrollHandler = () => {
      const now = Date.now();
      
      if (now - lastCall >= throttleMs) {
        lastCall = now;
        handleScroll();
      } else if (!requestId) {
        // Schedule the next call after the throttle period
        requestId = window.setTimeout(() => {
          requestId = null;
          handleScroll();
        }, throttleMs - (now - lastCall));
      }
    };
    
    window.addEventListener('scroll', throttledScrollHandler);
    
    // Initialize scroll state
    handleScroll();
    
    // Cleanup event listeners
    return () => {
      window.removeEventListener('scroll', throttledScrollHandler);
      if (requestId) {
        window.clearTimeout(requestId);
      }
    };
  }, [handleScroll, throttleMs]);
  
  // Smooth scroll to top implementation
  const scrollToTop = () => {
    setIsScrolling(true);
    window.scrollTo({
      top: 0,
      behavior: behavior
    });
    
    // Reset the scrolling state after animation completes
    const scrollTimeout = setTimeout(() => {
      setIsScrolling(false);
    }, behavior === 'smooth' ? 500 : 50);
    
    return () => clearTimeout(scrollTimeout);
  };
  
  // Smooth scroll to bottom implementation
  const scrollToBottom = () => {
    setIsScrolling(true);
    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
    
    window.scrollTo({
      top: documentHeight,
      behavior: behavior
    });
    
    // Reset the scrolling state after animation completes
    const scrollTimeout = setTimeout(() => {
      setIsScrolling(false);
    }, behavior === 'smooth' ? 500 : 50);
    
    return () => clearTimeout(scrollTimeout);
  };
  
  // Scroll to a specific element
  const scrollToElement = (elementId, offset = 0) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    setIsScrolling(true);
    const elementPosition = element.getBoundingClientRect().top + window.scrollY - offset;
    
    window.scrollTo({
      top: elementPosition,
      behavior: behavior
    });
    
    // Reset the scrolling state after animation completes
    const scrollTimeout = setTimeout(() => {
      setIsScrolling(false);
    }, behavior === 'smooth' ? 500 : 50);
    
    return () => clearTimeout(scrollTimeout);
  };
  
  return {
    showScroll,
    scrollY,
    isScrolling,
    scrollToTop,
    scrollToBottom,
    scrollToElement
  };
};

export default useFastScroll;
