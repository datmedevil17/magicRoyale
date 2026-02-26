import { Scene } from 'phaser';
import { ArenaConfig1 } from '../config/ArenaConfig1';

export class MapBuilder1 {
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
        for (let row = 0; row < ArenaConfig1.ROWS; row++) {
            for (let col = 0; col < ArenaConfig1.COLS; col++) {
                const color = this.getTileColor(col, row);
                this.drawTile(col, row, color);
            }
        }
    }

    private getTileColor(col: number, row: number): number {
        const riverStart = ArenaConfig1.RIVER_ROW_START;
        const riverEnd = ArenaConfig1.RIVER_ROW_END;
        if (row >= riverStart && row <= riverEnd) {
            return ArenaConfig1.Colors.WATER;
        }

        const isPlayable = col >= ArenaConfig1.MARGIN_X && col < ArenaConfig1.COLS - ArenaConfig1.MARGIN_X &&
            row >= ArenaConfig1.MARGIN_Y && row < ArenaConfig1.ROWS - ArenaConfig1.MARGIN_Y;

        if (!isPlayable) return ArenaConfig1.Colors.BORDER;

        const custom = ArenaConfig1.CUSTOM_TILES.find(t => t.col === col && t.row === row);
        if (custom) return custom.color;

        if (this.isSandPatch(col, row)) {
            return ArenaConfig1.Colors.SAND;
        }

        return (col + row) % 2 === 0 ? ArenaConfig1.Colors.GRASS : ArenaConfig1.Colors.GRASS_ALT;
    }

    private isSandPatch(col: number, row: number): boolean {
        return ArenaConfig1.TOWERS.some(tower => {
            const gridW = tower.gridWidth;
            const gridH = tower.gridHeight;
            const centerCol = tower.gridCol;
            const centerRow = tower.gridRow;
            const topLeftCol = centerCol - (gridW / 2);
            const topLeftRow = centerRow - (gridH / 2);

            return col >= topLeftCol && col < topLeftCol + gridW &&
                row >= topLeftRow && row < topLeftRow + gridH;
        });
    }

    private drawTile(col: number, row: number, color: number) {
        const x = this.startX + col * ArenaConfig1.TILE_SIZE + ArenaConfig1.TILE_SIZE / 2;
        const y = this.startY + row * ArenaConfig1.TILE_SIZE + ArenaConfig1.TILE_SIZE / 2;

        this.scene.add.rectangle(
            x, y,
            ArenaConfig1.TILE_SIZE,
            ArenaConfig1.TILE_SIZE,
            color
        ).setStrokeStyle(0);
    }

    private createRiverAndBridges() {
        [ArenaConfig1.BRIDGE_LEFT_COL, ArenaConfig1.BRIDGE_RIGHT_COL].forEach(col => {
            const bridgeX = this.startX + col * ArenaConfig1.TILE_SIZE + ArenaConfig1.TILE_SIZE / 2;
            const centerY = this.startY + ((ArenaConfig1.RIVER_ROW_START + ArenaConfig1.RIVER_ROW_END + 1) / 2) * ArenaConfig1.TILE_SIZE;

            if (this.scene.textures.exists('bridge')) {
                const bridge = this.scene.add.image(bridgeX, centerY, 'bridge');
                bridge.setRotation(Math.PI / 2);
            } else {
                this.scene.add.rectangle(bridgeX, centerY, ArenaConfig1.TILE_SIZE, ArenaConfig1.TILE_SIZE * 2.2, 0x8B4513);
            }
        });
    }

    private createDecorations() {
        if (ArenaConfig1.CUSTOM_FENCES) {
            ArenaConfig1.CUSTOM_FENCES.forEach(fence => {
                this.drawCustomFence(fence.col, fence.row, fence.vertical!, fence.texture);
            });
        }
    }

    private drawCustomFence(col: number, row: number, vertical: boolean, texture?: string) {
        const x = this.startX + col * ArenaConfig1.TILE_SIZE + ArenaConfig1.TILE_SIZE / 2;
        const y = this.startY + row * ArenaConfig1.TILE_SIZE + ArenaConfig1.TILE_SIZE / 2;

        if (texture && this.scene.textures.exists(texture)) {
            const wall = this.scene.add.image(x, y, texture);
            // Overlapping scales so fences connect visually 
            // wall textures are usually wider than they are tall
            if (vertical) {
                wall.setDisplaySize(ArenaConfig1.TILE_SIZE * 0.5, ArenaConfig1.TILE_SIZE * 1.5);
                wall.setAngle(90);
            } else {
                wall.setDisplaySize(ArenaConfig1.TILE_SIZE * 1.5, ArenaConfig1.TILE_SIZE * 0.5);
            }
            wall.setDepth(1);
        } else {
            // Fallback node
            this.scene.add.rectangle(x, y, 6, 6, ArenaConfig1.Colors.FENCE).setDepth(1);
            if (vertical) {
                this.scene.add.rectangle(x, y, 2, ArenaConfig1.TILE_SIZE, ArenaConfig1.Colors.FENCE).setDepth(0.5).setAlpha(0.6);
            } else {
                this.scene.add.rectangle(x, y, ArenaConfig1.TILE_SIZE, 2, ArenaConfig1.Colors.FENCE).setDepth(0.5).setAlpha(0.6);
            }
        }
    }

    private createProps() {
        if (!ArenaConfig1.PROPS) return;
        ArenaConfig1.PROPS.forEach(prop => {
            const { x, y } = ArenaConfig1.getPixelCoords(prop.col, prop.row);
            if (this.scene.textures.exists(prop.texture)) {
                const sprite = this.scene.add.image(x, y, prop.texture);
                sprite.setDepth(1);
                if (prop.rotate) sprite.setAngle(prop.rotate * 90);
            } else {
                this.scene.add.circle(x, y, 10, 0x00FF00).setDepth(1);
            }
        });
    }
}
