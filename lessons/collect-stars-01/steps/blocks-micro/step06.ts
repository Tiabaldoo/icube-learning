let player = sprites.create(
    sprites.castle.heroWalkFront1,
    SpriteKind.Player
)

controller.moveSprite(player, 100, 100)
player.setStayInScreen(true)
