import { Scene } from 'phaser';

// Import Gifuct-js related logic (we'll implement loadGif helper in utils)
// But wait, BootScene needs to use the helper.
// The helper uses fetch, so we can run it in preload or create.
// Since it's async, we might need to block or show loading bar.
// For now, let's load a few key GIFs in `create` before starting MainScene, 
// OR better, make BootScene async.

import { loadGif } from '../utils/GifLoader';
import { TroopStats } from '../logic/TroopStats';

export class BootScene extends Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        this.load.setPath('assets');

        // Cards
        this.load.image('ArchersCard', 'ArchersCard.png');
        this.load.image('ArrowsCard', 'ArrowsCard.png');
        this.load.image('BabyDragonCard', 'BabyDragonCard.png');
        this.load.image('BarbariansCard', 'BarbariansCard.png');
        this.load.image('CannonCard', 'CannonCard.png');
        // ... (keep existing images)
        this.load.image('FireballCard', 'FireballCard.png');
        this.load.image('GiantCard', 'GiantCard.png');
        this.load.image('InfernoTowerCard', 'InfernoTowerCard.png');
        this.load.image('MiniPEKKACard', 'MiniPEKKACard.png');
        this.load.image('RageCard', 'RageCard.png');
        this.load.image('ValkyrieCard', 'ValkyrieCard.png');
        this.load.image('WizardCard', 'WizardCard.png');

        // Towers
        this.load.image('tower_archer_blue', 'tower_archer_blue.png');
        this.load.image('tower_archer_red', 'tower_archer_red.png');
        this.load.image('tower_king_blue', 'tower_king_blue.png');
        this.load.image('tower_king_red', 'tower_king_red.png');

        // Arena Assets
        this.load.image('bridge', 'bridge.png');
        this.load.image('side_river', 'side_river.png');
        this.load.image('middle_river', 'middle_river.png');

        // Misc UI/Map Assets
        this.load.image('score_place1', 'score_place1.png');
        this.load.image('score_place2', 'score_place2.png');
        this.load.image('level_place', 'level_place.png');
        this.load.image('time_place', 'time_place.png');
        this.load.image('cup_icon', 'cup_icon.png');

        // Load indexed assets
        for (let i = 1; i <= 4; i++) {
            this.load.image(`wall${i}`, `wall${i}.png`);
            this.load.image(`stone${i}`, `stone${i}.png`);
            this.load.image(`tree${i}`, `tree${i}.png`);
        }
        for (let i = 1; i <= 5; i++) {
            this.load.image(`trees${i}`, `trees${i}.png`);
        }
    }

    async create() {
        console.log('BootScene: Loading GIFs...');

        // Load GIFs manually
        // We need to use the full path relative to public/
        // Vite serves public at root.

        const gifPath = 'assets/gifs/';

        // Array of GIFs to load
        const gifs = [
            'Archer_walk_player', 'Archer_walk_opponent',
            'Archer_fight_player', 'Archer_fight_opponent',

            'Giant_walk_player', 'Giant_walk_opponent',
            'Giant_fight_player', 'Giant_fight_opponent',

            'MiniPekka_walk_player', 'MiniPekka_walk_opponent',
            'MiniPekka_fight_player', 'MiniPekka_fight_opponent',

            'Valkyrie_walk_player', 'Valkyrie_walk_opponent',
            'Valkyrie_fight_player', 'Valkyrie_fight_opponent',

            'Wizard_walk_player', 'Wizard_walk_opponent',
            'Wizard_fight_player', 'Wizard_fight_opponent',

            'BabyDragon_walk_player', 'BabyDragon_walk_opponent',
            'BabyDragon_fight_player', 'BabyDragon_fight_opponent'
        ];

        const troops = Object.keys(TroopStats);

        for (const troopName of troops) {
            const stats = TroopStats[troopName as keyof typeof TroopStats];
            if (stats && stats.animSpeed) {
                // Determine keys
                // Current naming convention in BootScene: Name_action_owner
                // TroopStats key: Archer, Giant, etc.

                // We need to map TroopStats key to file names if they differ, or rely on convention.
                // The current array `gifs` had specific names. 
                // Let's iterate the `gifs` array and find matching stats.
            }
        }

        // Actually, better to iterate the known GIF list and look up stats.
        for (const key of gifs) {
            let frameRate: number | undefined = undefined;

            // Try to find matching troop stats
            // Key format: Name_action_owner (e.g. Archer_walk_player)
            const parts = key.split('_');
            const name = parts[0]; // Archer
            const action = parts[1]; // walk or fight

            // Check if name exists in TroopStats
            // Handle edge cases like "BabyDragon" vs "BabyDragon" (Match)
            // "MiniPekka" vs "MiniPekka" (Match)

            if (name in TroopStats) {
                const stats = TroopStats[name as keyof typeof TroopStats];
                if (stats.animSpeed) {
                    if (action === 'walk') frameRate = stats.animSpeed.walk;
                    else if (action === 'fight') frameRate = stats.animSpeed.fight;
                }
            }

            await loadGif(this, key, `${gifPath}${key}.gif`, frameRate);
        }

        console.log('BootScene: GIFs Loaded');
        const data = this.registry.get('data');
        this.scene.start('MainScene', data);
    }
}

