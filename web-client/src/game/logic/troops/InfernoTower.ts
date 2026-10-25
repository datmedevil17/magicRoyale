import { Building } from './Building';
import { Entity } from '../Entity';

// Damage multiplier by how long the beam has held the same target
const RAMP = [
    { after: 0, multiplier: 1 },
    { after: 2000, multiplier: 3 },
    { after: 4000, multiplier: 8 },
];

export class InfernoTower extends Building {
    public name = 'InfernoTower';
    private lockedTarget: Entity | null = null;
    private lockedSince: number = 0;

    constructor(id: string, x: number, y: number, ownerId: string) {
        super(id, x, y, ownerId, 'InfernoTower');
    }

    update(time: number, delta: number, enemies: Entity[]) {
        super.update(time, delta, enemies);

        // Switching targets resets the ramp
        if (this.target !== this.lockedTarget) {
            this.lockedTarget = this.target;
            this.lockedSince = time;
        }
    }

    /** Current ramp stage (0-based), for the renderer. */
    public get rampStage(): number {
        if (!this.lockedTarget) return 0;
        const held = this.now - this.lockedSince;
        let stage = 0;
        RAMP.forEach((s, i) => { if (held >= s.after) stage = i; });
        return stage;
    }

    protected dealDamage(target: Entity) {
        super.dealDamage(target, this.damage * RAMP[this.rampStage].multiplier);
    }
}
