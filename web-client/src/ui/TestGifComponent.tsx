import React, { useState, useEffect } from 'react';

export const TestGifComponent: React.FC = () => {
    const walkGif = '/assets/gifs/Valkyrie_walk_opponent.gif';
    const fightGif = '/assets/gifs/Valkyrie_fight_opponent.gif';

    // Start with walk
    const [currentGif, setCurrentGif] = useState(walkGif);
    const [status, setStatus] = useState('Walking');

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentGif(prev => {
                if (prev === walkGif) {
                    setStatus('Fighting');
                    return fightGif;
                } else {
                    setStatus('Walking');
                    return walkGif;
                }
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            backgroundColor: '#000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
        }}>
            <h1>GIF Render Test</h1>
            <h2 style={{ color: status === 'Walking' ? '#bfdbfe' : '#fca5a5' }}>{status}</h2>
            <div style={{
                border: '2px solid ' + (status === 'Walking' ? 'blue' : 'red'),
                padding: '20px',
                backgroundColor: '#222',
                borderRadius: '8px',
                minWidth: '200px',
                minHeight: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <img src={currentGif} alt="Archer Animation" key={currentGif} />
            </div>
            <p style={{ marginTop: '10px' }}>Path: {currentGif}</p>
        </div>
    );
};
