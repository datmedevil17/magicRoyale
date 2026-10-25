import { Troop, TroopState } from './Troop';
import { Entity, EntityType } from '../Entity';
import { getTroopStats } from '../../config/TroopConfig';

/**
 * A deployable building (Inferno Tower, Cannon): never moves, only attacks enemies
 * inside its attack range, and decays over its lifetime.
 */
export abstract class Building extends Troop {
    /** ms until the building has decayed to nothing (0 = never decays) */
    protected lifetime: number;

    constructor(id: string, x: number, y: number, ownerId: string, cardId: string) {
        super(id, x, y, ownerId, cardId);
        // Buildings are valid targets for building-only troops (e.g. Giant)
        this.type = EntityType.BUILDING;
        this.lifetime = getTroopStats(cardId).lifetime ?? 0;
    }

    update(time: number, delta: number, enemies: Entity[]) {
        if (this.lifetime > 0) {
            // Decay isn't a hit (no takeDamage), so it doesn't trigger the hit flash
            this.health = Math.max(0, this.health - this.maxHealth * delta / this.lifetime);
            if (this.health <= 0) return;
        }

        this.resolveAttack(time);

        if (this.target && (!this.canTarget(this.target) || !this.isInRange(this.target))) {
            this.target = null;
        }
        if (!this.target) {
            this.target = this.findNearestTarget(enemies, e => this.isInRange(e));
        }

        if (this.target) {
            this.state = TroopState.FIGHT;
            this.faceTarget(this.target);
            this.tryStartAttack(time, this.target);
        } else {
            this.state = TroopState.IDLE;
        }
    }
}
