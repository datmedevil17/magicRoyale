import { Troop } from './Troop';

export class Barbarian extends Troop {
    public name = 'Barbarians';

    constructor(id: string, x: number, y: number, ownerId: string) {
        super(id, x, y, ownerId, 'Barbarian');
    }
}
