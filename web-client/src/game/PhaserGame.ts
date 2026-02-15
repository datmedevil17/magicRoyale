import Phaser from 'phaser'; // Import default export to fix namespace error
import { BootScene } from './scenes/BootScene';
import { MainScene } from './scenes/MainScene';

export const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 480, // Portrait mobile-ish resolution
    height: 800,
    parent: 'game-container',
    backgroundColor: '#000000',
    scene: [BootScene, MainScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

const StartGame = (parent: string) => {
    return new Phaser.Game({ ...config, parent });
};

export default StartGame;
