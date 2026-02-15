import { TroopStats } from '../TroopStats';
import { Troop, TroopState } from './Troop';
import { Entity } from '../Entity';
import type { ArenaLayout } from '../Interfaces';

export class Wizard extends Troop {
    public name = TroopStats.Wizard.name;
    public speed = TroopStats.Wizard.speed;
    public range = TroopStats.Wizard.range;
    public hitSpeed = TroopStats.Wizard.hitSpeed;
    public damage = TroopStats.Wizard.damage;
    public attackType = TroopStats.Wizard.attackType;
    public movementType = TroopStats.Wizard.movementType;

    constructor(id: string, x: number, y: number, ownerId: string) {
        super(id, x, y, ownerId);
        this.maxHealth = TroopStats.Wizard.health;
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
