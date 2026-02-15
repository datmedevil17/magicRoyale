import type { IUser } from './User';
import { TypeEnum } from './Enums';
import type { Point2D, AttackAble } from './Interfaces';

export abstract class Tower implements AttackAble {
    // Making fields public for simplicity or protected
    public id: string;
    public owner: IUser;
    public demolitionBonusCount: number;
    public selfType: TypeEnum;
    public attackType: TypeEnum;
    public range: number;
    public damage: number;
    public active: boolean;
    public target: AttackAble | null;
    public hp: number;
    public hitSpeed: number;
    public position: Point2D;

    constructor(
        id: string,
        owner: IUser,
        demolitionBonusCount: number,
        active: boolean,
        range: number,
        hp: number,
        damage: number,
        position: Point2D
    ) {
        this.id = id;
        this.owner = owner;
        this.demolitionBonusCount = demolitionBonusCount;
        this.active = active;
        this.range = range;
        this.hp = hp;
        this.damage = damage;
        this.position = position;

        this.target = null;
        this.selfType = TypeEnum.GROUND;
        this.attackType = TypeEnum.AIR_GROUND; // Default attack type
        this.hitSpeed = 1;
    }

    public reduceHealthBy(damage: number): void {
        this.hp -= damage;
    }

    public getSelfType(): TypeEnum {
        return this.selfType;
    }

    public getPosition(): Point2D {
        return this.position;
    }

    public setPosition(position: Point2D): void {
        this.position = position;
    }

    public isDead(): boolean {
        return this.hp <= 0;
    }

    public shoot(): void {
        if (this.target) {
            this.target.reduceHealthBy(this.damage);
        }
    }
}
