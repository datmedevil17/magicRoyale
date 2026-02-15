import { Scene } from 'phaser';

export class WaitingScene extends Scene {
    constructor() {
        super('WaitingScene');
    }

    preload() {
        this.load.image('waiting_bg', 'assets/waiting_page_template.png');
    }

    create() {
        const { width, height } = this.scale;

        // Add background, centered and scaling to cover
        const bg = this.add.image(width / 2, height / 2, 'waiting_bg');

        // Scale to fit height, maintining aspect ratio might be tricky if screen is too wide, 
        // but for mobile/vertical it should be fine.
        const scaleX = width / bg.width;
        const scaleY = height / bg.height;
        const scale = Math.max(scaleX, scaleY);
        bg.setScale(scale);

        // Add "Searching..." text in Supercell-Magic font
        this.add.text(width / 2, height * 0.7, 'Searching for Opponent...', {
            fontFamily: 'Supercell-Magic',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 0, stroke: true, fill: true }
        }).setOrigin(0.5);
    }
}
