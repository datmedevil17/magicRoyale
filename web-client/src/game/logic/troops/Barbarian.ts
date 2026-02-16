import { Troop, TroopState } from './Troop';
import { Entity } from '../Entity';
import type { ArenaLayout } from '../Interfaces';

export class Barbarian extends Troop {
    public name = 'Barbarians';

    constructor(id: string, x: number, y: number, ownerId: string) {
        super(id, x, y, ownerId, 'Barbarian');
    }

    update(time: number, delta: number, enemies: Entity[], layout: ArenaLayout) {
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
