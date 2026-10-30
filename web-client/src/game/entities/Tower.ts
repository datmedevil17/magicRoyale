import Phaser from 'phaser';
import type { TowerShot } from '../logic/TowerEntity';
import { fireProjectile } from './Projectiles';

export class Tower extends Phaser.GameObjects.Sprite {
    private healthBar: Phaser.GameObjects.Graphics;
    public maxHealth: number;
    public currentHealth: number;
    private lastShotTime: number = -1;
    private sleepIcon: Phaser.GameObjects.Text | null = null;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, maxHealth: number) {
        super(scene, x, y, texture);
        this.scene.add.existing(this);

        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
        this.healthBar = this.scene.add.graphics();
        this.healthBar.setDepth(100); // Ensure health bar renders above all ground tiles
        this.updateHealthBar();
    }

    /** Scenes scale towers after construction; keep the health bar above the scaled sprite. */
    public setScale(x?: number, y?: number) {
        super.setScale(x, y);
        if (this.healthBar) this.updateHealthBar();
        return this;
    }

    public setHealth(amount: number) {
        const health = Math.max(0, amount);
        if (health === this.currentHealth) return; // called every frame; only redraw on change
        this.currentHealth = health;
        this.updateHealthBar();
    }

    /** Show a floating "Zz" over a sleeping king tower. Call every frame; only changes on toggle. */
    public setSleeping(sleeping: boolean) {
        if (sleeping === !!this.sleepIcon) return;
        if (!sleeping) {
            this.sleepIcon?.destroy();
            this.sleepIcon = null;
            return;
        }
        this.sleepIcon = this.scene.add.text(this.x + this.displayWidth * 0.25, this.y - this.displayHeight * 0.35, 'Zz', {
            fontSize: '14px', fontStyle: 'bold', color: '#ffffff', stroke: '#1e3a8a', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(101);
        this.scene.tweens.add({
            targets: this.sleepIcon,
            y: this.sleepIcon.y - 6,
            alpha: 0.5,
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut',
        });
    }

    /** Tower destroyed: shake the camera and leave darkened rubble in place. */
    public playDestroyed() {
        this.healthBar.destroy();
        this.setSleeping(false);
        this.scene.cameras.main.shake(250, 0.008);
        this.setTint(0x444444);
        this.scene.tweens.add({
            targets: this,
            alpha: 0.5,
            scaleY: this.scaleY * 0.6,
            duration: 300,
            ease: 'Quad.In',
        });
    }

    /** Call every frame with the tower entity's latest shot; draws each new shot once. */
    public showShot(shot: TowerShot | null, isKing: boolean) {
        if (!shot || shot.time === this.lastShotTime) return;
        this.lastShotTime = shot.time;
        // From the top of the tower: arrows for princess towers, a cannonball for the king
        fireProjectile(this.scene, this.x, this.y - this.displayHeight * 0.25, shot.targetX, shot.targetY,
            shot.flightMs, isKing ? 'ball' : 'arrow');
    }

    public updateHealthBar() {
        this.healthBar.clear();

        const width = 60;
        const height = 8;
        const x = this.x - width / 2;
        const y = this.y - this.displayHeight / 2 - 12; // Above the tower (displayHeight includes scale)

        // Background
        this.healthBar.fillStyle(0x000000);
        this.healthBar.fillRect(x, y, width, height);

        // Health
        const percentage = this.currentHealth / this.maxHealth;
        if (percentage > 0) {
            // Colors: Player=Blue(0x4a86e8), Enemy=Red(0xff0000)
            const isPlayer = this.texture.key.includes('blue') || this.texture.key.includes('player');
            const color = isPlayer ? 0x64ccff : 0xf04043;

            this.healthBar.fillStyle(color);
            this.healthBar.fillRect(x + 1, y + 1, (width - 2) * percentage, height - 2);
        }
    }

    public destroy(fromScene?: boolean) {
        this.healthBar.destroy();
        this.sleepIcon?.destroy();
        super.destroy(fromScene);
    }
}
