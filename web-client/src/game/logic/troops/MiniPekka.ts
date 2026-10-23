import { Troop } from './Troop';

export class MiniPekka extends Troop {
    public name = 'MiniPEKKA';
    // Keep hitting the same target until it dies
    protected stickyTarget = true;

    constructor(id: string, x: number, y: number, ownerId: string) {
        super(id, x, y, ownerId, 'MiniPEKKA');
    }
}
