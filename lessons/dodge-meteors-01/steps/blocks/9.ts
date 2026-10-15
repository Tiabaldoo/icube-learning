let Игрок = sprites.create(sprites.space.spaceRedShip, SpriteKind.Player)
Игрок.setPosition(80, 105)
controller.moveSprite(Игрок, 100, 0)
Игрок.setStayInScreen(true)
info.setScore(0)
game.onUpdateInterval(1000, function () {

})
