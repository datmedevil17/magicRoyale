
import { Scene } from 'phaser';

export class MapBuilder {
    private scene: Scene;
    private readonly COLS = 24;
    private readonly ROWS = 43;
    private readonly TILE_SIZE = 22; // From FXML

    // Offset to center the map if needed, or we can just return a Container
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
        this.createObstacles();
    }

    private createGroundLayer() {
        const colors = [0x8dab3b, 0xa4be43, 0x98b646];

        for (let row = 0; row < this.ROWS; row++) {
            if (row === 19) {
                // River row background (water color)
                this.drawRow(row, 0x00add2);
            } else {
                // Grass pattern
                for (let col = 0; col < this.COLS; col++) {
                    // Simple pattern replication: cycle colors
                    // The FXML pattern is a bit complex, but a simple noise or cycle is fine for now
                    // Let's use a pseudo-random consistent pattern based on indices
                    const colorIndex = (col + row) % 3;
                    this.drawTile(col, row, colors[colorIndex]);
                }
            }
        }
    }

    private drawRow(row: number, color: number) {
        for (let col = 0; col < this.COLS; col++) {
            this.drawTile(col, row, color);
        }
    }

    private drawTile(col: number, row: number, color: number) {
        const rect = this.scene.add.rectangle(
            this.startX + col * this.TILE_SIZE + this.TILE_SIZE / 2,
            this.startY + row * this.TILE_SIZE + this.TILE_SIZE / 2,
            this.TILE_SIZE,
            this.TILE_SIZE,
            color
        );
        rect.setStrokeStyle(0); // No border
    }

    private createRiverAndBridges() {
        const row = 19;
        // Bridges
        // Left Bridge (around col 6)
        this.addImage(6, row, 'bridge', 0.5);
        // Right Bridge (around col 17)
        this.addImage(17, row, 'bridge', 0.5);

        // River segments - simplified logic
        // We can just rely on the blue background tile for the water, 
        // and place bridge images on top. 
        // If we want the specific river sprites:
        // side_river at col 3 and 20? 
        this.addImage(3, row, 'side_river', 0.5);
        this.addImage(20, row, 'side_river', 0.5);

        // middle_river usually spans the center. 
        // For simplicity, let's place one in the center and scale it if needed
        // or just let the blue tiles do the work for the "water" look.
    }

    private createObstacles() {
        // Static obstacles mappings from FXML observation or just aesthetic placement
        // Walls
        this.addImage(6, 35, 'wall1', 0.5);
        this.addImage(17, 35, 'wall2', 0.5);

        // Stones
        this.addImage(3, 35, 'stone1', 0.5);
        this.addImage(2, 20, 'stone3', 0.5);
        this.addImage(2, 18, 'stone3', 0.5);
        this.addImage(23, 20, 'stone4', 0.5);
        this.addImage(6, 19, 'stone2', 0.5); // Near bridge?

        // Trees
        this.addImage(0, 33, 'tree1', 0.5);
        this.addImage(0, 25, 'tree2', 0.5);
        this.addImage(0, 29, 'tree2', 0.5);
        this.addImage(0, 20, 'tree3', 0.5);

        this.addImage(23, 20, 'tree3', 0.5); // Symmetric-ish

        // Large tree groups?
        // 'trees3' at (0, 16)
        this.addImage(0, 16, 'trees3', 0.5);
    }

    private addImage(col: number, row: number, key: string, scale: number = 1) {
        // Phaser images are centered by default
        const x = this.startX + col * this.TILE_SIZE + this.TILE_SIZE / 2;
        const y = this.startY + row * this.TILE_SIZE + this.TILE_SIZE / 2;
        const img = this.scene.add.image(x, y, key);
        img.setScale(scale);
        return img;
    }
}
