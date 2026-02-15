import { Troop, TroopState } from './Troop';
import { Entity } from '../Entity';

export class BabyDragon extends Troop {
    public name = 'BabyDragon';
    public speed = 45; // Halved from 90
    public range = 120; // Ranged
    public hitSpeed = 1.6;
    public damage = 100;
    public attackType: 'GROUND' | 'AIR' | 'BOTH' = 'BOTH';
    public movementType: 'GROUND' | 'AIR' = 'AIR';

    constructor(id: string, x: number, y: number, ownerId: string) {
        super(id, x, y, ownerId);
        this.maxHealth = 800;
        this.health = this.maxHealth;
    }

    update(time: number, delta: number, enemies: Entity[]) {
        let closest: Entity | null = null;
        let minDistance = Infinity;

        for (const enemy of enemies) {
            if (enemy.ownerId === this.ownerId) continue;
            // Baby Dragon hits BOTH, so no filter needed for Ground/Air
            // But we might want to respect future constraints.

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
