import { Troop, TroopState } from './Troop';
import { Entity, EntityType } from '../Entity';

export class Giant extends Troop {
    public name = 'Giant';
    public speed = 45; // Slow
    public range = 2; // Melee but slight range
    public hitSpeed = 1.5;
    public damage = 211;
    public attackType: 'GROUND' | 'AIR' | 'BOTH' = 'GROUND';
    public movementType: 'GROUND' | 'AIR' = 'GROUND';

    constructor(id: string, x: number, y: number, ownerId: string) {
        super(id, x, y, ownerId);
        this.maxHealth = 2000;
        this.health = this.maxHealth;
        // Giants target buildings only in real game, but for now simple target
        // Actually let's try to mimic that they ignore troops? 
        // For simplicity now, let's keep them attacking anything, or prefer towers?
        // Let's stick to standard behavior for now to avoid complex targeting logic updates.
    }

    update(time: number, delta: number, enemies: Entity[]) {
        // Simple AI: Move to nearest enemy, attack if in range

        // Find nearest enemy
        let closest: Entity | null = null;
        let minDistance = Infinity;

        // Filter enemies based on targeting preference? 
        // Giant targets Buildings (Towers). 
        // Let's implement that simple preference.
        const buildings = enemies.filter(e => e.type === EntityType.TOWER);
        const targets = buildings.length > 0 ? buildings : enemies;

        for (const enemy of targets) {
            if (enemy.ownerId === this.ownerId) continue;
            const dist = this.getDistanceTo(enemy);
            if (dist < minDistance) {
                minDistance = dist;
                closest = enemy;
            }
        }

        this.target = closest;

        if (this.target) {
            if (this.isInRange(this.target)) {
                this.state = TroopState.FIGHT;
                if (time - this.lastAttackTime > this.hitSpeed * 1000) {
                    this.attack(this.target);
                    this.lastAttackTime = time;
                }
            } else {
                this.state = TroopState.WALK;
                this.moveTowards(this.target, delta);
            }
        } else {
            this.state = TroopState.WALK;
            // Move forward if no target
            this.moveForward(delta);
        }
    }

    private attack(target: Entity) {
        target.takeDamage(this.damage);
    }
}
