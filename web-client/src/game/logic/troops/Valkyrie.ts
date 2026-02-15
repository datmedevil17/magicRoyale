import { TroopStats } from '../TroopStats';
import { Troop, TroopState } from './Troop';
import { Entity } from '../Entity';
import type { ArenaLayout } from '../Interfaces';

export class Valkyrie extends Troop {
    public name = TroopStats.Valkyrie.name;
    public speed = TroopStats.Valkyrie.speed;
    public range = TroopStats.Valkyrie.range;
    public hitSpeed = TroopStats.Valkyrie.hitSpeed;
    public damage = TroopStats.Valkyrie.damage;
    public attackType = TroopStats.Valkyrie.attackType;
    public movementType = TroopStats.Valkyrie.movementType;

    constructor(id: string, x: number, y: number, ownerId: string) {
        super(id, x, y, ownerId);
        this.maxHealth = TroopStats.Valkyrie.health;
        this.health = this.maxHealth;
    }

    update(time: number, delta: number, enemies: Entity[], layout: ArenaLayout) {
        let closest: Entity | null = null;
        let minDistance = Infinity;

        for (const enemy of enemies) {
            if (enemy.ownerId === this.ownerId) continue;
            const dist = this.getDistanceTo(enemy);
            if (dist < minDistance) {
                minDistance = dist;
                closest = enemy;
            }
        }

        this.target = closest;

        if (this.target) {
            if (this.isInRange(this.target)) {
                this.state = TroopState.FIGHT;
                if (time - this.lastAttackTime > this.hitSpeed * 1000) {
                    this.attack(this.target);
                    // Valkyrie deals AOE damage in real game. 
                    // Let's simplisticly damage only target for now, 
                    // or maybe nearby enemies? 
                    // Keeping simple for now.
                    this.lastAttackTime = time;
                }
            } else {
                this.state = TroopState.WALK;
                this.moveTowards(this.target, delta, layout);
            }
        } else {
            this.state = TroopState.WALK;
            this.moveForward(delta, layout);
        }
    }

    private attack(target: Entity) {
        target.takeDamage(this.damage);
    }
}
