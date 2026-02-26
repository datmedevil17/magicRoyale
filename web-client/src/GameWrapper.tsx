import { useRef, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { CARD_DATA, type CardData } from './game/config/CardConfig';
import { TransactionDrawer, type GameTransaction } from './ui/TransactionDrawer';

const SERVER_URL = 'http://localhost:3000';

export const GameWrapper = () => {
    const gameRef = useRef<Phaser.Game | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const location = useLocation();
    const navigate = useNavigate();
    const wallet = useWallet();
    const { deployTroop, delegateGame, endGame, erConnection, program, playerProfile } = useGameProgram();

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
    const [transactionHistory, setTransactionHistory] = useState<GameTransaction[]>([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // ── Socket setup ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!wallet.publicKey || !gameData) return;

        const socket = io(SERVER_URL, {
            query: { walletPublicKey: wallet.publicKey.toBase58() },
        });
        socketRef.current = socket;

        socket.on('connect', () => {
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
            EventBus.emit(EVENTS.NETWORK_OPPONENT_DEPLOY, data);
            // Record opponent deployment in history
            setTransactionHistory(prev => [...prev, {
                id: `opp-${Date.now()}`,
                cardId: data.cardId,
                ownerId: 'opponent',
                status: 'success', // Assuming network relay means it happened
                timestamp: Date.now()
            }]);
        });

        socket.on('sync-units', (data: any) => {
            EventBus.emit('sync-units', data);
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
    // Maps transaction signatures (or temporary IDs) to card names for robust toasts
    const pendingDeploysRef = useRef<Map<string, string>>(new Map());
    const opponentPendingDeploysQueue = useRef<string[]>([]);
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
                isBattleActive: isBattleActive,
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

            const tempId = `tx-${Date.now()}`;
            // Add pending tx to history
            setTransactionHistory(prev => [...prev, {
                id: tempId,
                cardId: data.cardId,
                ownerId: 'player',
                status: 'pending',
                timestamp: Date.now()
            }]);

            toast.loading(`Deploying ${data.cardId}...`, {
                id: tempId,
                style: { borderBottom: '3px solid #3b82f6' } // Blue for player
            });

            // ── OPTIMISTIC RELAY TO OPPONENT VIA SOCKET ──
            socketRef.current?.emit('deploy-troop', {
                cardIdx: data.cardIdx,
                cardId: data.cardId,
                x: data.x,
                y: data.y,
            });

            try {
                const txHash = await deployTroopRef.current(gameIdBn, data.cardIdx, data.x, data.y);
                console.log('Troop deployment tx sent:', txHash);
                pendingDeploysRef.current.set(txHash, data.cardId);

                // Update history with signature
                setTransactionHistory(prev => prev.map(tx =>
                    tx.id === tempId ? { ...tx, id: txHash } : tx
                ));

                // Finalize optimistic toast
                toast.success(`${data.cardId} transaction sent`, { id: tempId, duration: 2000 });
            } catch (err: any) {
                console.error('On-chain deploy failed:', err);
                toast.error(`${data.cardId} failed: ${err.message}`, { id: tempId });
                setTransactionHistory(prev => prev.map(tx =>
                    tx.id === tempId ? { ...tx, status: 'fail' } : tx
                ));
            }
        };
        EventBus.on(EVENTS.DEPLOY_TROOP_BLOCKCHAIN, handleDeployBlockchain);

        const handleCrownUpdate = (data: {
            playerCrowns: number;
            opponentCrowns: number;
            playerTowersDestroyed?: number;
            opponentTowersDestroyed?: number;
        }) => {
            setPlayerCrowns(data.playerCrowns);
            setOpponentCrowns(data.opponentCrowns);
            if (data.playerTowersDestroyed !== undefined) setPlayerTowersDestroyed(data.playerTowersDestroyed);
            if (data.opponentTowersDestroyed !== undefined) setOpponentTowersDestroyed(data.opponentTowersDestroyed);
        };
        EventBus.on(EVENTS.CROWN_UPDATE, handleCrownUpdate);

        const handleOpponentDeploy = (data: { cardId: string }) => {
            console.log('[GameWrapper] Opponent deployed UI toast prep:', data);
            opponentPendingDeploysQueue.current.push(data.cardId);

            toast(`Opponent deployed ${data.cardId}`, {
                icon: '⚔️',
                style: { borderBottom: '3px solid #ef4444' } // Red for opponent
            });
        };
        EventBus.on(EVENTS.NETWORK_OPPONENT_DEPLOY, handleOpponentDeploy);

        const handleToggleDrawer = () => setIsDrawerOpen(prev => !prev);
        EventBus.on(EVENTS.TOGGLE_DRAWER, handleToggleDrawer);

        // ── Game ended (from Phaser / Timeout) ───────────────────────────────
        const handleGameEnd = async (data: {
            winner: string;
            playerCrowns: number;
            opponentCrowns: number;
            playerTowersDestroyed: number;
            opponentTowersDestroyed: number;
            victoryReason: string;
        }) => {
            setGameEnded(true);
            const winnerRole = data.winner as 'player' | 'opponent' | 'draw';
            setWinner(winnerRole);
            setPlayerCrowns(data.playerCrowns);
            setOpponentCrowns(data.opponentCrowns);
            setPlayerTowersDestroyed(data.playerTowersDestroyed ?? 0);
            setOpponentTowersDestroyed(data.opponentTowersDestroyed ?? 0);
            setVictoryReason(data.victoryReason ?? '');

            const isMeWinner = winnerRole === 'player';
            const isDraw = winnerRole === 'draw';

            if (isMeWinner) {
                toast.success('You Won!', { duration: 5000 });
            } else if (isDraw) {
                toast('Draw!', { icon: '🤝' });
            } else {
                toast('Defeat', { icon: '🏁' });
                // Loser Flow: Auto-navigate back after 5 seconds if not a draw
                setTimeout(() => {
                    navigate('/menu');
                }, 8000); // 8 seconds to allow viewing the victory screen
            }

            // Wait for user to manually click "End Game" on the victory screen
        };
        const handleElixirInsufficient = () => {
            toast.error('Not enough elixir!', { id: 'elixir-low' }); // id prevents toast spam
        };
        EventBus.on(EVENTS.ELIXIR_INSUFFICIENT, handleElixirInsufficient);

        return () => {
            EventBus.off(EVENTS.DEPLOY_TROOP_BLOCKCHAIN, handleDeployBlockchain);
            EventBus.off(EVENTS.CROWN_UPDATE, handleCrownUpdate);
            EventBus.off(EVENTS.NETWORK_OPPONENT_DEPLOY, handleOpponentDeploy);
            EventBus.off(EVENTS.GAME_END, handleGameEnd);
            EventBus.off(EVENTS.ELIXIR_INSUFFICIENT, handleElixirInsufficient);
            EventBus.off(EVENTS.TOGGLE_DRAWER, handleToggleDrawer);
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
        setIsDelegating(true);
        console.log(`[Arena] Initiating delegation for Game ID: ${gameIdBn.toString()}`);
        try {
            await delegateGame(gameIdBn);
            console.log(`[Arena] Delegation Successful! Ownership transferred to Ephemeral Rollup.`);
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

        const subscriptionId = erConnection.onLogs(
            battlePda,
            (logs, _ctx) => {
                console.log("[ER WS] Received onLogs for battlePda:", logs);
                if (logs.err !== null) {
                    console.log("[ER WS] Ignored log due to err:", logs.err);
                    setTransactionHistory(prev => prev.map(tx =>
                        tx.id === logs.signature ? { ...tx, status: 'fail' } : tx
                    ));
                    return;
                }

                // Success!
                setTransactionHistory(prev => prev.map(tx =>
                    tx.id === logs.signature ? { ...tx, status: 'success' } : tx
                ));

                let title = 'ER Tx Confirmed';
                let isDeployLog = false;

                const isDeployInstruction = logs.logs && logs.logs.some(l =>
                    l.toLowerCase().includes('deploytroop') ||
                    l.toLowerCase().includes('deploy_troop')
                );

                const myCardName = pendingDeploysRef.current.get(logs.signature);
                console.log("[ER WS] Extracted signature:", logs.signature);
                console.log("[ER WS] myCardName found in ref?", myCardName);
                console.log("[ER WS] isDeployInstruction string check:", isDeployInstruction);

                if (myCardName) {
                    title = `${myCardName} deployed`;
                    pendingDeploysRef.current.delete(logs.signature);
                    isDeployLog = true;
                } else if (isDeployInstruction || opponentPendingDeploysQueue.current.length > 0) {
                    // Could be the opponent's deployment
                    const opponentCardName = opponentPendingDeploysQueue.current.shift();
                    title = opponentCardName ? `${opponentCardName} deployed` : 'Opponent Troop Deployed';
                    isDeployLog = true;
                }

                console.log("[ER WS] isDeployLog determined as:", isDeployLog);

                if (!isDeployLog) return; // Ignore non-deploy logs

                const explorerLink = `https://solscan.io/tx/${logs.signature}?cluster=custom&customUrl=https%3A%2F%2Fdevnet.magicblock.app`;

                toast.dismiss(`optimistic-${logs.signature}`); // Remove optimistic version
                toast(() => (
                    <div className="flex flex-col gap-1 items-start text-left">
                        <span className="font-bold text-sm text-green-400">{title}</span>
                        <a
                            href={explorerLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-blue-400 underline hover:text-blue-300 break-all leading-tight"
                        >
                            {logs.signature}
                        </a>
                    </div>
                ), {
                    icon: '⚡',
                    id: `confirmed-${logs.signature}`,
                    duration: 5000,
                    position: 'bottom-right',
                    style: { background: '#222', color: '#fff', border: '1px solid #10B981', maxWidth: '350px' }
                });
            },
            'confirmed'
        );

        return () => {
            erConnection.removeOnLogsListener(subscriptionId);
        };
    }, [erConnection, program, gameIdBn]);

    // ── Build Deck from On-Chain Data ────────────────────────────────────────
    const [currentDeck, setCurrentDeck] = useState<CardData[]>([]);

    useEffect(() => {
        if (!playerProfile) return;

        // Map IDs to full CardData objects, preserving the original deck index
        const fullDeck = playerProfile.deck
            .map((id: number, index: number) => {
                if (id === 0 || !CARD_DATA[id]) return null;
                return {
                    ...CARD_DATA[id],
                    deckIndex: index
                };
            })
            .filter((card: any): card is any => card !== null);

        if (fullDeck.length >= 4) {
            setCurrentDeck(fullDeck);
        }
    }, [playerProfile]);

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
                        <div style={{ pointerEvents: 'auto', position: 'absolute', right: '10px', top: '100px', zIndex: 100 }}>
                            <button
                                onClick={() => setIsDrawerOpen(true)}
                                style={{
                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                    color: '#fbce47',
                                    border: '1px solid #fbce47',
                                    borderRadius: '50%',
                                    width: '40px',
                                    height: '40px',
                                    fontSize: '20px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    boxShadow: '0 0 10px rgba(251, 206, 71, 0.3)'
                                }}
                                title="Transaction History"
                            >
                                📜
                            </button>
                        </div>
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
                            {currentDeck.length >= 4 && <CardDeck cards={currentDeck as any} />}
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
                        role={gameData?.role as any}
                    />
                )}

                <TransactionDrawer
                    transactions={transactionHistory}
                    isOpen={isDrawerOpen}
                    onToggle={() => setIsDrawerOpen(false)}
                />
            </div>
        </div>
    );
};
