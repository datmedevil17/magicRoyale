import { Entity, EntityType } from '../Entity';
import { getTroopStats } from '../../config/TroopConfig';
import { ArenaConfig } from '../../config/ArenaConfig';
import { getAnimTiming, hasSprite, spriteFor } from '../../config/AnimationTiming';
import { Troop } from '../troops/Troop';
import type { ArenaLayout } from '../Interfaces';

// Rage zones refresh this much rage on troops inside every tick, so it fades shortly after leaving
const RAGE_LINGER_MS = 300;

export class Spell extends Entity {
    public name: string;
    public radius: number;
    public damage: number;
    public effect: 'damage' | 'rage';
    public duration: number; // in ms
    public impactDelay: number; // ms after cast when damage lands
    public startTime: number = 0;
    private damageApplied: boolean = false;
    public state = 'fight' as const; // To reuse Unit animation logic

    constructor(id: string, x: number, y: number, ownerId: string, cardId: string) {
        super(id, x, y, ownerId, EntityType.SPELL);
        this.name = cardId;

        const stats = getTroopStats(cardId);
        this.radius = stats.range; // Using range as AOE radius
        this.damage = stats.damage;
        this.effect = stats.spellEffect ?? 'damage';

        // Damage lands on the animation's impact frame; the spell disappears when it ends.
        // Lingering spells (Rage) last spellDuration instead.
        const sprite = spriteFor(cardId, 'fight', 'player');
        const timing = hasSprite(sprite) ? getAnimTiming(sprite) : null;
        this.duration = stats.spellDuration ?? timing?.total ?? 1000;
        this.impactDelay = timing?.impactAt ?? 0;
        this.health = 1; // Spells "die" when duration ends
    }

    /** Lingering zone drawn under units rather than an effect drawn over them. */
    public get isZone(): boolean {
        return this.effect === 'rage';
    }

    public update(time: number, _delta: number, entities: Entity[], layout: ArenaLayout) {
        if (this.startTime === 0) {
            this.startTime = time;
        }

        const radius = this.radius * layout.tileSize / ArenaConfig.TILE_SIZE;

        if (this.effect === 'rage') {
            this.applyRage(time, entities, radius);
        } else if (!this.damageApplied && time - this.startTime >= this.impactDelay) {
            this.damageApplied = true;
            this.applyDamage(entities, radius);
        }

        if (time - this.startTime > this.duration) {
            this.health = 0; // Destroy entity
        }
    }

    private isInside(e: Entity, radius: number): boolean {
        return Math.hypot(e.x - this.x, e.y - this.y) <= radius + e.radius;
    }

    private applyDamage(entities: Entity[], radius: number) {
        for (const enemy of entities) {
            if (enemy.ownerId !== this.ownerId && enemy.health > 0 && enemy.type !== EntityType.SPELL
                && this.isInside(enemy, radius)) {
                enemy.takeDamage(this.damage);
            }
        }
    }

    /** Boost friendly troops and buildings inside the zone (towers are unaffected). */
    private applyRage(time: number, entities: Entity[], radius: number) {
        for (const e of entities) {
            if (e instanceof Troop && e.ownerId === this.ownerId && e.health > 0 && this.isInside(e, radius)) {
                e.rageUntil = Math.max(e.rageUntil, time + RAGE_LINGER_MS);
            }
        }
    }
}
