import { Troop } from './Troop';

export class Wizard extends Troop {
    public name = 'Wizard';

    constructor(id: string, x: number, y: number, ownerId: string) {
        super(id, x, y, ownerId, 'Wizard');
    }
}
