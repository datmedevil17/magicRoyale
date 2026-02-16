import { Entity } from './Entity';
import { Barbarian } from './troops/Barbarian';
import { Troop } from './troops/Troop';
import { Archer } from './troops/Archer';
import { Giant } from './troops/Giant';
import { MiniPekka } from './troops/MiniPekka';
import { Valkyrie } from './troops/Valkyrie';
import { Wizard } from './troops/Wizard';
import { BabyDragon } from './troops/BabyDragon';
import type { Point2D } from './Interfaces';
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

    public startGame() {
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

        // Update elixir (Slower: approx 1 per 5s? User said "increase elixir formation" .. wait)
        // User said: "increase eleixir formation" -> FASTER elixir?
        // "decrese troops walk and attack speed by half" -> SLOWER troops.
        // "increase elixir formation" usually means get elixir faster.
        // Original: delta / 2800 -> 1 per 2.8s.
        // If I make it delta / 1400 -> 1 per 1.4s (Double speed).
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

        // Remove dead entities
        this.entities = this.entities.filter(e => e.health > 0);
    }

    public getEntities(): Entity[] {
        return this.entities;
    }

    public deployCard(cardId: string, position: Point2D, ownerId: string): Entity | null {
        let entity: Entity | null = null;

        // Simple cost check (for player only, currently)
        // In a real game, this would check the owner's elixir
        // For now, we assume implicit success or check GameManager.elixir if owner is player

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
            // Spawn 4 Barbarians
            this.addEntity(new Barbarian(`barb_${Date.now()}_1`, position.x - 20, position.y - 20, ownerId));
            this.addEntity(new Barbarian(`barb_${Date.now()}_2`, position.x + 20, position.y - 20, ownerId));
            this.addEntity(new Barbarian(`barb_${Date.now()}_3`, position.x - 20, position.y + 20, ownerId));
            // Return one as main entity
            entity = new Barbarian(`barb_${Date.now()}_4`, position.x + 20, position.y + 20, ownerId);
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

        // Check for 3-crown victory
        if (this.playerCrowns >= 3 || this.opponentCrowns >= 3) {
            this.endGame();
        }
    }

    public getRemainingTime(): number {
        return Math.max(0, this.matchDuration - this.elapsedTime);
    }

    private endGame() {
        if (this.gameEnded) return;

        this.gameEnded = true;

        // Determine winner
        if (this.playerCrowns > this.opponentCrowns) {
            this.winner = 'player';
        } else if (this.opponentCrowns > this.playerCrowns) {
            this.winner = 'opponent';
        } else {
            this.winner = 'draw';
        }
    }
}
