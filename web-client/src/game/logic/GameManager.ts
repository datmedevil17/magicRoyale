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

    constructor(_user: IUser) {
        // user param kept for compatibility/extension
        this.entities = [];
    }

    public update(time: number, delta: number) {
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

        if (ownerId === 'player' || ownerId.startsWith('Player')) {
            if (this.elixir < cost) return null;
            this.elixir -= cost;
        }

        if (cardId === 'Archers') {
            // Spawn two archers? Or just one entity representing the card?
            // The request says "deploy archers... archer walk...". 
            // In Clash Royale, "Archers" spawns 2 units. 
            // For simplicity in this port, let's spawn ONE Archer for now, 
            // or we could spawn two. Let's spawn ONE to start to minimize complexity,
            // but the class is valid for multiple.

            // To match the user request "deploy archers... archer walk", 
            // one is enough to demonstrate the logic.
            const id = `archer_${Date.now()}_${Math.random()}`;
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
}
