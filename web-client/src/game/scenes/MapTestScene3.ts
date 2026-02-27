
import { Scene } from 'phaser';
import { Map3Config } from '../config/Map3Config';
import { MapBuilder3 } from './MapBuilder3';
import { Tower } from '../entities/Tower';

export class MapTestScene3 extends Scene {

    constructor() {
        super('MapTestScene3');
    }

    preload() {
        this.load.setPath('assets');

        // Towers (Load from magicblock for Map 3)
        this.load.image('m3_tower_archer_blue_right', '../magicblock/tower_archer_blue.png');
        this.load.image('m3_tower_archer_blue_left', '../magicblock/tower_archer_blue2.png');
        this.load.image('m3_tower_archer_red_right', '../magicblock/tower_archer_red.png');
        this.load.image('m3_tower_archer_red_left', '../magicblock/tower_archer_red2.png');
        this.load.image('m3_tower_king_blue', '../magicblock/tower_king_blue.png');
        this.load.image('m3_tower_king_red', '../magicblock/tower_king_red.png');
        this.load.image('logo', '../magicblock/logo.png');

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

        // Load Map 3 custom props
        for (let i = 1; i <= 2; i++) {
            this.load.image(`magic_stone${i}`, `../magicblock/stone${i}.png`);
        }
        this.load.image('solana_wall1', '../solanamap/wall1solana.png');
        this.load.image('logo', '../magicblock/logo.png');
    }

    create() {
        // 1. Calculate Dimensions & Zoom (Same as MainScene)
        const mapWidth = Map3Config.COLS * Map3Config.TILE_SIZE;
        const mapHeight = Map3Config.ROWS * Map3Config.TILE_SIZE;

        const targetHeight = this.scale.height * 0.95;
        const zoom = targetHeight / mapHeight;

        this.cameras.main.setZoom(zoom);
        this.cameras.main.centerOn(mapWidth / 2, mapHeight / 2);
        this.cameras.main.setBackgroundColor('#000000');

        // 2. Build Map
        const mapBuilder = new MapBuilder3(this, 0, 0);
        mapBuilder.build();

        // 3. Place Visual Towers (No Logic Entities)
        Map3Config.TOWERS.forEach(towerConfig => {
            const { x, y } = Map3Config.getPixelCoords(towerConfig.towerCol, towerConfig.towerRow);
            const isKing = towerConfig.type === 'king';

            // Visual Sprite only
            const maxHealth = isKing ? Map3Config.KING_TOWER_HP : Map3Config.PRINCESS_TOWER_HP;
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
