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

    public update(time: number, delta: number) {
        if (!this.gameStarted || this.gameEnded) return;

        // Track elapsed time
        this.elapsedTime += delta;

        // Check for time-based victory
        if (this.elapsedTime >= this.matchDuration) {
            this.endGame();
            return;
        }

        // Update elixir
        if (this.isTestMode) {
            this.elixir = this.maxElixir;
        } else if (this.elixir < this.maxElixir) {
            this.elixir += (delta / 1400);
            if (this.elixir > this.maxElixir) this.elixir = this.maxElixir;
        }

        // Update all entities
        for (const entity of this.entities) {
            if (entity instanceof Troop) {
                entity.updateBase(this.layout);
                entity.update(time, delta, this.entities, this.layout);
            }
        }

        // Check for destroyed towers BEFORE removing dead entities
        for (const entity of this.entities) {
            if (entity instanceof TowerEntity && entity.health <= 0 && !entity.destroyed) {
                entity.destroyed = true; // Mark as destroyed to avoid calling onTowerDestroyed multiple times
                const isKing = entity.id.includes('King');
                console.log(`Tower ${entity.id} destroyed! IsKing: ${isKing}, Owner: ${entity.ownerId}`);
                this.onTowerDestroyed(isKing, entity.ownerId);
            }
        }

        // Remove dead entities
        this.entities = this.entities.filter(e => e.health > 0);
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
        }

        if (entity) {
            this.addEntity(entity);
        }

        return entity;
    }

    public addEntity(entity: Entity) {
        this.entities.push(entity);
    }

    public onTowerDestroyed(isKing: boolean, ownerId: string) {
        if (this.gameEnded) return;

        // Track tower destruction
        if (ownerId === 'player') {
            this.playerTowersDestroyed++;
        } else {
            this.opponentTowersDestroyed++;
        }

        // Award crowns
        const crownCount = isKing ? 3 : 1;

        if (ownerId === 'player') {
            // Player tower destroyed, opponent gets crowns
            this.opponentCrowns += crownCount;
        } else {
            // Opponent tower destroyed, player gets crowns
            this.playerCrowns += crownCount;
        }

        // Cap at 3 crowns
        this.playerCrowns = Math.min(3, this.playerCrowns);
        this.opponentCrowns = Math.min(3, this.opponentCrowns);

        // IMMEDIATE victory on king tower destruction
        if (isKing) {
            this.victoryReason = 'King Tower Destroyed!';
            this.endGame();
            return;
        }

        // Check for 3-crown victory
        if (this.playerCrowns >= 3 || this.opponentCrowns >= 3) {
            this.victoryReason = 'Three Crown Victory!';
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

        // Get remaining towers
        const playerTowers = this.entities.filter(e =>
            e instanceof TowerEntity && e.ownerId === 'player' && e.health > 0
        );
        const opponentTowers = this.entities.filter(e =>
            e instanceof TowerEntity && e.ownerId === 'opponent' && e.health > 0
        );

        // Update tower destruction counts (in case called by timer)
        this.playerTowersDestroyed = 3 - playerTowers.length;
        this.opponentTowersDestroyed = 3 - opponentTowers.length;

        // Victory logic with tiebreakers
        if (this.playerCrowns > this.opponentCrowns) {
            this.winner = 'player';
            if (!this.victoryReason) this.victoryReason = 'More Crowns';
        } else if (this.opponentCrowns > this.playerCrowns) {
            this.winner = 'opponent';
            if (!this.victoryReason) this.victoryReason = 'More Crowns';
        } else if (playerTowers.length > opponentTowers.length) {
            // Tiebreaker 1: More towers remaining
            this.winner = 'player';
            this.victoryReason = 'More Towers Remaining';
        } else if (opponentTowers.length > playerTowers.length) {
            this.winner = 'opponent';
            this.victoryReason = 'More Towers Remaining';
        } else if (playerTowers.length > 0 && opponentTowers.length > 0) {
            // Tiebreaker 2: Minimum health comparison
            const playerMinHealth = Math.min(...playerTowers.map(t => t.health));
            const opponentMinHealth = Math.min(...opponentTowers.map(t => t.health));

            if (playerMinHealth > opponentMinHealth) {
                this.winner = 'player';
                this.victoryReason = 'Higher Tower Health';
            } else if (opponentMinHealth > playerMinHealth) {
                this.winner = 'opponent';
                this.victoryReason = 'Higher Tower Health';
            } else {
                this.winner = 'draw';
                this.victoryReason = 'Perfect Draw';
            }
        } else {
            // All towers destroyed on both sides (rare)
            this.winner = 'draw';
            this.victoryReason = 'All Towers Destroyed';
        }
    }
}
