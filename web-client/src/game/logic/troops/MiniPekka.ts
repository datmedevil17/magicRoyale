import { Troop, TroopState } from './Troop';
import { Entity } from '../Entity';
import type { ArenaLayout } from '../Interfaces';

export class MiniPekka extends Troop {
    public name = 'MiniPEKKA';

    constructor(id: string, x: number, y: number, ownerId: string) {
        super(id, x, y, ownerId, 'MiniPEKKA');
    }

    update(time: number, delta: number, enemies: Entity[], layout: ArenaLayout) {
        if (this.target && this.target.health <= 0) {
            this.target = null;
            this.state = TroopState.WALK;
        }

        if (!this.target) {
            // Find nearest enemy
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
        }

        if (this.target) {
            if (this.isInRange(this.target)) {
                this.state = TroopState.FIGHT;
                if (time - this.lastAttackTime > this.hitSpeed) {
                    // Use impactFrame if available, else immediate
                    if (this.impactFrame !== undefined) {
                        if (!this.damageScheduled) {
                            this.damageScheduled = true;
                            // Calculate delay: (impactFrame / attackFrames) * hitSpeed
                            // OR (impactFrame / fightFPS) * 1000
                            // Config has 'impactFrame'. Derived stats don't usually carry it, 
                            // but we can access it if we add it to Derived or just trust Config.
                            // Actually 'this.impactFrame' needs to be on Troop class or passed from stats.
                            // Troop.ts doesn't have public impactFrame.
                            // We should add it to Troop.ts or use stats again?
                            // Let's assume we add it to Troop.ts or access via stats.
                            // Troop.ts has 'impactFrame' property? No.
                            // Use 'this.impactDelay' (Troop.ts has it!)

                            this.damageTime = time + (this.impactDelay || 0);
                            this.pendingTarget = this.target;
                            this.lastAttackTime = time;
                        }
                    } else {
                        this.attack(this.target);
                        this.lastAttackTime = time;
                    }
                }
            } else {
                if (!this.damageScheduled && !this.shouldStopMoving(this.target)) {
                    this.state = TroopState.WALK;
                    this.moveTowards(this.target, delta, layout);
                } else if (!this.damageScheduled) {
                    this.state = TroopState.IDLE;
                }
            }
        } else {
            if (!this.damageScheduled) {
                this.state = TroopState.WALK;
                this.moveForward(delta, layout);
            }
        }

        // Handle Scheduled Damage
        if (this.damageScheduled && time >= this.damageTime) {
            if (this.pendingTarget && this.pendingTarget.health > 0) {
                this.attack(this.pendingTarget);
            }
            this.damageScheduled = false;
            this.pendingTarget = null;
        }
    }

    private attack(target: Entity) {
        console.log(`[${Date.now()}] MiniPEKKA ${this.id} attacks ${target.id} for ${this.damage}`);
        target.takeDamage(this.damage);
    }
}
