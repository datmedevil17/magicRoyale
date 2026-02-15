
export const TroopStats = {
    Archer: {
        name: 'Archer',
        speed: 25,
        range: 50,
        hitSpeed: 1.0,
        damage: 50,
        health: 200,
        attackType: 'BOTH' as const,
        movementType: 'GROUND' as const,
        animSpeed: {
            walk: 10, // Example override
            fight: 10
        }
    },
    Giant: {
        name: 'Giant',
        speed: 45,
        range: 2,
        hitSpeed: 1.5,
        damage: 211,
        health: 2000,
        attackType: 'GROUND' as const,
        movementType: 'GROUND' as const,
        animSpeed: {
            walk: 10,
            fight: 10
        }
    },
    MiniPekka: {
        name: 'MiniPekka',
        speed: 45,
        range: 1.5,
        hitSpeed: 1.8,
        damage: 350,
        health: 600,
        attackType: 'GROUND' as const,
        movementType: 'GROUND' as const,
        animSpeed: {
            walk: 10,
            fight: 10
        }
    },
    Valkyrie: {
        name: 'Valkyrie',
        speed: 30,
        range: 1.5,
        hitSpeed: 1.5,
        damage: 120,
        health: 900,
        attackType: 'GROUND' as const,
        movementType: 'GROUND' as const,
        animSpeed: {
            walk: 10,
            fight: 6
        }
    },
    Wizard: {
        name: 'Wizard',
        speed: 30,
        range: 150,
        hitSpeed: 1.4,
        damage: 130,
        health: 340,
        attackType: 'BOTH' as const,
        movementType: 'GROUND' as const,
        animSpeed: {
            walk: 10,
            fight: 6
        }
    },
    BabyDragon: {
        name: 'BabyDragon',
        speed: 45,
        range: 120,
        hitSpeed: 1.6,
        damage: 100,
        health: 800,
        attackType: 'BOTH' as const,
        movementType: 'AIR' as const,
        animSpeed: {
            walk: 5,
            fight: 6
        }
    },
    Barbarian: {
        name: 'Barbarians',
        speed: 45,
        range: 50,
        hitSpeed: 1.5,
        damage: 75,
        health: 350,
        attackType: 'GROUND' as const,
        movementType: 'GROUND' as const,
        animSpeed: {
            walk: 10,
            fight: 10
        }
    }
};
