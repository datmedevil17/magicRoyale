import { Troop } from './Troop';

export class Archer extends Troop {
    public name = 'Archers';
    // Keep shooting the same target until it dies
    protected stickyTarget = true;

    constructor(id: string, x: number, y: number, ownerId: string) {
        super(id, x, y, ownerId, 'Archers');
    }
}
