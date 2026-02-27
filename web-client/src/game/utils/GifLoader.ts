// @ts-ignore
import { parseGIF, decompressFrames } from 'gifuct-js';

interface LoadGifOptions {
    duration?: number; // Total duration of the animation in ms
    frameRate?: number; // Override frame rate (fps)
    hitSpeed?: number; // Target total cycle time (ms) to calculate pause
    repeat?: number;   // Phaser animation repeat (-1 for infinite, 0 for once)
}

export const loadGif = async (scene: Phaser.Scene, key: string, url: string, options: LoadGifOptions = {}) => {
    try {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const gif = parseGIF(buffer);
        const frames = decompressFrames(gif, true);

        // Create textures from frames
        frames.forEach((frame: any, i: number) => {
            const frameKey = `${key}_frame_${i}`;
            if (!scene.textures.exists(frameKey)) {
                const canvas = document.createElement('canvas');
                canvas.width = frame.dims.width;
                canvas.height = frame.dims.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    const imageData = new ImageData(
                        new Uint8ClampedArray(frame.patch),
                        frame.dims.width,
                        frame.dims.height
                    );
                    ctx.putImageData(imageData, 0, 0);
                    scene.textures.addCanvas(frameKey, canvas);
                }
            }
        });

        // Create animation
        if (!scene.anims.exists(key)) {
            const animFrames = frames.map((_: any, i: number) => ({ key: `${key}_frame_${i}` }));

            // Calculate frame rate
            let frameRate = 10;

            if (options.frameRate) {
                frameRate = options.frameRate;
            } else if (options.duration) {
                // Determine frame rate to fit all frames within duration
                // fps = frames / seconds
                frameRate = frames.length / (options.duration / 1000);
            } else {
                // Calculate from delays
                let totalDelay = 0;
                frames.forEach((f: any) => totalDelay += (f.delay || 100));
                const avgDelay = totalDelay / frames.length;
                frameRate = 1000 / avgDelay;
            }

            // Calculate Repeat Delay (Pause between loops)
            let repeatDelay = 0;
            if (options.hitSpeed) {
                const animDuration = (frames.length / frameRate) * 1000;
                if (options.hitSpeed > animDuration) {
                    repeatDelay = options.hitSpeed - animDuration;
                }
            }

            scene.anims.create({
                key: key,
                frames: animFrames,
                frameRate: frameRate,
                repeat: options.repeat !== undefined ? options.repeat : -1,
                repeatDelay: repeatDelay
            });
        }

        return true;
    } catch (e) {
        return false;
    }
};
