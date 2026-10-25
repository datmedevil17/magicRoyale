export interface TowerConfig {
    id: string;
    type: 'king' | 'princess';
    owner: 'player' | 'opponent';
    towerRow: number;
    towerCol: number;
    pixelScale: number;
    texture: string;
    gridRow: number;
    gridCol: number;
    gridWidth: number;
    gridHeight: number;
}

/**
 * Visual theme drawn by MapBuilder instead of the flat tile colours: floor, glowing lanes
 * along CUSTOM_TILES, tower pads, a gradient river with shimmer, and themed bridges.
 */
export interface ArenaTheme {
    floor: [number, number];               // subtle two-tone checker
    vignette: number;                      // edge darkening colour
    lane: { color: number; glow: number; width: number };
    pad: { fill: number; border: number };
    river: { edge: number; middle: number; bank: number; shimmer: number };
    bridge: { deck: number; stripe: number; rail: number };
    fenceTint?: number;                    // recolour shared fence art to match the theme
}

export interface ArenaConfigInterface {
    TILE_SIZE: number;
    ROWS: number;
    COLS: number;
    KING_TOWER_HP: number;
    PRINCESS_TOWER_HP: number;
    PLAYABLE_ROWS: number;
    PLAYABLE_COLS: number;
    MARGIN_X: number;
    MARGIN_Y: number;
    RIVER_ROW_START: number;
    RIVER_ROW_END: number;
    BRIDGE_LEFT_COL: number;
    BRIDGE_RIGHT_COL: number;
    Colors: {
        GRASS: number;
        GRASS_ALT: number;
        WATER: number;
        SAND: number;
        BORDER: number;
        FENCE: number;
        [key: string]: number;
    };
    CROWN_IMAGES?: {
        PLAYER_KING: string;
        PLAYER_QUEEN_Left: string;
        PLAYER_QUEEN_Right: string;
        OPPONENT_KING: string;
        OPPONENT_QUEEN_Left: string;
        OPPONENT_QUEEN_Right: string;
    };
    TOWERS: readonly TowerConfig[] | TowerConfig[];
    CUSTOM_TILES: { col: number, row: number, color: number }[];
    CUSTOM_FENCES: { col: number, row: number, rotate?: number, texture?: string, scale?: number, scaleX?: number, scaleY?: number }[];
    PROPS: { col: number, row: number, texture: string, rotate?: number, scale?: number, alpha?: number }[];
    THEME?: ArenaTheme;
    resolveGrid: (playableX: number, playableY: number, perspective?: 'player' | 'opponent') => { x: number, y: number, col: number, row: number };
    getPixelCoords: (col: number, row: number) => { x: number, y: number };
}
