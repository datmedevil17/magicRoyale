import { Entity, EntityType } from './Entity';

// Projectile speed in px per ms; damage lands when the shot reaches its target
const PROJECTILE_SPEED = 0.5;

/** The most recent shot, for the renderer to draw a projectile. */
export interface TowerShot {
    time: number;
    targetX: number;
    targetY: number;
    flightMs: number;
}

export class TowerEntity extends Entity {
    public range: number = 5.5; // Tiles
    public damage: number = 90;
    public hitSpeed: number = 0.8;
    public lastAttackTime: number = 0;
    public maxHealth: number;
    public lastShot: TowerShot | null = null;
    public destroyed: boolean = false;
    public isKing: boolean;
    /** King towers sleep until they take damage or one of their princess towers falls. */
    public active: boolean;
    private tileSize: number = 22;
    private pendingHits: { target: Entity; time: number }[] = [];

    constructor(id: string, x: number, y: number, ownerId: string, isKing: boolean, radius: number, tileSize: number = 22) {
        super(id, x, y, ownerId, EntityType.TOWER);
        this.isKing = isKing;
        this.active = !isKing;
        this.maxHealth = isKing ? 4000 : 2500;
        this.health = this.maxHealth;
        this.radius = radius;
        this.tileSize = tileSize;
    }

    public activate() {
        this.active = true;
    }

    public update(time: number, _delta: number, targets: Entity[]): void {
        // Destroyed towers stay in the entity list (for tiebreakers) but must not fire
        if (this.health <= 0) {
            this.pendingHits = [];
            return;
        }

        // Any damage wakes a sleeping king. Checked via health (not takeDamage) so it also
        // works on non-host clients, where health arrives in host snapshots.
        if (!this.active && this.health < this.maxHealth) this.activate();
        if (!this.active) return;

        // Land shots whose projectile has arrived
        if (this.pendingHits.length > 0) {
            this.pendingHits = this.pendingHits.filter(hit => {
                if (time < hit.time) return true;
                if (hit.target.health > 0) hit.target.takeDamage(this.damage);
                return false;
            });
        }

        // Cooldown check
        if (time - this.lastAttackTime < this.hitSpeed * 1000) return;

        // Find target
        let closest: Entity | null = null;
        let minDist = Infinity;
        const rangePx = this.range * this.tileSize;

        for (const target of targets) {
            if (target.ownerId !== this.ownerId && target.health > 0 && target.type !== EntityType.SPELL) {
                const dist = Math.hypot(target.x - this.x, target.y - this.y);
                if (dist <= rangePx && dist < minDist) {
                    minDist = dist;
                    closest = target;
                }
            }
        }

        if (closest) {
            this.lastAttackTime = time;
            const flightMs = minDist / PROJECTILE_SPEED;
            this.pendingHits.push({ target: closest, time: time + flightMs });
            this.lastShot = { time, targetX: closest.x, targetY: closest.y, flightMs };
        }
    }
}
