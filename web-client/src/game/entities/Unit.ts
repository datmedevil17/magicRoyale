import Phaser from 'phaser';
import { Entity } from '../logic/Entity';
import { Troop } from '../logic/troops/Troop';
import { Spell } from '../logic/spells/Spell';

export class Unit extends Phaser.GameObjects.Sprite {
    private healthBar: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene, entity: Entity) {
        // Initial texture based on entity type 
        // We defer to updateVisuals to set the correct one immediately
        super(scene, entity.x, entity.y, '');

        this.scene.add.existing(this);
        // Explicitly add to update list for animation updates
        if (this.scene) {
            this.scene.events.on('update', this.preUpdate, this);
        }

        this.healthBar = this.scene.add.graphics();
        this.updateVisuals(entity);

        // Scale adjustment if needed
        // this.setScale(0.5); // Removed hardcoded scale
        if (entity instanceof Troop) {
            const troop = entity as Troop;
            this.setScale(troop.pixelScale);
        } else {
            this.setScale(0.5); // Default/Fallback
        }
    }

    public preUpdate(time: number, delta: number) {
        super.preUpdate(time, delta);
    }

    public updateVisuals(entity: Entity) {
        // Update Position
        this.setPosition(entity.x, entity.y);
        this.setDepth(entity.y); // Fix Z-ordering/flickering

        const owner = entity.ownerId.includes('player') ? 'player' : 'opponent';
        // Offset: Player units face UP (-PI/2) in assets, Opponent units face DOWN (PI/2).
        // To rotate them correctly, we compensate for their default facing.
        const offset = owner === 'player' ? Math.PI / 2 : -Math.PI / 2;
        this.setRotation(entity.rotation + offset);

        // Update Animation/Texture based on State

        if (entity instanceof Troop || entity instanceof Spell) {
            const state = (entity as any).state; // 'walk', 'fight', 'idle'
            const owner = entity.ownerId.includes('player') ? 'player' : 'opponent';
            const name = (entity as any).name; // e.g. 'Archer' or 'Arrows'

            let action = 'walk';
            if (state === 'fight') action = 'fight';

            const textureKey = `${name}_${action}_${owner}`;

            // Check if we need to switch animation
            // Use currentAnim.key check to prevent restarting animation every frame
            if (!this.anims.isPlaying || this.anims.currentAnim?.key !== textureKey) {
                if (this.scene.anims.exists(textureKey)) {
                    this.play(textureKey);
                } else {
                    // Fallback for missing animation: Try action texture, then generic card image
                    if (this.scene.textures.exists(textureKey)) {
                        if (this.texture.key !== textureKey) {
                            this.setTexture(textureKey);
                        }
                    } else {
                        // FINAL FALLBACK: Use the static card image (e.g., 'GiantCard')
                        const cardFallback = `${name}Card`;
                        if (this.scene.textures.exists(cardFallback)) {
                            if (this.texture.key !== cardFallback) {
                                this.setTexture(cardFallback);
                            }
                        }
                    }
                }
            }
        }

        // Update Health Bar
        this.updateHealthBar(entity);
    }

    private updateHealthBar(entity: Entity) {
        this.healthBar.clear();

        const width = 40;
        const height = 6;
        const x = this.x - width / 2;
        const y = this.y - this.height * this.scaleY / 2 - 10;

        // Background
        this.healthBar.fillStyle(0x000000);
        this.healthBar.fillRect(x, y, width, height);

        // Health
        const percentage = entity.health / entity.maxHealth;
        if (percentage > 0) {
            const color = entity.ownerId.includes('player') ? 0x64ccff : 0xf04043; // Blue/Red
            this.healthBar.fillStyle(color);
            this.healthBar.fillRect(x + 1, y + 1, (width - 2) * percentage, height - 2);
        }
    }

    public destroy(fromScene?: boolean) {
        if (this.scene) {
            this.scene.events.off('update', this.preUpdate, this);
        }
        this.healthBar.destroy();
        super.destroy(fromScene);
    }
}
