// @ts-ignore
import { parseGIF, decompressFrames } from 'gifuct-js';

export const loadGif = async (scene: Phaser.Scene, key: string, url: string, frameRateOverride?: number) => {
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
            if (frameRateOverride) {
                frameRate = frameRateOverride;
            } else {
                // Calculate from delays
                let totalDelay = 0;
                frames.forEach((f: any) => totalDelay += (f.delay || 100));
                const avgDelay = totalDelay / frames.length;
                frameRate = 1000 / avgDelay;
            }

            scene.anims.create({
                key: key,
                frames: animFrames,
                frameRate: frameRate,
                repeat: -1
            });
        }

        console.log(`Loaded GIF animation: ${key} with ${frames.length} frames`);
        return true;
    } catch (e) {
        console.error(`Failed to load GIF ${key} from ${url}`, e);
        return false;
    }
};
