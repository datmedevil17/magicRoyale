// Asset pipeline: `npm run assets`
//
// 1. Downscales oversized map images in public/ to a fixed target width (idempotent:
//    images already at or below the target are skipped).
// 2. Converts every unit GIF in public/assets/gifs into a sprite sheet PNG in
//    public/assets/sprites plus a manifest consumed by BootScene. Frames are fully
//    composited (GIF disposal applied), so partial-frame GIFs render correctly.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PUBLIC = path.join(ROOT, 'public');

// Source images drawn far smaller than their native size. When changing a width here,
// scale the matching pixelScale/scale in the map configs by the same ratio.
const RESIZE = {
    'solanamap/tower_archer_blue.png': 256,
    'solanamap/tower_archer_red.png': 256,
    'solanamap/tower_archer_red2.png': 256,
    'solanamap/tower_king_red.png': 256,
    'solanamap/stone1.png': 256,
    'solanamap/stone2.png': 256,
    'solanamap/wall1solana.png': 384, // drawn with setDisplaySize, no scale change needed
    'magicblock/tower_archer_blue.png': 256,
    'magicblock/tower_archer_red.png': 256,
    'magicblock/tower_archer_red2.png': 256,
    'magicblock/tower_king_blue.png': 256,
    'magicblock/tower_king_red.png': 256,
    'assets/wall_solana.png': 384, // drawn with setDisplaySize, no scale change needed
};

const GIF_DIR = path.join(PUBLIC, 'assets/gifs');
const SPRITE_DIR = path.join(PUBLIC, 'assets/sprites');
const MANIFEST = path.join(ROOT, 'src/game/config/SpriteManifest.json');

async function resizeImages() {
    for (const [rel, width] of Object.entries(RESIZE)) {
        const file = path.join(PUBLIC, rel);
        const meta = await sharp(file).metadata();
        if (meta.width <= width) {
            console.log(`skip   ${rel} (${meta.width}px)`);
            continue;
        }
        const before = fs.statSync(file).size;
        const out = await sharp(file).resize({ width }).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
        fs.writeFileSync(file, out);
        console.log(`resize ${rel} ${meta.width}px → ${width}px, ${kb(before)} → ${kb(out.length)}`);
    }
}

async function buildSpriteSheets() {
    fs.mkdirSync(SPRITE_DIR, { recursive: true });
    const manifest = {};

    const gifs = fs.readdirSync(GIF_DIR).filter(f => /_(walk|fight)(-rage)?_(player|opponent)\.gif$/.test(f)).sort();
    for (const file of gifs) {
        const name = path.basename(file, '.gif');
        const image = sharp(path.join(GIF_DIR, file), { animated: true });
        const { delay = [] } = await image.metadata();
        const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

        const frameWidth = info.width;
        const frameHeight = info.pageHeight ?? info.height;
        const frameCount = Math.round(info.height / frameHeight);
        const delays = Array.from({ length: frameCount }, (_, i) => delay[i] ?? 0);

        // Lay frames out in a near-square grid to stay well under mobile max texture size
        const cols = Math.ceil(Math.sqrt(frameCount));
        const rows = Math.ceil(frameCount / cols);
        const sheetWidth = cols * frameWidth;
        const sheet = Buffer.alloc(sheetWidth * rows * frameHeight * 4);
        const rowBytes = frameWidth * 4;

        for (let f = 0; f < frameCount; f++) {
            const ox = (f % cols) * frameWidth;
            const oy = Math.floor(f / cols) * frameHeight;
            for (let y = 0; y < frameHeight; y++) {
                const src = (f * frameHeight + y) * rowBytes;
                const dst = ((oy + y) * sheetWidth + ox) * 4;
                data.copy(sheet, dst, src, src + rowBytes);
            }
        }

        await sharp(sheet, { raw: { width: sheetWidth, height: rows * frameHeight, channels: 4 } })
            .png({ compressionLevel: 9, adaptiveFiltering: true })
            .toFile(path.join(SPRITE_DIR, `${name}.png`));

        // delays: per-frame GIF delays in ms (0 = "as fast as possible" in the source GIF)
        manifest[name] = { frameWidth, frameHeight, frameCount, delays };
    }

    fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`sprites: ${gifs.length} sheets → public/assets/sprites, manifest → src/game/config/SpriteManifest.json`);
}

const kb = (n) => `${Math.round(n / 1024)}KB`;

await resizeImages();
await buildSpriteSheets();
