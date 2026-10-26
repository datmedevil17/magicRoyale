import Phaser from 'phaser';
import { getTroopStats } from '../../config/TroopConfig';
import { getAttackTiming } from '../../config/AnimationTiming';
import { ArenaConfig } from '../../config/ArenaConfig';
import { Entity, EntityType } from '../Entity';
import type { ArenaLayout } from '../Interfaces';

export const TroopState = {
    WALK: 'walk',
    FIGHT: 'fight',
    IDLE: 'idle'
} as const;

export type TroopState = typeof TroopState[keyof typeof TroopState];

/** Rage spell: movement and attack speed multiplier for troops inside the zone. */
export const RAGE_BOOST = 1.35;

/** Where and how long the current attack takes to land (for renderers drawing projectiles). */
export interface AttackInfo {
    targetX: number;
    targetY: number;
    impactDelay: number;
}

export abstract class Troop extends Entity {
    public state: TroopState = TroopState.WALK;
    public abstract name: string; // e.g. 'Archer'
    public speed: number = 0;
    public range: number = 0;
    public hitSpeed: number = 0;
    public damage: number = 0;
    public attackType: 'GROUND' | 'AIR' | 'BOTH' = 'GROUND';
    public movementType: 'GROUND' | 'AIR' = 'GROUND';
    public pixelScale: number = 0.5;
    public stopRange: number = 0;
    public fightPixelScale: number | undefined;
    public continuousAttack: boolean = false;

    public target: Entity | null = null;
    public lastAttackTime: number = 0;
    /** Time the current attack started; the renderer restarts the attack animation when it changes. */
    public attackStartTime: number = 0;
    public lastAttack: AttackInfo | null = null;
    /** Non-host: offset to the host's position still to be blended in (see GameManager.applySyncCorrection). */
    public syncErrorX: number = 0;
    public syncErrorY: number = 0;
    /** Raged while the logic clock is before this time (refreshed by Rage zones every tick). */
    public rageUntil: number = 0;

    protected splashRadius: number = 0;
    protected splashAroundSelf: boolean = false;

    // Per-tick context, set by prepareTick() before update()
    protected now: number = 0;
    protected world: Entity[] = [];
    protected scaleFactor: number = 1;

    // Targeting behaviour (overridden per troop)
    /** Keep the current target until it dies instead of re-picking the nearest each tick. */
    protected stickyTarget: boolean = false;
    /** Narrow which enemies may be targeted, e.g. buildings only. */
    protected targetFilter?: (e: Entity) => boolean;
    /** px per ms. When set, damage lands after the projectile's flight instead of at the animation impact. */
    protected projectileSpeed?: number;

    // Damage Scheduling: an attack starts, then damage lands at the animation's impact frame
    protected damageScheduled: boolean = false;
    protected damageTime: number = 0;
    protected pendingTarget: Entity | null = null;
    protected impactDelay: number = 0;

    // Add currentRange property
    public currentRange: number = 0;
    public currentSightRange: number = 0;
    public currentStopRange: number = 0;

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
        this.pixelScale = stats.pixelScale !== undefined ? stats.pixelScale : 0.5;
        this.stopRange = stats.stopRange;
        this.fightPixelScale = stats.fightPixelScale;
        this.continuousAttack = !!stats.continuousAttack;
        this.splashRadius = stats.splashRadius ?? 0;
        this.splashAroundSelf = !!stats.splashAroundSelf;

        // Damage lands where the attack animation hits (same timing the renderer plays).
        // Continuous attackers loop their animation, so they hit immediately.
        if (!this.continuousAttack) {
            this.impactDelay = getAttackTiming(cardId, 'player', this.hitSpeed)?.impactAt ?? 0;
        }
    }

    /**
     * Default behaviour: pick a target, walk to it, attack when in range, otherwise
     * advance toward the enemy side. Buildings and special troops override this.
     */
    public update(time: number, delta: number, enemies: Entity[], layout: ArenaLayout): void {
        this.resolveAttack(time);

        if (this.target && !this.canTarget(this.target)) this.target = null;
        if (!this.target || !this.stickyTarget) {
            this.target = this.findNearestTarget(enemies, this.targetFilter);
        }

        // Committed to a swing: stay in place until the hit lands
        if (this.damageScheduled) {
            this.state = TroopState.FIGHT;
            return;
        }

        if (!this.target) {
            this.state = TroopState.WALK;
            this.moveForward(delta, layout);
        } else if (this.isInRange(this.target)) {
            this.state = TroopState.FIGHT;
            this.faceTarget(this.target);
            this.tryStartAttack(time, this.target);
        } else if (!this.shouldStopMoving(this.target)) {
            this.state = TroopState.WALK;
            this.moveTowards(this.target, delta, layout);
        } else {
            // Inside stop range but outside attack range (stopRange > range): wait
            this.state = TroopState.IDLE;
        }
    }

    public get isRaged(): boolean {
        return this.now < this.rageUntil;
    }

    protected get rageFactor(): number {
        return this.isRaged ? RAGE_BOOST : 1;
    }

    /** Start an attack on `target` if off cooldown; damage lands `impactDelay` ms later. */
    protected tryStartAttack(time: number, target: Entity) {
        if (this.damageScheduled || time - this.lastAttackTime < this.hitSpeed / this.rageFactor) return;
        const baseDelay = this.projectileSpeed ? this.getDistanceTo(target) / this.projectileSpeed : this.impactDelay;
        const impactDelay = baseDelay / this.rageFactor;
        this.lastAttackTime = time;
        this.attackStartTime = time;
        this.lastAttack = { targetX: target.x, targetY: target.y, impactDelay };
        this.pendingTarget = target;
        this.damageTime = time + impactDelay;
        this.damageScheduled = true;
    }

    /** Apply a scheduled hit once its impact time is reached. Call at the start of every tick. */
    protected resolveAttack(time: number) {
        if (!this.damageScheduled || time < this.damageTime) return;
        this.damageScheduled = false;
        if (this.pendingTarget && this.pendingTarget.health > 0) {
            this.dealDamage(this.pendingTarget);
        }
        this.pendingTarget = null;
    }

    /** Damage applied when an attack lands: the target alone, or every enemy in the splash area. */
    protected dealDamage(target: Entity, amount: number = this.damage) {
        if (!this.splashRadius) {
            target.takeDamage(amount);
            return;
        }

        const center = this.splashAroundSelf ? this : target;
        const radius = this.splashRadius * this.scaleFactor;
        for (const e of this.world) {
            if (e !== target && !this.canTarget(e)) continue;
            const dist = Phaser.Math.Distance.Between(center.x, center.y, e.x, e.y);
            if (e === target || dist <= radius + e.radius) {
                e.takeDamage(amount);
            }
        }
    }

    /** Per-tick context: logic clock, every live entity (for splash), and map scale. Call before update(). */
    public prepareTick(layout: ArenaLayout, time: number, world: Entity[]) {
        this.now = time;
        this.world = world;

        // Use ArenaConfig.TILE_SIZE as reference
        const scaleFactor = layout.tileSize / ArenaConfig.TILE_SIZE;
        this.scaleFactor = scaleFactor;
        this.currentRange = this.range * scaleFactor;

        // Sight Range: Scale it similarly
        const stats = getTroopStats(this.name); // Re-fetch to get sightRange
        this.currentSightRange = (stats.sightRange || (this.range * 3)) * scaleFactor;

        // Stop Range: If stopRange exists, use it. Otherwise default to range.
        const rawStopRange = this.stopRange || this.range;
        this.currentStopRange = rawStopRange * scaleFactor;
    }

    public getDistanceTo(target: Entity): number {
        return Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
    }

    // Add properties

    // Config properties should be loaded in constructor

    // Config properties should be loaded in constructor

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

    /** Whether this troop may attack `target` at all, ignoring distance. */
    public canTarget(target: Entity): boolean {
        if (target.ownerId === this.ownerId || target.health <= 0) return false;
        if (target.type === EntityType.SPELL) return false;
        if (this.attackType === 'GROUND' && target instanceof Troop && target.movementType === 'AIR') return false;
        return true;
    }

    /** Nearest enemy within sight that this troop can attack, optionally narrowed by `filter`. */
    public findNearestTarget(enemies: Entity[], filter?: (e: Entity) => boolean): Entity | null {
        let nearest: Entity | null = null;
        let minDist = Infinity;

        for (const enemy of enemies) {
            if (!this.canTarget(enemy)) continue;
            if (filter && !filter(enemy)) continue;
            if (!this.canSee(enemy)) continue;

            const dist = this.getDistanceTo(enemy);
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        }
        return nearest;
    }

    public canSee(target: Entity): boolean {
        const dist = this.getDistanceTo(target);
        const sightRange = this.currentSightRange + (target.radius || 20) + (this.radius || 20);
        return dist <= sightRange;
    }

    public shouldStopMoving(target: Entity): boolean {
        const dist = this.getDistanceTo(target);

        // Stop Range Check (Edge-to-Edge)
        // Use stopRange insteaad of range
        // If stopRange is not set/same as range, it behaves like before.
        const stopDistance = this.currentStopRange + (target.radius || 20) + (this.radius || 20);

        return dist <= stopDistance;
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
        this.rotation = angle;


        // Scale speed to match map size
        // If map is 2x larger (tileSize 44 vs 22), we need 2x speed to cover same relative distance in same time.
        const scaleFactor = layout.tileSize / ArenaConfig.TILE_SIZE;
        const adjustedSpeed = this.speed * scaleFactor * this.rageFactor;

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

        this.moveTowards({ x: targetX, y: targetY }, delta, layout);
    }

    public faceTarget(target: Entity | { x: number, y: number }) {
        this.rotation = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
    }
}

