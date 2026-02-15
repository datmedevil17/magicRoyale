import { Troop, TroopState } from './Troop';
import { Entity } from '../Entity';

export class Valkyrie extends Troop {
    public name = 'Valkyrie';
    public speed = 60; // Medium
    public range = 1.5; // Melee (AOE technically, but single target for now)
    public hitSpeed = 1.5;
    public damage = 120;
    public attackType: 'GROUND' | 'AIR' | 'BOTH' = 'GROUND';
    public movementType: 'GROUND' | 'AIR' = 'GROUND';

    constructor(id: string, x: number, y: number, ownerId: string) {
        super(id, x, y, ownerId);
        this.maxHealth = 900;
        this.health = this.maxHealth;
    }

    update(time: number, delta: number, enemies: Entity[]) {
        let closest: Entity | null = null;
        let minDistance = Infinity;

        for (const enemy of enemies) {
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
                    // Valkyrie deals AOE damage in real game. 
                    // Let's simplisticly damage only target for now, 
                    // or maybe nearby enemies? 
                    // Keeping simple for now.
                    this.lastAttackTime = time;
                }
            } else {
                this.state = TroopState.WALK;
                this.moveTowards(this.target, delta);
            }
        } else {
            this.state = TroopState.WALK;
            this.moveForward(delta);
        }
    }

    private attack(target: Entity) {
        target.takeDamage(this.damage);
    }
}
