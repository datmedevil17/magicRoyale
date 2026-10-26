import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useWallet } from '@solana/wallet-adapter-react';
import { BN } from '@coral-xyz/anchor';
import { toast, Toaster } from 'react-hot-toast';
import { useGameProgram } from '../hooks/use-game-program';
import { getSelectedMap } from '../game/config/Maps';
import { SERVER_URL } from '../config/server';


type ViewState = 'select' | 'create' | 'join';

// How long a 2v2 joiner waits for the server to acknowledge its on-chain join before moving on
const CHAIN_JOINED_ACK_MS = 3000;

export const WaitingScreen: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const wallet = useWallet();
    const { createGame, joinGame, createGame2v2, joinGame2v2 } = useGameProgram();
    const is2v2 = (location.state as { mode?: string } | null)?.mode === '2v2';

    // The socket handlers below are registered once; read the latest program calls through refs
    const joinGameRef = useRef(joinGame);
    const joinGame2v2Ref = useRef(joinGame2v2);
    joinGameRef.current = joinGame;
    joinGame2v2Ref.current = joinGame2v2;

    const [view, setView] = useState<ViewState>('select');
    const [status, setStatus] = useState('');
    const [socket, setSocket] = useState<Socket | null>(null);
    const [createdGameId, setCreatedGameId] = useState<string>('');
    const [joinInput, setJoinInput] = useState<string>('');
    const [lobbyCount, setLobbyCount] = useState(1); // 2v2: players in the lobby

    // Connect socket on mount
    useEffect(() => {
        if (!wallet.publicKey) {
            setStatus('Please connect your wallet');
            return;
        }

        const newSocket = io(SERVER_URL, {
            query: { walletPublicKey: wallet.publicKey.toBase58() },
        });

        newSocket.on('connect', () => {
            console.log('[WaitingScreen] Socket connected.');
            setSocket(newSocket);
        });

        // Remove room-created listener since frontend generates the ID now

        newSocket.on('lobby-update', (data: { players: number }) => setLobbyCount(data.players));

        // Server sends game-start once the room is full (2 players, or 4 for 2v2)
        newSocket.on('game-start', async (data: {
            gameId: string;       // u64 as decimal string
            role: 'player1' | 'player2' | 'player3' | 'player4';
            opponentWallet?: string;
            mapType?: string;     // arena chosen by the room creator
            mode?: '2v2';
        }) => {
            console.log('[WaitingScreen] Received game-start:', data);
            const gameIdBn = new BN(data.gameId);

            if (data.mode === '2v2') {
                try {
                    if (data.role !== 'player1') { // player1 already called createGame2v2
                        setStatus('Joining 2v2 game on-chain...');
                        const p = joinGame2v2Ref.current(gameIdBn);
                        toast.promise(p, {
                            loading: 'Joining 2v2 game on-chain...',
                            success: 'Joined game!',
                            error: (e) => `Failed: ${e.message}`,
                        });
                        await p;
                        // player1 can only start once every joiner is in the battle account
                        await new Promise<void>(resolve => {
                            const fallback = setTimeout(resolve, CHAIN_JOINED_ACK_MS);
                            newSocket.emit('chain-joined', { gameId: data.gameId }, () => {
                                clearTimeout(fallback);
                                resolve();
                            });
                        });
                    }

                    setStatus('All players found! Starting...');
                    newSocket.disconnect(); // GameWrapper2v2 opens its own socket
                    navigate('/game2v2', { state: { gameId: data.gameId, role: data.role } });
                } catch (err: any) {
                    setStatus(`Error: ${err.message}`);
                    setView('select');
                }
                return;
            }

            try {
                if (data.role === 'player2') { // Player 1 already called createGame
                    setStatus('Joining game on-chain...');
                    const p = joinGameRef.current(gameIdBn);
                    toast.promise(p, {
                        loading: 'Joining game on-chain...',
                        success: 'Joined game!',
                        error: (e) => `Failed: ${e.message}`,
                    });
                    await p;
                }

                setStatus('Opponent found! Starting...');
                console.log('[WaitingScreen] On-chain setup complete. Navigating to /game...');
                newSocket.disconnect(); // GameWrapper will open its own socket
                setTimeout(() => {
                    navigate('/game', {
                        state: {
                            gameId: data.gameId,
                            role: data.role,
                            opponentWallet: data.opponentWallet,
                            mapType: data.mapType,
                        },
                    });
                }, 800);
            } catch (err: any) {
                setStatus(`Error: ${err.message}`);
                setView('select');
            }
        });

        newSocket.on('error', (err: any) => {
            toast.error(err.message || 'An error occurred');
            setStatus('');
            setView('select');
        });

        return () => { newSocket.disconnect(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wallet.publicKey]);

    const handleCreateClick = async () => {
        if (!socket) return;
        setView('create');

        // Generate a random 6-digit ID on the frontend
        const randomId = String(Math.floor(100000 + Math.random() * 900000));
        setCreatedGameId(randomId);
        setStatus('Creating game on-chain...');

        try {
            const gameIdBn = new BN(randomId);
            const p = is2v2 ? createGame2v2(gameIdBn) : createGame(gameIdBn);
            toast.promise(p, {
                loading: 'Creating game on-chain...',
                success: is2v2 ? 'Game created! Waiting for players...' : 'Game created! Waiting for opponent...',
                error: (e) => `Failed: ${e.message}`,
            });
            await p;

            // Only AFTER successful on-chain creation do we open the server room
            if (is2v2) {
                setLobbyCount(1);
                socket.emit('create-room', { gameId: randomId, mode: '2v2' });
                setStatus('Share the ID with 3 friends: waiting for players...');
            } else {
                socket.emit('create-room', { gameId: randomId, mapType: getSelectedMap() });
                setStatus('Waiting for opponent to join...');
            }
        } catch (err: any) {
            setStatus(`Error: ${err.message}`);
            setView('select');
        }
    };

    const handleJoinClick = () => {
        setView('join');
    };

    const submitJoin = () => {
        if (!socket || !joinInput.trim()) return;
        setStatus('Requesting to join room...');
        socket.emit('join-room', { gameId: joinInput.trim() });
        if (is2v2) setStatus('Joined lobby: waiting for players...');
    };

    return (
        <div className="w-screen h-screen bg-[#222] flex justify-center items-center text-white overflow-hidden">
            <Toaster position="top-center" toastOptions={{
                style: { background: '#333', color: '#fff', border: '1px solid #444' },
            }} />
            <div className="relative h-full max-h-[946px] w-full max-w-[528px] bg-black shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col items-center justify-end pb-32 border-x-4 border-black">
                <div className="absolute top-0 left-0 w-full h-full z-0">
                    <img src="/assets/splash_screen.png" alt="Background" className="w-full h-full object-cover" />
                </div>

                <div className="relative z-10 flex flex-col items-center gap-4 bg-black/60 p-8 rounded-xl border border-white/10 backdrop-blur-sm mx-4 min-w-[300px]">
                    {!wallet.publicKey ? (
                        <>
                            <h2 className="text-xl text-[#fbce47] mb-2">Connect wallet to play</h2>
                            <button onClick={() => navigate('/menu')} className="px-6 py-2 bg-red-600 rounded-lg shadow mt-2">Go Back</button>
                        </>
                    ) : view === 'select' ? (
                        status ? (
                            <h2 className="text-xl text-[#fbce47] animate-pulse">{status}</h2>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold text-[#64cbff] mb-6 drop-shadow-md">{is2v2 ? '2v2 Battle Setup' : 'Battle Setup'}</h2>
                                <button
                                    onClick={handleCreateClick}
                                    className="w-full py-3 bg-[#00d048] hover:bg-[#00e050] text-white font-bold rounded-lg shadow-lg border-b-4 border-green-800 active:translate-y-1 active:border-b-0 transition-all text-xl"
                                >
                                    Create Game
                                </button>
                                <span className="text-gray-400 font-semibold my-2">OR</span>
                                <button
                                    onClick={handleJoinClick}
                                    className="w-full py-3 bg-[#2b6fc2] hover:bg-[#3282e3] text-white font-bold rounded-lg shadow-lg border-b-4 border-blue-900 active:translate-y-1 active:border-b-0 transition-all text-xl"
                                >
                                    Join Game
                                </button>

                                <button
                                    onClick={() => navigate('/menu')}
                                    className="mt-6 px-4 py-2 text-gray-400 hover:text-white transition-colors underline opacity-70 hover:opacity-100"
                                >
                                    Cancel
                                </button>
                            </>
                        )
                    ) : view === 'create' ? (
                        <div className="flex flex-col items-center gap-4 text-center">
                            <h2 className="text-2xl font-bold text-[#64cbff]">Your Game ID</h2>
                            {createdGameId ? (
                                <div className="bg-black/50 px-8 py-4 rounded-xl border-2 border-[#fbce47] shadow-[0_0_15px_rgba(251,206,71,0.2)]">
                                    <span className="text-5xl font-mono tracking-[0.2em] text-[#fbce47] drop-shadow-md ml-[0.2em]">{createdGameId}</span>
                                </div>
                            ) : (
                                <div className="w-12 h-12 border-4 border-[#fbce47] border-t-transparent rounded-full animate-spin my-4" />
                            )}
                            <p className="text-sm text-[#fbce47]/80 mt-2 min-h-[20px]">{status}</p>
                            {is2v2 && createdGameId && (
                                <p className="text-lg font-bold text-white">Players: {lobbyCount}/4</p>
                            )}

                            <button
                                onClick={() => navigate('/menu')}
                                className="mt-4 px-6 py-2 bg-red-600/80 hover:bg-red-500 text-white rounded-lg transition-colors text-sm"
                            >
                                Cancel Game
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 w-full">
                            <h2 className="text-2xl font-bold text-[#64cbff] mb-2">Join Game</h2>
                            <p className="text-xs text-gray-300 mb-2">Enter the 6-digit Game ID</p>

                            {status && <p className="text-sm text-[#fbce47] animate-pulse">{status}</p>}
                            {is2v2 && status && <p className="text-lg font-bold text-white">Players: {lobbyCount}/4</p>}

                            <input
                                type="text"
                                maxLength={6}
                                placeholder="000000"
                                value={joinInput}
                                onChange={(e) => setJoinInput(e.target.value.replace(/[^0-9]/g, ''))} // Numbers only
                                className="w-full bg-black/50 border-2 border-white/20 rounded-lg px-4 py-3 text-center text-3xl font-mono text-white tracking-[0.3em] focus:border-[#64cbff] focus:outline-none transition-colors"
                            />

                            <div className="flex w-full gap-3 mt-4">
                                <button
                                    onClick={() => { setView('select'); setStatus(''); }}
                                    className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={submitJoin}
                                    disabled={joinInput.length !== 6 || !!status}
                                    className="flex-1 py-3 bg-[#00d048] hover:bg-[#00e050] disabled:bg-gray-600 disabled:text-gray-400 text-white font-bold rounded-lg shadow-lg border-b-4 border-green-800 disabled:border-b-0 active:translate-y-1 active:border-b-0 transition-all"
                                >
                                    Join
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
