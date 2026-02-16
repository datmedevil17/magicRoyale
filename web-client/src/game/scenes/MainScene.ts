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
    private waitingText?: Phaser.GameObjects.Text;

    // Map Layout Constants
    private tileSize: number = 22;
    private mapStartX: number = 0;
    private mapStartY: number = 0;

    constructor() {
        super('MainScene');
        // GameManager initialized in create() to ensure fresh data
    }

    create() {
        const username = localStorage.getItem('username') || 'Player1';
        this.gameManager = new GameManager({
            username: username,
            level: UserLevelEnum.LEVEL_1,
            currentXp: 0
        });



        // Set background color for the void
        this.cameras.main.setBackgroundColor('#1c2b36'); // Dark blue-gray

        // 1. Calculate Dynamic Tile Size
        // We have 24 columns and 45 rows.
        // We want to fit within the screen while maintaining aspect ratio, 
        // but prioritized to fill width on mobile.
        // Also reserve space for the UI at the bottom (Deck + Elixir).
        // Deck is ~80px + 60px bottom margin = 140px. Let's reserve 160px.
        const UI_HEIGHT = 160;
        const availableHeight = this.scale.height - UI_HEIGHT;

        const COLS = 24;
        const ROWS = 45;

        const widthRatio = this.scale.width / COLS;
        const heightRatio = availableHeight / ROWS;

        // Choose the smaller ratio to ensure it fits on screen, 
        // OR simply use widthRatio if we want full width and are okay with scrolling/clipping/letterboxing vertically.
        // Usually, fitting both is safer.
        this.tileSize = Math.min(widthRatio, heightRatio);

        const mapWidth = COLS * this.tileSize;
        const mapHeight = ROWS * this.tileSize;

        this.mapStartX = (this.scale.width - mapWidth) / 2;
        this.mapStartY = (availableHeight - mapHeight) / 2;

        // 2. Build Arena
        const mapBuilder = new MapBuilder(this, this.mapStartX, this.mapStartY, this.tileSize);
        mapBuilder.build();

        // Initialize GameManager Layout
        this.gameManager.setLayout({
            mapStartX: this.mapStartX,
            mapStartY: this.mapStartY,
            tileSize: this.tileSize
        });

        this.add.text(10, 10, 'Clash Royale Web', { fontSize: '20px', color: '#ffffff' });

        // Debug Text
        const debugText = this.add.text(10, 50, 'Debug: Init... Waiting for Card', { fontSize: '16px', color: '#ffff00', backgroundColor: '#000000' });

        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        // 3. Create Towers with Dynamic Positions
        // Grid coordinates (approximate based on standard layout):
        // King Opponent: Row 2
        // Princess Opponent: Row 7.5
        // River: Row 22
        // Princess Player: Row 36.5 (Mirror of 7.5 from bottom: 44 - 7.5 = 36.5)
        // King Player: Row 42 (Mirror of 2 from bottom: 44 - 2 = 42)

        const oppKingY = this.gridY(2);
        const oppPrincessY = this.gridY(7.5);
        const playerPrincessY = this.gridY(36.5);
        const playerKingY = this.gridY(42);

        const leftX = this.gridX(6.5); // ~ 6.5 cols from left
        const rightX = this.gridX(17.5); // ~ 17.5 cols from left (24 - 6.5 = 17.5)
        const midX = this.gridX(12); // Center column

        // King Towers
        this.createTower('player_king', midX, playerKingY, 'tower_king_blue', true, 'player');
        this.createTower('opponent_king', midX, oppKingY, 'tower_king_red', true, 'opponent');

        // Queen/Princess Towers
        this.createTower('player_princess_left', leftX, playerPrincessY, 'tower_archer_blue', false, 'player');
        this.createTower('player_princess_right', rightX, playerPrincessY, 'tower_archer_blue', false, 'player');

        this.createTower('opponent_princess_left', leftX, oppPrincessY, 'tower_archer_red', false, 'opponent');
        this.createTower('opponent_princess_right', rightX, oppPrincessY, 'tower_archer_red', false, 'opponent');

        // Listen for card selection
        EventBus.on(EVENTS.CARD_SELECTED, (cardId: string | null) => {
            this.selectedCardId = cardId;
            // debugText.setText(`Selected: ${cardId || 'None'} | Elixir: ${Math.floor(this.gameManager.elixir)}`);
        });

        // Listen for opponent deployment
        EventBus.on(EVENTS.NETWORK_OPPONENT_DEPLOY, (data: { cardId: string, position: { x: number, y: number } }) => {
            console.log('MainScene: Opponent deployed', data);

            // Mirror Grid Coordinates
            // Received (x=col, y=row) is from opponent's perspective.
            // We need to mirror it to our perspective.
            // Opponent's Left (0) -> Our Right (COLS - 1 - col)
            // Opponent's Bottom (row ~1) -> Our Top (ROWS - 1 - row)

            const COLS = 24;
            const ROWS = 45;

            // data.position.x is the column index sent by opponent
            // data.position.y is the row index sent by opponent
            const mirroredCol = (COLS - 1) - data.position.x;
            const mirroredRow = (ROWS - 1) - data.position.y;

            // Convert mirrored Grid Coordinates to Local Scene Pixels
            const pixelX = this.mapStartX + mirroredCol * this.tileSize + this.tileSize / 2;
            const pixelY = this.mapStartY + mirroredRow * this.tileSize + this.tileSize / 2;

            this.gameManager.deployCard(data.cardId, { x: pixelX, y: pixelY }, 'opponent');
            debugText.setText(`Opponent: ${data.cardId} at Grid[${mirroredCol},${mirroredRow}]`);
        });

        // Waiting State
        this.waitingText = this.add.text(centerX, centerY, 'Searching for Opponent...', { fontSize: '24px', color: '#ffffff', backgroundColor: '#000000', padding: { x: 10, y: 10 } }).setOrigin(0.5);
        this.input.enabled = false; // Disable input while waiting

        EventBus.on(EVENTS.GAME_START, (data: any) => {
            console.log('MainScene: Game Started!', data);

            if (this.waitingText) {
                this.waitingText.destroy();
                this.waitingText = undefined;
            }

            this.gameManager.startGame();
            debugText.setText('Debug: Game Start Event Received!'); // Update debug text
            this.input.enabled = true;
            this.add.text(centerX, centerY - 100, 'Game Start!', { fontSize: '32px', color: '#00ff00' })
                .setOrigin(0.5)
                .setScrollFactor(0)
                .setAlpha(0)
                .setDepth(100)
                .setScale(0.5);
        });

        // Input listener for deploying troops
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.selectedCardId) {
                // Convert Pixel to Grid
                const col = Math.floor((pointer.x - this.mapStartX) / this.tileSize);
                const row = Math.floor((pointer.y - this.mapStartY) / this.tileSize);

                // Ensure click is within bounds? or clamp?
                // For now, let's just use it, deployment logic might handle invalid pos.

                // Deploy locally using pixels for smooth visual immediate response?
                // OR snap to grid? Let's snap to grid center for consistency.
                const snapX = this.mapStartX + col * this.tileSize + this.tileSize / 2;
                const snapY = this.mapStartY + row * this.tileSize + this.tileSize / 2;

                // Ensure unique ID for every deployment to prevent React key issues or logic dupes
                const entity = this.gameManager.deployCard(this.selectedCardId, { x: snapX, y: snapY }, 'player');

                if (entity) {
                    debugText.setText(`Deployed ${this.selectedCardId} at [${col},${row}]`);

                    // Notify UI & Network
                    EventBus.emit(EVENTS.CARD_PLAYED, this.selectedCardId);
                    if (this.network) {
                        // Send GRID coordinates: x=col, y=row
                        // The server/opponent will receive {x: col, y: row}
                        this.network.sendDeploy(this.selectedCardId, { x: col, y: row });
                    }
                } else {
                    debugText.setText(`Failed: Low Elixir or Invalid`);
                }
            }
        });

        // Initialize Network LAST to ensure all listeners are ready before connection/events fire
        this.network = new Network();
    }

    private gridX(col: number): number {
        return this.mapStartX + col * this.tileSize;
    }

    private gridY(row: number): number {
        return this.mapStartY + row * this.tileSize;
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
        // Previous scale: King 0.6, Princess 0.45 for TILE_SIZE ~22.
        // New scale factor based on current tileSize vs 22.
        const baseScale = isKing ? 0.6 : 0.45;
        const scaleFactor = this.tileSize / 22;
        const finalScale = baseScale * scaleFactor;

        towerSprite.setScale(finalScale);
        this.towerSprites.set(id, towerSprite);

        // Create Logical Entity with correct radius (game logic units, can stay as pixels or grids)
        // If Logic uses pixels, we need to be consistent.
        // Assuming Logic uses Scene Pixels for now from previous code.
        const baseRadius = isKing ? 33 : 22;
        const radius = baseRadius * scaleFactor;

        const towerEntity = new TowerEntity(id, x, y, ownerId, isKing, radius, this.tileSize);
        this.gameManager.addEntity(towerEntity);

        return towerEntity;
    }
}
