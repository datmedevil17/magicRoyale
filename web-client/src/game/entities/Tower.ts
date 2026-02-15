import Phaser from 'phaser';

export class Tower extends Phaser.GameObjects.Sprite {
    private healthBar: Phaser.GameObjects.Graphics;
    public maxHealth: number;
    public currentHealth: number;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, maxHealth: number) {
        super(scene, x, y, texture);
        this.scene.add.existing(this);

        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
        this.healthBar = this.scene.add.graphics();
        this.updateHealthBar();
    }

    public setHealth(amount: number) {
        this.currentHealth = amount;
        if (this.currentHealth < 0) this.currentHealth = 0;
        this.updateHealthBar();
    }

    public setShooting(isShooting: boolean, owner: string, isKing: boolean) {
        const suffix = owner === 'player' || owner.startsWith('Player') ? 'player' : 'opponent';
        const animKey = isKing ? `Shot_fight_${suffix}` : `Tower_fight_${suffix}`;

        if (isShooting) {
            if (this.scene.anims.exists(animKey)) {
                if (this.scene instanceof Phaser.Scene) { // Safety check
                    if (this.anims) {
                        if (!this.anims.isPlaying || this.anims.currentAnim?.key !== animKey) {
                            this.play(animKey);
                        }
                    }
                }
            }
        } else {
            if (this.anims && this.anims.isPlaying) {
                this.stop();
                this.setFrame(0); // Reset to first frame or default texture
            }
        }
    }

    public setShooting(isShooting: boolean, owner: string, isKing: boolean) {
        // e.g. Tower_fight_player
        // owner: 'player' or 'opponent'
        // isKing: if true, maybe 'Shot_fight_'? Java uses different logic. 
        // Java: King -> Shot_fight, Queen -> Tower_fight

        const suffix = owner === 'player' || owner.startsWith('Player') ? 'player' : 'opponent';
        const animKey = isKing ? `Shot_fight_${suffix}` : `Tower_fight_${suffix}`;
        // Note: 'Shot_fight' assets need to be checked if they are for King.
        // Based on Java code: kingKey="Shot_fight_...", queenKey="Tower_fight_..."

        if (isShooting) {
            if (this.scene.anims.exists(animKey)) {
                if (this.anims.currentAnim?.key !== animKey) {
                    this.play(animKey);
                }
            }
        } else {
            this.stop();
            // Reset to default texture? 
            // We need to store original texture key or infer it.
            // For now, let's assume valid default texture is set on init.
            // If we stop, it stays on last frame? or we should setTexture.
            // Ideally setTexture to default.
            if (this.anims.isPlaying) {
                this.stop();
            }
            // How to restore default? 
            // Maybe store defaultTextureKey in constructor.
        }
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

    public preUpdate(time: number, delta: number) {
        super.preUpdate(time, delta);
        // Ensure health bar moves with tower if tower moves (it shouldn't but good practice)
        this.updateHealthBar();
    }

    public destroy(fromScene?: boolean) {
        this.healthBar.destroy();
        super.destroy(fromScene);
    }
}
