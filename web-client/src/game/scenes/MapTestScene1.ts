
import { Scene } from 'phaser';
import { ArenaConfig1 } from '../config/ArenaConfig1';
import { MapBuilder1 } from './MapBuilder1';
import { Tower } from '../entities/Tower';

export class MapTestScene1 extends Scene {

    constructor() {
        super('MapTestScene1');
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
        this.load.image('wall_solana', 'wall_solana.png');

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
        const mapWidth = ArenaConfig1.COLS * ArenaConfig1.TILE_SIZE;
        const mapHeight = ArenaConfig1.ROWS * ArenaConfig1.TILE_SIZE;

        const targetHeight = this.scale.height * 0.95;
        const zoom = targetHeight / mapHeight;

        this.cameras.main.setZoom(zoom);
        this.cameras.main.centerOn(mapWidth / 2, mapHeight / 2);
        this.cameras.main.setBackgroundColor('#000000');

        // 2. Build Map
        const mapBuilder = new MapBuilder1(this, 0, 0);
        mapBuilder.build();

        // 3. Place Visual Towers (No Logic Entities)
        ArenaConfig1.TOWERS.forEach(towerConfig => {
            const { x, y } = ArenaConfig1.getPixelCoords(towerConfig.towerCol, towerConfig.towerRow);
            const isKing = towerConfig.type === 'king';

            // Visual Sprite only
            const maxHealth = isKing ? ArenaConfig1.KING_TOWER_HP : ArenaConfig1.PRINCESS_TOWER_HP;
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
