import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
}

const Card = ({
  title,
  subtitle,
  children,
  footer,
  className = '',
  isLoading = false,
}: CardProps) => {
  return (
    <div className={`bg-white rounded-lg shadow-card overflow-hidden ${className}`}>
      {isLoading ? (
        <div className="animate-pulse p-6">
          {title && (
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          )}
          {subtitle && (
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          )}
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
          {footer && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          )}
        </div>
      ) : (
        <>
          {(title || subtitle) && (
            <div className="px-6 py-4 border-b border-gray-200">
              {title && (
                <h3 className="text-lg font-heading font-medium text-gray-900">{title}</h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
          )}
          <div className="px-6 py-4">{children}</div>
          {footer && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              {footer}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Card;