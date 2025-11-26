import React from 'react';

const Badge = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center font-serif font-medium';
  
  const variants = {
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-100',
    secondary: 'bg-accent-100 text-accent-800 dark:bg-accent-800 dark:text-accent-100',
    success: 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-100',
    warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-100',
    error: 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-100',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-xs rounded-md',
    sm: 'px-2.5 py-1 text-xs rounded-lg',
    md: 'px-3 py-1.5 text-sm rounded-lg',
    lg: 'px-4 py-2 text-base rounded-xl',
  };

  return (
    <span
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;