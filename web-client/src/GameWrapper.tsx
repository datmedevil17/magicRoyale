import { useRef, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { Toaster, toast } from 'react-hot-toast';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { io, Socket } from 'socket.io-client';
import StartGame from './game/PhaserGame';
import { ElixirBar } from './ui/ElixirBar';
import { CardDeck } from './ui/CardDeck';
import { GameHUD } from './ui/GameHUD';
import { VictoryScreen } from './ui/VictoryScreen';
import { EventBus, EVENTS } from './game/EventBus';
import { useGameProgram } from './hooks/use-game-program';

const SERVER_URL = 'http://localhost:3000';

export const GameWrapper = () => {
    const gameRef = useRef<Phaser.Game | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const location = useLocation();
    const wallet = useWallet();
    const { deployTroop, delegateGame, endGame, erConnection, program } = useGameProgram();

    // gameId is a u64 decimal string from navigation state; battle PDA derived on-chain.
    const gameData = location.state as {
        gameId: string;
        role: string;
        opponentWallet: string;
    } | null;

    const gameIdBn = gameData?.gameId ? new BN(gameData.gameId) : null;

    // Only player1 creates and delegates the battle PDA (one-time op).
    // Player2 never calls delegateGame — they skip straight to the waiting state.
    const isPlayer1 = gameData?.role === 'player1';

    const [isBattleActive, setIsBattleActive] = useState(false);
    const [isDelegated, setIsDelegated] = useState(!isPlayer1); // Player 2 starts "delegated" visually
    const [isDelegating, setIsDelegating] = useState(false);
    const [playerCrowns, setPlayerCrowns] = useState(0);
    const [opponentCrowns, setOpponentCrowns] = useState(0);
    const [timeLeft, setTimeLeft] = useState('3:00');
    const [gameEnded, setGameEnded] = useState(false);
    const [winner, setWinner] = useState<'player' | 'opponent' | 'draw'>('draw');
    const [playerName, setPlayerName] = useState('Player 1');
    const [playerTowersDestroyed, setPlayerTowersDestroyed] = useState(0);
    const [opponentTowersDestroyed, setOpponentTowersDestroyed] = useState(0);
    const [victoryReason, setVictoryReason] = useState<string>('');

    // ── Socket setup ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!wallet.publicKey || !gameData) return;

        const socket = io(SERVER_URL, {
            query: { walletPublicKey: wallet.publicKey.toBase58() },
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log(`[GameWrapper] Socket connected (id: ${socket.id}). Emitting rejoin-game:`, {
                gameId: gameData.gameId,
                role: gameData.role,
            });
            socket.emit('rejoin-game', {
                gameId: gameData.gameId,
                role: gameData.role,
            });
        });

        socket.on('tick', (data: { elapsed: number; remaining: number }) => {
            const minutes = Math.floor(data.remaining / 60000);
            const seconds = Math.floor((data.remaining % 60000) / 1000);
            setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            EventBus.emit('server-tick', data);
        });

        socket.on('battle-started', () => {
            console.log('[GameWrapper] Received battle-started from server.');
            setIsBattleActive(true);
            EventBus.emit(EVENTS.BATTLE_STARTED);
            toast.success('Battle Started! Good luck!', { duration: 4000 });
        });

        socket.on('opponent-disconnected', () => {
            toast('Opponent disconnected!', { icon: '🏳️' });
            setGameEnded(true);
            setWinner('player');
            setVictoryReason('Opponent disconnected');
            EventBus.emit('opponent-disconnected');
        });

        socket.on('opponent-deploy-troop', (data: any) => {
            console.log('[GameWrapper] Relaying opponent-deploy-troop to EventBus:', data);
            EventBus.emit(EVENTS.NETWORK_OPPONENT_DEPLOY, data);
        });

        socket.on('game-timeout', () => {
            setGameEnded(true);
            setWinner('draw');
            setVictoryReason('Time Out');
        });

        if (gameRef.current) {
            gameRef.current.registry.set('socket', socket);
        }

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wallet.publicKey]);

    const deployTroopRef = useRef(deployTroop);
    const endGameRef = useRef(endGame);
    useEffect(() => {
        deployTroopRef.current = deployTroop;
        endGameRef.current = endGame;
    }, [deployTroop, endGame]);

    // ── Phaser game boot ──────────────────────────────────────────────────────
    useEffect(() => {
        const storedName = localStorage.getItem('username');
        if (storedName) setPlayerName(storedName);

        if (!gameRef.current) {
            const game = StartGame('game-container', {
                walletPublicKey: wallet.publicKey?.toBase58(),
                gameId: gameData?.gameId,
                role: gameData?.role,
            });
            gameRef.current = game;

            if (socketRef.current) {
                game.registry.set('socket', socketRef.current);
            }
        }

        // ── On-chain troop submission + Server relay ─────────────────────────
        const handleDeployBlockchain = async (data: {
            cardIdx: number;
            cardId: string;
            x: number;
            y: number;
        }) => {
            if (!gameIdBn || !wallet.publicKey) return;

            // ── OPTIMISTIC RELAY TO OPPONENT VIA SOCKET ──
            socketRef.current?.emit('deploy-troop', {
                cardIdx: data.cardIdx,
                cardId: data.cardId,
                x: data.x,
                y: data.y,
            });

            try {
                await deployTroopRef.current(gameIdBn, data.cardIdx, data.x, data.y);
            } catch (err) {
                console.error('On-chain deploy failed:', err);
                toast.error('On-chain deploy failed');
            }
        };
        EventBus.on(EVENTS.DEPLOY_TROOP_BLOCKCHAIN, handleDeployBlockchain);

        const handleCrownUpdate = (data: {
            playerCrowns: number;
            opponentCrowns: number;
        }) => {
            setPlayerCrowns(data.playerCrowns);
            setOpponentCrowns(data.opponentCrowns);
        };
        EventBus.on(EVENTS.CROWN_UPDATE, handleCrownUpdate);

        const handleOpponentDeploy = (data: any) => {
            console.log('[GameWrapper] Opponent deployed UI toast:', data);
            toast.success(`Opponent played ${data.cardId}!`, { position: 'bottom-center', duration: 1500 });
        };
        EventBus.on(EVENTS.NETWORK_OPPONENT_DEPLOY, handleOpponentDeploy);

        // ── Game ended (from Phaser / Timeout) ───────────────────────────────
        const handleGameEnd = async (data: {
            winner: string;
            playerCrowns: number;
            opponentCrowns: number;
            playerTowersDestroyed: number;
            opponentTowersDestroyed: number;
            victoryReason: string;
        }) => {
            console.log('[GameWrapper] handling GAME_END event with data:', data);
            setGameEnded(true);
            setWinner(data.winner as 'player' | 'opponent' | 'draw');
            setPlayerCrowns(data.playerCrowns);
            setOpponentCrowns(data.opponentCrowns);
            setPlayerTowersDestroyed(data.playerTowersDestroyed ?? 0);
            setOpponentTowersDestroyed(data.opponentTowersDestroyed ?? 0);
            setVictoryReason(data.victoryReason ?? '');

            if (data.winner === gameData?.role) {
                toast.success('You Won!', { duration: 5000 });
            } else if (data.winner === 'draw') {
                toast('Draw!', { icon: '🤝' });
            } else {
                toast('Defeat', { icon: '🏁' });
            }

            // Commit game state to base layer via ER.
            // endGame on the ER is atomic — it CPIs into magic_program which
            // auto-commits and undelegates in a single instruction.
            if (gameIdBn) {
                const isTimeout = !!data.victoryReason?.toLowerCase().includes('time');
                try {
                    await endGameRef.current(gameIdBn, isTimeout);
                    // Wait briefly for base-layer propagation before showing victory screen 
                    // which has the mint button
                    await new Promise(r => setTimeout(r, 2000));
                    toast.success('Battle committed to chain!', { duration: 3000 });
                } catch (err) {
                    console.error('Failed to commit game:', err);
                    toast.error('Commit failed — try minting trophies after a few seconds');
                }
            }
        };
        EventBus.on(EVENTS.GAME_END, handleGameEnd);

        return () => {
            EventBus.off(EVENTS.DEPLOY_TROOP_BLOCKCHAIN, handleDeployBlockchain);
            EventBus.off(EVENTS.CROWN_UPDATE, handleCrownUpdate);
            EventBus.off(EVENTS.NETWORK_OPPONENT_DEPLOY, handleOpponentDeploy);
            EventBus.off(EVENTS.GAME_END, handleGameEnd);
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameData, wallet.publicKey]);

    // ── Delegate → ER (Player 1 only), then signal server ────────────────────
    const handleDelegate = async () => {
        if (!gameIdBn || !isPlayer1) return; // player2 never delegates
        console.log(`[GameWrapper] Player 1 calling delegateGame...`);
        setIsDelegating(true);
        try {
            await delegateGame(gameIdBn);
            console.log(`[GameWrapper] delegateGame successful. Emitting 'delegated' to server.`);
            toast.success('Delegation Successful!');
            setIsDelegated(true);
            // Signal server → server fires battle-started to both players
            socketRef.current?.emit('delegated');
        } catch (err: any) {
            console.error(`[GameWrapper] delegateGame failed:`, err);
            toast.error(`Delegation Failed: ${err.message}`);
        } finally {
            setIsDelegating(false);
        }
    };

    // ── ER WebSocket Logs ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!erConnection || !program || !gameIdBn) return;

        // Note: we can't directly get the battlePda unless we import getBattlePda.
        // We will derive it using PublicKey.findProgramAddressSync locally for simplicity.
        const [battlePda] = PublicKey.findProgramAddressSync(
            [Buffer.from("battle"), gameIdBn.toArrayLike(Buffer, "le", 8)],
            program.programId
        );

        console.log(`[GameWrapper] Subscribing to ER logs for Battle PDA: ${battlePda.toBase58()}`);
        const subscriptionId = erConnection.onLogs(
            battlePda,
            (logs, _ctx) => {
                if (logs.err === null) {
                    // Just show a quick visual toast for any successful action on the battle state
                    toast(`ER Tx Confirmed: ${logs.signature.slice(0, 8)}...`, {
                        icon: '⚡',
                        id: logs.signature, // Prevents spamming duplicate toasts for the same tx
                        duration: 3000,
                        position: 'bottom-right',
                        style: { background: '#222', color: '#10B981', border: '1px solid #10B981' }
                    });
                }
            },
            'confirmed'
        );

        return () => {
            console.log(`[GameWrapper] Unsubscribing from ER logs`);
            erConnection.removeOnLogsListener(subscriptionId);
        };
    }, [erConnection, program, gameIdBn]);

    return (
        <div className="w-screen h-screen bg-[#111] flex justify-center items-center overflow-hidden">
            <Toaster position="top-center" toastOptions={{
                style: { background: '#333', color: '#fff', border: '1px solid #444' },
            }} />

            <div id="app" style={{
                position: 'relative', width: '100%', maxWidth: '480px',
                height: '100%', maxHeight: '900px',
                boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                backgroundColor: '#000', overflow: 'hidden',
            }}>
                {/* Phaser canvas */}
                <div id="game-container" style={{
                    width: '100%', height: '100%',
                    filter: (gameEnded || !isBattleActive) ? 'blur(8px)' : 'none',
                    transition: 'filter 0.5s ease-in-out',
                }} />

                {/* Delegation / Waiting Overlay — Player 1 delegates, Player 2 waits */}
                {!isBattleActive && !gameEnded && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                        {isPlayer1 && !isDelegated ? (
                            // Player 1: show delegate button
                            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10 flex flex-col items-center gap-4 shadow-2xl">
                                <h2 className="text-xl font-bold text-[#64cbff]">Battle Ready</h2>
                                <p className="text-sm text-gray-400 text-center max-w-[200px]">
                                    Delegate your battle account to the Ephemeral Rollup to start.
                                </p>
                                <button
                                    onClick={handleDelegate}
                                    disabled={isDelegating}
                                    className="px-6 py-3 bg-[#00d048] hover:bg-[#00e050] text-white font-bold rounded-lg shadow-lg active:scale-95 transition-all w-full flex justify-center items-center gap-2"
                                >
                                    {isDelegating ? (
                                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Delegating...</>
                                    ) : 'START BATTLE'}
                                </button>
                            </div>
                        ) : (
                            // Player 1 after delegation, or Player 2: waiting for server
                            <div className="flex flex-col items-center gap-4">
                                <h2 className="text-2xl font-bold text-[#fbce47] animate-pulse">
                                    {isPlayer1 ? 'Waiting for Opponent...' : 'Waiting for Host to Delegate...'}
                                </h2>
                                <div className="w-12 h-12 border-4 border-[#fbce47] border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                )}

                {/* Battle HUD */}
                {isBattleActive && !gameEnded && (
                    <div className="ui-overlay" style={{
                        position: 'absolute', top: 0, left: 0,
                        width: '100%', height: '100%',
                        pointerEvents: 'none',
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    }}>
                        <GameHUD
                            playerName={playerName}
                            opponentName="Opponent"
                            playerLevel={1} opponentLevel={1}
                            playerCrowns={playerCrowns}
                            opponentCrowns={opponentCrowns}
                            timeLeft={timeLeft}
                            playerTowersDestroyed={playerTowersDestroyed}
                            opponentTowersDestroyed={opponentTowersDestroyed}
                        />
                        <div style={{ padding: '10px', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                            <CardDeck />
                            <ElixirBar />
                        </div>
                    </div>
                )}

                {/* Victory / Defeat Screen */}
                {gameEnded && (
                    <VictoryScreen
                        winner={winner}
                        playerCrowns={playerCrowns}
                        opponentCrowns={opponentCrowns}
                        playerTowersDestroyed={playerTowersDestroyed}
                        opponentTowersDestroyed={opponentTowersDestroyed}
                        victoryReason={victoryReason}
                        gameId={gameData?.gameId}
                    />
                )}
            </div>
        </div>
    );
};
