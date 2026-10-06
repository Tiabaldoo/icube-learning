namespace SpriteKind {
    export const ТипФиниша = SpriteKind.create()
}

let Игрок: Sprite = null
tiles.setCurrentTilemap(tilemap`level1`)
Игрок = sprites.create(sprites.castle.heroWalkFront1, SpriteKind.Player)
tiles.placeOnRandomTile(Игрок, sprites.dungeon.collectibleInsignia)
controller.moveSprite(Игрок, 80, 80)
scene.cameraFollowSprite(Игрок)
