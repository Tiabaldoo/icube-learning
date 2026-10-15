sprites.onDestroyed(SpriteKind.Enemy, function (sprite) {
    info.changeScoreBy(1)
    if (info.score() >= 10) {
        game.over(true)
    }
})
sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (sprite, otherSprite) {
    info.changeLifeBy(-1)
    Игрок.setFlag(SpriteFlag.Ghost, true)
    pause(1000)
    Игрок.setFlag(SpriteFlag.Ghost, false)
})
let Метеорит: Sprite = null
let Игрок: Sprite = null
Игрок = sprites.create(sprites.space.spaceRedShip, SpriteKind.Player)
Игрок.setPosition(80, 105)
controller.moveSprite(Игрок, 100, 0)
Игрок.setStayInScreen(true)
info.setScore(0)
music.play(music.stringPlayable("C5 B A G A B C5 - ", 120), music.PlaybackMode.LoopingInBackground)
info.setLife(3)
game.onUpdateInterval(1000, function () {
    Метеорит = sprites.create(img`
        . . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . . .
        . . . . . 4 4 4 4 4 . . . . . .
        . . . 4 4 4 5 5 5 d 4 4 4 4 . .
        . . 4 d 5 d 5 5 5 d d d 4 4 . .
        . . 4 5 5 1 1 1 d d 5 5 5 4 . .
        . 4 5 5 5 1 1 1 5 1 1 5 5 4 4 .
        . 4 d d 1 1 5 5 5 1 1 5 5 d 4 .
        . 4 5 5 1 1 5 1 1 5 5 d d d 4 .
        . 2 5 5 5 d 1 1 1 5 1 1 5 5 2 .
        . 2 d 5 5 d 1 1 1 5 1 1 5 5 2 .
        . . 2 4 d d 5 5 5 5 d d 5 4 . .
        . . . 2 2 4 d 5 5 d d 4 4 . . .
        . . 2 2 2 2 2 4 4 4 2 2 2 . . .
        . . . 2 2 4 4 4 4 4 4 2 2 . . .
        . . . . . 2 2 2 2 2 2 . . . . .
        `, SpriteKind.Enemy)
    Метеорит.setPosition(randint(10, 150), 0)
    Метеорит.vy = 60
    if (info.score() >= 5) {
        Метеорит.vy = 90
    }
    Метеорит.setFlag(SpriteFlag.AutoDestroy, true)
})
