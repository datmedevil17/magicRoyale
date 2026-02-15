import React, { useEffect, useState } from 'react';

export const MatchTimer: React.FC = () => {
    const [timeLeft, setTimeLeft] = useState(9999); // No effective time limit

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: '5px 10px',
            borderRadius: '5px',
            pointerEvents: 'none'
        }}>
            {formatTime(timeLeft)}
        </div>
    );
};
