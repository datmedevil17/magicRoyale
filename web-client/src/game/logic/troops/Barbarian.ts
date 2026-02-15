import { Troop, TroopState } from './Troop';
import { Entity } from '../Entity';

export class Barbarian extends Troop {
    public name = 'Barbarians';
    public speed = 45; // Medium (90/2)
    public range = 50; // Melee
    public hitSpeed = 1.5;
    public damage = 75;
    public attackType: 'GROUND' | 'AIR' | 'BOTH' = 'GROUND';
    public movementType: 'GROUND' | 'AIR' = 'GROUND';

    constructor(id: string, x: number, y: number, ownerId: string) {
        super(id, x, y, ownerId);
        this.maxHealth = 350;
        this.health = this.maxHealth;
    }

    update(time: number, delta: number, enemies: Entity[]) {
        let closest: Entity | null = null;
        let minDistance = Infinity;

        for (const enemy of enemies) {
            if (enemy.ownerId === this.ownerId) continue;

            // Target Constraint: Barbarians hit GROUND only
            if (enemy instanceof Troop && enemy.movementType === 'AIR') continue;

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
            this.moveForward(delta);
        }
    }

    private attack(target: Entity) {
        target.takeDamage(this.damage);
    }
}
