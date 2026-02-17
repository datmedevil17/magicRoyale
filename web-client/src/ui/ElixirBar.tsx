import React, { useEffect, useState } from 'react';
import { EventBus, EVENTS } from '../game/EventBus';

export const ElixirBar: React.FC = () => {
    const [elixir, setElixir] = useState(5);

    useEffect(() => {
        const handleElixirUpdate = (newElixir: number) => {
            setElixir(newElixir);
        };

        EventBus.on(EVENTS.ELIXIR_UPDATE, handleElixirUpdate);

        return () => {
            EventBus.off(EVENTS.ELIXIR_UPDATE, handleElixirUpdate);
        };
    }, []);

    const widthPercent = (elixir / 10) * 100;
    const displayElixir = Math.floor(elixir);

    return (
        <div style={{
            position: 'absolute',
            bottom: '110px', // Moved up to be below card deck
            left: '50%',
            transform: 'translateX(-50%)',
            width: '320px',
            height: '40px',
            backgroundColor: 'rgba(20, 20, 35, 0.9)',
            borderRadius: '20px',
            border: '3px solid rgba(148, 0, 211, 0.8)',
            overflow: 'hidden',
            boxShadow: '0 6px 12px rgba(0,0,0,0.5), inset 0 2px 4px rgba(0,0,0,0.3)'
        }}>
            {/* Animated fill */}
            <div style={{
                width: `${widthPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #d000ff 0%, #ff00ff 50%, #d000ff 100%)',
                transition: 'width 0.5s ease-out', // Smoother, longer transition
                boxShadow: widthPercent > 50 ? '0 0 10px rgba(255, 0, 255, 0.6)' : 'none',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Shimmer effect */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    animation: 'shimmer 2s infinite'
                }} />
            </div>
            
            {/* Elixir count display */}
            <span style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#fff',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                fontFamily: 'Supercell-Magic, sans-serif',
                textShadow: '2px 2px 4px #000',
                zIndex: 10
            }}>
                {displayElixir}/10
            </span>

            {/* Add keyframes animation */}
            <style>{`
                @keyframes shimmer {
                    0% { left: -100%; }
                    100% { left: 200%; }
                }
            `}</style>
        </div>
    );
};
