import { Troop } from './Troop';
import { Entity, EntityType } from '../Entity';

export class Giant extends Troop {
    public name = 'Giant';
    // Targets buildings only (towers + building cards like Inferno Tower)
    protected targetFilter = (e: Entity) => e.type === EntityType.TOWER || e.type === EntityType.BUILDING;

    constructor(id: string, x: number, y: number, ownerId: string) {
        super(id, x, y, ownerId, 'Giant');
    }
}
