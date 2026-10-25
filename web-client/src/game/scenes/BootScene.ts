import { Scene } from 'phaser';

import { getTroopStats, isSpellCard } from '../config/TroopConfig';
import { CONFIG_TO_SPRITE, getAnimTiming, getAttackTiming, type SpriteName } from '../config/AnimationTiming';
import { createSpriteAnim, loadSpriteSheet } from '../utils/SpriteAnims';

const OWNERS = ['player', 'opponent'] as const;

// Every unit's walk + fight animation for both owners. Phaser cache key (texture and
// animation) is `${configName}_${action}_${owner}`, e.g. 'Archers_walk_player'.
const UNIT_SHEETS = Object.entries(CONFIG_TO_SPRITE).flatMap(([configName, spriteName]) =>
    (['walk', 'fight'] as const).flatMap(action => OWNERS.map(owner => ({
        configName, action, owner,
        sprite: `${spriteName}_${action}_${owner}` as SpriteName,
        key: `${configName}_${action}_${owner}`,
    })))
).filter(sheet => !(isSpellCard(sheet.configName) && sheet.action === 'walk')); // spells only have a fight sheet

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

        // Map 1 (Base Map) Towers - Load from assets/
        this.load.image('tower_archer_blue', 'tower_archer_blue.png');
        this.load.image('tower_archer_red', 'tower_archer_red.png');
        this.load.image('tower_king_blue', 'tower_king_blue.png');
        this.load.image('tower_king_red', 'tower_king_red.png');
        this.load.image('logo', 'arena_logo.png');

        // Map 2 (Solana Map) Towers - Load from solanamap/
        this.load.image('m2_tower_archer_blue_right', '../solanamap/tower_archer_blue.png');
        this.load.image('m2_tower_archer_blue_left', '../solanamap/tower_archer_blue2.png');
        this.load.image('m2_tower_archer_red_right', '../solanamap/tower_archer_red.png');
        this.load.image('m2_tower_archer_red_left', '../solanamap/tower_archer_red2.png');
        this.load.image('m2_tower_king_blue', '../solanamap/tower_king_blue.png');
        this.load.image('m2_tower_king_red', '../solanamap/tower_king_red.png');
        this.load.image('m2_logo', '../solanamap/logo.png');
        this.load.image('m2_solana_wall1', '../solanamap/wall1solana.png');

        // Map 3 (Magicblock Map) Towers - Load from magicblock/
        this.load.image('m3_tower_archer_blue_right', '../magicblock/tower_archer_blue.png');
        this.load.image('m3_tower_archer_blue_left', '../magicblock/tower_archer_blue2.png');
        this.load.image('m3_tower_archer_red_right', '../magicblock/tower_archer_red.png');
        this.load.image('m3_tower_archer_red_left', '../magicblock/tower_archer_red2.png');
        this.load.image('m3_tower_king_blue', '../magicblock/tower_king_blue.png');
        this.load.image('m3_tower_king_red', '../magicblock/tower_king_red.png');
        this.load.image('m3_logo', '../magicblock/logo.png');
        this.load.image('m3_magic_stone1', '../magicblock/stone1.png');
        this.load.image('m3_magic_stone2', '../magicblock/stone2.png');

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

        // Load solanamap custom props
        for (let i = 1; i <= 3; i++) {
            this.load.image(`solana_stone${i}`, `../solanamap/stone${i}.png`);
        }
        for (let i = 1; i <= 2; i++) {
            this.load.image(`magic_stone${i}`, `../magicblock/stone${i}.png`);
        }
        // this.load.image('solana_logo', '../solanamap/logo.png');
        this.load.image('solana_wall1', '../solanamap/wall1solana.png');

        // Unit animations (sprite sheets generated by `npm run assets`)
        this.load.setPath('');
        for (const { key, sprite } of UNIT_SHEETS) {
            loadSpriteSheet(this, key, sprite);
        }
    }

    create() {
        for (const { key, sprite, configName, action, owner } of UNIT_SHEETS) {
            const stats = getTroopStats(configName);

            if (action === 'walk') {
                createSpriteAnim(this, key, getAnimTiming(sprite), -1);
            } else if (isSpellCard(configName)) {
                // Instant spells play once; lingering zones (Rage) loop for their duration
                createSpriteAnim(this, key, getAnimTiming(sprite), stats.spellDuration ? -1 : 0);
            } else if (stats.continuousAttack) {
                // Continuous attackers loop their whole GIF at native speed
                createSpriteAnim(this, key, getAnimTiming(sprite), -1);
            } else {
                // One attack cycle, played once per attack (Unit restarts it on each new attack)
                createSpriteAnim(this, key, getAttackTiming(configName, owner, stats.hitSpeed)!, 0);
            }
        }

        const data = this.registry.get('data') || {};
        const nextScene = data.nextScene || 'MainScene';
        this.scene.start(nextScene, data);
    }
}
