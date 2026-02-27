
import { Scene } from 'phaser';
import { Map2Config } from '../config/Map2Config';
import { MapBuilder2 } from './MapBuilder2';
import { Tower } from '../entities/Tower';

export class MapTestScene2 extends Scene {

    constructor() {
        super('MapTestScene2');
    }

    preload() {
        this.load.setPath('assets');

        // Towers (Load from solanamap instead of assets)
        this.load.image('tower_archer_blue', '../solanamap/tower_archer_blue.png');
        this.load.image('tower_archer_red', '../solanamap/tower_archer_red.png');
        this.load.image('tower_king_blue', '../solanamap/tower_king_blue.png');
        this.load.image('tower_king_red', '../solanamap/tower_king_red.png');

        // Solana Logo
        this.load.image('solana_logo', '../solanamap/wall1solana.png');

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

        // Load solanamap custom props
        for (let i = 1; i <= 3; i++) {
            this.load.image(`solana_stone${i}`, `../solanamap/stone${i}.png`);
        }
        this.load.image('solana_wall1', '../solanamap/wall1solana.png');
        this.load.image('logo', '../solanamap/logo.png');
    }

    create() {
        // 1. Calculate Dimensions & Zoom (Same as MainScene)
        const mapWidth = Map2Config.COLS * Map2Config.TILE_SIZE;
        const mapHeight = Map2Config.ROWS * Map2Config.TILE_SIZE;

        const targetHeight = this.scale.height * 0.95;
        const zoom = targetHeight / mapHeight;

        this.cameras.main.setZoom(zoom);
        this.cameras.main.centerOn(mapWidth / 2, mapHeight / 2);
        this.cameras.main.setBackgroundColor('#000000');

        // 2. Build Map
        const mapBuilder = new MapBuilder2(this, 0, 0);
        mapBuilder.build();

        // 3. Place Visual Towers (No Logic Entities)
        Map2Config.TOWERS.forEach(towerConfig => {
            const { x, y } = Map2Config.getPixelCoords(towerConfig.towerCol, towerConfig.towerRow);
            const isKing = towerConfig.type === 'king';

            // Visual Sprite only
            const maxHealth = isKing ? Map2Config.KING_TOWER_HP : Map2Config.PRINCESS_TOWER_HP;
            const towerSprite = new Tower(this, x, y, towerConfig.texture, maxHealth);
            towerSprite.setScale(towerConfig.pixelScale);

            // Allow access to towers for update loop
            this.towers.push(towerSprite);
        });
    }

    private towers: Tower[] = [];

    update(_time: number, _delta: number) {
        // Auto-heal logic for test
        this.towers.forEach(tower => {
            if (tower.currentHealth <= 0) {
                tower.setHealth(tower.maxHealth);
                console.log('Tower destroyed in Test Scene -> Resetting HP');
            }
        });
    }
}
