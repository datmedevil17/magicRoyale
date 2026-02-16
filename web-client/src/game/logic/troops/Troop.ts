import Phaser from 'phaser';
import { getTroopStats } from '../../config/TroopConfig';
import { ArenaConfig } from '../../config/ArenaConfig';
import { Entity, EntityType } from '../Entity';
import type { ArenaLayout } from '../Interfaces';

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

    // Add currentRange property
    public currentRange: number = 0;

    constructor(id: string, x: number, y: number, ownerId: string, cardId: string) {
        super(id, x, y, ownerId, EntityType.TROOP);

        // Load stats from config
        const stats = getTroopStats(cardId);
        this.health = stats.health;
        this.maxHealth = stats.health;
        this.speed = stats.speed;
        this.range = stats.range;
        this.hitSpeed = stats.hitSpeed;
        this.damage = stats.damage;
        this.radius = stats.radius;

        this.attackType = stats.attackType;
        this.movementType = stats.movementType;
    }

    public updateBase(layout: ArenaLayout) {
        // Use ArenaConfig.TILE_SIZE as reference
        const scaleFactor = layout.tileSize / ArenaConfig.TILE_SIZE;
        this.currentRange = this.range * scaleFactor;
    }

    abstract update(time: number, delta: number, enemies: Entity[], layout: ArenaLayout): void;

    public getDistanceTo(target: Entity): number {
        return Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
    }

    public isInRange(target: Entity): boolean {
        // Distance is center-to-center
        const dist = this.getDistanceTo(target);

        // Range check is edge-to-edge (Current Range + Radii)
        const attackRange = this.currentRange + (target.radius || 20) + (this.radius || 20);

        // Hysteresis: If already fighting, maintain intent to fight a bit longer (buffer) 
        // to prevent flickering when at inevitable range boundary.
        if (this.state === TroopState.FIGHT) {
            return dist <= attackRange + 5;
        }

        return dist <= attackRange;
    }

    public moveTowards(target: Entity | { x: number, y: number }, delta: number, layout: ArenaLayout) {
        let targetX = target.x;
        let targetY = target.y;

        // Simple Pathfinding for Bridge Crossing (Ground Troops only)
        if (this.movementType === 'GROUND') {
            const tileSize = layout.tileSize;

            // Convert to Rows for Logic
            const myRow = (this.y - layout.mapStartY) / tileSize;
            const targetRowCheck = (targetY - layout.mapStartY) / tileSize;

            // River Bounds (Visual Config)
            const riverTopRow = ArenaConfig.RIVER_ROW_START;     // 18
            const riverBottomRow = ArenaConfig.RIVER_ROW_END + 1; // 20 (End is 19 inclusive)

            const bridgeLeftX = layout.mapStartX + ArenaConfig.BRIDGE_LEFT_COL * tileSize + tileSize / 2;
            const bridgeRightX = layout.mapStartX + ArenaConfig.BRIDGE_RIGHT_COL * tileSize + tileSize / 2;

            // Check if we need to cross the river
            // Case 1: I am above river (Row < 18), Target is below (Row > 19)
            // Case 2: I am below river (Row > 19), Target is above (Row < 18)
            // Case 3: I am IN the river area (Row 18-20) -> Must exit via bridge verticality

            const isAbove = myRow < riverTopRow;
            const isBelow = myRow > riverBottomRow;
            const isInRiver = !isAbove && !isBelow;

            const targetIsAbove = targetRowCheck < riverTopRow;
            const targetIsBelow = targetRowCheck > riverBottomRow;

            let needsCrossing = false;

            if (isAbove && targetIsBelow) needsCrossing = true;
            if (isBelow && targetIsAbove) needsCrossing = true;

            if (needsCrossing || isInRiver) {
                // Determine Nearest Bridge
                const distLeft = Math.abs(this.x - bridgeLeftX);
                const distRight = Math.abs(this.x - bridgeRightX);

                // Select Bridge
                const bridgeX = distLeft < distRight ? bridgeLeftX : bridgeRightX;
                const BRIDGE_TOLERANCE = tileSize * 0.5; // Snap to bridge if close

                // If we are NOT aligned with the bridge yet, move to Bridge X first
                if (Math.abs(this.x - bridgeX) > BRIDGE_TOLERANCE) {
                    targetX = bridgeX;

                    // Maintain Y direction towards river
                    if (isAbove) targetY = riverTopRow * tileSize + layout.mapStartY;
                    else if (isBelow) targetY = riverBottomRow * tileSize + layout.mapStartY;
                    else targetY = this.y; // If in river, just correct X? No, we need to exit.
                }

                // If we are aligned (or in river), ensure we cross VERTICALLY
                if (Math.abs(this.x - bridgeX) <= BRIDGE_TOLERANCE || isInRiver) {
                    targetX = bridgeX; // Keep aligned
                    // Proceed to original target Y (Crossing)
                    // But if target is far, just aim across the river
                    if (isAbove || (isInRiver && targetIsBelow)) targetY = Math.max(targetY, (riverBottomRow + 1) * tileSize);
                    if (isBelow || (isInRiver && targetIsAbove)) targetY = Math.min(targetY, (riverTopRow - 1) * tileSize);
                }
            }
        }

        const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);

        // Scale speed to match map size
        // If map is 2x larger (tileSize 44 vs 22), we need 2x speed to cover same relative distance in same time.
        const scaleFactor = layout.tileSize / ArenaConfig.TILE_SIZE;
        const adjustedSpeed = this.speed * scaleFactor;

        const velocityX = Math.cos(angle) * adjustedSpeed * (delta / 1000); // Scale by delta (ms)
        const velocityY = Math.sin(angle) * adjustedSpeed * (delta / 1000);

        this.x += velocityX;
        this.y += velocityY;
    }

    public moveForward(delta: number, layout: ArenaLayout) {
        // Move towards opponent side
        let targetY = 0;
        let targetX = this.x; // Default to straight forward

        if (this.ownerId.includes('player')) {
            targetY = layout.mapStartY; // Top of arena
        } else {
            targetY = layout.mapStartY + ArenaConfig.ROWS * layout.tileSize; // Bottom of arena
        }

        // Bridge pathfinding logic is handled in moveTowards, so we just pass the ultimate destination
        // BUT moveTowards needs to know we want to CROSS.
        // If we just pass x,y, it checks crossing logic.

        // Wait, moveTowards expects targetX/Y.
        // If targetY is far end, it triggers crossing logic.

        this.moveTowards({ x: targetX, y: targetY }, delta, layout);
    }
}
