namespace SpriteKind {
    export const Star = SpriteKind.create()
}

let player2 = sprites.create(
    sprites.castle.heroWalkFront1,
    SpriteKind.Player
)

controller.moveSprite(player2, 100, 100)
player2.setStayInScreen(true)

let star = sprites.create(img`
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
