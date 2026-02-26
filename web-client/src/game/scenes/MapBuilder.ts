
import { Scene } from 'phaser';
import { ArenaConfig } from '../config/ArenaConfig';

export class MapBuilder {
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
        for (let row = 0; row < ArenaConfig.ROWS; row++) {
            for (let col = 0; col < ArenaConfig.COLS; col++) {
                const color = this.getTileColor(col, row);
                this.drawTile(col, row, color);
            }
        }
    }

    private getTileColor(col: number, row: number): number {
        // 0. Custom Override
        const custom = ArenaConfig.CUSTOM_TILES.find(t => t.col === col && t.row === row);
        if (custom) return custom.color;

        // River
        const riverStart = ArenaConfig.RIVER_ROW_START;
        const riverEnd = ArenaConfig.RIVER_ROW_END;
        if (row >= riverStart && row <= riverEnd) {
            return ArenaConfig.Colors.WATER;
        }

        // 1. Sand Patches (Towers)
        if (this.isSandPatch(col, row)) {
            return ArenaConfig.Colors.SAND;
        }

        // 2. Playable Area Check (Optional: Could add slight tint if needed, but per request, just grass)
        // const isPlayable = this.isPlayable(col, row);
        // if (!isPlayable) {
        //     return ArenaConfig.Colors.BORDER;
        // }

        // 3. Grass Pattern (Everywhere else)
        // Simple checkerboard
        return (col + row) % 2 === 0 ? ArenaConfig.Colors.GRASS : ArenaConfig.Colors.GRASS_ALT;
    }



    private isSandPatch(col: number, row: number): boolean {
        // Dynamic check against Tower definitions
        return ArenaConfig.TOWERS.some(tower => {
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
        // Bridges at specific columns over the river
        // Center of bridge should be between row 21 and 22.
        // Wait, start of Row 21 is Y_START + 21*SIZE. Center of Row 21 is +SIZE/2.
        // River spans 21 and 22.
        // Center of River is Y_START + 21*SIZE + SIZE (End of 21)

        // Bridges
        // Iterate bridges
        [ArenaConfig.BRIDGE_LEFT_COL, ArenaConfig.BRIDGE_RIGHT_COL].forEach(col => {
            const bridgeX = this.startX + col * ArenaConfig.TILE_SIZE + ArenaConfig.TILE_SIZE / 2;
            // const riverY = this.startY + (ArenaConfig.RIVER_ROW_START * ArenaConfig.TILE_SIZE) + (ArenaConfig.TILE_SIZE); // Center of river height-wise?
            // Actually River spans RIVER_ROW_START to RIVER_ROW_END.
            // Center Y equals ((START + END + 1) / 2) * SIZE.
            const centerY = this.startY + ((ArenaConfig.RIVER_ROW_START + ArenaConfig.RIVER_ROW_END + 1) / 2) * ArenaConfig.TILE_SIZE;

            // Bridge sprite
            if (this.scene.textures.exists('bridge')) {
                const bridge = this.scene.add.image(bridgeX, centerY, 'bridge');
                // Scale if needed
                // bridge.setDisplaySize(ArenaConfig.TILE_SIZE, ArenaConfig.TILE_SIZE * 3);
                bridge.setRotation(Math.PI / 2); // If vertical? No, bridge usually vertical.
            } else {
                // Fallback
                this.scene.add.rectangle(bridgeX, centerY, ArenaConfig.TILE_SIZE, ArenaConfig.TILE_SIZE * 2.2, 0x8B4513);
            }
        });
    }

    private createDecorations() {
        // Playable Area Fences
        // const rStart = ArenaConfig.MARGIN_Y;
        // const rEnd = ArenaConfig.ROWS - ArenaConfig.MARGIN_Y - 1;
        // const cStart = ArenaConfig.MARGIN_X;
        // const cEnd = ArenaConfig.COLS - ArenaConfig.MARGIN_X - 1;

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
        if (ArenaConfig.CUSTOM_FENCES) {
            ArenaConfig.CUSTOM_FENCES.forEach(fence => {
                this.drawFence(fence.col, fence.row, false, fence.rotate || 0, fence.texture, fence.scale, fence.scaleX, fence.scaleY);
            });
        }
    }

    private drawFence(col: number, row: number, vertical: boolean, rotate: number = 0, customTexture?: string, scale: number = 1, scaleX?: number, scaleY?: number) {
        const x = this.startX + col * ArenaConfig.TILE_SIZE + ArenaConfig.TILE_SIZE / 2;
        const y = this.startY + row * ArenaConfig.TILE_SIZE + ArenaConfig.TILE_SIZE / 2;

        // Use wall assets instead of primitive rectangle
        // Default to 'wall1' unless custom texture provided
        const texture = customTexture || 'wall1';

        // Final scales (default to uniform scale if specific axis not provided)
        const finalScaleX = scaleX !== undefined ? scaleX : scale;
        const finalScaleY = scaleY !== undefined ? scaleY : scale;

        if (this.scene.textures.exists(texture)) {
            const wall = this.scene.add.image(x, y, texture);
            wall.setDisplaySize(ArenaConfig.TILE_SIZE * finalScaleX, ArenaConfig.TILE_SIZE * finalScaleY);

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
            const w = (vertical || rotate === 1) ? 6 : ArenaConfig.TILE_SIZE;
            const h = (vertical || rotate === 1) ? ArenaConfig.TILE_SIZE : 6;
            this.scene.add.rectangle(x, y, w, h, ArenaConfig.Colors.FENCE).setDepth(1);
        }
    }

    private createProps() {
        if (!ArenaConfig.PROPS) return;

        ArenaConfig.PROPS.forEach(prop => {
            const { x, y } = ArenaConfig.getPixelCoords(prop.col, prop.row);

            // Check if texture exists
            if (this.scene.textures.exists(prop.texture)) {
                const sprite = this.scene.add.image(x, y, prop.texture);

                // Optional: Scale or randomize slightly
                // sprite.setScale(0.8 + Math.random() * 0.4);

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
