
import { Scene } from 'phaser';
import { ArenaConfig2v2 } from '../config/ArenaConfig2v2';

export class MapBuilder2v2 {
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
        for (let row = 0; row < ArenaConfig2v2.ROWS; row++) {
            for (let col = 0; col < ArenaConfig2v2.COLS; col++) {
                const color = this.getTileColor(col, row);
                this.drawTile(col, row, color);
            }
        }
    }

    private getTileColor(col: number, row: number): number {
        // 0. Custom Override
        const custom = ArenaConfig2v2.CUSTOM_TILES.find(t => t.col === col && t.row === row);
        if (custom) return custom.color;

        // River
        const riverStart = ArenaConfig2v2.RIVER_ROW_START;
        const riverEnd = ArenaConfig2v2.RIVER_ROW_END;
        if (row >= riverStart && row <= riverEnd) {
            return ArenaConfig2v2.Colors.WATER;
        }

        // 1. Sand Patches (Towers)
        if (this.isSandPatch(col, row)) {
            return ArenaConfig2v2.Colors.SAND;
        }

        // 3. Grass Pattern (Everywhere else)
        // Simple checkerboard
        return (col + row) % 2 === 0 ? ArenaConfig2v2.Colors.GRASS : ArenaConfig2v2.Colors.GRASS_ALT;
    }

    private isSandPatch(col: number, row: number): boolean {
        // Dynamic check against Tower definitions
        return ArenaConfig2v2.TOWERS.some(tower => {
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
        const x = this.startX + col * ArenaConfig2v2.TILE_SIZE + ArenaConfig2v2.TILE_SIZE / 2;
        const y = this.startY + row * ArenaConfig2v2.TILE_SIZE + ArenaConfig2v2.TILE_SIZE / 2;

        this.scene.add.rectangle(
            x, y,
            ArenaConfig2v2.TILE_SIZE,
            ArenaConfig2v2.TILE_SIZE,
            color
        ).setStrokeStyle(0);
    }

    private createRiverAndBridges() {
        // Bridges
        // Iterate bridges
        [ArenaConfig2v2.BRIDGE_LEFT_COL, ArenaConfig2v2.BRIDGE_RIGHT_COL].forEach(col => {
            const bridgeX = this.startX + col * ArenaConfig2v2.TILE_SIZE + ArenaConfig2v2.TILE_SIZE / 2;
            const centerY = this.startY + ((ArenaConfig2v2.RIVER_ROW_START + ArenaConfig2v2.RIVER_ROW_END + 1) / 2) * ArenaConfig2v2.TILE_SIZE;

            // Bridge sprite
            if (this.scene.textures.exists('bridge')) {
                const bridge = this.scene.add.image(bridgeX, centerY, 'bridge');
                // bridge.setDisplaySize(ArenaConfig2v2.TILE_SIZE, ArenaConfig2v2.TILE_SIZE * 3);
                bridge.setRotation(Math.PI / 2); // If vertical? No, bridge usually vertical.
            } else {
                // Fallback
                this.scene.add.rectangle(bridgeX, centerY, ArenaConfig2v2.TILE_SIZE, ArenaConfig2v2.TILE_SIZE * 2.2, 0x8B4513);
            }
        });
    }

    private createDecorations() {
        // Custom Fences
        if (ArenaConfig2v2.CUSTOM_FENCES) {
            ArenaConfig2v2.CUSTOM_FENCES.forEach(fence => {
                this.drawFence(fence.col, fence.row, false, fence.rotate || 0, fence.texture, fence.scale, fence.scaleX, fence.scaleY);
            });
        }
    }

    private drawFence(col: number, row: number, vertical: boolean, rotate: number = 0, customTexture?: string, scale: number = 1, scaleX?: number, scaleY?: number) {
        const x = this.startX + col * ArenaConfig2v2.TILE_SIZE + ArenaConfig2v2.TILE_SIZE / 2;
        const y = this.startY + row * ArenaConfig2v2.TILE_SIZE + ArenaConfig2v2.TILE_SIZE / 2;

        // Use wall assets instead of primitive rectangle
        // Default to 'wall1' unless custom texture provided
        const texture = customTexture || 'wall1';

        // Final scales (default to uniform scale if specific axis not provided)
        const finalScaleX = scaleX !== undefined ? scaleX : scale;
        const finalScaleY = scaleY !== undefined ? scaleY : scale;

        if (this.scene.textures.exists(texture)) {
            const wall = this.scene.add.image(x, y, texture);
            wall.setDisplaySize(ArenaConfig2v2.TILE_SIZE * finalScaleX, ArenaConfig2v2.TILE_SIZE * finalScaleY);

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
            const w = (vertical || rotate === 1) ? 6 : ArenaConfig2v2.TILE_SIZE;
            const h = (vertical || rotate === 1) ? ArenaConfig2v2.TILE_SIZE : 6;
            this.scene.add.rectangle(x, y, w, h, ArenaConfig2v2.Colors.FENCE).setDepth(1);
        }
    }

    private createProps() {
        if (!ArenaConfig2v2.PROPS) return;

        ArenaConfig2v2.PROPS.forEach(prop => {
            const { x, y } = ArenaConfig2v2.getPixelCoords(prop.col, prop.row);

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
                console.warn(`Prop texture not found: ${prop.texture}`);
                // Fallback placeholder
                this.scene.add.circle(x, y, 10, 0x00FF00).setDepth(1);
            }
        });
    }
}
