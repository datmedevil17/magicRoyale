import type { IUser } from './User';
import { CardStatusEnum } from './Enums';
import type { Point2D } from './Interfaces';

export interface ICard {
    id: string; // UUID
    cost: number;
    owner: IUser;
    position: Point2D;
    status: CardStatusEnum;
}

export abstract class Card implements ICard {
    id: string;
    cost: number;
    owner: IUser;
    position: Point2D;
    status: CardStatusEnum;

    constructor(id: string, cost: number, owner: IUser, position: Point2D) {
        this.id = id;
        this.cost = cost;
        this.owner = owner;
        this.position = position;
        this.status = CardStatusEnum.WALK;
    }

    public getPosition(): Point2D {
        return this.position;
    }

    public setPosition(position: Point2D): void {
        this.position = position;
    }
}
