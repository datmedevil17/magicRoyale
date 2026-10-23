import { Troop } from './Troop';

export class BabyDragon extends Troop {
    public name = 'BabyDragon';

    constructor(id: string, x: number, y: number, ownerId: string) {
        super(id, x, y, ownerId, 'BabyDragon');
    }
}
