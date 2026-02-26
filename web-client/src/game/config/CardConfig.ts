// Shared Card Mapping with Metadata
export interface CardData {
    id: string;
    name: string;
    cost: number;
    icon: string;
}

export const CARD_DATA: Record<number, CardData> = {
    1: { id: 'Giant', name: 'Giant', cost: 5, icon: 'assets/GiantCard.png' },
    2: { id: 'Valkyrie', name: 'Valkyrie', cost: 4, icon: 'assets/ValkyrieCard.png' },
    3: { id: 'MiniPEKKA', name: 'Mini P.E.K.K.A', cost: 4, icon: 'assets/MiniPEKKACard.png' },
    4: { id: 'BabyDragon', name: 'Baby Dragon', cost: 4, icon: 'assets/BabyDragonCard.png' },
    5: { id: 'Archers', name: 'Archers', cost: 3, icon: 'assets/ArchersCard.png' },
    6: { id: 'Arrows', name: 'Arrows', cost: 3, icon: 'assets/ArrowsCard.png' },
    7: { id: 'Wizard', name: 'Wizard', cost: 5, icon: 'assets/WizardCard.png' },
    8: { id: 'Barbarians', name: 'Barbarians', cost: 5, icon: 'assets/BarbariansCard.png' },
    9: { id: 'Cannon', name: 'Cannon', cost: 3, icon: 'assets/CannonCard.png' },
    10: { id: 'Rage', name: 'Rage', cost: 2, icon: 'assets/RageCard.png' },
    11: { id: 'InfernoTower', name: 'Inferno Tower', cost: 5, icon: 'assets/InfernoTowerCard.png' },
    12: { id: 'Fireball', name: 'Fireball', cost: 4, icon: 'assets/FireballCard.png' },
};

export const CARD_ID_TO_NAME: Record<number, string> = Object.entries(CARD_DATA).reduce((acc, [id, data]) => {
    acc[Number(id)] = data.name;
    return acc;
}, {} as Record<number, string>);

export const CARD_ID_TO_ASSET_ID: Record<number, string> = Object.entries(CARD_DATA).reduce((acc, [id, data]) => {
    acc[Number(id)] = data.id;
    return acc;
}, {} as Record<number, string>);

export const getCardName = (id: number) => CARD_ID_TO_NAME[id] || 'Unknown';
export const getCardAssetId = (id: number) => CARD_ID_TO_ASSET_ID[id] || 'card_box';
export const getCardData = (id: number) => CARD_DATA[id];

// Reverse mapping for lookups by internal ID string (e.g. 'MiniPEKKA')
export const CARD_NAME_TO_ID: Record<string, number> = Object.entries(CARD_DATA).reduce((acc, [id, data]) => {
    acc[data.id] = Number(id);
    return acc;
}, {} as Record<string, number>);
