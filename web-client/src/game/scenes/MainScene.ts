import { Scene } from 'phaser';
import { GameManager } from '../logic/GameManager';
import { Troop } from '../logic/troops/Troop';
import { UserLevelEnum } from '../logic/User';
import { EventBus, EVENTS } from '../EventBus';
import { Network } from '../network/Network';
import { MapBuilder } from './MapBuilder'; // Import MapBuilder
import { Tower } from '../entities/Tower';
import { TowerEntity } from '../logic/TowerEntity';
import { Unit } from '../entities/Unit';

export class MainScene extends Scene {
    private gameManager: GameManager;
    private selectedCardId: string | null = null;
    private network!: Network;
    private spriteMap: Map<string, Phaser.GameObjects.Sprite> = new Map();
    private towerSprites: Map<string, Tower> = new Map();

    constructor() {
        super('MainScene');
        // Mock user for now
        this.gameManager = new GameManager({
            username: 'Player1',
            level: UserLevelEnum.LEVEL_1,
            currentXp: 0
        });
    }

    create() {
        this.network = new Network();

        // Build Arena
        // Start X, Y: For now, center based on TILE_SIZE(22) * COLS(24) = 528 width
        // and ROWS(43) * 22 = 946 height.
        // We want to center it on the screen.
        const mapWidth = 24 * 22;
        const mapHeight = 43 * 22;

        const startX = (this.scale.width - mapWidth) / 2;
        const startY = (this.scale.height - mapHeight) / 2;

        const mapBuilder = new MapBuilder(this, startX, startY);
        mapBuilder.build();

        this.add.text(10, 10, 'Clash Royale Web', { fontSize: '20px', color: '#ffffff' });

        // Debug Text
        const debugText = this.add.text(10, 50, 'Debug: Init... Waiting for Card', { fontSize: '16px', color: '#ffff00', backgroundColor: '#000000' });

        const centerX = this.scale.width / 2;

        // King Towers
        this.createTower('player_king', centerX, this.scale.height - 100, 'tower_king_blue', true, 'player');
        this.createTower('opponent_king', centerX, 100, 'tower_king_red', true, 'opponent');

        // Queen/Princess Towers
        this.createTower('player_princess_left', centerX - 100, this.scale.height - 200, 'tower_archer_blue', false, 'player');
        this.createTower('player_princess_right', centerX + 100, this.scale.height - 200, 'tower_archer_blue', false, 'player');

        this.createTower('opponent_princess_left', centerX - 100, 200, 'tower_archer_red', false, 'opponent');
        this.createTower('opponent_princess_right', centerX + 100, 200, 'tower_archer_red', false, 'opponent');

        // Listen for card selection
        EventBus.on(EVENTS.CARD_SELECTED, (cardId: string | null) => {
            this.selectedCardId = cardId;
            console.log('MainScene: Card selected', cardId);
            debugText.setText(`Selected: ${cardId || 'None'} | Elixir: ${Math.floor(this.gameManager.elixir)}`);
        });

        // Listen for opponent deployment
        EventBus.on(EVENTS.NETWORK_OPPONENT_DEPLOY, (data: { cardId: string, position: { x: number, y: number } }) => {
            console.log('MainScene: Opponent deployed', data);
            // Mirror position for opponent
            const mirroredX = this.scale.width - data.position.x;
            const mirroredY = this.scale.height - data.position.y;

            this.gameManager.deployCard(data.cardId, { x: mirroredX, y: mirroredY }, 'opponent');
            debugText.setText(`Opponent: ${data.cardId} at ${Math.floor(mirroredX)},${Math.floor(mirroredY)}`);
        });

        // Input listener for deploying troops
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.selectedCardId) {
                // Ensure unique ID for every deployment to prevent React key issues or logic dupes
                const entity = this.gameManager.deployCard(this.selectedCardId, { x: pointer.x, y: pointer.y }, 'player');

                if (entity) {
                    debugText.setText(`Deployed ${this.selectedCardId}`);

                    // Notify UI & Network
                    EventBus.emit(EVENTS.CARD_PLAYED, this.selectedCardId);
                    if (this.network) {
                        this.network.sendDeploy(this.selectedCardId, { x: pointer.x, y: pointer.y });
                    }
                } else {
                    debugText.setText(`Failed: Low Elixir or Invalid`);
                }
            }
        });
    }

    update(time: number, delta: number) {
        this.gameManager.update(time, delta);

        // Emit elixir update (throttled logic ideally, but every frame is ok for now)
        EventBus.emit(EVENTS.ELIXIR_UPDATE, this.gameManager.elixir);

        // Emit crown updates
        EventBus.emit(EVENTS.CROWN_UPDATE, {
            playerCrowns: this.gameManager.playerCrowns,
            opponentCrowns: this.gameManager.opponentCrowns,
            remainingTime: this.gameManager.getRemainingTime()
        });

        // Check for game end
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

        // 1. Remove dead sprites
        for (const [id, sprite] of this.spriteMap) {
            if (!activeIds.has(id)) {
                sprite.destroy();
                this.spriteMap.delete(id);
            }
        }

        // 2. Add/Update sprites
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

                        // Sync Shooting
                        const isKing = entity.maxHealth > 3000;
                        towerCallback.setShooting(entity.isShooting, entity.ownerId, isKing);

                        if (entity.health <= 0 && !entity.destroyed) {
                            entity.destroyed = true;
                            towerCallback.destroy();
                            this.towerSprites.delete(entity.id);

                            // Notify GameManager of tower destruction
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

    private createTower(id: string, x: number, y: number, texture: string, isKing: boolean, ownerId: string) {
        // Create Visual Sprite
        const maxHealth = isKing ? 4000 : 2500;
        const towerSprite = new Tower(this, x, y, texture, maxHealth);
        // Scale is handled inside Tower or here? Previous code did it here.
        // Tower class doesn't set scale by default.
        const scale = isKing ? 0.5 : 0.4;
        towerSprite.setScale(scale);
        this.towerSprites.set(id, towerSprite);

        // Create Logical Entity
        const towerEntity = new TowerEntity(id, x, y, ownerId, isKing);
        this.gameManager.addEntity(towerEntity);
    }
}
