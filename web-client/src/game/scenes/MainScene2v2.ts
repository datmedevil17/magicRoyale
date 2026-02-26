import { Scene } from 'phaser';
import { GameManager } from '../logic/GameManager';
import { Troop } from '../logic/troops/Troop';
import { UserLevelEnum } from '../logic/User';
import { EventBus, EVENTS } from '../EventBus';
import { MapBuilder2v2 } from './MapBuilder2v2';
import { Tower } from '../entities/Tower';
import { TowerEntity } from '../logic/TowerEntity';
import { Unit } from '../entities/Unit';
import { ArenaConfig2v2 } from '../config/ArenaConfig2v2';

export class MainScene2v2 extends Scene {
    private gameManager!: GameManager;
    private spriteMap: Map<string, Phaser.GameObjects.Sprite> = new Map();
    private towerSprites: Map<string, Tower> = new Map();
    private isTestMode: boolean = false;

    // EventBus handler refs for cleanup
    private _onCardSelected!: (id: string | null) => void;
    private _onBattleStarted!: () => void;
    private _onTestDeploy!: (data: { cardId: string, x: number, y: number, ownerId: string }) => void;

    constructor() { super('MainScene2v2'); }

    init(data: { isTestMode?: boolean }) {
        this.isTestMode = !!data.isTestMode;
        this.gameManager = new GameManager({
            username: 'TestPlayer',
            level: UserLevelEnum.LEVEL_1,
            currentXp: 0
        }, this.isTestMode);
    }

    create() {
        // ── Map ──────────────────────────────────────────────────────────────
        const mapWidth = ArenaConfig2v2.COLS * ArenaConfig2v2.TILE_SIZE;
        const mapHeight = ArenaConfig2v2.ROWS * ArenaConfig2v2.TILE_SIZE;
        const zoom = (this.scale.height * 0.95) / mapHeight;
        this.cameras.main.setZoom(zoom);
        this.cameras.main.centerOn(mapWidth / 2, mapHeight / 2);
        this.cameras.main.setBackgroundColor('#000000');

        const mapBuilder = new MapBuilder2v2(this, 0, 0);
        mapBuilder.build();

        // ── Towers ───────────────────────────────────────────────────────────
        ArenaConfig2v2.TOWERS.forEach(tc => {
            const { x, y } = ArenaConfig2v2.getPixelCoords(tc.towerCol, tc.towerRow);
            this.createTower(tc.id, x, y, tc.texture, tc.type === 'king', tc.owner, tc.pixelScale);
        });

        // ── EventBus Listeners ──────────────────────────────────────────────
        this._onCardSelected = (_cardId: string | null) => { /* Selection in 2v2 handled via UI panel for test */ };
        EventBus.on(EVENTS.CARD_SELECTED, this._onCardSelected);

        this._onBattleStarted = () => {
            console.log(`[MainScene2v2] Battle Started`);
            this.input.enabled = true;
            this.gameManager.startGame();
        };
        EventBus.on(EVENTS.BATTLE_STARTED, this._onBattleStarted);

        // Test Deploy Listener (4 owners support)
        this._onTestDeploy = (data) => {
            console.log(`[MainScene2v2] Test Deploy:`, data);
            this.gameManager.deployCard(data.cardId, { x: data.x, y: data.y }, data.ownerId);
        };
        EventBus.on(EVENTS.TEST_DEPLOY, this._onTestDeploy);

        // Emit ready
        EventBus.emit('scene-ready');

        // Input handler for manual clicks
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            EventBus.emit('map-pointer-down', { worldX: worldPoint.x, worldY: worldPoint.y });
        });
    }

    private createTower(id: string, x: number, y: number, texture: string, isKing: boolean, ownerId: string, scale: number) {
        const maxHealth = isKing ? 4000 : 2500;
        const towerSprite = new Tower(this, x, y, texture, maxHealth);
        towerSprite.setScale(scale);
        this.towerSprites.set(id, towerSprite);

        // Logic side
        const radius = isKing ? 33 : 22;
        const towerEntity = new TowerEntity(id, x, y, ownerId, isKing, radius);
        this.gameManager.addEntity(towerEntity);
    }

    update(time: number, delta: number) {
        if (!this.gameManager.gameStarted || this.gameManager.gameEnded) return;
        this.gameManager.update(time, delta);
        this.syncSprites();
    }

    private syncSprites() {
        const entities = this.gameManager.getEntities();
        const activeIds = new Set(entities.map(e => e.id));

        // Cleanup dead sprites
        for (const [id, sprite] of this.spriteMap) {
            if (!activeIds.has(id)) {
                sprite.destroy();
                this.spriteMap.delete(id);
            }
        }

        for (const entity of entities) {
            // Towers
            if (entity instanceof TowerEntity) {
                const towerSprite = this.towerSprites.get(entity.id);
                if (towerSprite) {
                    towerSprite.setHealth(entity.health);

                    // MainScene style destruction
                    const isKing = entity.maxHealth > 3000;
                    towerSprite.setShooting(entity.isShooting, entity.ownerId, isKing);

                    if (entity.health <= 0 && !entity.destroyed) {
                        entity.destroyed = true;
                        towerSprite.destroy();
                        this.towerSprites.delete(entity.id);
                        this.gameManager.onTowerDestroyed(isKing, entity.ownerId);
                    }
                }
                continue;
            }

            // Troops
            if (entity instanceof Troop) {
                let unit = this.spriteMap.get(entity.id) as Unit;
                if (!unit) {
                    unit = new Unit(this, entity);
                    this.spriteMap.set(entity.id, unit);
                }
                unit.updateVisuals(entity);
            }
        }
    }

    shutdown() {
        EventBus.off(EVENTS.CARD_SELECTED, this._onCardSelected);
        EventBus.off(EVENTS.BATTLE_STARTED, this._onBattleStarted);
        EventBus.off(EVENTS.TEST_DEPLOY, this._onTestDeploy);
    }
}
