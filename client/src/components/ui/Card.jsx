import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  padding = 'default',
  shadow = 'default',
  hover = true,
  onClick,
  ...props 
}) => {
  const baseClasses = 'bg-white dark:bg-gray-800 border border-primary-200 dark:border-gray-700 transition-all duration-300';
  
  const paddings = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  const shadows = {
    none: '',
    sm: 'shadow-sm',
    default: 'shadow-soft',
    lg: 'shadow-soft-lg',
  };

  const hoverClasses = hover ? 'hover:shadow-soft-lg hover:-translate-y-0.5 cursor-pointer' : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${baseClasses} ${paddings[padding]} ${shadows[shadow]} ${hoverClasses} ${clickableClasses} rounded-xl ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => (
  <div className={`border-b border-primary-200 dark:border-gray-700 pb-4 mb-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-xl font-serif text-primary-900 dark:text-white ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '' }) => (
  <p className={`text-primary-600 dark:text-gray-300 font-literary mt-1 ${className}`}>
    {children}
  </p>
);

const CardContent = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '' }) => (
  <div className={`border-t border-primary-200 dark:border-gray-700 pt-4 mt-6 ${className}`}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;