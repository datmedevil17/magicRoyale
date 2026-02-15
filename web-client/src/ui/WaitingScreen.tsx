import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

export const WaitingScreen: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // We need a singleton socket connection ideally, but for now let's reuse logic or create new.
        // The Network class is inside Phaser.
        // We should probably lift the socket connection to a Context or external module 
        // that both React and Phaser can access.
        // For simplicity in this step, let's just use a socket here to listen for start.
        // BUT, if we use a new socket here, the ID might differ from what Phaser uses later?
        // Actually, the requirement says "when second player join both go to game".
        // The server needs to match them.

        const socket = io('http://localhost:3000');

        socket.on('connect', () => {
            console.log('Connected to server, requesting match...');
            socket.emit('find-match');
        });

        socket.on('game-start', (data) => {
            console.log('Game starting!', data);
            // Verify we are part of the game?
            // Data could contain 'opponentId' etc.
            // Pass this info to the Game via state or params?
            navigate('/game');
        });

        return () => {
            socket.disconnect();
        };
    }, [navigate]);

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            backgroundColor: '#333',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
        }}>
            <h2>Searching for Opponent...</h2>
            <div className="loader" style={{
                border: '8px solid #f3f3f3',
                borderTop: '8px solid #3498db',
                borderRadius: '50%',
                width: '60px',
                height: '60px',
                animation: 'spin 2s linear infinite',
                margin: '20px'
            }}></div>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};
