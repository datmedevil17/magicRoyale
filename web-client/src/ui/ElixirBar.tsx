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

    return (
        <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '300px',
            height: '35px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '18px',
            border: '2px solid #5b5b5b',
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}>
            <div style={{
                width: `${widthPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #d000ff 0%, #a800cc 100%)',
                transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />
            <span style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 'bold',
                fontFamily: 'Supercell-Magic, sans-serif',
                textShadow: '1px 1px 0 #000',
                zIndex: 10
            }}>{Math.floor(elixir)}</span>
        </div>
    );
};
