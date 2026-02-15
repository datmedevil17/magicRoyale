import { Entity, EntityType } from './Entity';

export class TowerEntity extends Entity {
    public range: number = 5.5; // Tiles
    public damage: number = 90;
    public hitSpeed: number = 0.8;
    public lastAttackTime: number = 0;
    public maxHealth: number;
    public isShooting: boolean = false;
    public destroyed: boolean = false;
    private shootingTimer: number = 0;

    constructor(id: string, x: number, y: number, ownerId: string, isKing: boolean) {
        super(id, x, y, ownerId, EntityType.BUILDING);
        this.maxHealth = isKing ? 4000 : 2500;
        this.health = this.maxHealth;
        this.radius = 50; // Towers are big
    }

    public update(time: number, _delta: number, targets: Entity[]): void {
        // Reset shooting state if enough time passed (e.g. 500ms animation)
        if (this.isShooting && time - this.shootingTimer > 500) {
            this.isShooting = false;
        }

        // Cooldown check
        if (time - this.lastAttackTime < this.hitSpeed * 1000) return;

        // Find target
        let closest: Entity | null = null;
        let minDist = Infinity;
        const rangePx = this.range * 22;

        for (const target of targets) {
            if (target.ownerId !== this.ownerId && target.health > 0) {
                const dist = Math.hypot(target.x - this.x, target.y - this.y);
                if (dist <= rangePx && dist < minDist) {
                    minDist = dist;
                    closest = target;
                }
            }
        }

        if (closest) {
            this.attack(closest);
            this.lastAttackTime = time;
            this.isShooting = true;
            this.shootingTimer = time;
        }
    }

    private attack(target: Entity) {
        // Deal damage
        target.takeDamage(this.damage);
    }
}
