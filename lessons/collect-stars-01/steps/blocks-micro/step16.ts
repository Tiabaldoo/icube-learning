namespace SpriteKind {
    export const Звезда = SpriteKind.create()
}

sprites.onOverlap(SpriteKind.Player, SpriteKind.Звезда, function (sprite, otherSprite) {
    info.changeScoreBy(1)
    Звезда.setPosition(randint(10, 150), randint(10, 110))
})

let Звезда: Sprite = null

let Игрок = sprites.create(
    sprites.castle.heroWalkFront1,
    SpriteKind.Player
)

controller.moveSprite(Игрок, 100, 100)
Игрок.setStayInScreen(true)

Звезда = sprites.create(img`
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . b b . . . . . . .
    . . . . . . b 5 5 b . . . . . .
    . . . b b b 5 5 1 1 b b b . . .
    . . . b 5 5 5 5 1 1 5 5 b . . .
    . . . . b d 5 5 5 5 d b . . . .
    . . . . c b 5 5 5 5 b c . . . .
    . . . . c 5 d d d d 5 c . . . .
    . . . . c 5 d c c d 5 c . . . .
    . . . . c c c . . c c c . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
`, SpriteKind.Звезда)

Звезда.setPosition(randint(10, 150), randint(10, 110))
info.setScore(0)
