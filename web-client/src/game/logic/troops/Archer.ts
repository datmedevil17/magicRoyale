import { Troop, TroopState } from './Troop';
import { Entity } from '../Entity';
import type { ArenaLayout } from '../Interfaces';

export class Archer extends Troop {
    public name = 'Archers';

    constructor(id: string, x: number, y: number, ownerId: string) {
        super(id, x, y, ownerId, 'Archers');
    }

    update(time: number, delta: number, enemies: Entity[], layout: ArenaLayout) {
        // Simple AI:
        // 1. Check for enemies in range
        // 2. If target exists and in range -> Attack
        // 3. If no target -> Move forward (up/down depending on owner)

        if (this.target && (this.target.health <= 0)) {
            this.target = null;
            this.state = TroopState.WALK;
        }

        if (!this.target) {
            this.target = this.findNearestEnemy(enemies);
        }

        if (this.target) {
            // Check Attack Range first
            if (this.isInRange(this.target)) {
                this.state = TroopState.FIGHT;
                this.faceTarget(this.target);
                if (time - this.lastAttackTime > this.hitSpeed) {
                    this.attack(this.target);
                    this.lastAttackTime = time;
                }
            } else {
                // Not in attack range. Should we move?
                // Logic:
                // If not in Stop Range -> Move.
                // If in Stop Range but NOT Attack Range -> Stand still? (Dead zone).
                // Ideally stopRange <= range so this never happens.
                // If stopRange > range (we stop early), we can't attack.

                if (!this.shouldStopMoving(this.target)) {
                    this.state = TroopState.WALK;
                    this.moveTowards(this.target, delta, layout);
                } else {
                    // We are in Stop Range, but NOT in Attack Range.
                    // This creates a standoff.
                    // But if stopRange <= range, this else block assumes we are NOT in range.
                    // So we must be > range.
                    // If we are > range, and !shouldStopMoving (<= stopRange), then we are <= stopRange.

                    // Case: range=40, stopRange=30. Dist=35.
                    // isInRange(40)? True. -> Attacks.

                    // Case: range=40, stopRange=50. Dist=45.
                    // isInRange(40)? False.
                    // shouldStop(50)? True.
                    // Result: Stands still at 45. Too far to attack.

                    // So user MUST set stopRange <= range for melee/attack logic to work, OR we allow attacking from stopRange?
                    // User wants to "reduce to range".
                    // So stopRange will be smaller.

                    this.state = TroopState.IDLE; // Wait
                }
            }
        } else {
            this.state = TroopState.WALK;
            // No enemies? Move to opponent side
            this.moveForward(delta, layout);
        }
    }

    private findNearestEnemy(enemies: Entity[]): Entity | null {
        let nearest: Entity | null = null;
        let minDist = Infinity;

        for (const enemy of enemies) {
            if (enemy.ownerId === this.ownerId) continue; // Ignore friendlies
            if (!this.canSee(enemy)) continue; // Use the new Sight Range logic

            const dist = this.getDistanceTo(enemy);
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        }
        return nearest;
    }

    private attack(target: Entity) {
        target.takeDamage(this.damage);
    }
}
