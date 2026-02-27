export const TroopType = {
    GROUND: 'GROUND',
    AIR: 'AIR'
} as const;
export type TroopType = typeof TroopType[keyof typeof TroopType];

export const TargetType = {
    GROUND: 'GROUND',
    AIR: 'AIR',
    BOTH: 'BOTH'
} as const;
export type TargetType = typeof TargetType[keyof typeof TargetType];

export interface TroopStats {
    health: number;
    // Animation-Driven Stats
    animSpeed: {
        walk: number; // FPS
        fight: number; // FPS
    };
    movePerFrame: number; // Pixels per walk frame
    attackFrames: number; // Total frames in attack cycle
    impactFrame?: number; // Frame where damage should occur (default: 0)
    pixelScale?: number; // Visual scaling factor (default: 1.0)
    stopRange?: number;  // Distance to stop walking (defaults to range)
    continuousAttack?: boolean; // If true, loop animation without pause based on hitSpeed
    fightPixelScale?: number; // Optional scale override for fight animation

    range: number;       // pixels
    sightRange: number;  // detection range in pixels
    damage: number;
    attackType: TargetType;
    movementType: TroopType;
    elixirCost: number;
    radius: number;      // collision radius
    spawnCount: number;  // How many units spawn
}

export const TROOP_STATS: Record<string, TroopStats> = {
    'Archers': {
        health: 304,
        animSpeed: { walk: 2, fight: 2 },
        movePerFrame: 4.5, // 10 * 4.5 = 45 speed
        attackFrames: 2,  // (14/15)*1000 = ~933ms hitSpeed
        range: 120,
        sightRange: 250,
        damage: 112,
        attackType: TargetType.BOTH,
        movementType: TroopType.GROUND,
        elixirCost: 3,
        radius: 12,
        spawnCount: 2,
        pixelScale: 0.7 // Default visual size
    },
    'Barbarian': {
        health: 2500,
        animSpeed: { walk: 4, fight: 5 },
        movePerFrame: 4.5, // 45 speed
        attackFrames: 5,  // (20/15)*1000 = 1333ms
        range: 30,
        sightRange: 150,
        damage: 192,
        attackType: TargetType.GROUND,
        movementType: TroopType.GROUND,
        elixirCost: 5,
        radius: 20,
        spawnCount: 1,
        pixelScale: 0.7
    },
    'Giant': {
        health: 3000,
        animSpeed: { walk: 2, fight: 2 },
        movePerFrame: 10, // 10 * 3.5 = 35 speed
        attackFrames: 2,  // (23/15)*1000 = 1533ms
        impactFrame: 1,   // Frame 1 of 2
        range: 40,
        sightRange: 180,
        damage: 253,
        attackType: TargetType.GROUND,
        movementType: TroopType.GROUND,
        elixirCost: 5,
        radius: 0,
        spawnCount: 1,
        pixelScale: 0.5
    },
    'MiniPEKKA': {
        health: 1392,
        animSpeed: { walk: 3, fight: 2.5 },
        movePerFrame: 10,
        attackFrames: 2.5,   // 28 frames / 14 FPS = 2.0s hitSpeed (2 loops if 14 frames/loop)
        impactFrame: 1.5,    // Damage at frame 10
        range: 35,
        sightRange: 160,
        damage: 500,
        attackType: TargetType.GROUND,
        movementType: TroopType.GROUND,
        elixirCost: 4,
        radius: 18,
        spawnCount: 1,
        pixelScale: 0.7,
        stopRange: 5
    },
    'Valkyrie': {
        health: 1907,
        animSpeed: { walk: 4, fight: 5 }, // Slow/Standard Spin
        movePerFrame: 7,
        attackFrames: 10, // 10 frames / 5 FPS = 2.0s Cycle. Continuous spin.
        range: 35,
        sightRange: 150,
        damage: 266,
        attackType: TargetType.GROUND,
        movementType: TroopType.GROUND,
        elixirCost: 4,
        radius: 20,
        spawnCount: 1,
        pixelScale: 0.7, // Default
        continuousAttack: true // Loop without pause
    },
    'Wizard': {
        health: 755,
        animSpeed: { walk: 6, fight: 4 },
        movePerFrame: 4.5,
        attackFrames: 8, // 8 / 4 = 2.0s hitSpeed
        range: 100,
        sightRange: 220,
        damage: 281,
        attackType: TargetType.BOTH,
        movementType: TroopType.GROUND,
        elixirCost: 5,
        radius: 0,
        spawnCount: 1,
        pixelScale: 0.7, // Normal walk size
        // stopRange: 25    // Walk slightly closer than attack range
    },
    'BabyDragon': {
        health: 1152,
        animSpeed: { walk: 5, fight: 4 },
        movePerFrame: 7,
        attackFrames: 4,
        range: 80,
        sightRange: 200,
        damage: 161,
        attackType: TargetType.BOTH,
        movementType: TroopType.AIR,
        elixirCost: 4,
        radius: 0,
        spawnCount: 1,
        pixelScale: 0.7
    },
    'InfernoTower': {
        health: 1400,
        animSpeed: { walk: 1, fight: 5 },
        movePerFrame: 0, // Building
        attackFrames: 5,
        range: 150,
        sightRange: 300,
        damage: 50, // Ramping damage usually, but base 50
        attackType: TargetType.BOTH,
        movementType: TroopType.GROUND,
        elixirCost: 5,
        radius: 30,
        spawnCount: 1,
        pixelScale: 0.8
    },
    'Arrows': {
        health: 1,
        animSpeed: { walk: 1, fight: 10 }, // 10 FPS for the gif
        movePerFrame: 0,
        attackFrames: 10, // Total frames in Arrows_fight_player.gif
        range: 100, // AOE radius
        sightRange: 0,
        damage: 300,
        attackType: TargetType.BOTH,
        movementType: TroopType.AIR,
        elixirCost: 3,
        radius: 0,
        spawnCount: 1,
        pixelScale: 1.5 // Visual size for the AOE
    }
};

// Return a derived object that includes computed speed/hitSpeed
export interface DerivedTroopStats extends TroopStats {
    speed: number;
    hitSpeed: number;
    pixelScale: number;
    stopRange: number;
    sightRange: number;
}

// Helper to get stats safely
export const getTroopStats = (cardId: string): DerivedTroopStats => {
    // Normalization if needed
    if (cardId === 'Barbarians' || cardId === 'Barbarian') return computeDerived(TROOP_STATS['Barbarian']);

    const stats = TROOP_STATS[cardId] || {
        // Fallback
        health: 100,
        animSpeed: { walk: 5, fight: 5 },
        movePerFrame: 2,
        attackFrames: 10,
        range: 20,
        sightRange: 100,
        damage: 10,
        attackType: TargetType.GROUND,
        movementType: TroopType.GROUND,
        elixirCost: 1,
        radius: 20,
        spawnCount: 1
    };

    return computeDerived(stats);
};

function computeDerived(stats: TroopStats): DerivedTroopStats {
    return {
        ...stats,
        speed: stats.animSpeed.walk * stats.movePerFrame,
        hitSpeed: (stats.attackFrames / stats.animSpeed.fight) * 1000,
        pixelScale: stats.pixelScale !== undefined ? stats.pixelScale : 0.5,
        stopRange: stats.stopRange !== undefined ? stats.stopRange : stats.range,
        sightRange: stats.sightRange !== undefined ? stats.sightRange : stats.range * 3
    };
}
