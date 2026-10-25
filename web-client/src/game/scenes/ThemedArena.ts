import Phaser, { Scene } from 'phaser';
import type { ArenaConfigInterface, ArenaTheme } from '../config/IArenaConfig';

const VIGNETTE_BANDS = 14;
const VIGNETTE_MAX_ALPHA = 0.55;
const RIVER_BANDS = 12;
const SHIMMER_DASHES = 40;
const SHIMMER_LOOP_MS = 7000;

// Depths: baked ground 0, river shimmer above it, bridges above the shimmer; units are drawn at their y (> 2)
const SHIMMER_DEPTH = 0.5;
const BRIDGE_DEPTH = 0.6;

/**
 * Draws a themed arena floor (see ArenaTheme): everything static is baked into one
 * RenderTexture; only the river shimmer animates.
 */
export class ThemedArena {
    private readonly scene: Scene;
    private readonly x: number;
    private readonly y: number;
    private readonly config: ArenaConfigInterface;
    private readonly theme: ArenaTheme;
    private readonly t: number;
    private readonly width: number;
    private readonly height: number;
    private readonly riverTop: number;
    private readonly riverBottom: number;

    constructor(scene: Scene, x: number, y: number, config: ArenaConfigInterface, theme: ArenaTheme) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.config = config;
        this.theme = theme;
        this.t = config.TILE_SIZE;
        this.width = config.COLS * this.t;
        this.height = config.ROWS * this.t;
        this.riverTop = config.RIVER_ROW_START * this.t;
        this.riverBottom = (config.RIVER_ROW_END + 1) * this.t;
    }

    public build() {
        const g = this.scene.make.graphics({}, false);
        this.drawFloor(g);
        this.drawVignette(g);
        this.drawPads(g);
        this.drawLanes(g);
        this.drawRiver(g);

        const ground = this.scene.add.renderTexture(this.x, this.y, this.width, this.height).setOrigin(0, 0);
        ground.draw(g);
        g.destroy();

        this.createShimmer();
        this.createBridges();
    }

    private drawFloor(g: Phaser.GameObjects.Graphics) {
        const [a, b] = this.theme.floor;
        for (let row = 0; row < this.config.ROWS; row++) {
            for (let col = 0; col < this.config.COLS; col++) {
                g.fillStyle((col + row) % 2 === 0 ? a : b);
                g.fillRect(col * this.t, row * this.t, this.t, this.t);
            }
        }
    }

    /** Darken toward the map edges so the playfield reads as the focus. */
    private drawVignette(g: Phaser.GameObjects.Graphics) {
        const band = this.t * 0.35;
        for (let i = 0; i < VIGNETTE_BANDS; i++) {
            const alpha = VIGNETTE_MAX_ALPHA * Math.pow(1 - i / VIGNETTE_BANDS, 2);
            g.lineStyle(band, this.theme.vignette, alpha);
            g.strokeRect(i * band + band / 2, i * band + band / 2, this.width - (2 * i + 1) * band, this.height - (2 * i + 1) * band);
        }
    }

    /** Rounded platform under each tower (replaces the square sand patch). */
    private drawPads(g: Phaser.GameObjects.Graphics) {
        const { fill, border } = this.theme.pad;
        for (const tower of this.config.TOWERS) {
            // Same footprint as the classic sand patch: whole tiles centred on the tower's tile
            const left = (tower.gridCol - tower.gridWidth / 2) * this.t + this.t / 2 + 2;
            const top = (tower.gridRow - tower.gridHeight / 2) * this.t + this.t / 2 + 2;
            const w = tower.gridWidth * this.t - 4;
            const h = tower.gridHeight * this.t - 4;
            const radius = this.t * 0.6;

            g.fillStyle(fill, 0.9).fillRoundedRect(left, top, w, h, radius);
            g.lineStyle(6, border, 0.15).strokeRoundedRect(left, top, w, h, radius);
            g.lineStyle(2, border, 0.85).strokeRoundedRect(left, top, w, h, radius);
        }
    }

    /** Glowing lanes through the CUSTOM_TILES path tiles: a line between each pair of adjacent tiles. */
    private drawLanes(g: Phaser.GameObjects.Graphics) {
        const tiles = new Set(this.config.CUSTOM_TILES.map(p => `${p.col},${p.row}`));
        const centre = (col: number, row: number) => ({ x: col * this.t + this.t / 2, y: row * this.t + this.t / 2 });
        const { color, glow, width } = this.theme.lane;

        const pass = (lineWidth: number, lineColor: number, alpha: number) => {
            g.lineStyle(lineWidth, lineColor, alpha);
            g.fillStyle(lineColor, alpha);
            for (const key of tiles) {
                const [col, row] = key.split(',').map(Number);
                const a = centre(col, row);
                g.fillCircle(a.x, a.y, lineWidth / 2); // round joins and ends
                for (const [dc, dr] of [[1, 0], [0, 1]]) {
                    if (!tiles.has(`${col + dc},${row + dr}`)) continue;
                    const b = centre(col + dc, row + dr);
                    g.lineBetween(a.x, a.y, b.x, b.y);
                }
            }
        };

        pass(width * 2.4, glow, 0.12);
        pass(width, color, 0.85);
    }

    /** Gradient river (edge → middle → edge colour) with glowing banks. */
    private drawRiver(g: Phaser.GameObjects.Graphics) {
        const { edge, middle, bank } = this.theme.river;
        const h = this.riverBottom - this.riverTop;
        const bandH = h / RIVER_BANDS;
        for (let i = 0; i < RIVER_BANDS; i++) {
            // 0 at the banks, 1 in the middle
            const t = 1 - Math.abs((i + 0.5) / RIVER_BANDS - 0.5) * 2;
            const c = Phaser.Display.Color.Interpolate.ColorWithColor(
                Phaser.Display.Color.ValueToColor(edge), Phaser.Display.Color.ValueToColor(middle), 100, t * 100);
            g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
            g.fillRect(0, this.riverTop + i * bandH, this.width, bandH + 0.5);
        }

        for (const yLine of [this.riverTop, this.riverBottom]) {
            g.lineStyle(8, bank, 0.18).lineBetween(0, yLine, this.width, yLine);
            g.lineStyle(2, bank, 0.9).lineBetween(0, yLine, this.width, yLine);
        }
    }

    /** Light streaks drifting along the river, masked to the river band. */
    private createShimmer() {
        const shimmer = this.scene.add.graphics().setDepth(SHIMMER_DEPTH);
        const h = this.riverBottom - this.riverTop;
        let seed = 7;
        const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

        // Two map-widths of dashes; sliding left by one width loops seamlessly
        for (let i = 0; i < SHIMMER_DASHES; i++) {
            const dx = rand() * this.width;
            const dy = this.riverTop + h * (0.2 + rand() * 0.6);
            const len = this.t * (0.6 + rand() * 1.2);
            shimmer.lineStyle(2, this.theme.river.shimmer, 0.25 + rand() * 0.35);
            shimmer.lineBetween(dx, dy, dx + len, dy);
            shimmer.lineBetween(dx + this.width, dy, dx + this.width + len, dy);
        }
        shimmer.setPosition(this.x, this.y);

        const maskShape = this.scene.make.graphics({}, false);
        maskShape.fillStyle(0xffffff).fillRect(this.x, this.y + this.riverTop, this.width, h);
        shimmer.setMask(maskShape.createGeometryMask());

        this.scene.tweens.add({
            targets: shimmer,
            x: this.x - this.width,
            duration: SHIMMER_LOOP_MS,
            repeat: -1,
        });
    }

    private createBridges() {
        const { deck, stripe, rail } = this.theme.bridge;
        const g = this.scene.add.graphics().setDepth(BRIDGE_DEPTH);
        const w = this.t * 1.7;
        const overhang = this.t * 0.35;
        const top = this.riverTop - overhang;
        const h = this.riverBottom - this.riverTop + overhang * 2;

        for (const col of [this.config.BRIDGE_LEFT_COL, this.config.BRIDGE_RIGHT_COL]) {
            const left = col * this.t + this.t / 2 - w / 2;
            g.fillStyle(0x000000, 0.35).fillRoundedRect(left + 2, top + 3, w, h, 4); // shadow
            g.fillStyle(deck).fillRoundedRect(left, top, w, h, 4);

            // Cross planks
            g.lineStyle(1, stripe, 0.5);
            for (let py = top + 6; py < top + h - 3; py += 6) {
                g.lineBetween(left + 4, py, left + w - 4, py);
            }

            // Glowing side rails
            for (const rx of [left + 2, left + w - 2]) {
                g.lineStyle(5, rail, 0.2).lineBetween(rx, top, rx, top + h);
                g.lineStyle(2, rail, 0.95).lineBetween(rx, top, rx, top + h);
            }
        }
        g.setPosition(this.x, this.y);
    }
}
