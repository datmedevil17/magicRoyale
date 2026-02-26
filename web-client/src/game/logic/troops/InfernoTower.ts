import { Troop, TroopState } from './Troop';
import { Entity } from '../Entity';
import type { ArenaLayout } from '../Interfaces';

export class InfernoTower extends Troop {
    public name = 'InfernoTower';

    constructor(id: string, x: number, y: number, ownerId: string) {
        super(id, x, y, ownerId, 'InfernoTower');
    }

    update(_time: number, _delta: number, enemies: Entity[], _layout: ArenaLayout) {
        // Inferno Tower is a building, it doesn't move. 
        // It just searches for targets within range and attacks.

        if (this.target && (this.target.health <= 0 || !this.isInRange(this.target))) {
            this.target = null;
            this.state = TroopState.IDLE;
        }

        if (!this.target) {
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
        }

        if (this.target) {
            this.state = TroopState.FIGHT;
            this.faceTarget(this.target);
            if (_time - this.lastAttackTime > this.hitSpeed) {
                this.attack(this.target);
                this.lastAttackTime = _time;
            }
        } else {
            this.state = TroopState.IDLE;
        }
    }

    private attack(target: Entity) {
        // Inferno logic: damage increases over time? 
        // For now, standard damage
        target.takeDamage(this.damage);
    }
}
