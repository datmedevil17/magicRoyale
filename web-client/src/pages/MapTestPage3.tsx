 import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { MapTestScene3 } from '../game/scenes/MapTestScene3';
import { GameHUD2 } from '../ui/GameHUD2';
import { Map3Config } from '../game/config/Map3Config';

export const MapTestPage3 = () => {
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (!gameRef.current) {
            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                width: 480,
                height: 800,
                parent: 'map-test-container-3',
                backgroundColor: '#000000',
                scene: [MapTestScene3],
                scale: {
                    mode: Phaser.Scale.FIT,
                    autoCenter: Phaser.Scale.CENTER_BOTH
                }
            };
            
            gameRef.current = new Phaser.Game(config);
        }

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    return (
        <div style={{ 
            width: '100vw', 
            height: '100vh', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            backgroundColor: '#222',
            position: 'relative' // Needed for absolute positioning of HUD
        }}>
            <div id="app" style={{
                position: 'relative', width: '100%', maxWidth: '480px',
                height: '100%', maxHeight: '900px',
                boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                backgroundColor: '#000', overflow: 'hidden',
            }}>
                <div id="map-test-container-3" style={{
                    width: '100%',
                    height: '100%',
                }}></div>

                <div className="ui-overlay" style={{
                    position: 'absolute', top: 0, left: 0,
                    width: '100%', height: '100%',
                    pointerEvents: 'none',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                }}>
                    <GameHUD2
                        playerName="me"
                        opponentName="Opponent"
                        playerLevel={1}
                        opponentLevel={1}
                        playerCrowns={2}   // Hardcoded test values
                        opponentCrowns={1} // Hardcoded test values
                        timeLeft="3:00"
                        playerKingImage={Map3Config.CROWN_IMAGES.PLAYER_KING}
                        playerQueenImageLeft={Map3Config.CROWN_IMAGES.PLAYER_QUEEN_Left}
                        playerQueenImageRight={Map3Config.CROWN_IMAGES.PLAYER_QUEEN_Right}
                        opponentKingImage={Map3Config.CROWN_IMAGES.OPPONENT_KING}
                        opponentQueenImageLeft={Map3Config.CROWN_IMAGES.OPPONENT_QUEEN_Left}
                        opponentQueenImageRight={Map3Config.CROWN_IMAGES.OPPONENT_QUEEN_Right}
                    />
                </div>
            </div>
        </div>
    );
};
