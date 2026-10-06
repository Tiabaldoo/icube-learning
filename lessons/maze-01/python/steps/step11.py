player: Sprite = None
tiles.set_current_tilemap(tilemap("""
    level1
    """))
player = sprites.create(sprites.castle.hero_walk_front1, SpriteKind.player)
