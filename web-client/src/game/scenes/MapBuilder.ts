import { Scene } from 'phaser';
import type { ArenaConfigInterface } from '../config/IArenaConfig';

export class MapBuilder {
    private scene: Scene;
    private startX: number;
    private startY: number;
    private config: ArenaConfigInterface;

    constructor(scene: Scene, x: number, y: number, config: ArenaConfigInterface) {
        this.scene = scene;
        this.startX = x;
        this.startY = y;
        this.config = config;
    }

    public build() {
        this.createGroundLayer();
        this.createRiverAndBridges();
        this.createDecorations();
        this.createProps();
    }

    private createGroundLayer() {
        for (let row = 0; row < this.config.ROWS; row++) {
            for (let col = 0; col < this.config.COLS; col++) {
                const color = this.getTileColor(col, row);
                this.drawTile(col, row, color);
            }
        }
    }

    private getTileColor(col: number, row: number): number {
        const custom = this.config.CUSTOM_TILES.find(t => t.col === col && t.row === row);
        if (custom) return custom.color;

        const riverStart = this.config.RIVER_ROW_START;
        const riverEnd = this.config.RIVER_ROW_END;
        if (row >= riverStart && row <= riverEnd) {
            return this.config.Colors.WATER;
        }

        if (this.isSandPatch(col, row)) {
            return this.config.Colors.SAND;
        }

        return (col + row) % 2 === 0 ? this.config.Colors.GRASS : this.config.Colors.GRASS_ALT;
    }

    private isSandPatch(col: number, row: number): boolean {
        return this.config.TOWERS.some(tower => {
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
        const x = this.startX + col * this.config.TILE_SIZE + this.config.TILE_SIZE / 2;
        const y = this.startY + row * this.config.TILE_SIZE + this.config.TILE_SIZE / 2;

        this.scene.add.rectangle(
            x, y,
            this.config.TILE_SIZE,
            this.config.TILE_SIZE,
            color
        ).setStrokeStyle(0);
    }

    private createRiverAndBridges() {
        [this.config.BRIDGE_LEFT_COL, this.config.BRIDGE_RIGHT_COL].forEach(col => {
            const bridgeX = this.startX + col * this.config.TILE_SIZE + this.config.TILE_SIZE / 2;
            const centerY = this.startY + ((this.config.RIVER_ROW_START + this.config.RIVER_ROW_END + 1) / 2) * this.config.TILE_SIZE;

            if (this.scene.textures.exists('bridge')) {
                const bridge = this.scene.add.image(bridgeX, centerY, 'bridge');
                // Standard bridge is horizontal in the sprite, but crosses a horizontal river vertically?
                // In our case, the river is horizontal (middle rows), so bridge should be vertical.
                // Original code had no rotation or set to 90.
            } else {
                this.scene.add.rectangle(bridgeX, centerY, this.config.TILE_SIZE, this.config.TILE_SIZE * 2.2, 0x8B4513);
            }
        });
    }

    private createDecorations() {
        if (this.config.CUSTOM_FENCES) {
            this.config.CUSTOM_FENCES.forEach(fence => {
                this.drawFence(fence.col, fence.row, false, fence.rotate || 0, fence.texture, fence.scale, fence.scaleX, fence.scaleY);
            });
        }
    }

    private drawFence(col: number, row: number, vertical: boolean, rotate: number = 0, customTexture?: string, scale: number = 1, scaleX?: number, scaleY?: number) {
        const x = this.startX + col * this.config.TILE_SIZE + this.config.TILE_SIZE / 2;
        const y = this.startY + row * this.config.TILE_SIZE + this.config.TILE_SIZE / 2;

        const texture = customTexture || 'wall1';
        const finalScaleX = scaleX !== undefined ? scaleX : scale;
        const finalScaleY = scaleY !== undefined ? scaleY : scale;

        if (this.scene.textures.exists(texture)) {
            const wall = this.scene.add.image(x, y, texture);
            wall.setDisplaySize(this.config.TILE_SIZE * finalScaleX, this.config.TILE_SIZE * finalScaleY);

            if (rotate) {
                wall.setAngle(rotate * 90);
            } else if (vertical) {
                wall.setAngle(90);
            }

            wall.setDepth(1);
        } else {
            const w = (vertical || rotate === 1) ? 6 : this.config.TILE_SIZE;
            const h = (vertical || rotate === 1) ? this.config.TILE_SIZE : 6;
            this.scene.add.rectangle(x, y, w, h, this.config.Colors.FENCE).setDepth(1);
        }
    }

    private createProps() {
        if (!this.config.PROPS) return;

        this.config.PROPS.forEach(prop => {
            const { x, y } = this.config.getPixelCoords(prop.col, prop.row);

            if (this.scene.textures.exists(prop.texture)) {
                const sprite = this.scene.add.image(x, y, prop.texture);
                sprite.setDepth(1);
                if (prop.rotate) {
                    sprite.setAngle(prop.rotate * 90);
                }
                if (prop.scale) {
                    sprite.setScale(prop.scale);
                }
            } else {
                this.scene.add.circle(x, y, 10, 0x00FF00).setDepth(1);
            }
        });
    }
}
