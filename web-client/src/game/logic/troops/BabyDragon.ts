import { TroopStats } from '../TroopStats';
import { Troop, TroopState } from './Troop';
import { Entity } from '../Entity';
import type { ArenaLayout } from '../Interfaces';

export class BabyDragon extends Troop {
    public name = TroopStats.BabyDragon.name;
    public speed = TroopStats.BabyDragon.speed;
    public range = TroopStats.BabyDragon.range;
    public hitSpeed = TroopStats.BabyDragon.hitSpeed;
    public damage = TroopStats.BabyDragon.damage;
    public attackType = TroopStats.BabyDragon.attackType;
    public movementType = TroopStats.BabyDragon.movementType;

    constructor(id: string, x: number, y: number, ownerId: string) {
        super(id, x, y, ownerId, 'BabyDragon');
        this.maxHealth = TroopStats.BabyDragon.health;
        this.health = this.maxHealth;
    }

    update(time: number, delta: number, enemies: Entity[], layout: ArenaLayout) {
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
                this.moveTowards(this.target, delta, layout);
            }
        } else {
            this.state = TroopState.WALK;
            this.moveForward(delta, layout);
        }
    }

    private attack(target: Entity) {
        target.takeDamage(this.damage);
    }
}
