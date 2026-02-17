import React from 'react';

interface SkeletonProps {
    className?: string;
    count?: number;
    wrapperClass?: string;
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({ className = '', count = 1, wrapperClass = '' }) => {
    return (
        <div className={`w-full flex flex-col gap-2 ${wrapperClass}`}>
            {Array.from({ length: count }).map((_, idx) => (
                <div
                    key={idx}
                    className={`bg-white/10 animate-pulse rounded ${className}`}
                ></div>
            ))}
        </div>
    );
};
