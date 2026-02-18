// Shared Card ID Mapping
export const CARD_ID_TO_NAME: Record<number, string> = {
    1: 'Giant',
    2: 'Valkyrie',
    3: 'MiniPEKKA',
    4: 'BabyDragon',
    5: 'Archers',
    6: 'Arrows',
    7: 'Wizard',
    8: 'Barbarians',
    9: 'Cannon',
    10: 'Rage',
    11: 'InfernoTower',
    12: 'Fireball',
};

export const getCardName = (id: number) => CARD_ID_TO_NAME[id] || 'Unknown';

// Reverse mapping for lookups by name
export const CARD_NAME_TO_ID: Record<string, number> = Object.entries(CARD_ID_TO_NAME).reduce((acc, [id, name]) => {
    acc[name] = Number(id);
    return acc;
}, {} as Record<string, number>);
