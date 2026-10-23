import { Troop, TroopState } from './Troop';
import { Entity, EntityType } from '../Entity';
import type { ArenaLayout } from '../Interfaces';

export class InfernoTower extends Troop {
    public name = 'InfernoTower';

    constructor(id: string, x: number, y: number, ownerId: string) {
        super(id, x, y, ownerId, 'InfernoTower');
        // Buildings are valid targets for building-only troops (e.g. Giant)
        this.type = EntityType.BUILDING;
    }

    update(time: number, _delta: number, enemies: Entity[], _layout: ArenaLayout) {
        // A building: never moves, only attacks enemies inside its attack range
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
