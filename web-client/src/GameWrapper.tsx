import { useRef, useEffect, useState } from 'react';
import StartGame from './game/PhaserGame';
import { ElixirBar } from './ui/ElixirBar';
import { CardDeck } from './ui/CardDeck';
import { GameHUD } from './ui/GameHUD';

export const GameWrapper = () => {
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (!gameRef.current) {
            gameRef.current = StartGame('game-container');
        }

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    const [timeLeft, setTimeLeft] = useState('3:00'); // Mock time state
    // In a real game, these would come from the game state/socket

    return (
        <div id="app" style={{
            position: 'relative',
            width: '480px',
            height: '800px',
            boxShadow: '0 0 50px rgba(0,0,0,0.5)',
            backgroundColor: '#000',
            borderRadius: '16px',
            overflow: 'hidden'
        }}>
            <div id="game-container" style={{ width: '100%', height: '100%' }}></div>
            <div className="ui-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <GameHUD
                    playerName="Player 1"
                    opponentName="Opponent"
                    playerLevel={1}
                    opponentLevel={1}
                    playerCrowns={0}
                    opponentCrowns={0}
                    timeLeft={timeLeft}
                />

                <div style={{ padding: '10px', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                    <div style={{ alignSelf: 'flex-end', marginBottom: '10px' }}>
                        {/* This could be emote button etc */}
                    </div>
                    <ElixirBar />
                    <CardDeck />
                </div>
            </div>
        </div>
    );
};
