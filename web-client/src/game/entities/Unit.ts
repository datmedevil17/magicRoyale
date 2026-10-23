import Phaser from 'phaser';
import { Entity } from '../logic/Entity';
import { Troop } from '../logic/troops/Troop';
import { Spell } from '../logic/spells/Spell';

const HIT_FLASH_MS = 80;
const SPAWN_MS = 200;
const DEATH_MS = 250;
const PLAYER_COLOR = 0x64ccff;
const OPPONENT_COLOR = 0xf04043;

export class Unit extends Phaser.GameObjects.Sprite {
    private healthBar: Phaser.GameObjects.Graphics | null = null;
    private barOffset: number = 0;
    private baseScale: number;
    private lastAttackStart: number = -1;
    private lastHealth: number;
    private lastBar = { x: NaN, y: NaN, health: NaN };
    private flashTimer: Phaser.Time.TimerEvent | null = null;
    private readonly owner: 'player' | 'opponent';
    private readonly isSpell: boolean;
    private readonly unitName: string; // card/config name, e.g. 'Archers' (Sprite already has `name`)

    constructor(scene: Phaser.Scene, entity: Entity) {
        // Texture is set by updateVisuals below
        super(scene, entity.x, entity.y, '');
        // add.existing also puts the sprite on the scene's update list, which advances its animations
        this.scene.add.existing(this);

        this.owner = entity.ownerId.includes('player') ? 'player' : 'opponent';
        this.unitName = (entity as Troop | Spell).name;
        this.lastHealth = entity.health;
        this.isSpell = entity instanceof Spell;

        if (entity instanceof Spell) {
            this.baseScale = 1;
        } else {
            this.baseScale = entity instanceof Troop ? entity.pixelScale : 0.5;
            this.healthBar = this.scene.add.graphics().setDepth(5000); // above every unit
            // Fixed bar height from the walk sprite so it doesn't jump when the (taller) attack sprite plays
            const walkKey = `${this.unitName}_walk_${this.owner}`;
            const refHeight = this.scene.textures.exists(walkKey) ? this.scene.textures.getFrame(walkKey, 0).height : 40;
            this.barOffset = refHeight * this.baseScale / 2 + 8;
        }

        // A finished single-play attack rests on its first frame until the next attack
        this.on(Phaser.Animations.Events.ANIMATION_COMPLETE, (anim: Phaser.Animations.Animation) => {
            if (entity instanceof Troop && anim.frames.length > 0) {
                this.setFrame(anim.frames[0].textureFrame);
            }
        });

        this.updateVisuals(entity);

        if (entity instanceof Spell) {
            // Cover the spell's damage area
            this.setDisplaySize(entity.radius * 2, entity.radius * 2);
        } else {
            this.playSpawnEffect();
        }
    }

    public updateVisuals(entity: Entity) {
        this.setPosition(entity.x, entity.y);
        this.setDepth(entity.y); // Fix Z-ordering/flickering

        // Player units face UP (-PI/2) in assets, Opponent units face DOWN (PI/2).
        // To rotate them correctly, we compensate for their default facing.
        const offset = this.owner === 'player' ? Math.PI / 2 : -Math.PI / 2;
        this.setRotation(entity.rotation + offset);

        if (entity instanceof Spell) {
            this.playAnim(`${this.unitName}_fight_${this.owner}`);
        } else if (entity instanceof Troop) {
            this.updateTroopAnim(entity);
        }

        if (entity.health < this.lastHealth) this.flash();
        this.lastHealth = entity.health;

        this.updateHealthBar(entity);
    }

    private updateTroopAnim(troop: Troop) {
        const walkKey = `${this.unitName}_walk_${this.owner}`;
        const fightKey = `${this.unitName}_fight_${this.owner}`;

        if (troop.state === 'fight') {
            if (troop.continuousAttack) {
                this.playAnim(fightKey);
            } else if (troop.attackStartTime !== this.lastAttackStart) {
                // New attack: restart the swing so it lines up with the damage
                this.lastAttackStart = troop.attackStartTime;
                this.playAnim(fightKey, true);
            } else if (this.texture.key !== fightKey) {
                // In range but waiting on cooldown: ready pose
                this.showFrame(fightKey);
            }
        } else if (troop.state === 'walk') {
            this.playAnim(walkKey);
        } else {
            // Idle: stand still instead of walking in place
            this.showFrame(walkKey);
        }
    }

    /** Play `key` unless it's already the current animation (or always, with `restart`). */
    private playAnim(key: string, restart = false) {
        if (!this.scene.anims.exists(key)) {
            this.showFallback();
            return;
        }
        if (restart || this.anims.currentAnim?.key !== key) {
            this.play(key);
        }
    }

    /** Show the first frame of `key`'s animation without playing it. */
    private showFrame(key: string) {
        if (this.texture.key === key && !this.anims.isPlaying) return;
        const anim = this.scene.anims.get(key);
        if (!anim) {
            this.showFallback();
            return;
        }
        this.anims.stop();
        this.setTexture(key, anim.frames[0].textureFrame);
    }

    /** No animation for this unit: show its card image. */
    private showFallback() {
        const cardFallback = `${this.unitName}Card`;
        if (this.texture.key !== cardFallback && this.scene.textures.exists(cardFallback)) {
            this.setTexture(cardFallback);
        }
    }

    private playSpawnEffect() {
        this.setScale(this.baseScale * 0.3).setAlpha(0);
        this.scene.tweens.add({
            targets: this,
            scale: this.baseScale,
            alpha: 1,
            duration: SPAWN_MS,
            ease: 'Back.Out',
        });

        const color = this.owner === 'player' ? PLAYER_COLOR : OPPONENT_COLOR;
        const ring = this.scene.add.circle(this.x, this.y, 6)
            .setStrokeStyle(2, color)
            .setDepth(this.depth - 1);
        this.scene.tweens.add({
            targets: ring,
            scale: 4,
            alpha: 0,
            duration: SPAWN_MS * 2,
            onComplete: () => ring.destroy(),
        });
    }

    private flash() {
        this.setTintFill(0xffffff);
        this.flashTimer?.remove();
        this.flashTimer = this.scene.time.delayedCall(HIT_FLASH_MS, () => {
            this.clearTint();
            this.flashTimer = null;
        });
    }

    private updateHealthBar(entity: Entity) {
        if (!this.healthBar) return;

        // Only redraw when something visible changed
        if (this.lastBar.x === this.x && this.lastBar.y === this.y && this.lastBar.health === entity.health) return;
        this.lastBar = { x: this.x, y: this.y, health: entity.health };

        this.healthBar.clear();

        const width = 40;
        const height = 6;
        const x = this.x - width / 2;
        const y = this.y - this.barOffset - height;

        // Background
        this.healthBar.fillStyle(0x000000);
        this.healthBar.fillRect(x, y, width, height);

        // Health
        const percentage = entity.health / entity.maxHealth;
        if (percentage > 0) {
            this.healthBar.fillStyle(this.owner === 'player' ? PLAYER_COLOR : OPPONENT_COLOR);
            this.healthBar.fillRect(x + 1, y + 1, (width - 2) * percentage, height - 2);
        }
    }

    /** Fade out and remove. Spells just disappear (their animation already finished). */
    public playDeath() {
        this.healthBar?.destroy();
        this.healthBar = null;
        this.flashTimer?.remove();

        if (this.isSpell) {
            this.destroy();
            return;
        }

        this.anims.stop();
        this.clearTint();
        this.scene.tweens.killTweensOf(this);
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: this.scale * 0.6,
            duration: DEATH_MS,
            onComplete: () => this.destroy(),
        });
    }

    public destroy(fromScene?: boolean) {
        this.healthBar?.destroy();
        this.flashTimer?.remove();
        super.destroy(fromScene);
    }
}
