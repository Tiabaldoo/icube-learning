@namespace
class SpriteKind:
    FinishKind = SpriteKind.create()

def on_on_overlap2(sprite2, otherSprite2):
    pass
sprites.on_overlap(SpriteKind.player, SpriteKind.FinishKind, on_on_overlap2)

player: Sprite = None
tiles.set_current_tilemap(tilemap("""
    level1
    """))
player = sprites.create(sprites.castle.hero_walk_front1, SpriteKind.player)
tiles.place_on_random_tile(player, sprites.dungeon.collectible_insignia)
controller.move_sprite(player, 80, 80)
scene.camera_follow_sprite(player)
finish = sprites.create(img("""
        . . b b b b b b b b b b b b . .
        . b e 4 4 4 4 4 4 4 4 4 4 e b .
        b e 4 4 4 4 4 4 4 4 4 4 4 4 e b
        b e 4 4 4 4 4 4 4 4 4 4 4 4 e b
        b e 4 4 4 4 4 4 4 4 4 4 4 4 e b
        b e e 4 4 4 4 4 4 4 4 4 4 e e b
        b e e e e e e e e e e e e e e b
        b e e e e e e e e e e e e e e b
        b b b b b b b d d b b b b b b b
        c b b b b b b c c b b b b b b c
        c c c c c c b c c b c c c c c c
        b e e e e e c b b c e e e e e b
        b e e e e e e e e e e e e e e b
        b c e e e e e e e e e e e e c b
        b b b b b b b b b b b b b b b b
        . b b . . . . . . . . . . b b .
        """),
    SpriteKind.FinishKind)
tiles.place_on_random_tile(finish, sprites.dungeon.chest_closed)
