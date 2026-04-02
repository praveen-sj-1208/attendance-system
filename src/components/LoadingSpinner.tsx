import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...', className = '' }) => (
  <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3" />
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

export default LoadingSpinner;
