namespace SpriteKind {
    export const Star = SpriteKind.create()
}

let player = sprites.create(
    img`
    . . . . . . f f f f . . . . . .
    . . . . f f f 2 2 f f f . . . .
    . . . f f f 2 2 2 2 f f f . . .
    . . f f f e e e e e e f f f . .
    . . f f e 2 2 2 2 2 2 e e f . .
    . . f e 2 f f f f f f 2 e f . .
    . . f f f f e e e e f f f f . .
    . f f e f b f 4 4 f b f e f f .
    . f e e 4 1 f d d f 1 4 e e f .
    . . f e e d d d d d d e e f . .
    . . . f e e 4 4 4 4 e e f . . .
    . . e 4 f 2 2 2 2 2 2 f 4 e . .
    . . 4 d f 2 2 2 2 2 2 f d 4 . .
    . . 4 4 f 4 4 5 5 4 4 f 4 4 . .
    . . . . . f f f f f f . . . . .
    . . . . . f f . . f f . . . . .
`,
    SpriteKind.Player
)

controller.moveSprite(player, 100, 100)
player.setStayInScreen(true)

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
