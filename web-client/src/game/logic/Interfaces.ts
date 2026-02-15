import type { TypeEnum } from './Enums';

export interface Point2D {
    x: number;
    y: number;
}

export interface AttackAble {
    reduceHealthBy(damage: number): void;
    getSelfType(): TypeEnum;
    getPosition(): Point2D;
    isDead(): boolean;
}
