import fs from 'fs';
import path from 'path';

const gifDir = path.join(process.cwd(), 'web-client/public/assets/gifs');

if (!fs.existsSync(gifDir)) {
    console.error(`Directory not found: ${gifDir}`);
    process.exit(1);
}

fs.readdirSync(gifDir).forEach(file => {
    if (!file.endsWith('.gif')) return;

    // Original: Archer_walk-rage_opponent_62-62.gif
    // Target Key: Archer_walk-rage_opponent
    const parts = file.split('_');
    if (parts.length >= 4) {
        // Reassemble the first 3 parts
        const newName = parts.slice(0, 3).join('_') + '.gif';
        const oldPath = path.join(gifDir, file);
        const newPath = path.join(gifDir, newName);

        // Normalize distinct names like "Shot" which might have different structure?
        // Java code: return elements[0] + "_" + elements[1] + "_" + elements[2];
        // So "Shot_fight_opponent_22-66.gif" -> "Shot_fight_opponent.gif" working.

        // Splash screen check from Java code
        if (file.startsWith('splash_screen')) return;

        console.log(`Renaming ${file} -> ${newName}`);
        fs.renameSync(oldPath, newPath);
    }
});
