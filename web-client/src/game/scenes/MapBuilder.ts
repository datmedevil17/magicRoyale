
import { Scene } from 'phaser';

import MapData from './MapData.json';

export class MapBuilder {
    private scene: Scene;
    private readonly COLS = 24;
    private readonly ROWS = 45;
    private readonly TILE_SIZE: number;

    // Offset to center the map if needed, or we can just return a Container
    private startX: number;
    private startY: number;

    constructor(scene: Scene, x: number, y: number, tileSize: number) {
        this.scene = scene;
        this.startX = x;
        this.startY = y;
        this.TILE_SIZE = tileSize;
    }

    public build() {
        this.createGroundLayer();
        this.createRiverAndBridges();
        this.createDecorations();
        this.createProps();
    }

    private createGroundLayer() {
        const grid = MapData.grid;

        for (let row = 0; row < this.ROWS; row++) {
            if (row < grid.length) {
                for (let col = 0; col < this.COLS; col++) {
                    if (col < grid[row].length) {
                        const hexColor = grid[row][col];
                        const color = parseInt(hexColor.replace('#', '0x'));
                        this.drawTile(col, row, color);
                    }
                }
            }
        }
    }

    private drawTile(col: number, row: number, color: number) {
        const x = this.startX + col * ArenaConfig.TILE_SIZE + ArenaConfig.TILE_SIZE / 2;
        const y = this.startY + row * ArenaConfig.TILE_SIZE + ArenaConfig.TILE_SIZE / 2;

        this.scene.add.rectangle(
            x, y,
            ArenaConfig.TILE_SIZE,
            ArenaConfig.TILE_SIZE,
            color
        ).setStrokeStyle(0);
    }

    private createRiverAndBridges() {
        // River and Bridges are now drawn by createGroundLayer via MapData colors
        // We can add specific textures ON TOP if needed, but for now the colors match the FXML.
        // The FXML uses colored rects for everything.
        // If we want detailed sprites, we can overlay them based on row/col.

        // Example: Add bridge sprites if we want texture instead of just flat color
        // Row 18 & 20 have bridge segments? No, Row 18 and 20 (index) in FXML had bridge colors.
        // Let's stick to the FXML colored rectangles for exact fidelity to Java client "look" if that's what's wanted,
        // OR add sprites. User said "assets placed look very bad". 
        // PROBABLY refers to the fact I was using "bridge.png" which didn't match the background.
        // Let's rely on the MapData colors first.
    }

    private createObstacles() {
        // Define obstacles for the BOTTOM half (Rows 22 to 44)
        // We will automatically mirror them to the TOP half (Rows 22 to 0)

        const obstacles: { col: number, row: number, key: string, scale?: number }[] = [
            // Walls (Level 1)
            { col: 6, row: 38, key: 'wall1' },
            { col: 17, row: 38, key: 'wall2' },

            // Stones
            { col: 3, row: 38, key: 'stone1' },
            { col: 2, row: 23, key: 'stone3' }, // Near river
            { col: 23, row: 23, key: 'stone4' }, // Near river
            { col: 21, row: 23, key: 'stone3' },

            // Trees
            { col: 0, row: 36, key: 'tree1' },
            { col: 0, row: 28, key: 'tree2' },
            { col: 0, row: 32, key: 'tree2' },
            { col: 0, row: 23, key: 'tree3' }, // Near river

            // Right Side Trees
            { col: 23, row: 36, key: 'tree1' },
            { col: 23, row: 28, key: 'tree2' },
            { col: 23, row: 32, key: 'tree2' },

            // Deep corners
            { col: 0, row: 44, key: 'trees2' },
            { col: 23, row: 44, key: 'trees1' },

            // Near King
            { col: 11, row: 37, key: 'level_place' },
        ];

        // Draw and Mirror
        obstacles.forEach(obs => {
            // Draw Original (Bottom)
            this.addImage(obs.col, obs.row, obs.key, obs.scale || 0.5);

            // Calculate Mirror (Top)
            // Mirror Row: (ROWS - 1) - obs.row
            // Mirror Col: (COLS - 1) - obs.col IF we want point reflection (rotate 180)
            // OR just Mirror Row if we want vertical reflection (flip X-axis)

            // Clash Royale map is point reflection (180 degree rotation).
            // Left becomes Right. Top becomes Bottom.
            // So if I have a wall on Left-Bottom, Opponent sees it on Right-Top.
            // BUT wait. 
            // My "Left" is Col 0. My "Bottom" is Row 44.
            // Opponent's "Left" is Col 23 (from my perspective). Opponent "Bottom" is Row 0.

            // If the map is symmetrical by point reflection:
            // Obstacle at (6, 38) [Left-Bottom]
            // Mirror at (23-6=17, 44-38=6) [Right-Top]

            // Let's check the original code:
            // Wall1: (6, 38). Wall3: (6, 3).
            // Cols are SAME (6 and 6). This is vertical reflection (Flip Y).
            // This means the map is distinct Left vs Right sides.
            // Left Lane has specific decor, Right Lane has different decor.
            // And Top/Bottom are mirrors.

            // So we mirror ROW, but Keep COL.
            const mirrorRow = (this.ROWS - 1) - obs.row;
            // Use same key? Or alternate key if available?
            // Original used 'wall1' bottom, 'wall3' top.
            // Let's stick to same keys for perfect symmetry or try to map if simple.
            // For now, same key ensures visual parity.
            this.addImage(obs.col, mirrorRow, obs.key, obs.scale || 0.5);
        });

        // Add River Specifics (Row 22) or Center items manually if needed
        // this.addImage(6, 22, 'stone2', 0.5);
    }

    private addImage(col: number, row: number, key: string, scale: number = 0.5) {
        // Phaser images are centered by default
        const x = this.startX + col * this.TILE_SIZE + this.TILE_SIZE / 2;
        const y = this.startY + row * this.TILE_SIZE + this.TILE_SIZE / 2;
        const img = this.scene.add.image(x, y, key);

        // Scale needs to adjust based on Tile Size vs Image Size ideally, 
        // but for now we keep the relative scale passed in, maybe slightly adjusted for new tile size
        // If the tiles are larger/smaller, we might want to scale images proportionally.
        // Assuming original scale was tuned for TILE_SIZE=22.
        const scaleFactor = this.TILE_SIZE / 22;
        img.setScale(scale * scaleFactor);

        return img;
    }
}
