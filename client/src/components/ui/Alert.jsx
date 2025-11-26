import React from 'react';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiAlertTriangle, FiX } from 'react-icons/fi';
import Button from './Button';

const Alert = ({ 
  type = 'info', 
  title, 
  children, 
  onClose,
  className = '',
  ...props 
}) => {
  const baseClasses = 'p-4 rounded-xl border font-sans';
  
  const types = {
    success: {
      classes: 'bg-success-50 border-success-200 text-success-800 dark:bg-success-900/20 dark:border-success-800 dark:text-success-200',
      icon: FiCheckCircle,
      iconColor: 'text-success-600 dark:text-success-400'
    },
    error: {
      classes: 'bg-error-50 border-error-200 text-error-800 dark:bg-error-900/20 dark:border-error-800 dark:text-error-200',
      icon: FiAlertCircle,
      iconColor: 'text-error-600 dark:text-error-400'
    },
    warning: {
      classes: 'bg-warning-50 border-warning-200 text-warning-800 dark:bg-warning-900/20 dark:border-warning-800 dark:text-warning-200',
      icon: FiAlertTriangle,
      iconColor: 'text-warning-600 dark:text-warning-400'
    },
    info: {
      classes: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
      icon: FiInfo,
      iconColor: 'text-blue-600 dark:text-blue-400'
    }
  };

  const { classes, icon: Icon, iconColor } = types[type];

  return (
    <div className={`${baseClasses} ${classes} ${className}`} {...props}>
      <div className="flex">
        <Icon className={`flex-shrink-0 w-5 h-5 mt-0.5 ${iconColor}`} />
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-serif font-medium mb-1">
              {title}
            </h3>
          )}
          <div className="text-sm font-literary">
            {children}
          </div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <Button
              variant="ghost"
              size="xs"
              icon={FiX}
              onClick={onClose}
              className={`${iconColor} hover:bg-current hover:bg-opacity-10`}
              aria-label="Close alert"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;