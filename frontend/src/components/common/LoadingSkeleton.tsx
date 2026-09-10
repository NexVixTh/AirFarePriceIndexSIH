import React from 'react';

interface LoadingSkeletonProps {
  className?: string;
  rows?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ className = 'h-8 w-full', rows = 1 }) => {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`bg-gov-surface/70 rounded border border-gov-border/40 ${className}`}
        />
      ))}
    </div>
  );
};
