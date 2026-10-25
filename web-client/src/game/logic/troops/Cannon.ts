import { Building } from './Building';

export class Cannon extends Building {
    public name = 'Cannon';
    // Cannonball speed: damage lands when the ball arrives
    protected projectileSpeed = 0.5;

    constructor(id: string, x: number, y: number, ownerId: string) {
        super(id, x, y, ownerId, 'Cannon');
    }
}
