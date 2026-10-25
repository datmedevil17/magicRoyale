import { Entity } from './Entity';
import { ArenaConfig } from '../config/ArenaConfig';
import { getTroopStats } from '../config/TroopConfig';
import { Barbarian } from './troops/Barbarian';
import { Troop } from './troops/Troop';
import { Archer } from './troops/Archer';
import { Giant } from './troops/Giant';
import { MiniPekka } from './troops/MiniPekka';
import { Valkyrie } from './troops/Valkyrie';
import { Wizard } from './troops/Wizard';
import { BabyDragon } from './troops/BabyDragon';
import { InfernoTower } from './troops/InfernoTower';
import { Cannon } from './troops/Cannon';
import { Building } from './troops/Building';
import { Spell } from './spells/Spell';
import { TowerEntity } from './TowerEntity';
import type { Point2D, ArenaLayout } from './Interfaces';
import type { IUser } from './User';

type EntityFactory = (id: string, x: number, y: number, ownerId: string) => Entity;

// Card ID → entity id prefix + constructor. The prefix is embedded in entity ids so a
// remote client can recreate the right entity from a host sync snapshot.
const CARD_FACTORIES: Record<string, { prefix: string; create: EntityFactory }> = {
    Archers: { prefix: 'archer', create: (id, x, y, o) => new Archer(id, x, y, o) },
    Giant: { prefix: 'giant', create: (id, x, y, o) => new Giant(id, x, y, o) },
    MiniPEKKA: { prefix: 'minipekka', create: (id, x, y, o) => new MiniPekka(id, x, y, o) },
    Valkyrie: { prefix: 'valkyrie', create: (id, x, y, o) => new Valkyrie(id, x, y, o) },
    Wizard: { prefix: 'wizard', create: (id, x, y, o) => new Wizard(id, x, y, o) },
    BabyDragon: { prefix: 'babydragon', create: (id, x, y, o) => new BabyDragon(id, x, y, o) },
    Barbarians: { prefix: 'barb', create: (id, x, y, o) => new Barbarian(id, x, y, o) },
    InfernoTower: { prefix: 'inferno', create: (id, x, y, o) => new InfernoTower(id, x, y, o) },
    Cannon: { prefix: 'cannon', create: (id, x, y, o) => new Cannon(id, x, y, o) },
    Arrows: { prefix: 'arrows', create: (id, x, y, o) => new Spell(id, x, y, o, 'Arrows') },
    Fireball: { prefix: 'fireball', create: (id, x, y, o) => new Spell(id, x, y, o, 'Fireball') },
    Rage: { prefix: 'rage', create: (id, x, y, o) => new Spell(id, x, y, o, 'Rage') },
};

const PREFIX_TO_CARD: Record<string, string> = Object.fromEntries(
    Object.entries(CARD_FACTORIES).map(([cardId, f]) => [f.prefix, cardId])
);

// Overlapping units are pushed apart by this fraction of the overlap per logic tick
const SEPARATION_STRENGTH = 0.5;
// Collision radius for units configured with radius 0
const DEFAULT_UNIT_RADIUS = 14;

// Snapshots arrive every 200ms; a troop missing from this many in a row is removed.
// The grace period covers the round trip for a troop we deployed that the host hasn't seen yet.
const SYNC_MISSES_BEFORE_REMOVAL = 5;

export class GameManager {
    private entities: Entity[] = [];
    public elixir: number = 5;
    public maxElixir: number = 10;

    // Layout logic
    public layout: ArenaLayout = {
        mapStartX: 0,
        mapStartY: 0,
        tileSize: 22 // Default fallback
    };

    // Game state
    public playerCrowns: number = 0;
    public opponentCrowns: number = 0;
    public playerTowersDestroyed: number = 0;
    public opponentTowersDestroyed: number = 0;
    public victoryReason: string = '';
    public matchDuration: number = 180000; // 3 minutes in ms
    public elapsedTime: number = 0;
    public gameEnded: boolean = false;
    public gameStarted: boolean = false;
    public winner: string | null = null;

    public isTestMode: boolean = false;

    public role: string = 'player1';

    // Troop id → consecutive host snapshots it was missing from (non-host only)
    private syncMisses: Map<string, number> = new Map();

    constructor(_user: IUser, isTestMode: boolean = false, role: string = 'player1') {
        // user param kept for compatibility/extension
        this.isTestMode = isTestMode;
        this.entities = [];
        this.role = role;
    }

    public setLayout(layout: ArenaLayout) {
        this.layout = layout;
    }

    public startGame(_opponentId?: string) {
        this.gameStarted = true;
    }

    /**
     * Called every server tick — syncs the authoritative elapsed time.
     * This lets both clients share the same clock regardless of frame rate.
     */
    public setElapsedFromServer(serverElapsedMs: number) {
        const drift = Math.abs(this.elapsedTime - serverElapsedMs);
        if (drift > 2000 && this.elapsedTime > 0) {
            // Only log extreme drift if necessary for production monitoring, otherwise skip
            // console.log(`[GameManager] Syncing clock. Drift was ${drift}ms.`);
        }
        this.elapsedTime = serverElapsedMs;

        if (this.elapsedTime >= this.matchDuration && !this.gameEnded) {
            this.endGame();
        }
    }

    private logicAccumulator: number = 0;
    private readonly LOGIC_TICK_RATE: number = 1000 / 30; // 30 Hz

    public update(time: number, delta: number) {
        if (!this.gameStarted || this.gameEnded) return;

        // elapsedTime is primarily driven by setElapsedFromServer().
        // We also accumulate delta locally so the game ticks smoothly between
        // server ticks (100ms gap).
        this.elapsedTime += delta;

        // Fixed Timestep Accumulator
        this.logicAccumulator += delta;

        while (this.logicAccumulator >= this.LOGIC_TICK_RATE) {
            this.runLogicTick(time, this.LOGIC_TICK_RATE);
            this.logicAccumulator -= this.LOGIC_TICK_RATE;
        }
    }

    private runLogicTick(time: number, tickDelta: number) {
        if (this.gameEnded) return;

        if (this.elapsedTime >= this.matchDuration) {
            this.endGame();
            return;
        }

        // Update elixir
        if (this.isTestMode) {
            this.elixir = this.maxElixir;
        } else if (this.elixir < this.maxElixir) {
            // Elixir speed should be adjusted for the fixed tick
            this.elixir += (tickDelta / 1400);
            if (this.elixir > this.maxElixir) this.elixir = this.maxElixir;
        }

        // Remove already-dead entities from last frame first
        this.entities = this.entities.filter(e => e.health > 0 || e instanceof TowerEntity);

        // Update all troop entities, filtering out dead targets so troops don't lock onto destroyed towers
        const aliveEntities = this.entities.filter(e => e.health > 0);
        for (const entity of this.entities) {
            if (entity instanceof Troop) {
                entity.prepareTick(this.layout, time, aliveEntities);
                entity.update(time, tickDelta, aliveEntities, this.layout);
            } else if (entity instanceof Spell) {
                entity.update(time, tickDelta, aliveEntities, this.layout);
            } else if (entity instanceof TowerEntity) {
                entity.update(time, tickDelta, aliveEntities);
            }
        }

        // Remove dead troops (TowerEntity destruction handled in MainScene)
        this.entities = this.entities.filter(e =>
            e instanceof TowerEntity || e.health > 0
        );

        this.separateUnits();
    }

    /**
     * Push overlapping units apart so they don't stack on one spot. Units collide with
     * others on the same layer (ground/air); ground units are also pushed out of
     * towers and buildings, which never move.
     */
    private separateUnits() {
        const radiusOf = (e: Entity) => e.radius || DEFAULT_UNIT_RADIUS;
        const movers: Troop[] = [];
        const obstacles: Entity[] = [];
        for (const e of this.entities) {
            if (e.health <= 0) continue;
            if (e instanceof Building || e instanceof TowerEntity) obstacles.push(e);
            else if (e instanceof Troop) movers.push(e);
        }

        for (let i = 0; i < movers.length; i++) {
            const a = movers[i];

            for (let j = i + 1; j < movers.length; j++) {
                const b = movers[j];
                if (a.movementType !== b.movementType) continue;
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const minDist = radiusOf(a) + radiusOf(b);
                const distSq = dx * dx + dy * dy;
                if (distSq >= minDist * minDist) continue;

                const dist = Math.sqrt(distSq);
                // Exactly overlapping (e.g. same deploy point): pick a direction from the ids
                const nx = dist > 0.001 ? dx / dist : (a.id < b.id ? 1 : -1);
                const ny = dist > 0.001 ? dy / dist : 0;
                const push = (minDist - dist) * SEPARATION_STRENGTH / 2;
                a.x -= nx * push; a.y -= ny * push;
                b.x += nx * push; b.y += ny * push;
            }

            if (a.movementType !== 'GROUND') continue;
            for (const o of obstacles) {
                const dx = a.x - o.x;
                const dy = a.y - o.y;
                const minDist = radiusOf(a) + o.radius;
                const distSq = dx * dx + dy * dy;
                if (distSq >= minDist * minDist || distSq < 0.000001) continue;

                const dist = Math.sqrt(distSq);
                const push = (minDist - dist) * SEPARATION_STRENGTH;
                a.x += dx / dist * push;
                a.y += dy / dist * push;
            }
        }
    }

    public getEntities(): Entity[] {
        return this.entities;
    }

    public isCardSupported(cardId: string): boolean {
        return cardId in CARD_FACTORIES;
    }

    /**
     * Spawn a card's entity. Pass `entityId` when mirroring a deploy from another
     * client so both sides use the same id (required for host sync to match them up).
     */
    public deployCard(cardId: string, position: Point2D, ownerId: string, skipElixirCost: boolean = false, entityId?: string): Entity | null {
        const factory = CARD_FACTORIES[cardId];
        if (!factory) {
            console.warn(`[GameManager] Card "${cardId}" has no implementation yet`);
            return null;
        }

        const cost = getTroopStats(cardId).elixirCost;

        // Normalize ownerId
        ownerId = ownerId.toLowerCase();

        if (!skipElixirCost && (ownerId === 'player' || ownerId.startsWith('player'))) {
            if (this.elixir < cost) return null;
            this.elixir -= cost;
        }

        const id = entityId ?? `${factory.prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        const entity = factory.create(id, position.x, position.y, ownerId);
        this.addEntity(entity);
        return entity;
    }

    public addEntity(entity: Entity) {
        this.entities.push(entity);
    }

    /**
     * Called from MainScene when a tower sprite detects health <= 0.
     * MainScene is the single owner of tower destruction detection.
     */
    public onTowerDestroyed(isKing: boolean, ownerId: string, isAuthority: boolean = true) {
        if (this.gameEnded) return;

        const ownerLower = ownerId.toLowerCase();

        // 2v2 Role Mapping
        // Team 0: player1, player2 (Blue)
        // Team 1: player3, player4 (Red)
        const isTeam0 = ownerLower === 'player1' || ownerLower === 'player2' || ownerLower === 'player';
        const isTeam1 = ownerLower === 'player3' || ownerLower === 'player4' || ownerLower === 'opponent';

        const myTeam = (this.role === 'player1' || this.role === 'player2') ? 0 : 1;

        const isPlayerTeam = (myTeam === 0) ? isTeam0 : isTeam1;
        const isOpponentTeam = (myTeam === 0) ? isTeam1 : isTeam0;

        // King tower death awards 3 crowns and 3 towers destroyed for a full clear
        const crownCount = isKing ? 3 : 1;
        const towerCount = isKing ? 3 : 1;

        // Track tower destruction
        if (isPlayerTeam) {
            // Player tower destroyed, opponent gets credit
            this.opponentTowersDestroyed = Math.min(3, isKing ? 3 : this.opponentTowersDestroyed + towerCount);
            this.opponentCrowns = Math.min(3, isKing ? 3 : this.opponentCrowns + crownCount);
        } else if (isOpponentTeam || ownerLower.startsWith('player3') || ownerLower.startsWith('player4')) {
            // Opponent tower destroyed (check for 2v2 roles too), player gets credit
            this.playerTowersDestroyed = Math.min(3, isKing ? 3 : this.playerTowersDestroyed + towerCount);
            this.playerCrowns = Math.min(3, isKing ? 3 : this.playerCrowns + crownCount);
        }

        this.playerCrowns = Math.min(3, this.playerCrowns);
        this.opponentCrowns = Math.min(3, this.opponentCrowns);

        // ONLY immediate victory on king tower destruction or naturally reaching 3 crowns
        // Authority check: normally only host triggers end-game. 
        // EXCEPTION: anyone can trigger instant end-match locally for a King destruction to keep the UI snappy.
        if (isKing || (isAuthority && (this.playerCrowns >= 3 || this.opponentCrowns >= 3))) {
            this.victoryReason = isKing ? 'King Tower Destroyed!' : 'Three Crown Victory!';
            this.endGame();
        }
    }

    public getState() {
        return {
            entities: this.entities,
            elixir: this.elixir,
            gameEnded: this.gameEnded,
            winner: this.winner,
            playerCrowns: this.playerCrowns,
            opponentCrowns: this.opponentCrowns
        };
    }

    /**
     * Synchronize entity positions and health from the authoritative host (Player 1).
     * Only applies to troops.
     */
    public syncFromHost(payload: any, isLocalHost: boolean = true) {
        const { entities: snaps, playerCrowns, opponentCrowns, playerTowersDestroyed, opponentTowersDestroyed, gameEnded, winner, victoryReason } = payload;
        const mapWidth = ArenaConfig.COLS * ArenaConfig.TILE_SIZE;
        const mapHeight = ArenaConfig.ROWS * ArenaConfig.TILE_SIZE;

        if (snaps) {
            snaps.forEach((snap: any) => {
                let entity = this.entities.find(e => e.id === snap.id);
                let finalX = snap.x;
                let finalY = snap.y;
                let finalOwner = snap.ownerId;

                if (!isLocalHost) {
                    finalX = mapWidth - snap.x;
                    finalY = mapHeight - snap.y;

                    // Perspective flip logic for 2v2
                    // Team 0 (p1, p2) is Blue, Team 1 (p3, p4) is Red
                    // If snap.ownerId is 'player1' or 'player2', it's Blue.
                    // If snap.ownerId is 'player3' or 'player4', it's Red.
                    // From p3/p4 perspective: Red is 'player', Blue is 'opponent'
                    if (snap.ownerId === 'player1' || snap.ownerId === 'player2') {
                        finalOwner = 'opponent';
                    } else if (snap.ownerId === 'player3' || snap.ownerId === 'player4') {
                        finalOwner = 'player';
                    } else {
                        // Fallback/Legacy 1v1
                        finalOwner = snap.ownerId === 'player' ? 'opponent' : 'player';
                    }
                }

                if (!entity && !isLocalHost) {
                    const cardId = PREFIX_TO_CARD[snap.id.split('_')[0]];
                    if (cardId) {
                        entity = this.deployCard(cardId, { x: finalX, y: finalY }, finalOwner, true, snap.id) ?? undefined;
                    }
                }

                if (entity) {
                    if (entity instanceof Troop) {
                        entity.x = finalX;
                        entity.y = finalY;
                        entity.health = snap.health;
                        entity.state = snap.state;
                        if (snap.targetId) {
                            entity.target = this.entities.find(e => e.id === snap.targetId) || null;
                        }
                    } else if (entity instanceof TowerEntity) {
                        entity.health = snap.health;
                    }
                }
            });

            if (!isLocalHost) {
                // The host is authoritative: drop troops it no longer has (died or never spawned there)
                const snapIds = new Set<string>(snaps.map((s: any) => s.id));
                this.entities = this.entities.filter(e => {
                    if (!(e instanceof Troop) || snapIds.has(e.id)) {
                        this.syncMisses.delete(e.id);
                        return true;
                    }
                    const misses = (this.syncMisses.get(e.id) ?? 0) + 1;
                    if (misses >= SYNC_MISSES_BEFORE_REMOVAL) {
                        this.syncMisses.delete(e.id);
                        return false;
                    }
                    this.syncMisses.set(e.id, misses);
                    return true;
                });
            }
        }

        if (isLocalHost) {
            if (playerCrowns !== undefined) this.playerCrowns = playerCrowns;
            if (opponentCrowns !== undefined) this.opponentCrowns = opponentCrowns;
            if (playerTowersDestroyed !== undefined) this.playerTowersDestroyed = playerTowersDestroyed;
            if (opponentTowersDestroyed !== undefined) this.opponentTowersDestroyed = opponentTowersDestroyed;
        } else {
            if (playerCrowns !== undefined) this.opponentCrowns = playerCrowns;
            if (opponentCrowns !== undefined) this.playerCrowns = opponentCrowns;
            if (playerTowersDestroyed !== undefined) this.opponentTowersDestroyed = playerTowersDestroyed;
            if (opponentTowersDestroyed !== undefined) this.playerTowersDestroyed = opponentTowersDestroyed;
        }

        if (gameEnded !== undefined) this.gameEnded = gameEnded;
        if (winner !== undefined) {
            if (isLocalHost) this.winner = winner;
            else {
                if (winner === 'player') this.winner = 'opponent';
                else if (winner === 'opponent') this.winner = 'player';
                else this.winner = 'draw';
            }
        }
        if (victoryReason !== undefined) this.victoryReason = victoryReason;
    }

    public getRemainingTime(): number {
        return Math.max(0, this.matchDuration - this.elapsedTime);
    }

    public forceEndGame() {
        this.endGame();
    }

    private endGame() {
        if (this.gameEnded) return;

        this.gameEnded = true;

        // Freeze all troops immediately
        this.entities.forEach(e => {
            if (e instanceof Troop) {
                e.state = 'idle';
            }
        });

        // Get all towers (including destroyed ones to calculate total damage dealt)
        const playerTowers = this.entities.filter(e =>
            e instanceof TowerEntity && e.ownerId === 'player'
        );
        const opponentTowers = this.entities.filter(e =>
            e instanceof TowerEntity && e.ownerId === 'opponent'
        );

        // Tower health stats
        const playerTowersAlive = playerTowers.filter(t => t.health > 0);
        const opponentTowersAlive = opponentTowers.filter(t => t.health > 0);

        // Victory logic with tiebreakers
        if (this.playerCrowns > this.opponentCrowns) {
            this.winner = 'player';
            if (!this.victoryReason) this.victoryReason = 'More Crowns';
        } else if (this.opponentCrowns > this.playerCrowns) {
            this.winner = 'opponent';
            if (!this.victoryReason) this.victoryReason = 'More Crowns';
        } else {
            // Tiebreaker 1: More towers remaining
            if (playerTowersAlive.length > opponentTowersAlive.length) {
                this.winner = 'player';
                this.victoryReason = 'More Towers Remaining';
            } else if (opponentTowersAlive.length > playerTowersAlive.length) {
                this.winner = 'opponent';
                this.victoryReason = 'More Towers Remaining';
            } else {
                // Tiebreaker 2: Total Tower Health (Damage calculation)
                const playerTotalHealth = playerTowersAlive.reduce((acc, t) => acc + t.health, 0);
                const opponentTotalHealth = opponentTowersAlive.reduce((acc, t) => acc + t.health, 0);

                if (playerTotalHealth > opponentTotalHealth) {
                    this.winner = 'player';
                    this.victoryReason = `Higher Combined Tower Health (${playerTotalHealth} vs ${opponentTotalHealth})`;
                } else if (opponentTotalHealth > playerTotalHealth) {
                    this.winner = 'opponent';
                    this.victoryReason = `Higher Combined Tower Health (${opponentTotalHealth} vs ${playerTotalHealth})`;
                } else {
                    // Perfect draw
                    this.winner = 'draw';
                    this.victoryReason = 'Sudden Death Draw';
                }
            }
        }
    }
}
