import { useEffect, useCallback } from 'react';
import useFastScroll from './useFastScroll';

const useKeyboardShortcuts = () => {
    // Use the fast scroll hook for scroll operations
    const { scrollToTop, scrollToBottom } = useFastScroll({
        threshold: 300,
        behavior: 'smooth'
    });
    
    // Create stable callback functions to use in the effect
    const handleScrollToTop = useCallback((instant = false) => {
        if (instant) {
            window.scrollTo({ top: 0, behavior: 'auto' });
        } else {
            scrollToTop();
        }
    }, [scrollToTop]);
    
    const handleScrollToBottom = useCallback((instant = false) => {
        if (instant) {
            window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'auto' });
        } else {
            scrollToBottom();
        }
    }, [scrollToBottom]);
    
    useEffect(() => {
        const handleKeyPress = (event) => {
            // Check if user is not typing in an input field
            const isInputFocused = document.activeElement.tagName === 'INPUT' || 
                                 document.activeElement.tagName === 'TEXTAREA' ||
                                 document.activeElement.isContentEditable;

            if (isInputFocused) return;

            switch (event.key) {
                case 'End':
                case 'PageDown':
                    // Fast scroll to bottom with End or PageDown key
                    event.preventDefault();
                    // Use the hook's scrollToBottom method
                    handleScrollToBottom(event.ctrlKey);
                    break;

                case 'Home':
                case 'PageUp':
                    // Fast scroll to top with Home or PageUp key
                    event.preventDefault();
                    // Use the hook's scrollToTop method
                    handleScrollToTop(event.ctrlKey);
                    break;

                case 'j':
                    // Scroll down (like vim)
                    if (event.ctrlKey) {
                        event.preventDefault();
                        window.scrollBy({
                            top: window.innerHeight * 0.8,
                            behavior: 'smooth',
                        });
                    }
                    break;

                case 'k':
                    // Scroll up (like vim)
                    if (event.ctrlKey) {
                        event.preventDefault();
                        window.scrollBy({
                            top: -window.innerHeight * 0.8,
                            behavior: 'smooth',
                        });
                    }
                    break;

                default:
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyPress);

        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, [handleScrollToTop, handleScrollToBottom]);
};

export default useKeyboardShortcuts;
