export const EntityType = {
    TROOP: 'troop',
    BUILDING: 'building',
    SPELL: 'spell',
    TOWER: 'tower'
} as const;

export type EntityType = typeof EntityType[keyof typeof EntityType];

export abstract class Entity {
    public id: string;
    public x: number;
    public y: number;
    public ownerId: string;
    public type: EntityType;
    public health: number = 100;
    public maxHealth: number = 100;
    public radius: number = 20; // Default hitbox radius
    public rotation: number = 0; // Rotation in radians


    constructor(id: string, x: number, y: number, ownerId: string, type: EntityType) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.ownerId = ownerId;
        this.type = type;
    }

    takeDamage(amount: number) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
    }
}
