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
import { getArenaConfig } from '../config/Maps';
import { ArenaConfig2v2 } from '../config/ArenaConfig2v2';
import { teamOf, type GameMode } from '../logic/Teams';
import type { ArenaConfigInterface } from '../config/IArenaConfig';
import { isSpellCard } from '../config/TroopConfig';
import { getDeployZones, getMapBounds, getTowerFootprints, isInZones, type LanesDown, type Rect } from '../logic/DeployZones';

const NO_DEPLOY_COLOR = 0xff3030;
const NO_DEPLOY_ALPHA = 0.22;

export class MainScene extends Scene {
    private gameManager!: GameManager;
    private selectedCardId: string | null = null;
    private spriteMap: Map<string, Unit> = new Map();
    private towerSprites: Map<string, Tower> = new Map();
    private isTestMode: boolean = false;
    private mapType: string = 'classic';
    private mode: GameMode = '1v1';
    private myTeam: 0 | 1 = 0;
    /** This client is on the other team from the host: its view is the host's rotated 180°. */
    private mirrored: boolean = false;
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
    private lastHudElixirStep: number = -1;
    private lastHudCrownKey: string = '';
    private deployOverlay: Phaser.GameObjects.Graphics | null = null;

    constructor() { super('MainScene'); }

    init(data: { isTestMode?: boolean, mapType?: string, mode?: GameMode, role?: string }) {
        this.isTestMode = !!data.isTestMode;
        this.mapType = data.mapType || 'classic';
        this.mode = data.mode === '2v2' ? '2v2' : '1v1';
        this.myTeam = teamOf(data.role, this.mode);
        this.mirrored = this.myTeam !== 0;
        this.lastHudElixirStep = -1;
        this.lastHudCrownKey = '';
        this.deployOverlay = null;

        this.arenaConfig = this.mode === '2v2' ? ArenaConfig2v2 : getArenaConfig(this.mapType);

        this.gameManager = new GameManager({
            username: 'Player1',
            level: UserLevelEnum.LEVEL_1,
            currentXp: 0
        }, this.isTestMode);
    }

    create() {
        // Phaser doesn't call shutdown() by name; hook it so EventBus listeners don't
        // outlive this scene (a destroyed game only fires 'destroy')
        this.events.once('shutdown', this.shutdown, this);
        this.events.once('destroy', this.shutdown, this);

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
        this._onCardSelected = (cardId: string | null) => {
            this.selectedCardId = cardId;
            this.drawDeployOverlay();
        };
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

        // ── EventBus: another player deployed (opponent, or a 2v2 teammate) ──
        this._onOpponentDeploy = (data: { cardId: string; x: number; y: number; ownerRole: string; entityId?: string }) => {
            if (!data.cardId) return;

            // Coordinates are in the deployer's view: teammates share ours, the other team's is rotated 180°
            const ally = teamOf(data.ownerRole, this.mode) === this.myTeam;
            const mapWidth = this.arenaConfig.COLS * this.arenaConfig.TILE_SIZE;
            const mapHeight = this.arenaConfig.ROWS * this.arenaConfig.TILE_SIZE;
            const position = ally ? { x: data.x, y: data.y } : { x: mapWidth - data.x, y: mapHeight - data.y };
            // Their elixir, not ours
            this.gameManager.deployCard(data.cardId, position, ally ? 'player' : 'opponent', true, data.entityId);
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
                this.gameManager.syncFromHost(data, this.mirrored);
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
                            // 0.1 precision is plenty and keeps the 5×/s payload small
                            x: Math.round(e.x * 10) / 10,
                            y: Math.round(e.y * 10) / 10,
                            health: Math.round(e.health * 10) / 10,
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
            if (!this.canDeployAt(data.cardId, data.x, data.y, data.ownerId)) {
                showDebug(`Can't deploy there (${data.ownerId === 'player' ? 'blue' : 'red'} side only)`);
                return;
            }
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

            if (!this.gameManager.isCardSupported(assetId)) {
                showDebug(`${assetId} is not available yet`);
                return;
            }

            if (!this.canDeployAt(assetId, worldPoint.x, worldPoint.y, 'player')) {
                showDebug("Can't deploy there");
                return;
            }

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
                    entityId: entity.id,
                    x: Math.floor(worldPoint.x),
                    y: Math.floor(worldPoint.y),
                });
            } else {
                showDebug('Not enough elixir');
                EventBus.emit(EVENTS.ELIXIR_INSUFFICIENT);
            }
        });

        // Lets test pages know the scene is up (they start the battle on this)
        EventBus.emit('scene-ready');
    }

    update(_time: number, delta: number) {
        if (!this.gameManager.gameStarted) return;

        if (!this.gameManager.gameEnded) {
            this.gameManager.update(_time, delta);
            this.emitHudUpdates();
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
            if (!activeIds.has(id)) { sprite.playDeath(); this.spriteMap.delete(id); }
        }

        for (const entity of entities) {
            if (entity instanceof Troop || entity instanceof Spell) {
                let unit = this.spriteMap.get(entity.id);
                if (!unit) {
                    unit = new Unit(this, entity);
                    this.spriteMap.set(entity.id, unit);
                }
                unit.updateVisuals(entity);
            } else if (entity instanceof TowerEntity) {
                const towerSprite = this.towerSprites.get(entity.id);
                if (towerSprite) {
                    towerSprite.setHealth(entity.health);
                    towerSprite.showShot(entity.lastShot, entity.isKing);

                    if (entity.health <= 0 && !entity.destroyed) {
                        entity.destroyed = true;
                        towerSprite.playDestroyed();
                        this.towerSprites.delete(entity.id);

                        const gameData = this.registry.get('data');
                        const isHost = gameData?.role === 'player1';
                        this.gameManager.onTowerDestroyed(entity.isKing, entity.ownerId, isHost);

                        // A fallen princess tower opens a pocket on that lane
                        this.drawDeployOverlay();

                        EventBus.emit(EVENTS.TOWER_DESTROYED, {
                            towerId: entity.id, isKing: entity.isKing, ownerId: entity.ownerId,
                        });
                    }
                }
            }
        }
    }

    /** Enemy princess towers of `side` that are destroyed, by lane as drawn on screen. */
    private getLanesDown(side: 'player' | 'opponent'): LanesDown {
        const midX = this.arenaConfig.COLS * this.arenaConfig.TILE_SIZE / 2;
        const lanes: LanesDown = { left: false, right: false };
        for (const e of this.gameManager.getEntities()) {
            if (e instanceof TowerEntity && !e.isKing && e.ownerId !== side && e.health <= 0) {
                if (e.x < midX) lanes.left = true;
                else lanes.right = true;
            }
        }
        return lanes;
    }

    /** Footprints of every standing tower (either side); a destroyed tower's ground frees up. */
    private getStandingTowerFootprints(): Rect[] {
        const standing = new Set(this.gameManager.getEntities()
            .filter(e => e instanceof TowerEntity && e.health > 0)
            .map(e => e.id));
        return getTowerFootprints(this.arenaConfig, standing, this.mirrored);
    }

    /**
     * Spells can land anywhere on the map; troops and buildings only in `side`'s deploy
     * zones and never on a standing tower.
     */
    private canDeployAt(cardId: string, x: number, y: number, side: 'player' | 'opponent'): boolean {
        if (isSpellCard(cardId)) return isInZones([getMapBounds(this.arenaConfig)], x, y);
        return isInZones(getDeployZones(this.arenaConfig, side, this.getLanesDown(side)), x, y)
            && !isInZones(this.getStandingTowerFootprints(), x, y);
    }

    /** While a troop/building card is selected, shade the playable tiles where it can't be placed. */
    private drawDeployOverlay() {
        if (!this.deployOverlay) this.deployOverlay = this.add.graphics().setDepth(2); // above ground, below units
        const g = this.deployOverlay;
        g.clear();

        const cardId = this.selectedCardId?.split(':')[0];
        if (!cardId || isSpellCard(cardId)) return;

        const c = this.arenaConfig;
        const t = c.TILE_SIZE;
        const zones = getDeployZones(c, 'player', this.getLanesDown('player'));
        const towers = this.getStandingTowerFootprints();
        g.fillStyle(NO_DEPLOY_COLOR, NO_DEPLOY_ALPHA);
        for (let row = c.MARGIN_Y; row < c.ROWS - c.MARGIN_Y; row++) {
            for (let col = c.MARGIN_X; col < c.COLS - c.MARGIN_X; col++) {
                const cx = col * t + t / 2;
                const cy = row * t + t / 2;
                if (!isInZones(zones, cx, cy) || isInZones(towers, cx, cy)) {
                    g.fillRect(col * t, row * t, t, t);
                }
            }
        }
    }

    /**
     * Push HUD state to React only when it visibly changes, instead of every frame:
     * elixir in 0.1 steps, crowns on change, remaining time once per second.
     */
    private emitHudUpdates() {
        const gm = this.gameManager;

        const elixirStep = Math.floor(gm.elixir * 10);
        if (elixirStep !== this.lastHudElixirStep) {
            this.lastHudElixirStep = elixirStep;
            EventBus.emit(EVENTS.ELIXIR_UPDATE, gm.elixir);
        }

        const remainingTime = gm.getRemainingTime();
        const crownKey = [
            gm.playerCrowns, gm.opponentCrowns,
            gm.playerTowersDestroyed, gm.opponentTowersDestroyed,
            Math.ceil(remainingTime / 1000),
        ].join(',');
        if (crownKey !== this.lastHudCrownKey) {
            this.lastHudCrownKey = crownKey;
            EventBus.emit(EVENTS.CROWN_UPDATE, {
                playerCrowns: gm.playerCrowns,
                opponentCrowns: gm.opponentCrowns,
                playerTowersDestroyed: gm.playerTowersDestroyed,
                opponentTowersDestroyed: gm.opponentTowersDestroyed,
                remainingTime,
            });
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
        const mapWidth = this.arenaConfig.COLS * this.arenaConfig.TILE_SIZE;
        const mapHeight = this.arenaConfig.ROWS * this.arenaConfig.TILE_SIZE;

        let finalX = x;
        let finalY = y;
        let finalOwner = ownerId;
        let finalTexture = texture;
        let finalScale = pixelScale;

        if (this.mirrored) {
            finalX = mapWidth - x;
            finalY = mapHeight - y;
            finalOwner = ownerId === 'player' ? 'opponent' : 'player';

            // The mirrored tower should look like the one the config draws at that screen
            // position: other colour, and left/right art swapped since x is mirrored.
            // Its scale comes from that config entry too (textures differ in source size).
            const mirroredTexture = texture
                .replace(/blue|red/, c => (c === 'blue' ? 'red' : 'blue'))
                .replace(/_left$|_right$/, side => (side === '_left' ? '_right' : '_left'));
            const counterpart = this.arenaConfig.TOWERS.find(t => t.texture === mirroredTexture);
            if (counterpart) {
                finalTexture = mirroredTexture;
                finalScale = counterpart.pixelScale;
            } else {
                finalTexture = texture.replace(/blue|red/, c => (c === 'blue' ? 'red' : 'blue'));
            }
        }

        const maxHealth = isKing ? this.arenaConfig.KING_TOWER_HP : this.arenaConfig.PRINCESS_TOWER_HP;
        const towerSprite = new Tower(this, finalX, finalY, finalTexture, maxHealth);
        towerSprite.setScale(finalScale);
        this.towerSprites.set(id, towerSprite);

        const radius = isKing ? 33 : 22;
        const towerEntity = new TowerEntity(id, finalX, finalY, finalOwner, isKing, radius);
        this.gameManager.addEntity(towerEntity);
        return towerEntity;
    }
}
