namespace SpriteKind {
    export const Star = SpriteKind.create()
}

sprites.onOverlap(SpriteKind.Player, SpriteKind.Star, function (sprite, otherSprite) {
    info.changeScoreBy(1)
    star.setPosition(randint(10, 150), randint(10, 110))

    if (info.score() >= 10) {
    }
})

let star: Sprite = null

let player = sprites.create(
    sprites.castle.heroWalkFront1,
    SpriteKind.Player
)

controller.moveSprite(player, 100, 100)
player.setStayInScreen(true)

star = sprites.create(img`
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
`, SpriteKind.Star)

star.setPosition(randint(10, 150), randint(10, 110))
info.setScore(0)
