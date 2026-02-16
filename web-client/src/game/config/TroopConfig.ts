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
    speed: number;       // pixels per second
    range: number;       // pixels
    hitSpeed: number;    // milliseconds
    damage: number;
    attackType: TargetType;
    movementType: TroopType;
    elixirCost: number;
    radius: number;      // collision radius
    spawnCount: number;  // How many units spawn
    animSpeed?: {
        walk: number;
        fight: number;
    };
}

export const TROOP_STATS: Record<string, TroopStats> = {
    'Archers': {
        health: 304,
        speed: 45, // Medium
        range: 60, // 5 tiles (5 * 22)
        hitSpeed: 900, // 0.9s
        damage: 112,
        attackType: TargetType.BOTH,
        movementType: TroopType.GROUND,
        elixirCost: 3,
        radius: 20,
        spawnCount: 2,
        animSpeed: { walk: 2, fight: 2 }
    },
    'Barbarian': {
        health: 670,
        speed: 45, // Medium
        range: 30, // Melee
        hitSpeed: 1300, // 1.3s
        damage: 192,
        attackType: TargetType.GROUND,
        movementType: TroopType.GROUND,
        elixirCost: 5,
        radius: 20,
        spawnCount: 1, // User has single GIF containing 5 barbarians
        animSpeed: { walk: 2, fight: 2 }
    },
    'Giant': {
        health: 3000,
        speed: 1, // Slow
        range: 30, // Melee
        hitSpeed: 1500, // 1.5s
        damage: 253,
        attackType: TargetType.GROUND, // Building only logically
        movementType: TroopType.GROUND,
        elixirCost: 5,
        radius: 20,
        spawnCount: 1,
        animSpeed: { walk: 2, fight: 2 }
    },
    'MiniPEKKA': {
        health: 1392,
        speed: 60, // Fast
        range: 30, // Melee
        hitSpeed: 1600, // 1.6s
        damage: 755,
        attackType: TargetType.GROUND,
        movementType: TroopType.GROUND,
        elixirCost: 4,
        radius: 20,
        spawnCount: 1,
        animSpeed: { walk: 2, fight: 2 }
    },
    'Valkyrie': {
        health: 1907,
        speed: 45, // Medium
        range: 30, // Melee
        hitSpeed: 1500, // 1.5s
        damage: 266,
        attackType: TargetType.GROUND,
        movementType: TroopType.GROUND,
        elixirCost: 4,
        radius: 20,
        spawnCount: 1,
        animSpeed: { walk: 2, fight: 2 }
    },
    'Wizard': {
        health: 755,
        speed: 45, // Medium
        range: 121, // ~5.5 tiles
        hitSpeed: 1400, // 1.4s
        damage: 281,
        attackType: TargetType.BOTH,
        movementType: TroopType.GROUND,
        elixirCost: 5,
        radius: 20,
        spawnCount: 1,
        animSpeed: { walk: 2, fight: 2 }
    },
    'BabyDragon': {
        health: 1152,
        speed: 60, // Fast
        range: 77, // ~3.5 tiles
        hitSpeed: 1500, // 1.5s
        damage: 161,
        attackType: TargetType.BOTH,
        movementType: TroopType.AIR,
        elixirCost: 4,
        radius: 20,
        spawnCount: 1,
        animSpeed: { walk: 2, fight: 2 }
    }
};

// Helper to get stats safely
export const getTroopStats = (cardId: string): TroopStats => {
    // Normalization if needed
    if (cardId === 'Barbarians' || cardId === 'Barbarian') return TROOP_STATS['Barbarian'];

    return TROOP_STATS[cardId] || {
        // Fallback or Error
        health: 100,
        speed: 20,
        range: 20,
        hitSpeed: 1000,
        damage: 10,
        attackType: TargetType.GROUND,
        movementType: TroopType.GROUND,
        elixirCost: 1,
        radius: 20,
        spawnCount: 1
    };
};
