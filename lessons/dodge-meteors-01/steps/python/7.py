ship: Sprite = None

ship = sprites.create(sprites.space.space_red_ship, SpriteKind.player)

ship.set_position(80, 105)

controller.move_sprite(ship, 100, 0)

ship.set_stay_in_screen(True)
