namespace SpriteKind {
    export const ТипВрага = SpriteKind.create()
    export const ТипФиниша = SpriteKind.create()
}

sprites.onOverlap(SpriteKind.Player, SpriteKind.ТипФиниша, function (sprite, otherSprite) {
    game.over(true)
})

sprites.onOverlap(SpriteKind.Player, SpriteKind.ТипВрага, function (sprite, otherSprite) {
    tiles.placeOnRandomTile(Игрок, sprites.dungeon.collectibleInsignia)
})

let Игрок: Sprite = null
let Финиш: Sprite = null
let Враг: Sprite = null

tiles.setCurrentTilemap(tiles.createTilemap(hex`14001400020101010101010101010101010101010101010d030a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0e030a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0e030a0a0a0a020101010101010c0101010d0a0a0e030a0a0a0a03020101010d0a0a0a0a0a0e0a0a0e0302010c0105030a0a0a0e0a0a0a0a0a0e0a0a0e03030a0a0a0a030a0a0a0401010d0a0a0e0a0a0e03030a0a0a0a0b0a0a0a0a0a100e0a0a0e0a0a0e03030a0a0a0a030a0a0a0a0a0a0e0a0a0e0a0a0e030607090a0a030a0a0a0a0a0a0e0a0a0e0a0a0e060709030a0a030a0a0a0a0a0a0e0a0a0e0a0a0e120a03030a0a030a0a0a0a0a0a0e0a0a0e0a0a0e0a0a03030a0a030a0a0a0a0a130e0a0a0e0a0a0e0a0a03030a0a06070707070707080a0a0e0a0a0e0a0a03030a0a0a0a0a0a0a0a0a0a0a0a0e0a0a0e0a0a03030a0a0a0a0a0a0a0a0a0a0a0a0e0a0a0e0a0a0306070707070707070707070707080a0a0e0a0a030a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0e0a0a0b0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0e0a0a060707070707070707070707070707070708`, img`
22222222222222222222
2..................2
2..................2
2....2222222.2222..2
2....222222.....2..2
222.222...2.....2..2
22....2...2222..2..2
22...........2..2..2
22....2......2..2..2
2222..2......2..2..2
2222..2......2..2..2
..22..2......2..2..2
..22..2......2..2..2
..22..22222222..2..2
..22............2..2
..22............2..2
..222222222222222..2
..2................2
...................2
..222222222222222222
`, [gallerytilemaps.baseTransparency16,sprites.dungeon.greenOuterNorth0,sprites.dungeon.greenOuterNorthWest,sprites.dungeon.greenOuterWest0,sprites.dungeon.greenInnerSouthWest,sprites.dungeon.greenInnerSouthEast,sprites.dungeon.greenOuterSouthEast,sprites.dungeon.greenOuterSouth1,sprites.dungeon.greenOuterSouthWest,sprites.dungeon.greenInnerNorthEast,sprites.dungeon.floorLight0,sprites.dungeon.stairWest,sprites.dungeon.stairNorth,sprites.dungeon.greenOuterNorthEast,sprites.dungeon.greenOuterEast0,sprites.dungeon.floorLight1,sprites.dungeon.floorLight3,sprites.dungeon.floorLight4,sprites.dungeon.collectibleInsignia,sprites.dungeon.chestClosed], TileScale.Sixteen))

Игрок = sprites.create(
    sprites.castle.heroWalkFront1,
    SpriteKind.Player
)

tiles.placeOnRandomTile(
    Игрок,
    sprites.dungeon.collectibleInsignia
)

controller.moveSprite(Игрок, 80, 80)

scene.cameraFollowSprite(Игрок)

Финиш = sprites.create(img`
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

tiles.placeOnRandomTile(
    Финиш,
    sprites.dungeon.chestClosed
)

Враг = sprites.create(
    sprites.castle.skellyWalkFront1,
    SpriteKind.ТипВрага
)

tiles.placeOnRandomTile(
    Враг,
    sprites.dungeon.floorLight3
)

Враг.vx = 80
Враг.setBounceOnWall(true)
