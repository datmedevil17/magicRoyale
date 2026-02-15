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
            height: '30px',
            backgroundColor: '#333',
            borderRadius: '15px',
            border: '2px solid #000',
            overflow: 'hidden'
        }}>
            <div style={{
                width: `${widthPercent}%`,
                height: '100%',
                backgroundColor: '#d000ff',
                transition: 'width 0.2s ease-in-out'
            }} />
            <span style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                fontWeight: 'bold',
                textShadow: '1px 1px 0 #000'
            }}>{Math.floor(elixir)} / 10</span>
        </div>
    );
};
