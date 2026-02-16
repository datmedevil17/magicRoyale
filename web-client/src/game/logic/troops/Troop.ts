
import Phaser from 'phaser';
import { Entity, EntityType } from '../Entity';
import type { ArenaLayout } from '../Interfaces';
import { ArenaConstants } from '../ArenaConstants';

export const TroopState = {
    WALK: 'walk',
    FIGHT: 'fight',
    IDLE: 'idle'
} as const;

export type TroopState = typeof TroopState[keyof typeof TroopState];

export abstract class Troop extends Entity {
    public state: TroopState = TroopState.WALK;
    public abstract name: string; // e.g. 'Archer'
    public speed: number = 0;
    public range: number = 0;
    public hitSpeed: number = 0;
    public damage: number = 0;
    public attackType: 'GROUND' | 'AIR' | 'BOTH' = 'GROUND';
    public movementType: 'GROUND' | 'AIR' = 'GROUND';

    public target: Entity | null = null;
    public lastAttackTime: number = 0;

    constructor(id: string, x: number, y: number, ownerId: string, cardId: string) {
        super(id, x, y, ownerId, EntityType.TROOP);
    }

    public updateBase(layout: ArenaLayout) {
        const scaleFactor = layout.tileSize / ArenaConstants.REFERENCE_TILE_SIZE;
        this.currentRange = this.range * scaleFactor;
    }

    abstract update(time: number, delta: number, enemies: Entity[], layout: ArenaLayout): void;

    public getDistanceTo(target: Entity): number {
        return Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
    }

    public isInRange(target: Entity): boolean {
        // Distance is center-to-center
        const dist = this.getDistanceTo(target);

        // BETTER: Store 'currentRange' which is updated in update() method.
        return dist <= this.currentRange + (target.radius || 20) + (this.radius || 20);
    }

    // Add currentRange property
    public currentRange: number = 0;

    public moveTowards(target: Entity | { x: number, y: number }, delta: number, layout: ArenaLayout) {
        let targetX = target.x;
        let targetY = target.y;

        // Simple Pathfinding for Bridge Crossing (Ground Troops only)
        if (this.movementType === 'GROUND') {
            const riverRowY = layout.mapStartY + ArenaConstants.RIVER_ROW * layout.tileSize;

            const bridgeLeftX = layout.mapStartX + ArenaConstants.BRIDGE_LEFT_COL * layout.tileSize + layout.tileSize / 2;
            const bridgeRightX = layout.mapStartX + ArenaConstants.BRIDGE_RIGHT_COL * layout.tileSize + layout.tileSize / 2;

            // Check if we need to cross the river
            // If I am above river and target is below, OR I am below and target is above
            // AND I am NOT already on a bridge (x approx bridgeX)

            const myRow = Math.floor((this.y - layout.mapStartY) / layout.tileSize);
            const targetRow = Math.floor((targetY - layout.mapStartY) / layout.tileSize);

            const isCrossing = (myRow < ArenaConstants.RIVER_ROW && targetRow > ArenaConstants.RIVER_ROW) ||
                (myRow > ArenaConstants.RIVER_ROW && targetRow < ArenaConstants.RIVER_ROW);

            if (isCrossing) {
                // Determine if we are already at a bridge
                const distLeft = Math.abs(this.x - bridgeLeftX);
                const distRight = Math.abs(this.x - bridgeRightX);

                const BRIDGE_WIDTH_TOLERANCE = layout.tileSize * 1.5; // Generous width

                if (distLeft > BRIDGE_WIDTH_TOLERANCE && distRight > BRIDGE_WIDTH_TOLERANCE) {
                    // Not at a bridge, move towards nearest one
                    const bridgeX = distLeft < distRight ? bridgeLeftX : bridgeRightX;
                    targetX = bridgeX;
                    targetY = riverRowY; // Aim for center of river (bridge)
                }
                // If we are close enough to bridge X, we proceed to targetY (crossing the bridge)
            }
        }

        const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);

        // Scale speed to match map size
        // If map is 2x larger (tileSize 44 vs 22), we need 2x speed to cover same relative distance in same time.
        const scaleFactor = layout.tileSize / ArenaConstants.REFERENCE_TILE_SIZE;
        const adjustedSpeed = this.speed * scaleFactor;

        const velocityX = Math.cos(angle) * adjustedSpeed * (delta / 1000); // Scale by delta (ms)
        const velocityY = Math.sin(angle) * adjustedSpeed * (delta / 1000);

        this.x += velocityX;
        this.y += velocityY;
    }

    public moveForward(delta: number, layout: ArenaLayout) {
        // Move towards opponent side
        let targetY = 0;
        if (this.ownerId.includes('player')) {
            targetY = layout.mapStartY; // Top of arena
        } else {
            targetY = layout.mapStartY + ArenaConstants.ROWS * layout.tileSize; // Bottom of arena
        }

        // Bridge targeting logic
        let targetX = this.x;
        if (this.movementType === 'GROUND') {
            const bridgeLeftX = layout.mapStartX + ArenaConstants.BRIDGE_LEFT_COL * layout.tileSize + layout.tileSize / 2;
            const bridgeRightX = layout.mapStartX + ArenaConstants.BRIDGE_RIGHT_COL * layout.tileSize + layout.tileSize / 2;
            const midX = layout.mapStartX + (ArenaConstants.COLS / 2) * layout.tileSize;

            if (this.x < midX) targetX = bridgeLeftX;
            else targetX = bridgeRightX;
        }

        this.moveTowards({ x: targetX, y: targetY }, delta, layout);
    }
}
