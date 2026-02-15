import { Entity } from './Entity';
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

    // Game state
    public playerCrowns: number = 0;
    public opponentCrowns: number = 0;
    public matchDuration: number = 180000; // 3 minutes in ms
    public elapsedTime: number = 0;
    public gameEnded: boolean = false;
    public winner: string | null = null;

    constructor(_user: IUser) {
        // user param kept for compatibility/extension
        this.entities = [];
    }

    public update(time: number, delta: number) {
        if (this.gameEnded) return;

        // Track elapsed time
        this.elapsedTime += delta;

        // Check for time-based victory
        if (this.elapsedTime >= this.matchDuration) {
            this.endGame();
            return;
        }

        // Update elixir (approx 1 per 2.8s)
        if (this.elixir < this.maxElixir) {
            this.elixir += (delta / 2800);
            if (this.elixir > this.maxElixir) this.elixir = this.maxElixir;
        }

        // Update all entities
        for (const entity of this.entities) {
            if (entity instanceof Troop) {
                entity.update(time, delta, this.entities);
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

        let cost = 3; // Default
        switch (cardId) {
            case 'Archers': cost = 3; break;
            case 'Giant': cost = 5; break;
            case 'MiniPEKKA': cost = 4; break;
            case 'Valkyrie': cost = 4; break;
            case 'Wizard': cost = 5; break;
            case 'BabyDragon': cost = 4; break;
        }

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
