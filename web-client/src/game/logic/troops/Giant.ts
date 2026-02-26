import { Troop, TroopState } from './Troop';
import { Entity, EntityType } from '../Entity';
import type { ArenaLayout } from '../Interfaces';

export class Giant extends Troop {
    public name = 'Giant';

    constructor(id: string, x: number, y: number, ownerId: string) {
        super(id, x, y, ownerId, 'Giant');
        // Giants target buildings only in real game, but for now simple target
        // Actually let's try to mimic that they ignore troops? 
        // For simplicity now, let's keep them attacking anything, or prefer towers?
        // Let's stick to standard behavior for now to avoid complex targeting logic updates.
    }

    update(time: number, delta: number, enemies: Entity[], layout: ArenaLayout) {
        // Handle Scheduled Damage
        if (this.damageScheduled && time >= this.damageTime) {
            if (this.pendingTarget && this.pendingTarget.health > 0) {
                this.performAttack(this.pendingTarget);
            }
            this.damageScheduled = false;
            this.pendingTarget = null;
        }

        // Simple AI: Move to nearest enemy, attack if in range
        // ... (existing targeting logic)

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
                    // Schedule Attack instead of immediate
                    if (!this.damageScheduled) {
                        this.damageScheduled = true;
                        this.damageTime = time + this.impactDelay;
                        this.pendingTarget = this.target;
                        this.lastAttackTime = time;
                        console.log(`[${Date.now()}] Giant ${this.id} starts attack animation... (Damage in ${this.impactDelay}ms)`);
                    }
                }
            } else {
                // If attack is scheduled, finish it? 
                // Or cancel if moved out of range?
                // Standard behavior: finish windup? No, usually proximity check.

                // For movement: use stopRange
                if (!this.damageScheduled && !this.shouldStopMoving(this.target)) {
                    this.state = TroopState.WALK;
                    this.moveTowards(this.target, delta, layout);
                } else if (!this.damageScheduled) {
                    // In dead zone (stopRange < dist < attackRange)
                    // If stopRange <= attackRange, this means we are WAITING to attack?
                    // Or we are close enough to stop, but not close enough to attack?
                    // This implies stopRange > attackRange.
                    // If stopRange < attackRange, isInRange consumes the close case.

                    // So if we are here: !isInRange (dist > range) AND shouldStop (dist <= stopRange).
                    // This means range < dist <= stopRange.
                    // We stop, but cannot attack.
                    this.state = TroopState.IDLE;
                }
                // If damage scheduled, we wait (stay in Fight state or walk? Fight usually locks).
            }
        } else {
            if (!this.damageScheduled) {
                this.state = TroopState.WALK;
                this.moveForward(delta, layout);
            }
        }
    }

    private performAttack(target: Entity) {
        console.log(`[${Date.now()}] Giant ${this.id} deals IMPACT damage to ${target.id}`);
        target.takeDamage(this.damage);
        console.log(`[${Date.now()}] Target ${target.id} remaining HP: ${target.health}`);
    }
}
