import Phaser from 'phaser';
import { Entity } from '../logic/Entity';
import { RAGE_BOOST, Troop } from '../logic/troops/Troop';
import { Building } from '../logic/troops/Building';
import { Cannon } from '../logic/troops/Cannon';
import { InfernoTower } from '../logic/troops/InfernoTower';
import { Spell } from '../logic/spells/Spell';
import { fireProjectile } from './Projectiles';

const HIT_FLASH_MS = 80;
const SPAWN_MS = 200;
const DEATH_MS = 250;
const PLAYER_COLOR = 0x64ccff;
const OPPONENT_COLOR = 0xf04043;
const RAGE_TINT = 0xff77ff;
const ZONE_DEPTH = 1; // lingering spell zones: above the ground, below every unit
// Inferno beam width/colour per ramp stage
const BEAM_STYLE = [
    { width: 2, color: 0xffb347 },
    { width: 4, color: 0xff7a1a },
    { width: 6, color: 0xff2a00 },
];

export class Unit extends Phaser.GameObjects.Sprite {
    private healthBar: Phaser.GameObjects.Graphics | null = null;
    private barOffset: number = 0;
    private baseScale: number;
    private lastAttackStart: number = -1;
    private lastHitCount: number;
    private lastBar = { x: NaN, y: NaN, health: NaN };
    private flashTimer: Phaser.Time.TimerEvent | null = null;
    private raged: boolean = false;
    private beam: Phaser.GameObjects.Graphics | null = null;
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
        this.lastHitCount = entity.hitCount;
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
        // Fix Z-ordering/flickering; zones (Rage) lie flat under units
        this.setDepth(entity instanceof Spell && entity.isZone ? ZONE_DEPTH : entity.y);

        if (entity instanceof Cannon) {
            // Drawn in 3/4 view with a frame per facing, so it never rotates
            this.updateCannon(entity);
        } else {
            if (!(entity instanceof Building)) {
                // Player units face UP (-PI/2) in assets, Opponent units face DOWN (PI/2).
                // To rotate them correctly, we compensate for their default facing.
                const offset = this.owner === 'player' ? Math.PI / 2 : -Math.PI / 2;
                this.setRotation(entity.rotation + offset);
            }

            if (entity instanceof Spell) {
                this.playAnim(`${this.unitName}_fight_${this.owner}`);
            } else if (entity instanceof Troop) {
                this.updateTroopAnim(entity);
            }
        }

        if (entity instanceof Troop) {
            this.updateRage(entity);
            if (entity instanceof InfernoTower) this.updateBeam(entity);
        }

        if (entity.hitCount !== this.lastHitCount) this.flash();
        this.lastHitCount = entity.hitCount;

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

    /**
     * Cannon: idle uses the walk sprite; while fighting, pick the fight-sheet frame that
     * faces the target (0 = left, 2 = down-left, 3 = down-right, 0 mirrored = right) and
     * fire a cannonball on each new attack.
     */
    private updateCannon(cannon: Cannon) {
        const fightKey = `${this.unitName}_fight_${this.owner}`;
        if (cannon.state !== 'fight' || !cannon.target || !this.scene.textures.exists(fightKey)) {
            this.setFlipX(false);
            this.showFrame(`${this.unitName}_walk_${this.owner}`);
            return;
        }

        const dx = cannon.target.x - cannon.x;
        const dy = cannon.target.y - cannon.y;
        const frame = dy > 0 ? (dx < 0 ? 2 : 3) : 0;
        this.anims.stop();
        this.setTexture(fightKey, frame);
        this.setFlipX(dy <= 0 && dx > 0);

        if (cannon.attackStartTime !== this.lastAttackStart && cannon.lastAttack) {
            this.lastAttackStart = cannon.attackStartTime;
            const { targetX, targetY, impactDelay } = cannon.lastAttack;
            fireProjectile(this.scene, this.x, this.y, targetX, targetY, impactDelay, 'ball');
            // Recoil
            this.scene.tweens.add({
                targets: this,
                scale: this.baseScale * 0.9,
                duration: 60,
                yoyo: true,
            });
        }
    }

    /** Raged troops play their animations faster and glow purple. */
    private updateRage(troop: Troop) {
        if (troop.isRaged === this.raged) return;
        this.raged = troop.isRaged;
        this.anims.timeScale = this.raged ? RAGE_BOOST : 1;
        if (!this.flashTimer) this.applyBaseTint();
    }

    private applyBaseTint() {
        if (this.raged) this.setTint(RAGE_TINT);
        else this.clearTint();
    }

    /** Inferno beam to its target, thicker and redder as the damage ramps up. */
    private updateBeam(inferno: InfernoTower) {
        if (!this.beam) this.beam = this.scene.add.graphics().setDepth(4500);
        this.beam.clear();
        const target = inferno.target;
        if (inferno.state !== 'fight' || !target) return;

        const style = BEAM_STYLE[inferno.rampStage];
        this.beam.lineStyle(style.width, style.color, 0.9);
        // From the tower's top (the attack sheet is larger than the tower, so use the walk-sprite height)
        this.beam.lineBetween(this.x, this.y - this.barOffset * 0.75, target.x, target.y);
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
            this.flashTimer = null;
            this.applyBaseTint();
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
        this.beam?.destroy();
        this.beam = null;
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
        this.beam?.destroy();
        this.flashTimer?.remove();
        super.destroy(fromScene);
    }
}
