export const CardStatusEnum = {
    WALK: 'WALK',
    WALK_RAGE: 'WALK_RAGE',
    FIGHT: 'FIGHT',
    FIGHT_RAGE: 'FIGHT_RAGE'
} as const;

export type CardStatusEnum = typeof CardStatusEnum[keyof typeof CardStatusEnum];

export const TypeEnum = {
    GROUND: 'GROUND',
    AIR: 'AIR',
    AIR_GROUND: 'AIR_GROUND'
} as const;

export type TypeEnum = typeof TypeEnum[keyof typeof TypeEnum];

export const MovementSpeedEnum = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    FAST: 'FAST'
} as const;

export type MovementSpeedEnum = typeof MovementSpeedEnum[keyof typeof MovementSpeedEnum];
