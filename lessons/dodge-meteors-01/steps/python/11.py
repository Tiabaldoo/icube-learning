meteor: Sprite = None

ship: Sprite = None

ship = sprites.create(sprites.space.space_red_ship, SpriteKind.player)

ship.set_position(80, 105)

controller.move_sprite(ship, 100, 0)

ship.set_stay_in_screen(True)

info.set_score(0)

def on_interval():
    global meteor
    meteor = sprites.create(img("""
        """), SpriteKind.enemy)
game.on_update_interval(1000, on_interval)
