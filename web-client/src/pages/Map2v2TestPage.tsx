import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { MapTestScene2v2 } from '../game/scenes/MapTestScene2v2';

export const Map2v2TestPage = () => {
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (!gameRef.current) {
            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                width: 480,
                height: 800,
                parent: 'map-2v2-test-container',
                backgroundColor: '#000000',
                scene: [MapTestScene2v2],
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
            backgroundColor: '#222'
        }}>
            <div id="map-2v2-test-container" style={{
                width: '480px',
                height: '800px',
                boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                borderRadius: '16px',
                overflow: 'hidden'
            }}></div>
        </div>
    );
};
