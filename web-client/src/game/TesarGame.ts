import { BootScene } from './scenes/BootScene';
import { TesarScene } from './scenes/TesarScene';

// Define the game config specifically for the TesarScene
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, TesarScene]
};

const StartTesarGame = (parent: string, data?: any) => {
    const game = new Phaser.Game({ ...config, parent });
    if (data) {
        // Ensure default nextScene is TesarScene
        game.registry.set('data', { nextScene: 'TesarScene', ...data });
    }
    return game;
};

export default StartTesarGame;
