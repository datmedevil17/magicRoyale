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



export const Map2Config = {
    // Dimensions
    TILE_SIZE: 22,
    ROWS: 38, // Total rows (Reduced to zoom in)
    COLS: 24, // Total cols

    // Tower Stats
    KING_TOWER_HP: 4200,
    PRINCESS_TOWER_HP: 3200,

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

    // Crown Images for HUD
    CROWN_IMAGES: {
        PLAYER_KING: '/solanamap/tower_king_blue.png',
        PLAYER_QUEEN_Left: '/solanamap/tower_archer_blue2.png',
        PLAYER_QUEEN_Right: '/solanamap/tower_archer_blue.png',
        OPPONENT_KING: '/solanamap/tower_king_red.png',
        OPPONENT_QUEEN_Left: '/solanamap/tower_archer_red2.png',
        OPPONENT_QUEEN_Right: '/solanamap/tower_archer_red.png',
    },

    // Colors
    Colors: {
        GRASS: 0x050505,      // Very dark navy, almost black
        GRASS_ALT: 0x1d0a24,  // Slightly lighter for subtle grid
        WATER: 0x9945FF,      // Bright neon cyan river
        SAND: 0x055441,       // Dark blue for the sand patches
        BORDER: 0x000000,     // Black
        FENCE: 0xcc00ff,      // Neon purple
        LASER_CYAN: 0x00ffff, // Bright cyan for circuit lines
        LASER_PURPLE: 0xcc00ff, // Bright purple for circuit lines
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
            id: 'player_king',
            type: 'king',
            owner: 'player',
            // Visual Tower
            towerRow: 31,
            towerCol: 11.5,
            pixelScale: 0.2,
            texture: 'tower_king_blue',
            // Sand Grid
            gridRow: 32,
            gridCol: 11.5,
            gridWidth: 4,
            gridHeight: 4
        },
        {
            id: 'player_princess_left',
            type: 'princess',
            owner: 'player',
            towerRow: 27.5,
            towerCol: 6,
            pixelScale: 0.15,
            texture: 'tower_archer_blue_left',
            gridRow: 28,
            gridCol: 6,
            gridWidth: 3,
            gridHeight: 3
        },
        {
            id: 'player_princess_right',
            type: 'princess',
            owner: 'player',
            towerRow: 27.5,
            towerCol: 17,
            pixelScale: 0.06,
            texture: 'tower_archer_blue_right',
            gridRow: 28,
            gridCol: 17,
            gridWidth: 3,
            gridHeight: 3
        },

        // OPPONENT (Top)
        {
            id: 'opponent_king',
            type: 'king',
            owner: 'opponent',
            towerRow: 4.7,
            towerCol: 11.5,
            pixelScale: 0.08,
            texture: 'tower_king_red',
            gridRow: 6,
            gridCol: 11.5,
            gridWidth: 4,
            gridHeight: 4
        },
        {
            id: 'opponent_princess_left',
            type: 'princess',
            owner: 'opponent',
            towerRow: 8.5,
            towerCol: 6,
            pixelScale: 0.06,
            texture: 'tower_archer_red_left',
            gridRow: 9,
            gridCol: 6,
            gridWidth: 3,
            gridHeight: 3
        },
        {
            id: 'opponent_princess_right',
            type: 'princess',
            owner: 'opponent',
            towerRow: 8.5,
            towerCol: 17,
            pixelScale: 0.06,
            texture: 'tower_archer_red_right',
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
        ], 0x05a680),
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
            // { col: 7, row: 31 },
            // { col: 8, row: 31 },
            // { col: 9, row: 31 },
            // { col: 14, row: 31 },
            // { col: 15, row: 31 },
            // { col: 16, row: 31 },
            // { col: 17, row: 31 },
            // { col: 17, row: 30 },
            // { col: 17, row: 26 },
            // { col: 17, row: 25 },
            // { col: 17, row: 24 },
            // { col: 17, row: 23 },
            // { col: 17, row: 22 },
            // { col: 17, row: 21 },
            // { col: 17, row: 20 },
        ], 0x05a680),
        // ...colorRect(10, 20, 12, 22, 0xFF0000), // Example: Red Rectangle
        // ...colorTiles([{col: 5, row: 5}, {col: 6, row: 6}], 0x00FF00), // Example: Specific Green Points
    ] as { col: number, row: number, color: number }[],

    // Custom Fences (Wall segments at specific locations)
    CUSTOM_FENCES: [







        { col: 2, row: 5, rotate: 3, texture: 'solana_wall1', scaleX: 5, scaleY: 4 },
        { col: 2, row: 10, rotate: 3, texture: 'solana_wall1', scaleX: 5, scaleY: 4 },
        { col: 2, row: 15, rotate: 3, texture: 'solana_wall1', scaleX: 5, scaleY: 4 },
        { col: 2, row: 22, rotate: 3, texture: 'solana_wall1', scaleX: 5, scaleY: 4 },
        { col: 2, row: 27, rotate: 3, texture: 'solana_wall1', scaleX: 5, scaleY: 4 },
        { col: 2, row: 32, rotate: 3, texture: 'solana_wall1', scaleX: 5, scaleY: 4 },
        // { col: 2, row: 34, rotate: 3, texture: 'solana_wall1', scaleX: 2, scaleY: 1 },

        { col: 5, row: 34.5, rotate: 0, texture: 'solana_wall1', scaleX: 5, scaleY: 4 },
        { col: 10, row: 34.5, rotate: 0, texture: 'solana_wall1', scaleX: 5, scaleY: 4 },
        { col: 15, row: 34.5, rotate: 0, texture: 'solana_wall1', scaleX: 5, scaleY: 4 },
        { col: 21, row: 32, rotate: 1, texture: 'solana_wall1', scaleX: 5, scaleY: 4 },


        { col: 21, row: 27, rotate: 1, texture: 'solana_wall1', scaleX: 5, scaleY: 4 },
        { col: 21, row: 22, rotate: 1, texture: 'solana_wall1', scaleX: 5, scaleY: 4 },
        { col: 21, row: 15, rotate: 1, texture: 'solana_wall1', scaleX: 5, scaleY: 4 },
        { col: 21, row: 10, rotate: 1, texture: 'solana_wall1', scaleX: 5, scaleY: 4 },
        { col: 21, row: 5, rotate: 1, texture: 'solana_wall1', scaleX: 5, scaleY: 4 },

        { col: 18, row: 1.5, rotate: 0, texture: 'solana_wall1', scaleX: 5, scaleY: 4 },
        { col: 13, row: 1.5, rotate: 0, texture: 'solana_wall1', scaleX: 5, scaleY: 4 },
        { col: 8, row: 1.5, rotate: 0, texture: 'solana_wall1', scaleX: 5, scaleY: 4 },














        // Example: { col: 5, row: 5, rotate: 1 } (1 = 90 deg, 0 = 0 deg)
    ] as { col: number, row: number, rotate?: number, texture?: string, scale?: number, scaleX?: number, scaleY?: number }[],


    // Props (Trees, Stones, etc.) outside the playable area
    PROPS: [

        // // { col: 0, row: 20, texture: 'tree3' }, // Near river
        { col: 3.5, row: 1.5, texture: 'solana_stone1', scale: 0.08, rotate: 0 },
        { col: 19, row: 34, texture: 'solana_stone1', scale: 0.08, rotate: 0 },
        { col: 18.2, row: 16.2, texture: 'solana_stone3', scale: 0.12 },
        { col: 18.2, row: 20.2, texture: 'solana_stone3', scale: 0.12 },
        { col: 4.7, row: 16.2, texture: 'solana_stone3', scale: 0.12 },
        { col: 4.7, row: 20.2, texture: 'solana_stone3', scale: 0.12 },
        { col: 11.5, row: 25, texture: 'logo', scale: 0.2, rotate: 0 },
        { col: 11.5, row: 12, texture: 'logo', scale: 0.2, rotate: 2 },
        // { col: 11.5, row: 5, texture: 'logo', scale: 0.2, rotate: 0 },
        // { col: 10, row: 20, texture: 'logo', scale: 5 },



        // { col: 1, row: 36.2, texture: 'solana_stone1',scale:0.07,rotate:3 },
        // { col: 3.5, row: 36, texture: 'solana_stone2',scale:0.065 },
        // { col: 6, row: 36, texture: 'solana_stone2',scale:0.065 },
        // { col: 8.5, row: 36, texture: 'solana_stone2',scale:0.065 },
        // { col: 11, row: 36, texture: 'solana_stone2',scale:0.065 },
        // { col: 13.5, row: 36 , texture: 'solana_stone2',scale:0.065 },
        // { col: 16, row: 36, texture: 'solana_stone2',scale:0.065 },
        // { col: 18.5, row: 36, texture: 'solana_stone2',scale:0.065 },
        // { col: 21.2, row: 36.2 , texture: 'solana_stone1',scale:0.07,rotate:1 },



        // { col: 5, row: 20, texture: 'stone3' },
        // { col: 18, row: 16, texture: 'stone3' },
        // { col: 18, row: 20, texture: 'stone3' },
        // { col: 0.5, row: 10, texture: 'tree2', rotate: 0 },
        // { col: 0.5, row: 15, texture: 'tree2', rotate: 0 },


        // { col: 1, row: 29, texture: 'trees3', rotate: 0 },

        // { col: 22.5, row: 12, texture: 'tree4', rotate: 0 },
        // { col: 22.5, row: 1.5, texture: 'trees5', rotate: 0 },
        // { col: 22.5, row: 7, texture: 'tree4', rotate: 0 },
        // { col: 22.5, row: 22, texture: 'tree4', rotate: 0 },
        // { col: 22.5, row: 27, texture: 'tree4', rotate: 0 },



        // {
        //     col: 5,
        //     row: 3.5,
        //     texture: 'trees1',
        //     rotate: 2
        // },
        // {
        //     col: 18,
        //     row: 33.5,
        //     texture: 'trees1'
        // },





    ] as { col: number, row: number, texture: string, rotate?: number, scale?: number }[],

    getPixelCoords(col: number, row: number) {
        return {
            x: col * this.TILE_SIZE + this.TILE_SIZE / 2,
            y: row * this.TILE_SIZE + this.TILE_SIZE / 2
        };
    }
};
