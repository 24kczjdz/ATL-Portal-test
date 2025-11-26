import React from 'react';
import { FiLoader } from 'react-icons/fi';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary',
  className = '',
  text,
  fullscreen = false
}) => {
  const sizes = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const colors = {
    primary: 'text-primary-600 dark:text-primary-400',
    secondary: 'text-accent-600 dark:text-accent-400',
    white: 'text-white',
    gray: 'text-gray-600 dark:text-gray-400',
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <FiLoader className={`${sizes[size]} ${colors[color]} animate-spin`} />
      {text && (
        <p className={`mt-3 text-sm font-literary ${colors[color]}`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 bg-opacity-80 dark:bg-opacity-80 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;