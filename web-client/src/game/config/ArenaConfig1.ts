export function colorTiles(points: { col: number, row: number }[], color: number) {
    return points.map(p => ({ col: p.col, row: p.row, color }));
}

export function colorRect(c1: number, r1: number, c2: number, r2: number, color: number) {
    const tiles = [];
    for (let c = c1; c <= c2; c++) {
        for (let r = r1; r <= r2; r++) {
            tiles.push({ col: c, row: r, color });
        }
    }
    return tiles;
}

const customTiles = [];
// Horizontal paths at King Towers
for (let c = 6; c <= 17; c++) {
    customTiles.push({ col: c, row: 31, color: 0x14F195 });
    customTiles.push({ col: c, row: 6, color: 0x14F195 });
}
// Vertical paths
for (let r = 6; r <= 31; r++) {
    customTiles.push({ col: 6, row: r, color: 0x14F195 });
    customTiles.push({ col: 17, row: r, color: 0x14F195 });
}

const customFences = [];
// Left & Right Fences
for (let r = 4; r <= 33; r++) {
    customFences.push({ col: 2.5, row: r, vertical: true, texture: 'wall_solana' });
    customFences.push({ col: 21.5, row: r, vertical: true, texture: 'wall_solana' });
}
// Top & Bottom Fences
for (let c = 4; c <= 20; c++) {
    customFences.push({ col: c, row: 3.5, vertical: false, texture: 'wall_solana' });
    customFences.push({ col: c, row: 34.5, vertical: false, texture: 'wall_solana' });
}

export const ArenaConfig1 = {
    // Dimensions
    TILE_SIZE: 22,
    ROWS: 38,
    COLS: 24,

    KING_TOWER_HP: 4200,
    PRINCESS_TOWER_HP: 2400,

    PLAYABLE_ROWS: 30,
    PLAYABLE_COLS: 18,

    get MARGIN_X() { return (this.COLS - this.PLAYABLE_COLS) / 2; },
    get MARGIN_Y() { return (this.ROWS - this.PLAYABLE_ROWS) / 2; },

    RIVER_ROW_START: 18,
    RIVER_ROW_END: 19,

    Colors: {
        GRASS: 0x1A0B2E,      // Dark purple
        GRASS_ALT: 0x240F42,  // Slightly lighter dark purple
        GRID_LINE: 0x9945FF,  // Not visible but kept for type
        WATER: 0x00008B,      // Dark Blue
        SAND: 0x14F195,       // Solana Green for sand
        BORDER: 0x1A0B2E,     // Same as grass
        FENCE: 0x9945FF,      // Solana Purple
    },

    resolveGrid(playableX: number, playableY: number, perspective: 'player' | 'opponent' = 'player') {
        const absoluteX = this.MARGIN_X + playableX;
        let absoluteY = 0;
        if (perspective === 'player') {
            const riverBottom = this.RIVER_ROW_END + 1;
            absoluteY = riverBottom + playableY;
        } else {
            const riverTop = this.RIVER_ROW_START - 1;
            absoluteY = riverTop - playableY;
        }
        return { x: absoluteX, y: absoluteY, col: absoluteX, row: absoluteY };
    },

    BRIDGE_LEFT_COL: 6,
    BRIDGE_RIGHT_COL: 17,

    TOWERS: [
        { id: 'player_king', type: 'king', owner: 'player', towerRow: 31, towerCol: 11.5, pixelScale: 0.8, texture: 'tower_king_blue', gridRow: 32, gridCol: 11.5, gridWidth: 4, gridHeight: 4 },
        { id: 'player_princess_left', type: 'princess', owner: 'player', towerRow: 28, towerCol: 6, pixelScale: 0.7, texture: 'tower_archer_blue', gridRow: 28, gridCol: 6, gridWidth: 3, gridHeight: 3 },
        { id: 'player_princess_right', type: 'princess', owner: 'player', towerRow: 28, towerCol: 17, pixelScale: 0.7, texture: 'tower_archer_blue', gridRow: 28, gridCol: 17, gridWidth: 3, gridHeight: 3 },

        { id: 'opponent_king', type: 'king', owner: 'opponent', towerRow: 5, towerCol: 11.5, pixelScale: 0.8, texture: 'tower_king_red', gridRow: 6, gridCol: 11.5, gridWidth: 4, gridHeight: 4 },
        { id: 'opponent_princess_left', type: 'princess', owner: 'opponent', towerRow: 9, towerCol: 6, pixelScale: 0.7, texture: 'tower_archer_red', gridRow: 9, gridCol: 6, gridWidth: 3, gridHeight: 3 },
        { id: 'opponent_princess_right', type: 'princess', owner: 'opponent', towerRow: 9, towerCol: 17, pixelScale: 0.7, texture: 'tower_archer_red', gridRow: 9, gridCol: 17, gridWidth: 3, gridHeight: 3 }
    ] as const,

    CUSTOM_TILES: customTiles as { col: number, row: number, color: number }[],
    CUSTOM_FENCES: customFences as { col: number, row: number, vertical?: boolean, texture?: string }[],

    PROPS: [
        { col: 1, row: 29, texture: 'trees3', rotate: 0 },
        { col: 22.5, row: 12, texture: 'tree4', rotate: 0 },
        { col: 22.5, row: 1.5, texture: 'trees5', rotate: 0 },
        { col: 22.5, row: 7, texture: 'tree4', rotate: 0 },
        { col: 22.5, row: 22, texture: 'tree4', rotate: 0 },
        { col: 22.5, row: 27, texture: 'tree4', rotate: 0 },
        { col: 5, row: 3.5, texture: 'trees1', rotate: 2 },
        { col: 18, row: 33.5, texture: 'trees1' },
    ] as { col: number, row: number, texture: string, rotate?: number }[],

    getPixelCoords(col: number, row: number) {
        return {
            x: col * this.TILE_SIZE + this.TILE_SIZE / 2,
            y: row * this.TILE_SIZE + this.TILE_SIZE / 2
        };
    }
};
