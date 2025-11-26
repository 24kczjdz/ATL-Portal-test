import React, { forwardRef } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const Input = forwardRef(({ 
  label,
  error,
  helperText,
  type = 'text',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  showPasswordToggle = false,
  className = '',
  containerClassName = '',
  ...props 
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const baseClasses = 'w-full border rounded-xl transition-colors font-sans focus:outline-none focus:ring-2 focus:ring-primary-500';
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg',
  };

  const stateClasses = error 
    ? 'border-error-300 dark:border-error-600 bg-error-50 dark:bg-error-900/20 text-error-900 dark:text-error-100 focus:border-error-500'
    : 'border-primary-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-primary-900 dark:text-white focus:border-primary-500';

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-serif text-primary-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {Icon && iconPosition === 'left' && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400 dark:text-gray-500" />
        )}
        
        <input
          ref={ref}
          type={inputType}
          className={`
            ${baseClasses} 
            ${sizes[size]} 
            ${stateClasses} 
            ${Icon && iconPosition === 'left' ? 'pl-10' : ''} 
            ${(Icon && iconPosition === 'right') || showPasswordToggle ? 'pr-10' : ''} 
            ${className}
          `}
          {...props}
        />
        
        {Icon && iconPosition === 'right' && !showPasswordToggle && (
          <Icon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400 dark:text-gray-500" />
        )}
        
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-gray-300"
          >
            {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
          </button>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-error-600 dark:text-error-400 font-sans">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-primary-500 dark:text-gray-400 font-sans">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;