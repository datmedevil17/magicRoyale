import { Entity, EntityType } from '../Entity';
import { getTroopStats } from '../../config/TroopConfig';
import { ArenaConfig } from '../../config/ArenaConfig';
import type { ArenaLayout } from '../Interfaces';

export class Spell extends Entity {
    public name: string;
    public radius: number;
    public damage: number;
    public duration: number; // in ms
    public startTime: number = 0;
    public state: 'fight' = 'fight'; // To reuse Unit animation logic
    public pixelScale: number = 1.0;

    constructor(id: string, x: number, y: number, ownerId: string, cardId: string) {
        super(id, x, y, ownerId, EntityType.SPELL);
        this.name = cardId;

        const stats = getTroopStats(cardId);
        this.radius = stats.range; // Using range as AOE radius
        this.damage = stats.damage;
        this.pixelScale = stats.pixelScale || 1.0;

        // Spells disappear after animation. For now, estimate or use config.
        this.duration = 1000; // 1 second default 
        this.health = 1; // Spells "die" when duration ends
    }

    public update(time: number, delta: number, enemies: Entity[], layout: ArenaLayout) {
        if (this.startTime === 0) {
            this.startTime = time;
            this.applyDamage(enemies, layout);
        }

        // Use delta to decrement duration (or just ignore if using absolute time)
        // To satisfy lint:
        if (delta > 0) {
            // duration is already handled by time - startTime
        }

        if (time - this.startTime > this.duration) {
            this.health = 0; // Destroy entity
        }
    }

    private applyDamage(enemies: Entity[], layout: ArenaLayout) {
        const scaleFactor = layout.tileSize / ArenaConfig.TILE_SIZE;
        const currentRadius = this.radius * scaleFactor;

        enemies.forEach(enemy => {
            if (enemy.ownerId !== this.ownerId && enemy.health > 0) {
                const dist = Math.sqrt(Math.pow(enemy.x - this.x, 2) + Math.pow(enemy.y - this.y, 2));
                if (dist <= currentRadius + enemy.radius) {
                    enemy.takeDamage(this.damage);
                }
            }
        });
    }
}
