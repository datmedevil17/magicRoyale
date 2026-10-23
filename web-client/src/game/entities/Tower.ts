import Phaser from 'phaser';
import type { TowerShot } from '../logic/TowerEntity';

export class Tower extends Phaser.GameObjects.Sprite {
    private healthBar: Phaser.GameObjects.Graphics;
    public maxHealth: number;
    public currentHealth: number;
    private lastShotTime: number = -1;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, maxHealth: number) {
        super(scene, x, y, texture);
        this.scene.add.existing(this);

        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
        this.healthBar = this.scene.add.graphics();
        this.healthBar.setDepth(100); // Ensure health bar renders above all ground tiles
        this.updateHealthBar();
    }

    public setHealth(amount: number) {
        const health = Math.max(0, amount);
        if (health === this.currentHealth) return; // called every frame; only redraw on change
        this.currentHealth = health;
        this.updateHealthBar();
    }

    /** Tower destroyed: shake the camera and leave darkened rubble in place. */
    public playDestroyed() {
        this.healthBar.destroy();
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
        this.fireProjectile(shot.targetX, shot.targetY, shot.flightMs, isKing);
    }

    /**
     * Draw a shot flying from the top of the tower to the target: an arrow for princess
     * towers, a cannonball for the king. `flightMs` matches when the logic applies damage.
     */
    private fireProjectile(targetX: number, targetY: number, flightMs: number, isKing: boolean) {
        Tower.ensureProjectileTextures(this.scene);

        const startX = this.x;
        const startY = this.y - this.displayHeight * 0.25;
        const projectile = this.scene.add.image(startX, startY, isKing ? 'proj_ball' : 'proj_arrow')
            .setDepth(4000)
            .setRotation(Phaser.Math.Angle.Between(startX, startY, targetX, targetY));

        this.scene.tweens.add({
            targets: projectile,
            x: targetX,
            y: targetY,
            duration: flightMs,
            onComplete: () => projectile.destroy(),
        });
    }

    private static ensureProjectileTextures(scene: Phaser.Scene) {
        if (scene.textures.exists('proj_arrow')) return;

        const g = scene.make.graphics({}, false);
        // Arrow pointing right (rotation 0): shaft + head
        g.fillStyle(0x8b5a2b).fillRect(0, 2, 12, 2);
        g.fillStyle(0xdddddd).fillTriangle(12, 0, 16, 3, 12, 6);
        g.generateTexture('proj_arrow', 16, 6);
        g.clear();
        // Cannonball
        g.fillStyle(0x222222).fillCircle(5, 5, 5);
        g.fillStyle(0x666666).fillCircle(3.5, 3.5, 1.5);
        g.generateTexture('proj_ball', 10, 10);
        g.destroy();
    }


    public updateHealthBar() {
        this.healthBar.clear();

        const width = 60;
        const height = 8;
        const x = this.x - width / 2;
        const y = this.y - this.height / 2 - 15; // Above the tower

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
        super.destroy(fromScene);
    }
}
