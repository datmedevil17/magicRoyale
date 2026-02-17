import { Scene } from 'phaser';
import { GameManager } from '../logic/GameManager';
import { Troop } from '../logic/troops/Troop';
import { UserLevelEnum } from '../logic/User';
import { EventBus, EVENTS } from '../EventBus';
import { Network } from '../network/Network';
import { MapBuilder } from './MapBuilder';
import { Tower } from '../entities/Tower';
import { TowerEntity } from '../logic/TowerEntity';
import { Unit } from '../entities/Unit';
import { ArenaConfig } from '../config/ArenaConfig';

export class MainScene extends Scene {
    private gameManager!: GameManager;
    private selectedCardId: string | null = null;
    private network!: Network;
    private spriteMap: Map<string, Phaser.GameObjects.Sprite> = new Map();
    private towerSprites: Map<string, Tower> = new Map();

    private isTestMode: boolean = false;

    constructor() {
        super('MainScene');
    }

    init(data: { isTestMode?: boolean }) {
        this.isTestMode = !!data.isTestMode;

        // Mock user for now
        this.gameManager = new GameManager({
            username: 'Player1',
            level: UserLevelEnum.LEVEL_1,
            currentXp: 0
        }, this.isTestMode);
    }

    create() {
        this.network = new Network();

        // 1. Calculate Dimensions & Zoom
        const mapWidth = ArenaConfig.COLS * ArenaConfig.TILE_SIZE;   // 24 * 22 = 528
        const mapHeight = ArenaConfig.ROWS * ArenaConfig.TILE_SIZE;  // 44 * 22 = 968

        // Fit Map to 95% of Screen Height (Zoomed In)
        const targetHeight = this.scale.height * 0.95;
        const zoom = targetHeight / mapHeight; // ~0.66

        // Center the camera on the map center
        this.cameras.main.setZoom(zoom);
        this.cameras.main.centerOn(mapWidth / 2, mapHeight / 2);
        this.cameras.main.setBackgroundColor('#000000');

        // 2. Build Map
        const mapBuilder = new MapBuilder(this, 0, 0); // Draw at (0,0) world coords
        mapBuilder.build();

        this.add.text(10, 10, 'Clash Royale Web', { fontSize: '20px', color: '#ffffff' }).setScrollFactor(0); // Sticky UI

        // Debug Text
        const debugText = this.add.text(10, 50, 'Debug: Init... Waiting for Card', { fontSize: '16px', color: '#ffff00', backgroundColor: '#000000' }).setScrollFactor(0);

        // 3. Tower Placement (Using logic from MapConfig)
        ArenaConfig.TOWERS.forEach(towerConfig => {
            const { x, y } = ArenaConfig.getPixelCoords(towerConfig.towerCol, towerConfig.towerRow);
            const isKing = towerConfig.type === 'king';
            const tower = this.createTower(
                towerConfig.id,
                x,
                y,
                towerConfig.texture,
                isKing,
                towerConfig.owner,
                towerConfig.pixelScale
            );

            // High health for testing - REMOVED override to respect ArenaConfig
            // if (this.isTestMode && tower) {
            //    tower.health = 100000;
            //    tower.maxHealth = 100000;
            //
            //    // Update Visual Sprite Max Health too!
            //    const visualTower = this.towerSprites.get(towerConfig.id);
            //    if (visualTower) {
            //        visualTower.maxHealth = 100000;
            //        visualTower.setHealth(100000);
            //    }
            // }
        });


        // Listen for card selection
        EventBus.on(EVENTS.CARD_SELECTED, (cardId: string | null) => {
            this.selectedCardId = cardId;
            // debugText.setText(`Selected: ${cardId || 'None'} | Elixir: ${Math.floor(this.gameManager.elixir)}`);
        });

        // Listen for opponent deployment
        EventBus.on(EVENTS.NETWORK_OPPONENT_DEPLOY, (data: { cardId: string, position: { x: number, y: number } }) => {
            // Mirror position for opponent relative to map dimensions
            const mirroredX = mapWidth - data.position.x;
            const mirroredY = mapHeight - data.position.y;

            this.gameManager.deployCard(data.cardId, { x: mirroredX, y: mirroredY }, 'opponent');
            debugText.setText(`Opponent: ${data.cardId} at ${Math.floor(mirroredX)},${Math.floor(mirroredY)}`);
        });

        // Waiting State
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        const waitingText = this.add.text(centerX, centerY, 'Searching for Opponent...', { fontSize: '24px', color: '#ffffff', backgroundColor: '#000000', padding: { x: 10, y: 10 } })
            .setOrigin(0.5)
            .setScrollFactor(0);

        this.input.enabled = false;

        EventBus.on(EVENTS.GAME_START, (data: any) => {
            console.log('MainScene: Game Started!', data);
            waitingText.destroy();
            this.input.enabled = true;
            this.gameManager.startGame(); // CRITICAL: Start the game loop!

            this.add.text(centerX, centerY - 100, 'Game Start!', { fontSize: '32px', color: '#00ff00' })
                .setOrigin(0.5)
                .setScrollFactor(0)
                .setAlpha(0)
                .setDepth(100)
                .setScale(0.5);
        });

        // Test Mode Auto-Start
        if (this.isTestMode) {
            EventBus.emit(EVENTS.GAME_START, { test: true });
        }

        // Input listener for deploying troops
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.selectedCardId) {
                // Convert screen click to World coordinates
                const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

                // TODO: Check if point is inside Playable Area?
                // For now, let deploy happen anywhere on map.

                const entity = this.gameManager.deployCard(this.selectedCardId, { x: worldPoint.x, y: worldPoint.y }, 'player');

                if (entity) {
                    debugText.setText(`Deployed ${this.selectedCardId}`);
                    EventBus.emit(EVENTS.CARD_PLAYED, this.selectedCardId);
                    if (this.network) {
                        this.network.sendDeploy(this.selectedCardId, { x: worldPoint.x, y: worldPoint.y });
                    }
                } else {
                    debugText.setText(`Failed: Low Elixir or Invalid`);
                }
            }
        });
    }

    update(time: number, delta: number) {
        this.gameManager.update(time, delta);
        EventBus.emit(EVENTS.ELIXIR_UPDATE, this.gameManager.elixir);

        EventBus.emit(EVENTS.CROWN_UPDATE, {
            playerCrowns: this.gameManager.playerCrowns,
            opponentCrowns: this.gameManager.opponentCrowns,
            remainingTime: this.gameManager.getRemainingTime()
        });

        if (this.gameManager.gameEnded) {
            EventBus.emit(EVENTS.GAME_END, {
                winner: this.gameManager.winner,
                playerCrowns: this.gameManager.playerCrowns,
                opponentCrowns: this.gameManager.opponentCrowns
            });
        }

        // Synchronize Sprites
        const entities = this.gameManager.getEntities();
        const activeIds = new Set(entities.map(e => e.id));

        // 1. Remove dead
        for (const [id, sprite] of this.spriteMap) {
            if (!activeIds.has(id)) {
                sprite.destroy();
                this.spriteMap.delete(id);
            }
        }

        // 2. Add/Update
        for (const entity of entities) {
            if (entity instanceof Troop) {
                let unit = this.spriteMap.get(entity.id) as Unit;
                if (!unit) {
                    unit = new Unit(this, entity);
                    this.spriteMap.set(entity.id, unit);
                }
                unit.updateVisuals(entity);
            } else if (entity instanceof TowerEntity) {
                if (this.towerSprites.has(entity.id)) {
                    const towerCallback = this.towerSprites.get(entity.id);
                    if (towerCallback) {
                        towerCallback.setHealth(entity.health);
                        const isKing = entity.maxHealth > 3000;
                        towerCallback.setShooting(entity.isShooting, entity.ownerId, isKing);

                        if (entity.health <= 0 && !entity.destroyed) {
                            entity.destroyed = true;
                            towerCallback.destroy();
                            this.towerSprites.delete(entity.id);

                            this.gameManager.onTowerDestroyed(isKing, entity.ownerId);
                            EventBus.emit(EVENTS.TOWER_DESTROYED, {
                                towerId: entity.id,
                                isKing,
                                ownerId: entity.ownerId
                            });
                        }
                    }
                }
            }
        }
    }

    private createTower(id: string, x: number, y: number, texture: string, isKing: boolean, ownerId: string, pixelScale: number): TowerEntity {
        // Create Visual Sprite
        const maxHealth = isKing ? 4000 : 2500;
        const towerSprite = new Tower(this, x, y, texture, maxHealth);

        // Scale and Size
        // King: 3x3 grids (approx 66px width) -> Radius ~33
        // Princess: 2x2 grids (approx 44px width) -> Radius ~22
        // TILE_SIZE = 22.

        // Use config scale
        towerSprite.setScale(pixelScale);
        this.towerSprites.set(id, towerSprite);

        // Create Logical Entity with correct radius
        const radius = isKing ? 33 : 22;
        const towerEntity = new TowerEntity(id, x, y, ownerId, isKing, radius);
        this.gameManager.addEntity(towerEntity);

        return towerEntity;
    }
}
