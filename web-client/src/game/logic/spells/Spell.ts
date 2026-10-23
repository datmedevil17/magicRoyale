import { Entity, EntityType } from '../Entity';
import { getTroopStats } from '../../config/TroopConfig';
import { ArenaConfig } from '../../config/ArenaConfig';
import { getAnimTiming, hasSprite, spriteFor } from '../../config/AnimationTiming';
import type { ArenaLayout } from '../Interfaces';

export class Spell extends Entity {
    public name: string;
    public radius: number;
    public damage: number;
    public duration: number; // in ms
    public impactDelay: number; // ms after cast when damage lands
    public startTime: number = 0;
    private damageApplied: boolean = false;
    public state: 'fight' = 'fight'; // To reuse Unit animation logic
    public pixelScale: number = 1.0;

    constructor(id: string, x: number, y: number, ownerId: string, cardId: string) {
        super(id, x, y, ownerId, EntityType.SPELL);
        this.name = cardId;

        const stats = getTroopStats(cardId);
        this.radius = stats.range; // Using range as AOE radius
        this.damage = stats.damage;
        this.pixelScale = stats.pixelScale || 1.0;

        // Damage lands on the animation's last frame; the spell disappears when it ends
        const sprite = spriteFor(cardId, 'fight', 'player');
        const timing = hasSprite(sprite) ? getAnimTiming(sprite) : null;
        this.duration = timing?.total ?? 1000;
        this.impactDelay = timing?.impactAt ?? 0;
        this.health = 1; // Spells "die" when duration ends
    }

    public update(time: number, _delta: number, enemies: Entity[], layout: ArenaLayout) {
        if (this.startTime === 0) {
            this.startTime = time;
        }

        if (!this.damageApplied && time - this.startTime >= this.impactDelay) {
            this.damageApplied = true;
            this.applyDamage(enemies, layout);
        }

        if (time - this.startTime > this.duration) {
            this.health = 0; // Destroy entity
        }
    }

    private applyDamage(enemies: Entity[], layout: ArenaLayout) {
        const scaleFactor = layout.tileSize / ArenaConfig.TILE_SIZE;
        const currentRadius = this.radius * scaleFactor;

        enemies.forEach(enemy => {
            if (enemy.ownerId !== this.ownerId && enemy.health > 0 && enemy.type !== EntityType.SPELL) {
                const dist = Math.sqrt(Math.pow(enemy.x - this.x, 2) + Math.pow(enemy.y - this.y, 2));
                if (dist <= currentRadius + enemy.radius) {
                    enemy.takeDamage(this.damage);
                }
            }
        });
    }
}
