player: Sprite = None
tiles.set_current_tilemap(tilemap("""
    level1
    """))
player = sprites.create(sprites.castle.hero_walk_front1, SpriteKind.player)
tiles.place_on_random_tile(player, sprites.dungeon.collectible_insignia)
controller.move_sprite(player, 80, 80)
scene.camera_follow_sprite(player)
