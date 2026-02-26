import { Entity } from './Entity';
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
import { TowerEntity } from './TowerEntity';
import type { Point2D, ArenaLayout } from './Interfaces';
import type { IUser } from './User';

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

    constructor(_user: IUser, isTestMode: boolean = false) {
        // user param kept for compatibility/extension
        this.isTestMode = isTestMode;
        this.entities = [];
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
                entity.updateBase(this.layout);
                entity.update(time, tickDelta, aliveEntities, this.layout);
            }
        }

        // Remove dead troops (TowerEntity destruction handled in MainScene)
        this.entities = this.entities.filter(e =>
            e instanceof TowerEntity || e.health > 0
        );
    }

    public getEntities(): Entity[] {
        return this.entities;
    }

    public deployCard(cardId: string, position: Point2D, ownerId: string): Entity | null {
        let entity: Entity | null = null;

        const stats = getTroopStats(cardId);
        let cost = stats.elixirCost;

        // Normalize ownerId
        ownerId = ownerId.toLowerCase();

        if (ownerId === 'player' || ownerId.startsWith('player')) {
            if (this.elixir < cost) return null;
            this.elixir -= cost;
        }

        if (cardId === 'Archers') {
            const id = `archer_${Date.now()}_${Math.random()}`;
            entity = new Archer(id, position.x, position.y, ownerId);
        } else if (cardId === 'Giant') {
            const id = `giant_${Date.now()}_${Math.random()}`;
            entity = new Giant(id, position.x, position.y, ownerId);
        } else if (cardId === 'MiniPEKKA') {
            const id = `minipekka_${Date.now()}_${Math.random()}`;
            entity = new MiniPekka(id, position.x, position.y, ownerId);
        } else if (cardId === 'Valkyrie') {
            const id = `valkyrie_${Date.now()}_${Math.random()}`;
            entity = new Valkyrie(id, position.x, position.y, ownerId);
        } else if (cardId === 'Wizard') {
            const id = `wizard_${Date.now()}_${Math.random()}`;
            entity = new Wizard(id, position.x, position.y, ownerId);
        } else if (cardId === 'BabyDragon') {
            const id = `babydragon_${Date.now()}_${Math.random()}`;
            entity = new BabyDragon(id, position.x, position.y, ownerId);
        } else if (cardId === 'Barbarians') {
            const id = `barb_${Date.now()}_${Math.random()}`;
            entity = new Barbarian(id, position.x, position.y, ownerId);
        } else if (cardId === 'InfernoTower') {
            const id = `inferno_${Date.now()}_${Math.random()}`;
            entity = new InfernoTower(id, position.x, position.y, ownerId);
        }

        if (entity) {
            this.addEntity(entity);
        }

        return entity;
    }

    public addEntity(entity: Entity) {
        this.entities.push(entity);
    }

    /**
     * Called from MainScene when a tower sprite detects health <= 0.
     * MainScene is the single owner of tower destruction detection.
     */
    public onTowerDestroyed(isKing: boolean, ownerId: string) {
        if (this.gameEnded) return;

        const ownerLower = ownerId.toLowerCase();
        const isPlayerTeam = ownerLower.startsWith('player');
        const isOpponentTeam = ownerLower.startsWith('opponent');

        // Track tower destruction
        if (isPlayerTeam) {
            this.playerTowersDestroyed++;
        } else if (isOpponentTeam) {
            this.opponentTowersDestroyed++;
        }

        // Award crowns
        const crownCount = isKing ? 3 : 1;

        if (isPlayerTeam) {
            // Player tower destroyed, opponent gets crowns
            this.opponentCrowns += crownCount;
        } else if (isOpponentTeam) {
            // Opponent tower destroyed, player gets crowns
            this.playerCrowns += crownCount;
        }

        // Cap at 3 crowns (standard rules: King tower = 3 crowns)
        if (isKing) {
            if (isOpponentTeam) this.playerCrowns = 3;
            if (isPlayerTeam) this.opponentCrowns = 3;
        }

        this.playerCrowns = Math.min(3, this.playerCrowns);
        this.opponentCrowns = Math.min(3, this.opponentCrowns);

        // IMMEDIATE victory on 3 crowns OR king tower destruction
        if (this.playerCrowns >= 3 || this.opponentCrowns >= 3 || isKing) {
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

    public getRemainingTime(): number {
        return Math.max(0, this.matchDuration - this.elapsedTime);
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
                    this.victoryReason = 'Higher Combined Tower Health';
                } else if (opponentTotalHealth > playerTotalHealth) {
                    this.winner = 'opponent';
                    this.victoryReason = 'Higher Combined Tower Health';
                } else {
                    // Perfect draw
                    this.winner = 'draw';
                    this.victoryReason = 'Sudden Death Draw';
                }
            }
        }
    }
}
