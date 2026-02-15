import { Tower } from '../Tower';
import type { IUser } from '../User';
import type { AttackAble } from '../Interfaces';

export class KingTower extends Tower {
    private shooting: boolean;

    constructor(
        id: string,
        owner: IUser,
        hp: number,
        damage: number
    ) {
        // KingTower stats: range 7, demolitionBonus 3
        super(id, owner, 3, false, 7, hp, damage, { x: 0, y: 0 }); // Pos to be set
        this.shooting = false;
    }

    public isShooting(): boolean {
        return this.shooting;
    }

    public setTarget(target: AttackAble): void {
        this.target = target;
        this.shooting = true;
    }

    public static create(owner: IUser): KingTower {
        const id = crypto.randomUUID();
        switch (owner.level) {
            case 1: return new KingTower(id, owner, 2400, 50);
            case 2: return new KingTower(id, owner, 2568, 53);
            case 3: return new KingTower(id, owner, 2736, 57);
            case 4: return new KingTower(id, owner, 2904, 60);
            case 5: return new KingTower(id, owner, 3096, 64);
            default: return new KingTower(id, owner, 2400, 50);
        }
    }
}
