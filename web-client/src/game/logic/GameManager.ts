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
import { Spell } from './spells/Spell';
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

    public role: string = 'player1';

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
                entity.updateBase(this.layout);
                entity.update(time, tickDelta, aliveEntities, this.layout);
            } else if (entity instanceof Spell) {
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

    public deployCard(cardId: string, position: Point2D, ownerId: string, skipElixirCost: boolean = false): Entity | null {
        let entity: Entity | null = null;

        const stats = getTroopStats(cardId);
        let cost = stats.elixirCost;

        // Normalize ownerId
        ownerId = ownerId.toLowerCase();

        if (!skipElixirCost && (ownerId === 'player' || ownerId.startsWith('player'))) {
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
        } else if (cardId === 'Arrows') {
            const id = `arrows_${Date.now()}_${Math.random()}`;
            entity = new Spell(id, position.x, position.y, ownerId, 'Arrows');
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
                    const typePrefix = snap.id.split('_')[0];
                    const cardIdMap: Record<string, string> = {
                        'giant': 'Giant', 'archer': 'Archers', 'minipekka': 'MiniPEKKA',
                        'valkyrie': 'Valkyrie', 'babydragon': 'BabyDragon', 'wizard': 'Wizard',
                        'barb': 'Barbarians', 'inferno': 'InfernoTower'
                    };
                    const cardId = cardIdMap[typePrefix];
                    if (cardId) {
                        entity = this.deployCard(cardId, { x: finalX, y: finalY }, finalOwner, true) as Entity;
                        if (entity) entity.id = snap.id;
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
