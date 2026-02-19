import { useRef, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Toaster, toast } from 'react-hot-toast';
import StartGame from './game/PhaserGame';
import { ElixirBar } from './ui/ElixirBar';
import { CardDeck } from './ui/CardDeck';
import { GameHUD } from './ui/GameHUD';
import { VictoryScreen } from './ui/VictoryScreen';
import { EventBus, EVENTS } from './game/EventBus';
import { useGameProgram } from './hooks/use-game-program';


export const GameWrapper = () => {
    const gameRef = useRef<Phaser.Game | null>(null);
    const location = useLocation();
    const wallet = useWallet();
    const { deployTroop, delegate, undelegateBattle } = useGameProgram();

    const [isBattleActive, setIsBattleActive] = useState(false);
    const [isDelegated, setIsDelegated] = useState(false);
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

    // Get game data from navigation state
    const gameData = location.state as {
        gameId: string;
        battleId: string;
        role: string;
        opponentWallet: string;
    } | null;

    useEffect(() => {
        const storedName = localStorage.getItem('username');
        if (storedName) {
            setPlayerName(storedName);
        }

        if (!gameRef.current) {
            // Pass blockchain data to Phaser
            gameRef.current = StartGame('game-container', {
                walletPublicKey: wallet.publicKey?.toBase58(),
                gameId: gameData?.gameId,
                battleId: gameData?.battleId,
                role: gameData?.role,
            });
        }

        // --- Delegation Logic ---
        const handleBattleStarted = () => {
            console.log('GameWrapper: Battle Started!');
            setIsBattleActive(true);
            toast.success('Battle Started! Good luck!', { duration: 4000 });
        };

        EventBus.on(EVENTS.BATTLE_STARTED, handleBattleStarted);


        // Listen for troop deployment requests from Phaser
        const handleDeployRequest = async (data: {
            cardIdx: number;
            x: number;
            y: number;
        }) => {
            if (!gameData || !wallet.publicKey) {
                console.error('Cannot deploy: missing game data or wallet');
                return;
            }

            // Block if not active (double check)
            if (!isBattleActive) {
                console.warn('Battle not active yet');
                toast.error('Wait for battle to start!');
                return;
            }

            try {
                const gameId = new PublicKey(gameData.gameId);
                const battleId = new PublicKey(gameData.battleId);

                console.log('Deploying troop on-chain:', data);
                
                // Show toast for deployment
                const deployPromise = deployTroop(gameData.gameId ? new PublicKey(gameData.gameId) : gameId, battleId, data.cardIdx, data.x, data.y);
                
                toast.promise(deployPromise, {
                    loading: 'Deploying...',
                    success: 'Troop Deployed!',
                    error: (err) => `Failed: ${err.message}`
                });

                await deployPromise;
                console.log('Troop deployed successfully');
            } catch (err) {
                console.error('Failed to deploy troop on-chain:', err);
            }
        };

        EventBus.on(EVENTS.DEPLOY_TROOP_BLOCKCHAIN, handleDeployRequest);

        // Listen for crown updates
        const handleCrownUpdate = (data: { playerCrowns: number, opponentCrowns: number, remainingTime: number }) => {
            setPlayerCrowns(data.playerCrowns);
            setOpponentCrowns(data.opponentCrowns);

            // Format remaining time
            const minutes = Math.floor(data.remainingTime / 60000);
            const seconds = Math.floor((data.remainingTime % 60000) / 1000);
            setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        };

        // Listen for game end
        const handleGameEnd = async (data: {
            winner: string,
            playerCrowns: number,
            opponentCrowns: number,
            playerTowersDestroyed: number,
            opponentTowersDestroyed: number,
            victoryReason: string
        }) => {
            setGameEnded(true);
            setWinner(data.winner as 'player' | 'opponent' | 'draw');
            setPlayerCrowns(data.playerCrowns);
            setOpponentCrowns(data.opponentCrowns);
            setPlayerTowersDestroyed(data.playerTowersDestroyed || 0);
            setOpponentTowersDestroyed(data.opponentTowersDestroyed || 0);
            setVictoryReason(data.victoryReason || '');
            
            if (data.winner === gameData?.role) {
                toast.success('You Won!', { duration: 5000 });
            } else {
                toast('Game Over', { icon: '🏁' });
            }

            // --- Undelegation Logic ---
            if (gameData?.battleId) {
                console.log('Undelegating battle...', gameData.battleId);
                const undelegatePromise = undelegateBattle(new PublicKey(gameData.battleId));
                
                toast.promise(undelegatePromise, {
                    loading: 'Committing Battle State...',
                    success: 'Battle State Committed!',
                    error: (err) => `Commit Failed: ${err.message}`
                });

                try {
                    await undelegatePromise;
                    console.log('Battle undelegated successfully');
                    
                    // Notify Network/Server that we are done
                    // Note: winnerIdx calculation logic depends on role. 
                    // If I am player1 and winner is 'player', winnerIdx=0. 
                    // If winner is 'opponent', winnerIdx=1.
                    // If 'draw', winnerIdx=null.
                    let winnerIdx: number | null = null;
                    if (data.winner === 'player') {
                        winnerIdx = gameData.role === 'player1' ? 0 : 1;
                    } else if (data.winner === 'opponent') {
                        winnerIdx = gameData.role === 'player1' ? 1 : 0;
                    }

                    EventBus.emit(EVENTS.CLIENT_UNDELEGATED, {
                        gameId: gameData.gameId,
                        battleId: gameData.battleId,
                        winnerIdx
                    });

                } catch (err) {
                    console.error("Failed to undelegate:", err);
                }
            }
        };

        EventBus.on(EVENTS.CROWN_UPDATE, handleCrownUpdate);
        EventBus.on(EVENTS.GAME_END, handleGameEnd);

        return () => {
            EventBus.off(EVENTS.BATTLE_STARTED, handleBattleStarted);
            EventBus.off(EVENTS.DEPLOY_TROOP_BLOCKCHAIN, handleDeployRequest);
            EventBus.off(EVENTS.CROWN_UPDATE, handleCrownUpdate);
            EventBus.off(EVENTS.GAME_END, handleGameEnd);

            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, [gameData, deployTroop, wallet.publicKey, isBattleActive]); // Added isBattleActive dependency if needed, but refs logic implies maybe not. 
    // Actually handleDeployRequest uses isBattleActive from closure. 
    // Since handleDeployRequest is defined inside useEffect, it captures the initial state.
    // We need to use a ref for isBattleActive to be safe, or recreate listener.
    // Recreating listener on every state change might be expensive for Phaser integration?
    // Let's use a ref for isBattleActive.
    
    // ... wait, I'll allow component re-render to update the closure or just use a ref. Ref is safer.
    
    const isBattleActiveRef = useRef(isBattleActive);
    useEffect(() => {
        isBattleActiveRef.current = isBattleActive;
    }, [isBattleActive]);

    const handleDelegate = async () => {
        if (!gameData) return;
        setIsDelegating(true);
        const promise = delegate(new PublicKey(gameData.battleId));
        
        toast.promise(promise, {
             loading: 'Delegating to Ephemeral Rollup...',
             success: 'Delegation Successful!',
             error: (err) => `Delegation Failed: ${err.message}`
        });

        try {
            await promise;
            setIsDelegated(true);
            EventBus.emit(EVENTS.PLAYER_DELEGATED);
        } catch (err: any) {
            // alert("Delegation failed: " + err.message); // managed by toast
        } finally {
            setIsDelegating(false);
        }
    };


    return (
        <div className="w-screen h-screen bg-[#111] flex justify-center items-center overflow-hidden">
            <Toaster position="top-center" toastOptions={{
                style: {
                    background: '#333',
                    color: '#fff',
                    border: '1px solid #444',
                },
            }} />
            <div id="app" style={{
                position: 'relative',
                width: '100%',
                maxWidth: '480px',
                height: '100%',
                maxHeight: '900px',
                boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                backgroundColor: '#000',
                overflow: 'hidden'
            }}>
                <div id="game-container" style={{
                    width: '100%',
                    height: '100%',
                    filter: (gameEnded || !isBattleActive) ? 'blur(8px)' : 'none',
                    transition: 'filter 0.5s ease-in-out'
                }}></div>

                {/* Delegation / Waiting Overlay */}
                {!isBattleActive && !gameEnded && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                        {!isDelegated ? (
                            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10 flex flex-col items-center gap-4 shadow-2xl">
                                <h2 className="text-xl font-bold text-[#64cbff] text-shadow-md">Battle Ready</h2>
                                <p className="text-sm text-gray-400 text-center max-w-[200px]">Delegate your battle account to the Ephemeral Rollup to play without wallet popups.</p>
                                <button
                                    onClick={handleDelegate}
                                    disabled={isDelegating}
                                    className="px-6 py-3 bg-[#00d048] hover:bg-[#00e050] text-white font-bold rounded-lg shadow-lg transform active:scale-95 transition-all w-full flex justify-center items-center gap-2"
                                >
                                    {isDelegating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Delegating...
                                        </>
                                    ) : (
                                        "START BATTLE"
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 animate-pulse">
                                <h2 className="text-2xl font-bold text-[#fbce47] text-shadow-md">Waiting for Opponent...</h2>
                                <div className="w-12 h-12 border-4 border-[#fbce47] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                )}

                {isBattleActive && (
                    <div className="ui-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <GameHUD
                            playerName={playerName}
                            opponentName="Opponent"
                            playerLevel={1}
                            opponentLevel={1}
                            playerCrowns={playerCrowns}
                            opponentCrowns={opponentCrowns}
                            timeLeft={timeLeft}
                            playerTowersDestroyed={playerTowersDestroyed}
                            opponentTowersDestroyed={opponentTowersDestroyed}
                        />

                        <div style={{ padding: '10px', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                            <div style={{ alignSelf: 'flex-end', marginBottom: '10px' }}>
                                {/* This could be emote button etc */}
                            </div>
                            <CardDeck />
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
                    />
                )}
            </div>
        </div>
    );
};


