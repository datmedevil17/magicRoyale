import { Scene } from 'phaser';
import { GameManager } from '../logic/GameManager';
import { Troop } from '../logic/troops/Troop';
import { UserLevelEnum } from '../logic/User';
import { EventBus, EVENTS } from '../EventBus';
import { MapBuilder } from './MapBuilder';
import { Tower } from '../entities/Tower';
import { TowerEntity } from '../logic/TowerEntity';
import { Spell } from '../logic/spells/Spell';
import { Unit } from '../entities/Unit';
import { ArenaConfig } from '../config/ArenaConfig';
import { Map2Config } from '../config/Map2Config';
import { Map3Config } from '../config/Map3Config';
import type { ArenaConfigInterface } from '../config/IArenaConfig';

export class MainScene extends Scene {
    private gameManager!: GameManager;
    private selectedCardId: string | null = null;
    private spriteMap: Map<string, Phaser.GameObjects.Sprite> = new Map();
    private towerSprites: Map<string, Tower> = new Map();
    private isTestMode: boolean = false;
    private mapType: string = 'classic';
    private arenaConfig: ArenaConfigInterface = ArenaConfig;

    // EventBus handler refs for cleanup
    private _onCardSelected!: (id: string | null) => void;
    private _onOpponentDeploy!: (data: any) => void;
    private _onBattleStarted!: () => void;
    private _onServerTick!: (data: { elapsed: number; remaining: number }) => void;
    private _onOpponentDisconnected!: () => void;
    private _onGameEndTrigger!: () => void;
    private _onTestDeploy!: (data: { cardId: string, x: number, y: number, ownerId: 'player' | 'opponent' }) => void;
    private _onSyncUnits!: (data: any) => void;
    private gameEndEmitted: boolean = false;

    constructor() { super('MainScene'); }

    init(data: { isTestMode?: boolean, mapType?: string }) {
        this.isTestMode = !!data.isTestMode;
        this.mapType = data.mapType || 'classic';

        // Select the appropriate config
        switch (this.mapType) {
            case 'solana':
            case 'map2':
                this.arenaConfig = Map2Config;
                break;
            case 'magicblock':
            case 'map3':
                this.arenaConfig = Map3Config;
                break;
            default:
                this.arenaConfig = ArenaConfig;
        }

        this.gameManager = new GameManager({
            username: 'Player1',
            level: UserLevelEnum.LEVEL_1,
            currentXp: 0
        }, this.isTestMode);
    }

    create() {
        // ── Map ──────────────────────────────────────────────────────────────
        const mapWidth = this.arenaConfig.COLS * this.arenaConfig.TILE_SIZE;
        const mapHeight = this.arenaConfig.ROWS * this.arenaConfig.TILE_SIZE;
        const zoom = (this.scale.height * 0.95) / mapHeight;
        this.cameras.main.setZoom(zoom);
        this.cameras.main.centerOn(mapWidth / 2, mapHeight / 2);
        this.cameras.main.setBackgroundColor('#000000');

        const mapBuilder = new MapBuilder(this, 0, 0, this.arenaConfig);
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
        this.arenaConfig.TOWERS.forEach(tc => {
            const { x, y } = this.arenaConfig.getPixelCoords(tc.towerCol, tc.towerRow);
            this.createTower(tc.id, x, y, tc.texture, tc.type === 'king', tc.owner, tc.pixelScale);
        });

        // ── EventBus: card selected ─────────────────────────────────────────
        this._onCardSelected = (cardId: string | null) => { this.selectedCardId = cardId; };
        EventBus.on(EVENTS.CARD_SELECTED, this._onCardSelected);

        // ── EventBus: battle started (from Network or test mode) ─────────────
        this._onBattleStarted = () => {
            this.input.enabled = true;
            this.gameManager.startGame();
        };
        EventBus.on(EVENTS.BATTLE_STARTED, this._onBattleStarted);

        // ── EventBus: server clock tick → sync GameManager time ──────────────
        this._onServerTick = (data: { elapsed: number; remaining: number }) => {
            if (this.gameManager.gameStarted && !this.gameManager.gameEnded) {
                this.gameManager.setElapsedFromServer(data.elapsed);
            }
        };
        EventBus.on('server-tick', this._onServerTick);

        // ── EventBus: opponent deployed a troop ──────────────────────────────
        this._onOpponentDeploy = (data: { cardId: string; x: number; y: number; ownerRole: string }) => {
            if (!data.cardId) return;

            const mapWidth = this.arenaConfig.COLS * this.arenaConfig.TILE_SIZE;
            const mapHeight = this.arenaConfig.ROWS * this.arenaConfig.TILE_SIZE;
            const mirroredX = mapWidth - data.x;
            const mirroredY = mapHeight - data.y;
            this.gameManager.deployCard(data.cardId, { x: mirroredX, y: mirroredY }, 'opponent');
        };
        EventBus.on(EVENTS.NETWORK_OPPONENT_DEPLOY, this._onOpponentDeploy);

        // ── EventBus: opponent disconnected ──────────────────────────────────
        this._onOpponentDisconnected = () => { showDebug('Opponent disconnected!'); };
        EventBus.on('opponent-disconnected', this._onOpponentDisconnected);

        // ── EventBus: external game end trigger (e.g. timeout) ────────────────
        this._onGameEndTrigger = () => {
            this.gameManager.forceEndGame();
        };
        EventBus.on(EVENTS.GAME_END_TRIGGER, this._onGameEndTrigger);

        // ── Continuous Sync (Host-based) ──────────────────────────────────────
        const gameData = this.registry.get('data');
        const isHost = gameData?.role === 'player1';

        this._onSyncUnits = (data: any) => {
            if (!isHost) {
                this.gameManager.syncFromHost(data, isHost);
            }
        };
        EventBus.on('sync-units', this._onSyncUnits);

        if (isHost) {
            this.time.addEvent({
                delay: 200,
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
                            entities: entities,
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
            this.gameManager.deployCard(data.cardId, { x: data.x, y: data.y }, data.ownerId);
        };
        EventBus.on(EVENTS.TEST_DEPLOY, this._onTestDeploy);

        // ── Input: disabled until battle starts ──────────────────────────────
        this.input.enabled = false;

        const centerY = this.scale.height / 2;
        const waitingText = this.add.text(centerX, centerY, 'Waiting for both players...', {
            fontSize: '22px', color: '#ffffff',
            backgroundColor: '#000000', padding: { x: 10, y: 10 },
        }).setOrigin(0.5).setScrollFactor(0).setDepth(999);

        const removeWaiting = () => { if (waitingText.active) waitingText.destroy(); };
        EventBus.once(EVENTS.BATTLE_STARTED, removeWaiting);

        if (this.isTestMode || this.gameManager.gameStarted) {
            this.input.enabled = true;
            this.gameManager.startGame();
            removeWaiting();
        }

        // ── Click to deploy ──────────────────────────────────────────────────
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

            EventBus.emit('map-pointer-down', {
                x: pointer.x,
                y: pointer.y,
                worldX: worldPoint.x,
                worldY: worldPoint.y
            });

            if (!this.selectedCardId) return;
            if (this.isTestMode) return;

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

        const entities = this.gameManager.getEntities();
        const activeIds = new Set(entities.map(e => e.id));

        for (const [id, sprite] of this.spriteMap) {
            if (!activeIds.has(id)) { sprite.destroy(); this.spriteMap.delete(id); }
        }

        for (const entity of entities) {
            if (entity instanceof Troop || entity instanceof Spell) {
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
                    towerSprite.setShooting(entity.isShooting, entity.ownerId, entity.isKing);

                    if (entity.health <= 0 && !entity.destroyed) {
                        entity.destroyed = true;
                        towerSprite.destroy();
                        this.towerSprites.delete(entity.id);

                        const gameData = this.registry.get('data');
                        const isHost = gameData?.role === 'player1';
                        this.gameManager.onTowerDestroyed(entity.isKing, entity.ownerId, isHost);

                        EventBus.emit(EVENTS.TOWER_DESTROYED, {
                            towerId: entity.id, isKing: entity.isKing, ownerId: entity.ownerId,
                        });
                    }
                }
            }
        }
    }

    shutdown() {
        EventBus.off(EVENTS.CARD_SELECTED, this._onCardSelected);
        EventBus.off(EVENTS.BATTLE_STARTED, this._onBattleStarted);
        EventBus.off('server-tick', this._onServerTick);
        EventBus.off(EVENTS.NETWORK_OPPONENT_DEPLOY, this._onOpponentDeploy);
        EventBus.off('opponent-disconnected', this._onOpponentDisconnected);
        EventBus.off(EVENTS.GAME_END_TRIGGER, this._onGameEndTrigger);
        EventBus.off(EVENTS.TEST_DEPLOY, this._onTestDeploy);
        EventBus.off('sync-units', this._onSyncUnits);
    }

    private createTower(
        id: string, x: number, y: number, texture: string,
        isKing: boolean, ownerId: string, pixelScale: number
    ): TowerEntity {
        const gameData = this.registry.get('data');
        const isHost = gameData?.role === 'player1';
        const mapWidth = this.arenaConfig.COLS * this.arenaConfig.TILE_SIZE;
        const mapHeight = this.arenaConfig.ROWS * this.arenaConfig.TILE_SIZE;

        let finalX = x;
        let finalY = y;
        let finalOwner = ownerId;
        let finalTexture = texture;

        if (!isHost) {
            finalX = mapWidth - x;
            finalY = mapHeight - y;
            finalOwner = ownerId === 'player' ? 'opponent' : 'player';

            if (finalTexture.includes('blue')) {
                finalTexture = finalTexture.replace('blue', 'red');
            } else if (finalTexture.includes('red')) {
                finalTexture = finalTexture.replace('red', 'blue');
            }
        }

        const maxHealth = isKing ? this.arenaConfig.KING_TOWER_HP : this.arenaConfig.PRINCESS_TOWER_HP;
        const towerSprite = new Tower(this, finalX, finalY, finalTexture, maxHealth);
        towerSprite.setScale(pixelScale);
        this.towerSprites.set(id, towerSprite);

        const radius = isKing ? 33 : 22;
        const towerEntity = new TowerEntity(id, finalX, finalY, finalOwner, isKing, radius);
        this.gameManager.addEntity(towerEntity);
        return towerEntity;
    }
}
