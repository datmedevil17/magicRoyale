import React from 'react';

interface MobileLayoutProps {
    children: React.ReactNode;
    className?: string; // Allow additional classes for inner content
    bgClass?: string;   // Background class for the mobile container
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children, className = '', bgClass = 'bg-[#222]' }) => {
    return (
        <div className="w-screen h-screen bg-[#111] flex justify-center items-center overflow-hidden">
            {/* Mobile Container */}
            <div className={`relative w-full max-w-[480px] h-full max-h-[900px] ${bgClass} shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden ${className}`}>
                {children}
            </div>
        </div>
    );
};
