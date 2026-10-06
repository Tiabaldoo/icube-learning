player: Sprite = None
tiles.set_current_tilemap(tilemap("""
    level1
    """))
player = sprites.create(img("""
"""), SpriteKind.player)
