import { useRef, useEffect, useState } from 'react';
import StartGame from '../game/PhaserGame';
import { ElixirBar } from '../ui/ElixirBar';
import { CardDeck } from '../ui/CardDeck';
import { GameHUD } from '../ui/GameHUD';
import { VictoryScreen } from '../ui/VictoryScreen';
import { EventBus, EVENTS } from '../game/EventBus';

export const TroopTestPage = () => {
    const gameRef = useRef<Phaser.Game | null>(null);
    const [playerCrowns, setPlayerCrowns] = useState(0);
    const [opponentCrowns, setOpponentCrowns] = useState(0);
    const [timeLeft, setTimeLeft] = useState('3:00');
    const [gameEnded, setGameEnded] = useState(false);
    const [winner, setWinner] = useState<'player' | 'opponent' | 'draw'>('draw');

    useEffect(() => {
        if (!gameRef.current) {
            // Initialize with Test Mode enabled
            gameRef.current = StartGame('game-container', { isTestMode: true });
        }

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
        const handleGameEnd = (data: { winner: string, playerCrowns: number, opponentCrowns: number }) => {
            setGameEnded(true);
            setWinner(data.winner as 'player' | 'opponent' | 'draw');
            setPlayerCrowns(data.playerCrowns);
            setOpponentCrowns(data.opponentCrowns);
        };

        EventBus.on(EVENTS.CROWN_UPDATE, handleCrownUpdate);
        EventBus.on(EVENTS.GAME_END, handleGameEnd);

        return () => {
            EventBus.off(EVENTS.CROWN_UPDATE, handleCrownUpdate);
            EventBus.off(EVENTS.GAME_END, handleGameEnd);

            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    return (
        <div id="app" style={{
            position: 'relative',
            width: '480px',
            height: '800px',
            boxShadow: '0 0 50px rgba(0,0,0,0.5)',
            backgroundColor: '#000',
            borderRadius: '16px',
            overflow: 'hidden',
            margin: '20px auto' // Centered
        }}>
            <div id="game-container" style={{ width: '100%', height: '100%' }}></div>

            {/* Overlay UI */}
            <div className="ui-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <GameHUD
                    playerName="Tester"
                    opponentName="Dummy"
                    playerLevel={9}
                    opponentLevel={9}
                    playerCrowns={playerCrowns}
                    opponentCrowns={opponentCrowns}
                    timeLeft={timeLeft}
                />

                <div style={{ padding: '10px', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                    <div style={{ alignSelf: 'center', marginBottom: '10px', color: '#00ff00', fontWeight: 'bold', textShadow: '1px 1px 2px black' }}>
                        TEST MODE: Unlimited Elixir & High HP Towers
                    </div>
                    <ElixirBar />
                    <CardDeck cards={[]} />
                </div>
            </div>

            {gameEnded && (
                <VictoryScreen
                    winner={winner}
                    playerCrowns={playerCrowns}
                    opponentCrowns={opponentCrowns}
                    playerTowersDestroyed={0}
                    opponentTowersDestroyed={0}
                />
            )}
        </div>
    );
};
