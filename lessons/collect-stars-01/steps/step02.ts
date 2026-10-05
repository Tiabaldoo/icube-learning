let player2 = sprites.create(
    sprites.castle.heroWalkFront1,
    SpriteKind.Player
)

controller.moveSprite(player2, 100, 100)
player2.setStayInScreen(true)
