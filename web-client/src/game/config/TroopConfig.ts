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
}

export const TROOP_STATS: Record<string, TroopStats> = {
    'Archers': {
        health: 200,
        speed: 25,
        range: 150,
        hitSpeed: 1000,
        damage: 50,
        attackType: TargetType.BOTH,
        movementType: TroopType.GROUND,
        elixirCost: 3,
        radius: 20,
        spawnCount: 2
    },
    'Barbarian': {
        health: 350,
        speed: 45,
        range: 50,
        hitSpeed: 1500,
        damage: 75,
        attackType: TargetType.GROUND,
        movementType: TroopType.GROUND,
        elixirCost: 3, // User said 3 (default)
        radius: 20,
        spawnCount: 1 // Usually 4 in CR, but user didn't specify count, likely 1 for now or handled by card logic
    },
    'Giant': {
        health: 2000,
        speed: 45,
        range: 30, // Melee usually implies small range, user said 2px but that might be contact. 30 is safer for interaction.
        hitSpeed: 1500,
        damage: 211,
        attackType: TargetType.GROUND, // Giant usually targets BUILDINGS only, but user said GROUND (Attack Type). Logic might need update if it's building-only.
        movementType: TroopType.GROUND,
        elixirCost: 5,
        radius: 20,
        spawnCount: 1
    },
    'MiniPEKKA': {
        health: 600,
        speed: 45,
        range: 30, // User said 1.5px
        hitSpeed: 1800,
        damage: 350,
        attackType: TargetType.GROUND,
        movementType: TroopType.GROUND,
        elixirCost: 4,
        radius: 20,
        spawnCount: 1
    },
    'Valkyrie': {
        health: 900,
        speed: 30,
        range: 30, // User said 1.5px
        hitSpeed: 1500,
        damage: 120,
        attackType: TargetType.GROUND, // Valkyrie has Area Damage, logic needs to handle this
        movementType: TroopType.GROUND,
        elixirCost: 4,
        radius: 20,
        spawnCount: 1
    },
    'Wizard': {
        health: 340,
        speed: 30,
        range: 150,
        hitSpeed: 1400,
        damage: 130,
        attackType: TargetType.BOTH, // Area damage usually
        movementType: TroopType.GROUND,
        elixirCost: 5,
        radius: 20,
        spawnCount: 1
    },
    'BabyDragon': {
        health: 800,
        speed: 45,
        range: 120,
        hitSpeed: 1600,
        damage: 100,
        attackType: TargetType.BOTH, // Area damage
        movementType: TroopType.AIR,
        elixirCost: 4,
        radius: 20,
        spawnCount: 1
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
