import Phaser from 'phaser';
import { Entity, EntityType } from '../Entity';

export const TroopState = {
    WALK: 'walk',
    FIGHT: 'fight',
    IDLE: 'idle'
} as const;

export type TroopState = typeof TroopState[keyof typeof TroopState];

export abstract class Troop extends Entity {
    public state: TroopState = TroopState.WALK;
    public abstract name: string; // e.g. 'Archer'
    public abstract speed: number; // Pixels per second (or frame)
    public abstract range: number;
    public abstract hitSpeed: number;
    public abstract damage: number;
    public abstract attackType: 'GROUND' | 'AIR' | 'BOTH';
    public abstract movementType: 'GROUND' | 'AIR';
    public target: Entity | null = null;
    public lastAttackTime: number = 0;

    constructor(id: string, x: number, y: number, ownerId: string) {
        super(id, x, y, ownerId, EntityType.TROOP);
    }

    abstract update(time: number, delta: number, enemies: Entity[]): void;

    public getDistanceTo(target: Entity): number {
        return Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
    }

    public isInRange(target: Entity): boolean {
        return this.getDistanceTo(target) <= this.range;
    }

    public moveTowards(target: Entity | { x: number, y: number }, delta: number) {
        let targetX = target.x;
        let targetY = target.y;

        // Simple Pathfinding for Bridge Crossing (Ground Troops)
        if (this.movementType === 'GROUND') {
            const riverY = 356;
            const riverWidth = 50; // Safety zone
            const bridgeLeftX = 119;
            const bridgeRightX = 361;

            const isCrossing = (this.y < riverY - riverWidth && targetY > riverY + riverWidth) ||
                (this.y > riverY + riverWidth && targetY < riverY - riverWidth);

            if (isCrossing) {
                // Find nearest bridge
                const distLeft = Math.abs(this.x - bridgeLeftX);
                const distRight = Math.abs(this.x - bridgeRightX);
                const bridgeX = distLeft < distRight ? bridgeLeftX : bridgeRightX;

                // Move towards bridge
                targetX = bridgeX;
                targetY = riverY; // Mid-river/bridge
            }
        }

        const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
        const velocityX = Math.cos(angle) * this.speed * (delta / 1000); // Scale by delta (ms)
        const velocityY = Math.sin(angle) * this.speed * (delta / 1000);

        this.x += velocityX;
        this.y += velocityY;
    }

    public moveForward(delta: number) {
        // Move towards opponent side
        // Player (bottom) -> moves UP (y decreases)
        // Opponent (top) -> moves DOWN (y increases)

        let targetY = 0;
        if (this.ownerId.includes('player')) {
            targetY = 0; // Top of screen
        } else {
            targetY = 800; // Bottom of screen
        }

        // Move towards center-ish x? or just straight?
        // Let's move towards center-lane bridge depending on X
        // If x < 240, go left bridge (119), else right bridge (361)

        let targetX = this.x;
        if (this.movementType === 'GROUND') {
            if (this.x < 240) targetX = 119;
            else targetX = 361;
        }

        this.moveTowards({ x: targetX, y: targetY }, delta);
    }
}
