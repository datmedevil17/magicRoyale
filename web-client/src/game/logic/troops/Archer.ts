import Phaser from 'phaser';
import { Troop, TroopState } from './Troop';
import { Entity } from '../Entity';

export class Archer extends Troop {
    public name: string = 'Archer';
    public speed: number = 50; // Adjust for Phaser pixel scale
    public range: number = 150; // Pixel range
    public hitSpeed: number = 1000; // ms
    public damage: number = 50;
    public attackType: 'GROUND' | 'AIR' | 'BOTH' = 'BOTH';
    public movementType: 'GROUND' | 'AIR' = 'GROUND';

    constructor(id: string, x: number, y: number, ownerId: string) {
        super(id, x, y, ownerId);
        this.health = 200;
        this.maxHealth = 200;
    }

    update(time: number, delta: number, enemies: Entity[]) {
        // Simple AI:
        // 1. Check for enemies in range
        // 2. If target exists and in range -> Attack
        // 3. If no target -> Move forward (up/down depending on owner)

        if (this.target && (this.target.health <= 0 || !this.isInRange(this.target))) {
            this.target = null;
            this.state = TroopState.WALK;
        }

        if (!this.target) {
            this.target = this.findNearestEnemy(enemies);
        }

        if (this.target) {
            if (this.isInRange(this.target)) {
                this.state = TroopState.FIGHT;
                if (time - this.lastAttackTime > this.hitSpeed) {
                    this.attack(this.target);
                    this.lastAttackTime = time;
                }
            } else {
                this.state = TroopState.WALK;
                this.moveTowards(this.target, delta);
            }
        } else {
            this.state = TroopState.WALK;
            // No enemies? Move to opponent side
            this.moveForward(delta);
        }
    }

    private findNearestEnemy(enemies: Entity[]): Entity | null {
        let nearest: Entity | null = null;
        let minDist = Infinity;

        for (const enemy of enemies) {
            if (enemy.ownerId === this.ownerId) continue; // Ignore friendlies
            const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (dist < minDist && dist <= this.range + 200) { // Look ahead a bit
                minDist = dist;
                nearest = enemy;
            }
        }
        return nearest;
    }

    private attack(target: Entity) {
        target.takeDamage(this.damage);
    }
}
