// Helper to color multiple specific tiles
export function colorTiles(points: { col: number, row: number }[], color: number) {
    return points.map(p => ({ col: p.col, row: p.row, color }));
}

// Helper to color a rectangular area
export function colorRect(c1: number, r1: number, c2: number, r2: number, color: number) {
    const tiles = [];
    for (let c = c1; c <= c2; c++) {
        for (let r = r1; r <= r2; r++) {
            tiles.push({ col: c, row: r, color });
        }
    }
    return tiles;
}

export const ArenaConfig2v2 = {
    // Dimensions
    TILE_SIZE: 22,
    ROWS: 38, // Total rows (Reduced to zoom in)
    COLS: 24, // Total cols

    // Playable Area (centered)
    PLAYABLE_ROWS: 30,
    PLAYABLE_COLS: 18,

    // Calculated Margins
    get MARGIN_X() {
        return (this.COLS - this.PLAYABLE_COLS) / 2; // (24-18)/2 = 3
    },
    get MARGIN_Y() {
        return (this.ROWS - this.PLAYABLE_ROWS) / 2; // (44-30)/2 = 7
    },

    // River (Middle 2 rows)
    // Rows 0-37. Middle is 18.5. So rows 18 and 19.
    RIVER_ROW_START: 18,
    RIVER_ROW_END: 19,

    // Colors
    Colors: {
        GRASS: 0x8cbc2b,
        GRASS_ALT: 0x9dc330,
        WATER: 0x00add2,
        SAND: 0xd2b48c, // Tan/Sand color
        BORDER: 0x555555, // Dark gray for non-playable area
        FENCE: 0x654321, // Brown for fence posts (if drawn as rects for now)
    },

    // Tower Layout (Relative to Playable Area bounds)
    // "both side princess towee sand grid should be 3 block away from left and 7 from river"
    // "king tower grid should be 10 block away from river and 2 block away from princess tower grid"

    // Helper to get actual grid coordinates
    resolveGrid(playableX: number, playableY: number, perspective: 'player' | 'opponent' = 'player') {
        const absoluteX = this.MARGIN_X + playableX;
        let absoluteY = 0;

        // Player is at bottom, Opponent at top
        if (perspective === 'player') {
            // Player y starts from bottom margin up
            // River is at row 21-22. 
            // Playable area starts at row 7 (MARGIN_Y) and ends at row 37 (44-7=37).
            // But usually we think "distance from river".
            // Let's define distance from River Center or River Edge? 
            // "7 from river" -> presumably 7 tiles *away* from the river bank.
            const riverBottom = this.RIVER_ROW_END + 1; // Row 23
            absoluteY = riverBottom + playableY;
        } else {
            // Opponent
            const riverTop = this.RIVER_ROW_START - 1; // Row 20
            absoluteY = riverTop - playableY;
        }

        return { x: absoluteX, y: absoluteY, col: absoluteX, row: absoluteY };
    },

    // Bridge Positions (Relative to Playable Area center or specific cols)
    BRIDGE_LEFT_COL: 6,
    BRIDGE_RIGHT_COL: 17,

    // TOWER DEFINITIONS
    TOWERS: [
        // PLAYER (Bottom)
        {
            id: 'player_king_1',
            type: 'king',
            owner: 'player',
            // Visual Tower (Shifted Left)
            towerRow: 31,
            towerCol: 9.5, // Shifted from 11.5
            pixelScale: 0.8,
            texture: 'tower_king_blue',
            // Sand Grid
            gridRow: 32,
            gridCol: 9.5,
            gridWidth: 4,
            gridHeight: 4
        },
        {
            id: 'player_king_2',
            type: 'king',
            owner: 'player',
            // Visual Tower (Shifted Right)
            towerRow: 31,
            towerCol: 13.5, // Shifted from 11.5
            pixelScale: 0.8,
            texture: 'tower_king_blue',
            // Sand Grid
            gridRow: 32,
            gridCol: 13.5,
            gridWidth: 4,
            gridHeight: 4
        },
        {
            id: 'player_princess_left',
            type: 'princess',
            owner: 'player',
            towerRow: 28,
            towerCol: 6,
            pixelScale: 0.7,
            texture: 'tower_archer_blue',
            gridRow: 28,
            gridCol: 6,
            gridWidth: 3,
            gridHeight: 3
        },
        {
            id: 'player_princess_right',
            type: 'princess',
            owner: 'player',
            towerRow: 28,
            towerCol: 17,
            pixelScale: 0.7,
            texture: 'tower_archer_blue',
            gridRow: 28,
            gridCol: 17,
            gridWidth: 3,
            gridHeight: 3
        },

        // OPPONENT (Top)
        {
            id: 'opponent_king_1',
            type: 'king',
            owner: 'opponent',
            towerRow: 5,
            towerCol: 9.5,
            pixelScale: 0.8,
            texture: 'tower_king_red',
            gridRow: 6,
            gridCol: 9.5,
            gridWidth: 4,
            gridHeight: 4
        },
        {
            id: 'opponent_king_2',
            type: 'king',
            owner: 'opponent',
            towerRow: 5,
            towerCol: 13.5,
            pixelScale: 0.8,
            texture: 'tower_king_red',
            gridRow: 6,
            gridCol: 13.5,
            gridWidth: 4,
            gridHeight: 4
        },
        {
            id: 'opponent_princess_left',
            type: 'princess',
            owner: 'opponent',
            towerRow: 9,
            towerCol: 6,
            pixelScale: 0.7,
            texture: 'tower_archer_red',
            gridRow: 9,
            gridCol: 6,
            gridWidth: 3,
            gridHeight: 3
        },
        {
            id: 'opponent_princess_right',
            type: 'princess',
            owner: 'opponent',
            towerRow: 9,
            towerCol: 17,
            pixelScale: 0.7,
            texture: 'tower_archer_red',
            gridRow: 9,
            gridCol: 17,
            gridWidth: 3,
            gridHeight: 3
        }
    ] as const,

    // Custom Tile Coloring
    // Add specific tiles here to override their color
    // Use helper functions with spread operator (...)
    CUSTOM_TILES: [
        // ...colorTiles([{ col: 5, row: 16 }], 0xFF0000),
        ...colorTiles([
            { col: 6, row: 20 },
            { col: 6, row: 21 },
            { col: 6, row: 22 },
            { col: 6, row: 23 },
            { col: 6, row: 24 },
            { col: 6, row: 25 },
            { col: 6, row: 26 },
            { col: 6, row: 30 },
            { col: 6, row: 31 },
            { col: 7, row: 31 },
            { col: 8, row: 31 },
            { col: 9, row: 31 },
            { col: 14, row: 31 },
            { col: 15, row: 31 },
            { col: 16, row: 31 },
            { col: 17, row: 31 },
            { col: 17, row: 30 },
            { col: 17, row: 26 },
            { col: 17, row: 25 },
            { col: 17, row: 24 },
            { col: 17, row: 23 },
            { col: 17, row: 22 },
            { col: 17, row: 21 },
            { col: 17, row: 20 },

        ], 0xd2b48c),
        ...colorTiles([
            { col: 6, row: 17 },
            { col: 6, row: 16 },
            { col: 6, row: 15 },
            { col: 6, row: 14 },
            { col: 6, row: 13 },
            { col: 6, row: 12 },
            { col: 6, row: 11 },
            { col: 6, row: 7 },
            { col: 6, row: 6 },
            { col: 7, row: 6 },
            { col: 8, row: 6 },
            { col: 9, row: 6 },
            { col: 14, row: 6 },
            { col: 15, row: 6 },
            { col: 16, row: 6 },
            { col: 17, row: 6 },
            { col: 17, row: 7 },
            { col: 17, row: 11 },
            { col: 17, row: 12 },
            { col: 17, row: 13 },
            { col: 17, row: 14 },
            { col: 17, row: 15 },
            { col: 17, row: 16 },
            { col: 17, row: 17 },
        ], 0xd2b48c),
    ] as { col: number, row: number, color: number }[],

    // Custom Fences (Wall segments at specific locations)
    CUSTOM_FENCES: [
        { col: 2, row: 10, rotate: 3, texture: 'wall3', scaleX: 5, scaleY: 1 },
        { col: 2, row: 15, rotate: 3, texture: 'wall3', scaleX: 5, scaleY: 1 },
        { col: 2, row: 22, rotate: 3, texture: 'wall3', scaleX: 5, scaleY: 1 },
        { col: 2, row: 27, rotate: 3, texture: 'wall3', scaleX: 5, scaleY: 1 },
        { col: 2, row: 32, rotate: 3, texture: 'wall3', scaleX: 5, scaleY: 1 },
        // { col: 2, row: 34, rotate: 3, texture: 'wall3', scaleX: 2, scaleY: 1 },
        { col: 5, row: 34.5, rotate: 0, texture: 'wall3', scaleX: 5, scaleY: 1 },
        { col: 10, row: 34.5, rotate: 0, texture: 'wall3', scaleX: 5, scaleY: 1 },
        { col: 21, row: 27, rotate: 1, texture: 'wall3', scaleX: 5, scaleY: 1 },
        { col: 21, row: 22, rotate: 1, texture: 'wall3', scaleX: 5, scaleY: 1 },
        { col: 21, row: 15, rotate: 1, texture: 'wall3', scaleX: 5, scaleY: 1 },
        { col: 21, row: 10, rotate: 1, texture: 'wall3', scaleX: 5, scaleY: 1 },
        { col: 21, row: 5, rotate: 1, texture: 'wall3', scaleX: 5, scaleY: 1 },
        { col: 18, row: 2.5, rotate: 2, texture: 'wall3', scaleX: 5, scaleY: 1 },
        { col: 13, row: 2.5, rotate: 2, texture: 'wall3', scaleX: 5, scaleY: 1 },
    ] as { col: number, row: number, rotate?: number, texture?: string, scale?: number, scaleX?: number, scaleY?: number }[],

    // Props (Trees, Stones, etc.) outside the playable area
    PROPS: [
        { col: 5, row: 16, texture: 'stone3' },
        { col: 5, row: 20, texture: 'stone3' },
        { col: 18, row: 16, texture: 'stone3' },
        { col: 18, row: 20, texture: 'stone3' },
        { col: 0.5, row: 10, texture: 'tree2', rotate: 0 },
        { col: 0.5, row: 15, texture: 'tree2', rotate: 0 },
        { col: 1, row: 29, texture: 'trees3', rotate: 0 },
        { col: 22.5, row: 12, texture: 'tree4', rotate: 0 },
        { col: 22.5, row: 1.5, texture: 'trees5', rotate: 0 },
        { col: 22.5, row: 7, texture: 'tree4', rotate: 0 },
        { col: 22.5, row: 22, texture: 'tree4', rotate: 0 },
        { col: 22.5, row: 27, texture: 'tree4', rotate: 0 },
        {
            col: 5,
            row: 3.5,
            texture: 'trees1',
            rotate: 2
        },
        {
            col: 18,
            row: 33.5,
            texture: 'trees1'
        },
    ] as { col: number, row: number, texture: string, rotate?: number }[],

    getPixelCoords(col: number, row: number) {
        return {
            x: col * this.TILE_SIZE + this.TILE_SIZE / 2,
            y: row * this.TILE_SIZE + this.TILE_SIZE / 2
        };
    }
};
