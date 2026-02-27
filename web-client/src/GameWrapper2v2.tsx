import { useRef, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { Toaster, toast } from 'react-hot-toast';
import { BN } from '@coral-xyz/anchor';
import { io, Socket } from 'socket.io-client';
import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { MainScene2v2 } from './game/scenes/MainScene2v2';
import { ElixirBar } from './ui/ElixirBar';
import { CardDeck } from './ui/CardDeck';
import { GameHUD } from './ui/GameHUD';
import { VictoryScreen } from './ui/VictoryScreen';
import { EventBus, EVENTS } from './game/EventBus';
import { useGameProgram, getBattle2v2Pda } from './hooks/use-game-program';
import { CARD_DATA, type CardData } from './game/config/CardConfig';
import { TransactionDrawer, type GameTransaction } from './ui/TransactionDrawer';

const SERVER_URL = 'http://localhost:3000';

export const GameWrapper2v2 = () => {
    const gameRef = useRef<Phaser.Game | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const location = useLocation();
    const wallet = useWallet();
    const { deployTroop2v2, delegateGame2v2, endGame2v2, erConnection, program, playerProfile } = useGameProgram();

    const gameData = location.state as {
        gameId: string;
        role: string;
        team: number;
    } | null;

    const gameIdBn = gameData?.gameId ? new BN(gameData.gameId) : null;
    const isPlayer1 = gameData?.role === 'player1';

    const [isBattleActive, setIsBattleActive] = useState(false);
    const [isDelegated, setIsDelegated] = useState(!isPlayer1);
    const [isDelegating, setIsDelegating] = useState(false);
    const [playerCrowns, setPlayerCrowns] = useState(0);
    const [opponentCrowns, setOpponentCrowns] = useState(0);
    const [timeLeft, setTimeLeft] = useState('2v2 Ready');
    const [gameEnded, setGameEnded] = useState(false);
    const [winner, setWinner] = useState<'player' | 'opponent' | 'draw'>('draw');
    const [playerName, setPlayerName] = useState('You');
    const [playerTowersDestroyed, setPlayerTowersDestroyed] = useState(0);
    const [opponentTowersDestroyed, setOpponentTowersDestroyed] = useState(0);
    const [victoryReason, setVictoryReason] = useState<string>('');
    const [transactionHistory, setTransactionHistory] = useState<GameTransaction[]>([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    useEffect(() => {
        if (!wallet.publicKey || !gameData) return;

        const socket = io(SERVER_URL, {
            query: { walletPublicKey: wallet.publicKey.toBase58() },
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('rejoin-game-2v2', {
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
            toast.success('2v2 Battle Started!', { duration: 4000 });
        });

        socket.on('player-disconnected', (data: { role: string }) => {
            toast(`${data.role} disconnected!`, { icon: '🏳️' });
        });

        socket.on('opponent-deploy-troop', (data: any) => {
            EventBus.emit(EVENTS.NETWORK_OPPONENT_DEPLOY, data);
            setTransactionHistory(prev => [...prev, {
                id: `opp-${Date.now()}`,
                cardId: data.cardId,
                ownerId: data.role.startsWith('player') ? 'teammate' : 'opponent',
                status: 'success',
                timestamp: Date.now()
            }]);
        });

        socket.on('sync-units', (data: any) => {
            EventBus.emit('sync-units', data);
        });

        if (gameRef.current) {
            gameRef.current.registry.set('socket', socket);
        }

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [wallet.publicKey, gameData]);

    const deployTroopRef = useRef(deployTroop2v2);
    const endGameRef = useRef(endGame2v2);
    const pendingDeploysRef = useRef<Map<string, string>>(new Map());
    const opponentPendingDeploysQueue = useRef<string[]>([]);

    useEffect(() => {
        deployTroopRef.current = deployTroop2v2;
        endGameRef.current = endGame2v2;
    }, [deployTroop2v2, endGame2v2]);

    useEffect(() => {
        const storedName = localStorage.getItem('username');
        if (storedName) setPlayerName(storedName);

        if (!gameRef.current) {
            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                width: 480,
                height: 800,
                parent: 'game-container',
                backgroundColor: '#000000',
                scene: [BootScene, MainScene2v2],
                scale: {
                    mode: Phaser.Scale.FIT,
                    autoCenter: Phaser.Scale.CENTER_BOTH
                }
            };
            const game = new Phaser.Game(config);
            game.registry.set('data', {
                isTestMode: false,
                role: gameData?.role,
                gameId: gameData?.gameId
            });
            gameRef.current = game;

            if (socketRef.current) {
                game.registry.set('socket', socketRef.current);
            }
        }

        const handleDeployBlockchain = async (data: {
            cardIdx: number;
            cardId: string;
            x: number;
            y: number;
        }) => {
            if (!gameIdBn || !wallet.publicKey) return;

            const tempId = `tx-${Date.now()}`;
            setTransactionHistory(prev => [...prev, {
                id: tempId,
                cardId: data.cardId,
                ownerId: 'player',
                status: 'pending',
                timestamp: Date.now()
            }]);

            toast.loading(`Deploying ${data.cardId}...`, { id: tempId });

            socketRef.current?.emit('deploy-troop-2v2', {
                cardIdx: data.cardIdx,
                cardId: data.cardId,
                x: data.x,
                y: data.y,
            });

            try {
                const txHash = await deployTroopRef.current(gameIdBn, data.cardIdx, data.x, data.y);
                pendingDeploysRef.current.set(txHash, data.cardId);

                setTransactionHistory(prev => prev.map(tx =>
                    tx.id === tempId ? { ...tx, id: txHash } : tx
                ));

                toast.success(`${data.cardId} sent`, { id: tempId, duration: 2000 });
            } catch (err: any) {
                toast.error(`${data.cardId} failed: ${err.message}`, { id: tempId });
                setTransactionHistory(prev => prev.map(tx =>
                    tx.id === tempId ? { ...tx, status: 'fail' } : tx
                ));
            }
        };
        EventBus.on(EVENTS.DEPLOY_TROOP_BLOCKCHAIN, handleDeployBlockchain);

        const handleCrownUpdate = (data: any) => {
            setPlayerCrowns(data.playerCrowns);
            setOpponentCrowns(data.opponentCrowns);
            setPlayerTowersDestroyed(data.playerTowersDestroyed);
            setOpponentTowersDestroyed(data.opponentTowersDestroyed);
        };
        EventBus.on(EVENTS.CROWN_UPDATE, handleCrownUpdate);

        const handleOpponentDeploy = (data: { cardId: string }) => {
            opponentPendingDeploysQueue.current.push(data.cardId);
            toast(`Deployment: ${data.cardId}`, { icon: '⚔️' });
        };
        EventBus.on(EVENTS.NETWORK_OPPONENT_DEPLOY, handleOpponentDeploy);

        const handleGameEnd = async (data: any) => {
            setGameEnded(true);
            setWinner(data.winner);
            setVictoryReason(data.victoryReason);
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
    }, [gameData, wallet.publicKey, gameIdBn]);

    const handleDelegate = async () => {
        if (!gameIdBn || !isPlayer1) return;
        setIsDelegating(true);
        try {
            await delegateGame2v2(gameIdBn);
            toast.success('2v2 Delegation Successful!');
            setIsDelegated(true);
            socketRef.current?.emit('delegated');
        } catch (err: any) {
            toast.error(`Delegation Failed: ${err.message}`);
        } finally {
            setIsDelegating(false);
        }
    };

    useEffect(() => {
        if (!erConnection || !program || !gameIdBn) return;

        const battlePda = getBattle2v2Pda(gameIdBn, program.programId);
        const subscriptionId = erConnection.onLogs(battlePda, (logs) => {
            if (logs.err) {
                setTransactionHistory(prev => prev.map(tx => tx.id === logs.signature ? { ...tx, status: 'fail' } : tx));
                return;
            }
            setTransactionHistory(prev => prev.map(tx => tx.id === logs.signature ? { ...tx, status: 'success' } : tx));

            const myCardName = pendingDeploysRef.current.get(logs.signature);
            if (myCardName) {
                toast.success(`${myCardName} confirmed on ER`, { position: 'bottom-right' });
                pendingDeploysRef.current.delete(logs.signature);
            }
        }, 'confirmed');

        return () => { erConnection.removeOnLogsListener(subscriptionId); };
    }, [erConnection, program, gameIdBn]);

    const [currentDeck, setCurrentDeck] = useState<CardData[]>([]);
    useEffect(() => {
        if (!playerProfile) return;
        const fullDeck = playerProfile.deck
            .map((id: number, index: number) => (id === 0 || !CARD_DATA[id]) ? null : { ...CARD_DATA[id], deckIndex: index })
            .filter((card: any): card is any => card !== null);
        if (fullDeck.length >= 4) setCurrentDeck(fullDeck);
    }, [playerProfile]);

    return (
        <div className="w-screen h-screen bg-[#111] flex justify-center items-center overflow-hidden">
            <Toaster position="top-center" />
            <div id="app" className="relative w-full max-w-[480px] h-full shadow-2xl bg-black overflow-hidden">
                <div id="game-container" className={`w-full h-full transition-all duration-500 ${(gameEnded || !isBattleActive) ? 'blur-md' : ''}`} />

                {!isBattleActive && !gameEnded && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                        {isPlayer1 && !isDelegated ? (
                            <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-white/10 flex flex-col items-center gap-6 shadow-2xl">
                                <h2 className="text-2xl font-black text-blue-400 italic">2v2 BATTLE READY</h2>
                                <button onClick={handleDelegate} disabled={isDelegating} className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-black rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50">
                                    {isDelegating ? 'DELEGATING...' : 'START 2V2 BATTLE'}
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-6">
                                <h2 className="text-2xl font-black text-amber-400 animate-pulse tracking-tighter italic">WAITING FOR ALLIES...</h2>
                                <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                )}

                {isBattleActive && !gameEnded && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
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
                            opponentName="Opponents"
                            playerLevel={1} opponentLevel={1}
                            playerCrowns={playerCrowns}
                            opponentCrowns={opponentCrowns}
                            timeLeft={timeLeft}
                            playerTowersDestroyed={playerTowersDestroyed}
                            opponentTowersDestroyed={opponentTowersDestroyed}
                        />
                        <div className="p-4 pointer-events-auto flex flex-col gap-4 mt-auto">
                            {currentDeck.length >= 4 && <CardDeck cards={currentDeck as any} />}
                            <ElixirBar />
                        </div>
                    </div>
                )}

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
                        is2v2={true}
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
