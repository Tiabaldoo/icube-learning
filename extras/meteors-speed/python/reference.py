meteor: Sprite = None

ship: Sprite = None

def on_destroyed(sprite):
    info.change_score_by(1)
    if info.score() >= 10:
        game.over(True)
sprites.on_destroyed(SpriteKind.enemy, on_destroyed)

def on_overlap(sprite, otherSprite):
    game.over(False)
sprites.on_overlap(SpriteKind.player, SpriteKind.enemy, on_overlap)

ship = sprites.create(sprites.space.space_red_ship, SpriteKind.player)

ship.set_position(80, 105)

controller.move_sprite(ship, 100, 0)

ship.set_stay_in_screen(True)

info.set_score(0)

def on_interval():
    global meteor
    meteor = sprites.create(img("""
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
        """), SpriteKind.enemy)
    meteor.set_position(randint(10, 150), 0)
    meteor.vy = 60
    if info.score() >= 5:
        meteor.vy = 90
    meteor.set_flag(SpriteFlag.AUTO_DESTROY, True)
game.on_update_interval(1000, on_interval)
