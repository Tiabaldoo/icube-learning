namespace SpriteKind {
    export const ТипФиниша = SpriteKind.create()
}

let Игрок: Sprite = null
tiles.setCurrentTilemap(tilemap`level1`)
Игрок = sprites.create(sprites.castle.heroWalkFront1, SpriteKind.Player)
tiles.placeOnRandomTile(Игрок, sprites.dungeon.collectibleInsignia)
controller.moveSprite(Игрок, 80, 80)
scene.cameraFollowSprite(Игрок)
let Финиш = sprites.create(img`
    . . b b b b b b b b b b b b . .
    . b e 4 4 4 4 4 4 4 4 4 4 e b .
    b e 4 4 4 4 4 4 4 4 4 4 4 4 e b
    b e 4 4 4 4 4 4 4 4 4 4 4 4 e b
    b e 4 4 4 4 4 4 4 4 4 4 4 4 e b
    b e e 4 4 4 4 4 4 4 4 4 4 e e b
    b e e e e e e e e e e e e e e b
    b e e e e e e e e e e e e e e b
    b b b b b b b d d b b b b b b b
    c b b b b b b c c b b b b b b c
    c c c c c c b c c b c c c c c c
    b e e e e e c b b c e e e e e b
    b e e e e e e e e e e e e e e b
    b c e e e e e e e e e e e e c b
    b b b b b b b b b b b b b b b b
    . b b . . . . . . . . . . b b .
    `, SpriteKind.ТипФиниша)
tiles.placeOnRandomTile(Финиш, sprites.dungeon.chestClosed)
