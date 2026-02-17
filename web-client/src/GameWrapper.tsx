import { useRef, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
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
    const { deployTroop } = useGameProgram();

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

            try {
                const gameId = new PublicKey(gameData.gameId);
                const battleId = new PublicKey(gameData.battleId);

                console.log('Deploying troop on-chain:', data);
                await deployTroop(gameId, battleId, data.cardIdx, data.x, data.y);
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
        const handleGameEnd = (data: {
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
        };

        EventBus.on(EVENTS.CROWN_UPDATE, handleCrownUpdate);
        EventBus.on(EVENTS.GAME_END, handleGameEnd);

        return () => {
            EventBus.off(EVENTS.DEPLOY_TROOP_BLOCKCHAIN, handleDeployRequest);
            EventBus.off(EVENTS.CROWN_UPDATE, handleCrownUpdate);
            EventBus.off(EVENTS.GAME_END, handleGameEnd);

            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, [gameData, deployTroop, wallet.publicKey]);

    return (
        <div className="w-screen h-screen bg-[#111] flex justify-center items-center overflow-hidden">
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
                    filter: gameEnded ? 'blur(8px)' : 'none',
                    transition: 'filter 0.5s ease-in-out'
                }}></div>
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

