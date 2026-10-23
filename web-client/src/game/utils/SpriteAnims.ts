import SPRITE_MANIFEST from '../config/SpriteManifest.json';
import type { AnimTiming, SpriteName } from '../config/AnimationTiming';

/**
 * Queue a generated sprite sheet for loading under `key`. Call from a scene's preload().
 * The URL is relative to the site root, so the loader path must be '' (see load.setPath).
 */
export const loadSpriteSheet = (scene: Phaser.Scene, key: string, sprite: SpriteName) => {
    const { frameWidth, frameHeight } = SPRITE_MANIFEST[sprite];
    scene.load.spritesheet(key, `assets/sprites/${sprite}.png`, { frameWidth, frameHeight });
};

/**
 * Create an animation on the loaded sprite sheet `key` with per-frame durations from
 * `timing`. `repeat` is -1 to loop forever, 0 to play once.
 */
export const createSpriteAnim = (scene: Phaser.Scene, key: string, timing: AnimTiming, repeat: number) => {
    if (scene.anims.exists(key) || !scene.textures.exists(key)) return;

    scene.anims.create({
        key,
        frames: timing.frames.map((frame, i) => ({ key, frame, duration: timing.durations[i] })),
        repeat,
    });
};
