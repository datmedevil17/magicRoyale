import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useWallet } from '@solana/wallet-adapter-react';

export const WaitingScreen: React.FC = () => {
    const navigate = useNavigate();
    const wallet = useWallet();
    const [status, setStatus] = useState('Connecting to server...');

    useEffect(() => {
        if (!wallet.publicKey) {
            setStatus('Please connect your wallet');
            return;
        }

        const socket = io('http://localhost:3000', {
            query: {
                walletPublicKey: wallet.publicKey.toBase58()
            }
        });

        socket.on('connect', () => {
            console.log('Connected to server, requesting match...');
            setStatus('Searching for opponent...');
            socket.emit('find-match');
        });

        socket.on('game-start', (data) => {
            console.log('Game starting!', data);
            setStatus('Opponent found! Starting game...');
            setTimeout(() => {
                // Navigate with game IDs in state
                navigate('/game', {
                    state: {
                        gameId: data.gameId,
                        battleId: data.battleId,
                        role: data.role,
                        opponentWallet: data.opponentWallet
                    }
                });
            }, 1000);
        });

        socket.on('error', (err) => {
            console.error('Socket error:', err);
            setStatus(`Error: ${err.message}`);
        });

        return () => {
            socket.disconnect();
        };
    }, [navigate, wallet.publicKey]);

    return (
        <div className="w-screen h-screen bg-[#222] flex justify-center items-center  text-white overflow-hidden">
            {/* Mobile Container */}
            <div className="relative h-full max-h-[946px] w-full max-w-[528px] bg-black shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col items-center justify-end pb-32 border-x-4 border-black">

                {/* Background Image - Contained within mobile view */}
                <div className="absolute top-0 left-0 w-full h-full z-0">
                    <img src="/assets/splash_screen.png" alt="Loading" className="w-full h-full object-cover" />
                </div>

                {/* Overlay Content */}
                <div className="relative z-10 flex flex-col items-center gap-4 bg-black/60 p-6 rounded-xl border border-white/10 backdrop-blur-sm mx-4">
                    <h2 className="text-xl text-shadow-md text-[#fbce47] text-center leading-normal">{status}</h2>
                    {wallet.publicKey ? (
                        <div className="w-12 h-12 border-4 border-[#fff] border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <p className="text-sm text-white/80">Connect wallet to continue</p>
                    )}
                    <button
                        onClick={() => navigate('/menu')}
                        className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg border-2 border-red-800 hover:bg-red-500 active:scale-95 transition-all text-sm shadow-lg"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
