import { ArenaConfig } from './ArenaConfig';
import { Map2Config } from './Map2Config';
import { Map3Config } from './Map3Config';
import type { ArenaConfigInterface } from './IArenaConfig';

export type MapType = 'classic' | 'solana' | 'magicblock';

export const MAPS: { id: MapType; name: string; description: string; image: string; previewRoute: string; color: string }[] = [
    {
        id: 'classic',
        name: 'Classic Arena',
        description: 'The original battleground. Perfectly balanced.',
        image: '/assets/map_cover.png',
        previewRoute: '/map-test',
        color: 'from-green-500/20 to-green-900/40',
    },
    {
        id: 'solana',
        name: 'Solana Arena',
        description: 'Neon synthwave vibes with Solana branding.',
        image: '/solanamap/logo.png',
        previewRoute: '/map2',
        color: 'from-purple-500/20 to-blue-900/40',
    },
    {
        id: 'magicblock',
        name: 'Magicblock Arena',
        description: 'Dark, mysterious, and powered by Magicblock.',
        image: '/magicblock/logo.png',
        previewRoute: '/map3',
        color: 'from-teal-500/20 to-gray-900/40',
    },
];

const STORAGE_KEY = 'selectedMap';

const isMapType = (value: unknown): value is MapType => MAPS.some(m => m.id === value);

/** The arena the player picked on the map selection page (used when they create a match). */
export const getSelectedMap = (): MapType => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return isMapType(stored) ? stored : 'classic';
    } catch {
        return 'classic';
    }
};

export const setSelectedMap = (map: MapType) => {
    try {
        localStorage.setItem(STORAGE_KEY, map);
    } catch {
        // Storage unavailable (private mode etc.): selection just won't persist
    }
};

/** Arena layout for a map id. Also accepts the legacy 'map2' / 'map3' ids. */
export const getArenaConfig = (mapType?: string): ArenaConfigInterface => {
    switch (mapType) {
        case 'solana':
        case 'map2':
            return Map2Config;
        case 'magicblock':
        case 'map3':
            return Map3Config;
        default:
            return ArenaConfig;
    }
};
