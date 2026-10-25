import Phaser from 'phaser';

export type ProjectileKind = 'arrow' | 'ball';

const TEXTURE: Record<ProjectileKind, string> = { arrow: 'proj_arrow', ball: 'proj_ball' };

/**
 * Draw a shot flying from (fromX, fromY) to (toX, toY) over `flightMs`, matching when
 * the game logic applies its damage.
 */
export function fireProjectile(
    scene: Phaser.Scene, fromX: number, fromY: number, toX: number, toY: number,
    flightMs: number, kind: ProjectileKind,
) {
    ensureTextures(scene);

    const projectile = scene.add.image(fromX, fromY, TEXTURE[kind])
        .setDepth(4000)
        .setRotation(Phaser.Math.Angle.Between(fromX, fromY, toX, toY));

    scene.tweens.add({
        targets: projectile,
        x: toX,
        y: toY,
        duration: flightMs,
        onComplete: () => projectile.destroy(),
    });
}

function ensureTextures(scene: Phaser.Scene) {
    if (scene.textures.exists(TEXTURE.arrow)) return;

    const g = scene.make.graphics({}, false);
    // Arrow pointing right (rotation 0): shaft + head
    g.fillStyle(0x8b5a2b).fillRect(0, 2, 12, 2);
    g.fillStyle(0xdddddd).fillTriangle(12, 0, 16, 3, 12, 6);
    g.generateTexture(TEXTURE.arrow, 16, 6);
    g.clear();
    // Cannonball
    g.fillStyle(0x222222).fillCircle(5, 5, 5);
    g.fillStyle(0x666666).fillCircle(3.5, 3.5, 1.5);
    g.generateTexture(TEXTURE.ball, 10, 10);
    g.destroy();
}
