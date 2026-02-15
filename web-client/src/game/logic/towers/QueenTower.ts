import { Tower } from '../Tower';
import type { IUser } from '../User';

export class QueenTower extends Tower {
    constructor(
        id: string,
        owner: IUser,
        hp: number,
        damage: number
    ) {
        // QueenTower stats: range 7.5 (Java said 8), demolitionBonus 1. Java code said 8.
        super(id, owner, 1, true, 8, hp, damage, { x: 0, y: 0 });
    }

    public static create(owner: IUser): QueenTower {
        const id = crypto.randomUUID();
        switch (owner.level) {
            case 1: return new QueenTower(id, owner, 1400, 50);
            case 2: return new QueenTower(id, owner, 1512, 54);
            case 3: return new QueenTower(id, owner, 1624, 58);
            case 4: return new QueenTower(id, owner, 1750, 62);
            case 5: return new QueenTower(id, owner, 1890, 69);
            default: return new QueenTower(id, owner, 1400, 50);
        }
    }
}
