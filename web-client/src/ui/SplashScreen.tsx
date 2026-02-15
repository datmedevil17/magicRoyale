import React from 'react';
import { useNavigate } from 'react-router-dom';

export const SplashScreen: React.FC = () => {
    const navigate = useNavigate();

    const handlePlay = () => {
        navigate('/waiting');
    };

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            backgroundColor: '#222',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontFamily: 'Segoe UI, sans-serif'
        }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '2rem', textShadow: '2px 2px 4px #000' }}>Clash Royale Web</h1>
            <img src="/assets/clash_royale_logo.png" alt="Logo" style={{ width: '300px', marginBottom: '3rem' }} />

            <button
                onClick={handlePlay}
                style={{
                    padding: '15px 40px',
                    fontSize: '1.5rem',
                    backgroundColor: '#fcd34d',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 0 #d97706',
                    fontWeight: 'bold',
                    color: '#4b5563',
                    transition: 'transform 0.1s'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(4px)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
                PLAY
            </button>
        </div>
    );
};
