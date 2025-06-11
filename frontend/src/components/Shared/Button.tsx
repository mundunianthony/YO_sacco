import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  isLoading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button = ({
  onClick,
  type = 'button',
  disabled = false,
  isLoading = false,
  variant = 'primary',
  size = 'md',
  className = '',
  fullWidth = false,
  children,
}: ButtonProps) => {
  // Base classes
  const baseClasses = 'font-medium rounded-md focus:outline-none transition-colors duration-200 inline-flex items-center justify-center';
  
  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3',
  };
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm',
    secondary: 'bg-secondary-600 hover:bg-secondary-700 text-white shadow-sm',
    success: 'bg-success-600 hover:bg-success-700 text-white shadow-sm',
    danger: 'bg-error-600 hover:bg-error-700 text-white shadow-sm',
    warning: 'bg-warning-600 hover:bg-warning-700 text-white shadow-sm',
    outline: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm',
    link: 'bg-transparent text-primary-600 hover:text-primary-800 hover:underline',
  };
  
  // Disabled classes
  const disabledClasses = 'opacity-50 cursor-not-allowed';
  
  // Full width class
  const widthClass = fullWidth ? 'w-full' : '';
  
  // Combine all classes
  const buttonClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${disabled || isLoading ? disabledClasses : ''}
    ${widthClass}
    ${className}
  `;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={buttonClasses}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;