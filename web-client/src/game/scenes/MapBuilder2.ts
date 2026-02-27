
import { Scene } from 'phaser';
import { Map2Config } from '../config/Map2Config';

export class MapBuilder2 {
    private scene: Scene;
    private startX: number;
    private startY: number;

    constructor(scene: Scene, x: number, y: number) {
        this.scene = scene;
        this.startX = x;
        this.startY = y;
    }

    public build() {
        this.createGroundLayer();
        this.createRiverAndBridges();
        this.createDecorations();
        this.createProps();
    }

    private createGroundLayer() {
        // Render grid based on Config dimensions
        for (let row = 0; row < Map2Config.ROWS; row++) {
            for (let col = 0; col < Map2Config.COLS; col++) {
                const color = this.getTileColor(col, row);
                this.drawTile(col, row, color);
            }
        }
    }

    private getTileColor(col: number, row: number): number {
        // 0. Custom Override
        const custom = Map2Config.CUSTOM_TILES.find(t => t.col === col && t.row === row);
        if (custom) return custom.color;

        // River
        const riverStart = Map2Config.RIVER_ROW_START;
        const riverEnd = Map2Config.RIVER_ROW_END;
        if (row >= riverStart && row <= riverEnd) {
            return Map2Config.Colors.WATER;
        }

        // 1. Sand Patches (Towers)
        if (this.isSandPatch(col, row)) {
            return Map2Config.Colors.SAND;
        }

        // 2. Playable Area Check (Optional: Could add slight tint if needed, but per request, just grass)
        // const isPlayable = this.isPlayable(col, row);
        // if (!isPlayable) {
        //     return Map2Config.Colors.BORDER;
        // }

        // 3. Grass Pattern (Everywhere else)
        // Simple checkerboard
        return (col + row) % 2 === 0 ? Map2Config.Colors.GRASS : Map2Config.Colors.GRASS_ALT;
    }



    private isSandPatch(col: number, row: number): boolean {
        // Dynamic check against Tower definitions
        return Map2Config.TOWERS.some(tower => {
            // Sand Grid Coords
            const gridW = tower.gridWidth;
            const gridH = tower.gridHeight;
            const centerCol = tower.gridCol;
            const centerRow = tower.gridRow;

            // Calculate Top-Left based on GRID size
            const topLeftCol = centerCol - (gridW / 2);
            const topLeftRow = centerRow - (gridH / 2);

            // Check bounds
            return col >= topLeftCol && col < topLeftCol + gridW &&
                row >= topLeftRow && row < topLeftRow + gridH;
        });
    }

    private drawTile(col: number, row: number, color: number) {
        const x = this.startX + col * Map2Config.TILE_SIZE + Map2Config.TILE_SIZE / 2;
        const y = this.startY + row * Map2Config.TILE_SIZE + Map2Config.TILE_SIZE / 2;

        const isWater = color === Map2Config.Colors.WATER;
        const width = Map2Config.TILE_SIZE + (isWater ? 1 : 0);
        const height = Map2Config.TILE_SIZE + (isWater ? 1 : 0);

        const tile = this.scene.add.rectangle(
            x, y,
            width,
            height,
            color
        );

        // Adds the glowing synthwave grid line, except for the river
        if (color !== Map2Config.Colors.WATER) {
            tile.setStrokeStyle(1, 0x00add2, 0.4);
        }
    }

    private createRiverAndBridges() {
        // Bridges at specific columns over the river
        // Center of bridge should be between row 21 and 22.
        // Wait, start of Row 21 is Y_START + 21*SIZE. Center of Row 21 is +SIZE/2.
        // River spans 21 and 22.
        // Center of River is Y_START + 21*SIZE + SIZE (End of 21)

        // Bridges
        // Iterate bridges
        [Map2Config.BRIDGE_LEFT_COL, Map2Config.BRIDGE_RIGHT_COL].forEach(col => {
            const bridgeX = this.startX + col * Map2Config.TILE_SIZE + Map2Config.TILE_SIZE / 2;
            // const riverY = this.startY + (Map2Config.RIVER_ROW_START * Map2Config.TILE_SIZE) + (Map2Config.TILE_SIZE); // Center of river height-wise?
            // Actually River spans RIVER_ROW_START to RIVER_ROW_END.
            // Center Y equals ((START + END + 1) / 2) * SIZE.
            const centerY = this.startY + ((Map2Config.RIVER_ROW_START + Map2Config.RIVER_ROW_END + 1) / 2) * Map2Config.TILE_SIZE;

            // Bridge sprite
            if (this.scene.textures.exists('bridge')) {
                const bridge = this.scene.add.image(bridgeX, centerY, 'bridge');
                // Scale if needed
                // bridge.setDisplaySize(Map2Config.TILE_SIZE, Map2Config.TILE_SIZE * 3);
                bridge.setRotation(Math.PI / 2); // If vertical? No, bridge usually vertical.
            }
        });
    }

    private createDecorations() {
        // Playable Area Fences
        // const rStart = Map2Config.MARGIN_Y;
        // const rEnd = Map2Config.ROWS - Map2Config.MARGIN_Y - 1;
        // const cStart = Map2Config.MARGIN_X;
        // const cEnd = Map2Config.COLS - Map2Config.MARGIN_X - 1;

        // Draw vertical fences
        // for (let row = rStart; row <= rEnd; row++) {
        //     // Left fence (Col 2 boundary)
        //     this.drawFence(cStart - 1, row, true);
        //     // Right fence (Col 21 boundary)
        //     this.drawFence(cEnd + 1, row, true);
        // }

        // Draw horizontal fences
        // for (let col = cStart; col <= cEnd; col++) {
        //     // Top fence (Row 6 boundary)
        //     this.drawFence(col, rStart - 1, false);
        //     // Bottom fence (Row 37 boundary)
        //     this.drawFence(col, rEnd + 1, false);
        // }

        // Custom Fences
        if (Map2Config.CUSTOM_FENCES) {
            Map2Config.CUSTOM_FENCES.forEach(fence => {
                this.drawFence(fence.col, fence.row, false, fence.rotate || 0, fence.texture, fence.scale, fence.scaleX, fence.scaleY);
            });
        }
    }

    private drawFence(col: number, row: number, vertical: boolean, rotate: number = 0, customTexture?: string, scale: number = 1, scaleX?: number, scaleY?: number) {
        const x = this.startX + col * Map2Config.TILE_SIZE + Map2Config.TILE_SIZE / 2;
        const y = this.startY + row * Map2Config.TILE_SIZE + Map2Config.TILE_SIZE / 2;

        // Use wall assets instead of primitive rectangle
        // Default to 'wall1' unless custom texture provided
        const texture = customTexture || 'wall1';

        // Final scales (default to uniform scale if specific axis not provided)
        const finalScaleX = scaleX !== undefined ? scaleX : scale;
        const finalScaleY = scaleY !== undefined ? scaleY : scale;

        if (this.scene.textures.exists(texture)) {
            const wall = this.scene.add.image(x, y, texture);
            wall.setDisplaySize(Map2Config.TILE_SIZE * finalScaleX, Map2Config.TILE_SIZE * finalScaleY);

            // Apply rotation (0=0, 1=90, 2=180, 3=270)
            if (rotate) {
                wall.setAngle(rotate * 90);
            } else if (vertical) {
                // Default vertical to 90 if no specific rotate provided
                wall.setAngle(90);
            }

            wall.setDepth(1); // Above ground
        } else {
            // Fallback if assets missing
            const w = (vertical || rotate === 1) ? 6 : Map2Config.TILE_SIZE;
            const h = (vertical || rotate === 1) ? Map2Config.TILE_SIZE : 6;
            this.scene.add.rectangle(x, y, w, h, Map2Config.Colors.FENCE).setDepth(1);
        }
    }

    private createProps() {
        if (!Map2Config.PROPS) return;

        Map2Config.PROPS.forEach(prop => {
            const { x, y } = Map2Config.getPixelCoords(prop.col, prop.row);

            // Check if texture exists
            if (this.scene.textures.exists(prop.texture)) {
                const sprite = this.scene.add.image(x, y, prop.texture);

                // Scale prop if specified, otherwise default to 1
                if (prop.scale !== undefined) {
                    sprite.setScale(prop.scale);
                }

                // Depth: Props should be above ground but below flying units?
                // Standard depth is 0. Let's make them slightly higher than ground (which is effectively 0)
                sprite.setDepth(1);

                // Apply rotation (0=0, 1=90, 2=180, 3=270)
                if (prop.rotate) {
                    sprite.setAngle(prop.rotate * 90);
                }
            } else {
                // Fallback placeholder
                this.scene.add.circle(x, y, 10, 0x00FF00).setDepth(1);
            }
        });
    }
}
