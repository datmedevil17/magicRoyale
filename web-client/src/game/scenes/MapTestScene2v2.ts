
import { Scene } from 'phaser';
import { ArenaConfig2v2 } from '../config/ArenaConfig2v2';
import { MapBuilder } from './MapBuilder';
import { Tower } from '../entities/Tower';

export class MapTestScene2v2 extends Scene {

    constructor() {
        super('MapTestScene2v2');
    }

    preload() {
        this.load.setPath('assets');

        // Towers
        this.load.image('tower_archer_blue', 'tower_archer_blue.png');
        this.load.image('tower_archer_red', 'tower_archer_red.png');
        this.load.image('tower_king_blue', 'tower_king_blue.png');
        this.load.image('tower_king_red', 'tower_king_red.png');

        // Arena Assets
        this.load.image('bridge', 'bridge.png');
        this.load.image('side_river', 'side_river.png');
        this.load.image('middle_river', 'middle_river.png');

        // Props for Map Test
        for (let i = 1; i <= 4; i++) {
            this.load.image(`wall${i}`, `wall${i}.png`);
            this.load.image(`stone${i}`, `stone${i}.png`);
            this.load.image(`tree${i}`, `tree${i}.png`);
        }
        for (let i = 1; i <= 5; i++) {
            this.load.image(`trees${i}`, `trees${i}.png`);
        }
    }

    create() {
        // 1. Calculate Dimensions & Zoom (Same as MainScene)
        const mapWidth = ArenaConfig2v2.COLS * ArenaConfig2v2.TILE_SIZE;
        const mapHeight = ArenaConfig2v2.ROWS * ArenaConfig2v2.TILE_SIZE;

        const targetHeight = this.scale.height * 0.95;
        const zoom = targetHeight / mapHeight;

        this.cameras.main.setZoom(zoom);
        this.cameras.main.centerOn(mapWidth / 2, mapHeight / 2);
        this.cameras.main.setBackgroundColor('#000000');

        // 2. Build Map
        const mapBuilder = new MapBuilder(this, 0, 0, ArenaConfig2v2);
        mapBuilder.build();

        // 3. Place Visual Towers (No Logic Entities)
        ArenaConfig2v2.TOWERS.forEach(towerConfig => {
            const { x, y } = ArenaConfig2v2.getPixelCoords(towerConfig.towerCol, towerConfig.towerRow);
            const isKing = towerConfig.type === 'king';

            // Visual Sprite only
            const maxHealth = isKing ? 4000 : 2500;
            const towerSprite = new Tower(this, x, y, towerConfig.texture, maxHealth);
            towerSprite.setScale(towerConfig.pixelScale);
        });
    }
}
