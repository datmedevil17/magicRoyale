import { Scene } from 'phaser';
import { GameManager } from '../logic/GameManager';
import { Troop } from '../logic/troops/Troop';
import { UserLevelEnum } from '../logic/User';
import { EventBus, EVENTS } from '../EventBus';
import { MapBuilder } from './MapBuilder';
import { Tower } from '../entities/Tower';
import { TowerEntity } from '../logic/TowerEntity';
import { Unit } from '../entities/Unit';
import { getArenaConfig } from '../config/Maps';
import type { ArenaConfigInterface } from '../config/IArenaConfig';

export class TesarScene extends Scene {
    private gameManager!: GameManager;
    private spriteMap: Map<string, Unit> = new Map();
    private towerSprites: Map<string, Tower> = new Map();
    private currentConfig!: ArenaConfigInterface;

    // EventBus handler refs for cleanup
    private _onBattleStarted!: () => void;
    private _onGameEndTrigger!: () => void;
    private _onTestDeploy!: (data: { cardId: string, x: number, y: number, ownerId: 'player' | 'opponent' }) => void;
    private _onSyncUnits!: (data: any) => void;

    constructor() { super('TesarScene'); }

    init(data: { mapType?: string }) {
        // Initialize GameManager in Test Mode
        this.gameManager = new GameManager({
            username: 'TestPlayer',
            level: UserLevelEnum.LEVEL_1,
            currentXp: 0
        }, true);

        // Select Configuration based on Registry or Init data
        const registryData = this.registry.get('data') || {};
        const mapType = data?.mapType || registryData.mapType || 'classic';

        this.currentConfig = getArenaConfig(mapType);
    }

    preload() {
        // Assets are preloaded by BootScene
    }

    create() {
        // Phaser doesn't call shutdown() by name; hook it so EventBus listeners don't
        // outlive this scene (a destroyed game only fires 'destroy')
        this.events.once('shutdown', this.shutdown, this);
        this.events.once('destroy', this.shutdown, this);

        // ── Map Setup ──
        const mapWidth = this.currentConfig.COLS * this.currentConfig.TILE_SIZE;
        const mapHeight = this.currentConfig.ROWS * this.currentConfig.TILE_SIZE;

        // Calculate zoom to fit within the container (use the smaller ratio to fit entirely)
        const zoomX = this.scale.width / mapWidth;
        const zoomY = this.scale.height / mapHeight;
        const zoom = Math.min(zoomX, zoomY) * 0.95; // 95% to leave a small margin

        this.cameras.main.setZoom(zoom);
        this.cameras.main.centerOn(mapWidth / 2, mapHeight / 2);
        this.cameras.main.setBackgroundColor('#000000');

        const mapBuilder = new MapBuilder(this, 0, 0, this.currentConfig);
        mapBuilder.build();

        // ── Towers Setup ──
        this.currentConfig.TOWERS.forEach(tc => {
            const { x, y } = this.currentConfig.getPixelCoords(tc.towerCol, tc.towerRow);
            this.createTower(tc.id, x, y, tc.texture, tc.type === 'king', tc.owner, tc.pixelScale);
        });

        // ── Input ──
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            EventBus.emit('tesar-map-pointer-down', { worldX: worldPoint.x, worldY: worldPoint.y });
        });

        // ── Events ──
        this._onBattleStarted = () => {
            this.input.enabled = true;
            this.gameManager.startGame();
        };
        EventBus.on(EVENTS.BATTLE_STARTED, this._onBattleStarted);

        this._onTestDeploy = (data) => {
            this.gameManager.deployCard(data.cardId, { x: data.x, y: data.y }, data.ownerId);
        };
        EventBus.on(EVENTS.TEST_DEPLOY, this._onTestDeploy);

        this._onGameEndTrigger = () => {
            this.gameManager.forceEndGame();
        };
        EventBus.on(EVENTS.GAME_END_TRIGGER, this._onGameEndTrigger);

        // Dummy sync to consume events and prevent errors if needed
        this._onSyncUnits = (_data: any) => { };
        EventBus.on('sync-units', this._onSyncUnits);

        EventBus.emit('tesar-scene-ready');
    }

    private createTower(id: string, x: number, y: number, texture: string, isKing: boolean, ownerId: string, scale: number) {
        const hp = isKing ? this.currentConfig.KING_TOWER_HP : this.currentConfig.PRINCESS_TOWER_HP;
        const towerSprite = new Tower(this, x, y, texture, hp);
        towerSprite.setScale(scale);
        this.towerSprites.set(id, towerSprite);

        const radius = isKing ? 33 : 22;
        const towerEntity = new TowerEntity(id, x, y, ownerId, isKing, radius);
        towerEntity.maxHealth = hp;
        towerEntity.health = hp; // Ensure health matches config
        this.gameManager.addEntity(towerEntity);
    }

    update(time: number, delta: number) {
        if (!this.gameManager.gameStarted) return;

        // In test mode, we just let it run smoothly locally (delta accumulation happens in GameManager)
        this.gameManager.update(time, delta);

        // Update visual positions
        this.syncSprites();
    }

    private syncSprites() {
        const entities = this.gameManager.getEntities();
        const activeIds = new Set(entities.map(e => e.id));

        // Cleanup dead sprites
        for (const [id, sprite] of this.spriteMap) {
            if (!activeIds.has(id)) {
                sprite.playDeath();
                this.spriteMap.delete(id);
            }
        }

        for (const entity of entities) {
            if (entity instanceof TowerEntity) {
                const towerSprite = this.towerSprites.get(entity.id);
                if (towerSprite) {
                    towerSprite.setHealth(entity.health);
                    towerSprite.showShot(entity.lastShot, entity.isKing);
                    if (entity.health <= 0 && !entity.destroyed) {
                        entity.destroyed = true;
                        towerSprite.playDestroyed();
                        this.towerSprites.delete(entity.id);
                        this.gameManager.onTowerDestroyed(entity.isKing, entity.ownerId, true);
                    }
                }
                continue;
            }

            if (entity instanceof Troop) {
                let unit = this.spriteMap.get(entity.id);
                if (!unit) {
                    unit = new Unit(this, entity);
                    this.spriteMap.set(entity.id, unit);
                }
                // Smooth movement in local test
                unit.updateVisuals(entity);
            }
        }
    }

    shutdown() {
        EventBus.off(EVENTS.BATTLE_STARTED, this._onBattleStarted);
        EventBus.off(EVENTS.GAME_END_TRIGGER, this._onGameEndTrigger);
        EventBus.off(EVENTS.TEST_DEPLOY, this._onTestDeploy);
        EventBus.off('sync-units', this._onSyncUnits);
    }
}
