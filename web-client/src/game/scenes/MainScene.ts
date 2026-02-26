import { Scene } from 'phaser';
import { GameManager } from '../logic/GameManager';
import { Troop } from '../logic/troops/Troop';
import { UserLevelEnum } from '../logic/User';
import { EventBus, EVENTS } from '../EventBus';
import { MapBuilder } from './MapBuilder';
import { Tower } from '../entities/Tower';
import { TowerEntity } from '../logic/TowerEntity';
import { Unit } from '../entities/Unit';
import { ArenaConfig } from '../config/ArenaConfig';

export class MainScene extends Scene {
    private gameManager!: GameManager;
    private selectedCardId: string | null = null;
    private spriteMap: Map<string, Phaser.GameObjects.Sprite> = new Map();
    private towerSprites: Map<string, Tower> = new Map();
    private isTestMode: boolean = false;
    // EventBus handler refs for cleanup
    private _onCardSelected!: (id: string | null) => void;
    private _onOpponentDeploy!: (data: any) => void;
    private _onBattleStarted!: () => void;
    private _onServerTick!: (data: { elapsed: number; remaining: number }) => void;
    private _onOpponentDisconnected!: () => void;
    private _onTestDeploy!: (data: { cardId: string, x: number, y: number, ownerId: 'player' | 'opponent' }) => void;
    private gameEndEmitted: boolean = false;

    constructor() { super('MainScene'); }

    init(data: { isTestMode?: boolean }) {
        this.isTestMode = !!data.isTestMode;
        this.gameManager = new GameManager({
            username: 'Player1',
            level: UserLevelEnum.LEVEL_1,
            currentXp: 0
        }, this.isTestMode);
    }

    create() {
        // ── Map ──────────────────────────────────────────────────────────────
        const mapWidth = ArenaConfig.COLS * ArenaConfig.TILE_SIZE;
        const mapHeight = ArenaConfig.ROWS * ArenaConfig.TILE_SIZE;
        const zoom = (this.scale.height * 0.95) / mapHeight;
        this.cameras.main.setZoom(zoom);
        this.cameras.main.centerOn(mapWidth / 2, mapHeight / 2);
        this.cameras.main.setBackgroundColor('#000000');

        const mapBuilder = new MapBuilder(this, 0, 0);
        mapBuilder.build();

        // ── Debug text overlay ───────────────────────────────────────────────
        const centerX = this.scale.width / 2;
        const debugText = this.add.text(centerX, 30, '', {
            fontSize: '18px', color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: { x: 12, y: 8 },
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(1000).setAlpha(0);

        const showDebug = (msg: string) => {
            if (!debugText || !debugText.active) return;
            debugText.setText(msg).setAlpha(1);
            this.tweens.add({ targets: debugText, alpha: 0, duration: 2000, delay: 1000 });
        };

        // ── Towers ───────────────────────────────────────────────────────────
        ArenaConfig.TOWERS.forEach(tc => {
            const { x, y } = ArenaConfig.getPixelCoords(tc.towerCol, tc.towerRow);
            this.createTower(tc.id, x, y, tc.texture, tc.type === 'king', tc.owner, tc.pixelScale);
        });

        // ── EventBus: card selected ─────────────────────────────────────────
        this._onCardSelected = (cardId: string | null) => { this.selectedCardId = cardId; };
        EventBus.on(EVENTS.CARD_SELECTED, this._onCardSelected);

        // ── EventBus: battle started (from Network or test mode) ─────────────
        // This is the SINGLE trigger that starts gameplay.
        this._onBattleStarted = () => {
            this.input.enabled = true;
            this.gameManager.startGame();
        };
        EventBus.on(EVENTS.BATTLE_STARTED, this._onBattleStarted);

        // ── EventBus: server clock tick → sync GameManager time ──────────────
        // The server is the authoritative clock. We sync elapsed to GameManager
        // so both players' timers drift together (not independently from Phaser delta).
        this._onServerTick = (data: { elapsed: number; remaining: number }) => {
            if (this.gameManager.gameStarted && !this.gameManager.gameEnded) {
                this.gameManager.setElapsedFromServer(data.elapsed);
            }
        };
        EventBus.on('server-tick', this._onServerTick);

        // ── EventBus: opponent deployed a troop ──────────────────────────────
        // Shape: { cardId: string, x: number, y: number (world coords from opponent) }
        // x/y are already server-relayed world coords from the OTHER player's screen.
        // We mirror them to our POV: flip along the centre.
        this._onOpponentDeploy = (data: { cardId: string; x: number; y: number; ownerRole: string }) => {
            if (!data.cardId) {
                return;
            }

            const mapWidth = ArenaConfig.COLS * ArenaConfig.TILE_SIZE;
            const mapHeight = ArenaConfig.ROWS * ArenaConfig.TILE_SIZE;
            const mirroredX = mapWidth - data.x;
            const mirroredY = mapHeight - data.y;
            this.gameManager.deployCard(data.cardId, { x: mirroredX, y: mirroredY }, 'opponent');
        };
        EventBus.on(EVENTS.NETWORK_OPPONENT_DEPLOY, this._onOpponentDeploy);

        // ── EventBus: opponent disconnected ──────────────────────────────────
        this._onOpponentDisconnected = () => { showDebug('Opponent disconnected!'); };
        EventBus.on('opponent-disconnected', this._onOpponentDisconnected);

        // ── Continuous Sync (Host-based) ──────────────────────────────────────
        const gameData = this.registry.get('data');
        const isHost = gameData?.role === 'player1';

        // Listener for incoming syncs (for non-hosts)
        const onSyncUnits = (data: any) => {
            if (!isHost) {
                this.gameManager.syncFromHost(data, isHost);
            }
        };
        EventBus.on('sync-units', onSyncUnits);

        // Broadcaster for host
        if (isHost) {
            this.time.addEvent({
                delay: 500, // Every 500ms
                loop: true,
                callback: () => {
                    const entities = this.gameManager.getEntities()
                        .filter(e => e instanceof Troop || e instanceof TowerEntity)
                        .map(e => ({
                            id: e.id,
                            x: e.x,
                            y: e.y,
                            health: e.health,
                            ownerId: e.ownerId,
                            state: (e as any).state,
                            targetId: (e as any).target?.id
                        }));

                    if (entities.length > 0) {
                        const socket = this.registry.get('socket');
                        socket?.emit('sync-units', {
                            units: entities,
                            playerCrowns: this.gameManager.playerCrowns,
                            opponentCrowns: this.gameManager.opponentCrowns,
                            playerTowersDestroyed: this.gameManager.playerTowersDestroyed,
                            opponentTowersDestroyed: this.gameManager.opponentTowersDestroyed,
                            gameEnded: this.gameManager.gameEnded,
                            winner: this.gameManager.winner,
                            victoryReason: this.gameManager.victoryReason
                        });
                    }
                }
            });
        }

        // ── EventBus: test deploy (from TestArena devtools) ──────────────────
        this._onTestDeploy = (data) => {
            // World coordinates are already precise from TestArena map click/input
            this.gameManager.deployCard(data.cardId, { x: data.x, y: data.y }, data.ownerId);
        };
        EventBus.on(EVENTS.TEST_DEPLOY, this._onTestDeploy);

        // ── Input: disabled until battle starts ──────────────────────────────
        this.input.enabled = false;

        // Show searching text until battle starts
        const centerY = this.scale.height / 2;
        const waitingText = this.add.text(centerX, centerY, 'Waiting for both players...', {
            fontSize: '22px', color: '#ffffff',
            backgroundColor: '#000000', padding: { x: 10, y: 10 },
        }).setOrigin(0.5).setScrollFactor(0).setDepth(999);

        // Remove waiting text when battle starts
        const removeWaiting = () => { waitingText.destroy(); };
        EventBus.once(EVENTS.BATTLE_STARTED, removeWaiting);

        // ── Test-mode auto-start ─────────────────────────────────────────────
        if (this.isTestMode || this.gameManager.gameStarted) {
            this.input.enabled = true;
            this.gameManager.startGame(); // Ensure it's started in GM
            waitingText.destroy();
        }

        // ── Click to deploy ──────────────────────────────────────────────────
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

            // Always emit technical coordinate for external UI (like TestArena)
            EventBus.emit('map-pointer-down', {
                x: pointer.x,
                y: pointer.y,
                worldX: worldPoint.x,
                worldY: worldPoint.y
            });

            if (!this.selectedCardId) return;

            const [assetId, deckIdxStr] = (this.selectedCardId || "").split(':');
            const deckIdx = parseInt(deckIdxStr || '0');

            const entity = this.gameManager.deployCard(
                assetId,
                { x: worldPoint.x, y: worldPoint.y },
                'player'
            );

            if (entity) {
                showDebug(`${assetId} deployed`);
                EventBus.emit(EVENTS.CARD_PLAYED, this.selectedCardId);

                // ── Single path for troop relay + on-chain submission ─────────
                // Request on-chain submission via EventBus → GameWrapper (which also relays socket)
                EventBus.emit(EVENTS.DEPLOY_TROOP_BLOCKCHAIN, {
                    cardIdx: deckIdx,
                    cardId: assetId,
                    x: Math.floor(worldPoint.x),
                    y: Math.floor(worldPoint.y),
                });
            } else {
                showDebug('Not enough elixir');
                EventBus.emit(EVENTS.ELIXIR_INSUFFICIENT);
            }
        });
    }

    update(_time: number, delta: number) {
        if (!this.gameManager.gameStarted) return;

        // Run logic if match is active
        if (!this.gameManager.gameEnded) {
            this.gameManager.update(_time, delta);
            EventBus.emit(EVENTS.ELIXIR_UPDATE, this.gameManager.elixir);
            EventBus.emit(EVENTS.CROWN_UPDATE, {
                playerCrowns: this.gameManager.playerCrowns,
                opponentCrowns: this.gameManager.opponentCrowns,
                playerTowersDestroyed: this.gameManager.playerTowersDestroyed,
                opponentTowersDestroyed: this.gameManager.opponentTowersDestroyed,
                remainingTime: this.gameManager.getRemainingTime(),
            });
        } else if (!this.gameEndEmitted) {
            // Signal outcome once
            this.gameEndEmitted = true;
            EventBus.emit(EVENTS.GAME_END, {
                winner: this.gameManager.winner,
                playerCrowns: this.gameManager.playerCrowns,
                opponentCrowns: this.gameManager.opponentCrowns,
                playerTowersDestroyed: this.gameManager.playerTowersDestroyed,
                opponentTowersDestroyed: this.gameManager.opponentTowersDestroyed,
                victoryReason: this.gameManager.victoryReason,
            });
        }

        // ── Sync entity sprites ───────────────────────────────────────────────
        const entities = this.gameManager.getEntities();
        const activeIds = new Set(entities.map(e => e.id));

        for (const [id, sprite] of this.spriteMap) {
            if (!activeIds.has(id)) { sprite.destroy(); this.spriteMap.delete(id); }
        }

        for (const entity of entities) {
            if (entity instanceof Troop) {
                let unit = this.spriteMap.get(entity.id) as Unit;
                if (!unit) {
                    unit = new Unit(this, entity);
                    this.spriteMap.set(entity.id, unit);
                }
                unit.updateVisuals(entity);
            } else if (entity instanceof TowerEntity) {
                const towerSprite = this.towerSprites.get(entity.id);
                if (towerSprite) {
                    towerSprite.setHealth(entity.health);
                    const isKing = entity.maxHealth > 3000;
                    towerSprite.setShooting(entity.isShooting, entity.ownerId, isKing);



                    // Tower destroyed — only handled here, not in GameManager
                    if (entity.health <= 0 && !entity.destroyed) {
                        entity.destroyed = true;
                        towerSprite.destroy();
                        this.towerSprites.delete(entity.id);

                        // Signal GameManager for scoring and instant victory
                        const gameData = this.registry.get('data');
                        const isHost = gameData?.role === 'player1';
                        this.gameManager.onTowerDestroyed(isKing, entity.ownerId, isHost);

                        EventBus.emit(EVENTS.TOWER_DESTROYED, {
                            towerId: entity.id, isKing, ownerId: entity.ownerId,
                        });
                    }
                }
            }
        }
    }

    shutdown() {
        // Clean up all EventBus listeners to prevent double-registration on scene restart
        EventBus.off(EVENTS.CARD_SELECTED, this._onCardSelected);
        EventBus.off(EVENTS.BATTLE_STARTED, this._onBattleStarted);
        EventBus.off('server-tick', this._onServerTick);
        EventBus.off(EVENTS.NETWORK_OPPONENT_DEPLOY, this._onOpponentDeploy);
        EventBus.off('opponent-disconnected', this._onOpponentDisconnected);
    }

    private createTower(
        id: string, x: number, y: number, texture: string,
        isKing: boolean, ownerId: string, pixelScale: number
    ): TowerEntity {
        const gameData = this.registry.get('data');
        const isHost = gameData?.role === 'player1';
        const mapWidth = ArenaConfig.COLS * ArenaConfig.TILE_SIZE;
        const mapHeight = ArenaConfig.ROWS * ArenaConfig.TILE_SIZE;

        let finalX = x;
        let finalY = y;
        let finalOwner = ownerId;
        let finalTexture = texture;

        if (!isHost) {
            // Mirror for Player 2 POV
            finalX = mapWidth - x;
            finalY = mapHeight - y;
            finalOwner = ownerId === 'player' ? 'opponent' : 'player';

            // Texture swap: Red <-> Blue to maintain team-color POV
            if (finalTexture.includes('blue')) {
                finalTexture = finalTexture.replace('blue', 'red');
            } else if (finalTexture.includes('red')) {
                finalTexture = finalTexture.replace('red', 'blue');
            }
        }

        const maxHealth = isKing ? 4000 : 2500;
        const towerSprite = new Tower(this, finalX, finalY, finalTexture, maxHealth);
        towerSprite.setScale(pixelScale);
        this.towerSprites.set(id, towerSprite);

        const radius = isKing ? 33 : 22;
        const towerEntity = new TowerEntity(id, finalX, finalY, finalOwner, isKing, radius);
        this.gameManager.addEntity(towerEntity);
        return towerEntity;
    }
}
