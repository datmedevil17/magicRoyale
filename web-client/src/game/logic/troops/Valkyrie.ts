import { Troop } from './Troop';

export class Valkyrie extends Troop {
    public name = 'Valkyrie';

    constructor(id: string, x: number, y: number, ownerId: string) {
        super(id, x, y, ownerId, 'Valkyrie');
    }
}
