import type { ArenaConfigInterface } from '../config/IArenaConfig';

/** Rows past the river a side may deploy into once the enemy princess tower on that lane falls. */
const POCKET_ROWS = 4;

export interface Rect { x: number; y: number; w: number; h: number }

/** Enemy princess towers destroyed, by lane as seen on screen. */
export interface LanesDown { left: boolean; right: boolean }

/**
 * Areas (world px) where `side` may deploy troops and buildings. The local player is
 * always drawn at the bottom ('player'); 'opponent' (top) is used by the test arena.
 * Each side gets its own half of the playable area, plus a pocket past the river on
 * any lane whose enemy princess tower is down. Spells can go anywhere on the map.
 */
export function getDeployZones(config: ArenaConfigInterface, side: 'player' | 'opponent', lanesDown: LanesDown): Rect[] {
    const t = config.TILE_SIZE;
    const left = config.MARGIN_X * t;
    const right = (config.COLS - config.MARGIN_X) * t;
    const top = config.MARGIN_Y * t;
    const bottom = (config.ROWS - config.MARGIN_Y) * t;
    const mid = (left + right) / 2;
    const riverTop = config.RIVER_ROW_START * t;
    const riverBottom = (config.RIVER_ROW_END + 1) * t;
    const pocketDepth = POCKET_ROWS * t;

    const zones: Rect[] = side === 'player'
        ? [{ x: left, y: riverBottom, w: right - left, h: bottom - riverBottom }]
        : [{ x: left, y: top, w: right - left, h: riverTop - top }];

    // Pockets are on the enemy's side of the river
    const pocketY = side === 'player' ? riverTop - pocketDepth : riverBottom;
    if (lanesDown.left) zones.push({ x: left, y: pocketY, w: mid - left, h: pocketDepth });
    if (lanesDown.right) zones.push({ x: mid, y: pocketY, w: right - mid, h: pocketDepth });

    return zones;
}

export const isInZones = (zones: Rect[], x: number, y: number) =>
    zones.some(z => x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h);

/**
 * Footprints (world px) of the towers in `standingIds`: the same whole-tile area as the
 * tower's sand patch / pad. Troops and buildings can't be placed there. `mirrored` rotates
 * them 180° for clients whose view is the host's turned around.
 */
export function getTowerFootprints(config: ArenaConfigInterface, standingIds: Set<string>, mirrored: boolean): Rect[] {
    const t = config.TILE_SIZE;
    const mapW = config.COLS * t;
    const mapH = config.ROWS * t;
    return config.TOWERS
        .filter(tower => standingIds.has(tower.id))
        .map(tower => {
            const w = tower.gridWidth * t;
            const h = tower.gridHeight * t;
            const x = (tower.gridCol - tower.gridWidth / 2) * t + t / 2;
            const y = (tower.gridRow - tower.gridHeight / 2) * t + t / 2;
            return mirrored ? { x: mapW - x - w, y: mapH - y - h, w, h } : { x, y, w, h };
        });
}

/** Whole map, for spells. */
export const getMapBounds = (config: ArenaConfigInterface): Rect =>
    ({ x: 0, y: 0, w: config.COLS * config.TILE_SIZE, h: config.ROWS * config.TILE_SIZE });
