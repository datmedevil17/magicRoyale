
import { Scene } from 'phaser';
import { ArenaConfig } from '../config/ArenaConfig';
import { MapBuilder } from './MapBuilder';
import { Tower } from '../entities/Tower';

export class MapTestScene extends Scene {

    constructor() {
        super('MapTestScene');
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
        const mapWidth = ArenaConfig.COLS * ArenaConfig.TILE_SIZE;
        const mapHeight = ArenaConfig.ROWS * ArenaConfig.TILE_SIZE;

        const targetHeight = this.scale.height * 0.95;
        const zoom = targetHeight / mapHeight;

        this.cameras.main.setZoom(zoom);
        this.cameras.main.centerOn(mapWidth / 2, mapHeight / 2);
        this.cameras.main.setBackgroundColor('#000000');

        // 2. Build Map
        const mapBuilder = new MapBuilder(this, 0, 0);
        mapBuilder.build();

        // 3. Place Visual Towers (No Logic Entities)
        ArenaConfig.TOWERS.forEach(towerConfig => {
            const { x, y } = ArenaConfig.getPixelCoords(towerConfig.towerCol, towerConfig.towerRow);
            const isKing = towerConfig.type === 'king';

            // Visual Sprite only
            const maxHealth = isKing ? 4000 : 2500;
            const towerSprite = new Tower(this, x, y, towerConfig.texture, maxHealth);
            towerSprite.setScale(towerConfig.pixelScale);
        });


    }
}
