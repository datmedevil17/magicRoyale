import { Troop, TroopState } from './Troop';
import { Entity } from '../Entity';
import type { ArenaLayout } from '../Interfaces';

export class Wizard extends Troop {
    public name = 'Wizard';

    constructor(id: string, x: number, y: number, ownerId: string) {
        super(id, x, y, ownerId, 'Wizard');
    }

    update(time: number, delta: number, enemies: Entity[], layout: ArenaLayout) {
        let closest: Entity | null = null;
        let minDistance = Infinity;

        for (const enemy of enemies) {
            if (enemy.ownerId === this.ownerId) continue;
            if (!this.canSee(enemy)) continue;

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
                this.faceTarget(this.target);
                if (time - this.lastAttackTime > this.hitSpeed) {
                    this.attack(this.target);
                    this.lastAttackTime = time;
                }
            } else {
                // Use shouldStopMoving to prevent jitter/teleport issues at range edge
                if (!this.shouldStopMoving(this.target)) {
                    this.state = TroopState.WALK;
                    this.moveTowards(this.target, delta, layout);
                } else {
                    this.state = TroopState.IDLE;
                }
            }
        } else {
            this.state = TroopState.WALK;
            this.moveForward(delta, layout);
        }
    }

    private attack(target: Entity) {
        console.log(`[${Date.now()}] Wizard ${this.id} attacks ${target.id} for ${this.damage}`);
        target.takeDamage(this.damage);
    }
}
