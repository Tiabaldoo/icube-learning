// Автоматически генерируемый код. Не редактируйте.
namespace myTiles {
    //% fixedInstance jres blockIdentity=images._tile
    export const transparency16 = image.ofBuffer(hex``);

    helpers._registerFactory("tilemap", function(name: string) {
        switch(helpers.stringTrim(name)) {
            case "level1":
            case "level1":return tiles.createTilemap(hex`14001400020101010101010101010101010101010101010d030a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0e030a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0e030a0a0a0a020101010101010c0101010d0a0a0e030a0a0a0a03020101010d0a0a0a0a0a0e0a0a0e0302010c0105030a0a0a0e0a0a0a0a0a0e0a0a0e03030a0a0a0a030a0a0a0401010d0a0a0e0a0a0e03030a0a0a0a0b0a0a0a0a0a100e0a0a0e0a0a0e03030a0a0a0a030a0a0a0a0a0a0e0a0a0e0a0a0e030607090a0a030a0a0a0a0a0a0e0a0a0e0a0a0e060709030a0a030a0a0a0a0a0a0e0a0a0e0a0a0e120a03030a0a030a0a0a0a0a0a0e0a0a0e0a0a0e0a0a03030a0a030a0a0a0a0a130e0a0a0e0a0a0e0a0a03030a0a06070707070707080a0a0e0a0a0e0a0a03030a0a0a0a0a0a0a0a0a0a0a0a0e0a0a0e0a0a03030a0a0a0a0a0a0a0a0a0a0a0a0e0a0a0e0a0a0306070707070707070707070707080a0a0e0a0a030a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0e0a0a0b0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0e0a0a060707070707070707070707070707070708`, img`
22222222222222222222
2..................2
2..................2
2....2222222.2222..2
2....222222.....2..2
222.222...2.....2..2
22....2...2222..2..2
22...........2..2..2
22....2......2..2..2
2222..2......2..2..2
2222..2......2..2..2
..22..2......2..2..2
..22..2......2..2..2
..22..22222222..2..2
..22............2..2
..22............2..2
..222222222222222..2
..2................2
...................2
..222222222222222222
`, [gallerytilemaps.baseTransparency16,sprites.dungeon.greenOuterNorth0,sprites.dungeon.greenOuterNorthWest,sprites.dungeon.greenOuterWest0,sprites.dungeon.greenInnerSouthWest,sprites.dungeon.greenInnerSouthEast,sprites.dungeon.greenOuterSouthEast,sprites.dungeon.greenOuterSouth1,sprites.dungeon.greenOuterSouthWest,sprites.dungeon.greenInnerNorthEast,sprites.dungeon.floorLight0,sprites.dungeon.stairWest,sprites.dungeon.stairNorth,sprites.dungeon.greenOuterNorthEast,sprites.dungeon.greenOuterEast0,sprites.dungeon.floorLight1,sprites.dungeon.floorLight3,sprites.dungeon.floorLight4,sprites.dungeon.collectibleInsignia,sprites.dungeon.chestClosed], TileScale.Sixteen);
            case "level2":
            case "level2":return tiles.createTilemap(hex`1000100002020202020202020202020202020202020301010101010201010101010105020201010101010102010101010101010202020202020101020101020202020202020101010101010201010101010101020201010202020202010102020202020202010101010101020101010101010102020202020201010701010202020202020201010101010102010101010101010202010102020202020101020202020202020101010104010201010101010101020201010101010102010102020202020202020202020101020101010101010102020601010101010201010101010101020201010101010102020202020202020202020202020202020202020202020202`, img`
2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 
2 . . . . . . 2 . . . . . . . 2 
2 . . . . . . 2 . . . . . . . 2 
2 2 2 2 2 . . 2 . . 2 2 2 2 2 2 
2 . . . . . . 2 . . . . . . . 2 
2 . . 2 2 2 2 2 . . 2 2 2 2 2 2 
2 . . . . . . 2 . . . . . . . 2 
2 2 2 2 2 . . 2 . . 2 2 2 2 2 2 
2 . . . . . . 2 . . . . . . . 2 
2 . . 2 2 2 2 2 . . 2 2 2 2 2 2 
2 . . . . . . 2 . . . . . . . 2 
2 . . . . . . 2 . . 2 2 2 2 2 2 
2 2 2 2 2 . . 2 . . . . . . . 2 
2 . . . . . . 2 . . . . . . . 2 
2 . . . . . . 2 2 2 2 2 2 2 2 2 
2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 
`, [gallerytilemaps.baseTransparency16,sprites.dungeon.floorLight0,sprites.dungeon.darkGroundCenter,sprites.dungeon.collectibleInsignia,sprites.dungeon.floorLight3,sprites.dungeon.chestClosed,sprites.dungeon.floorLight2,sprites.dungeon.doorClosedNorth], TileScale.Sixteen);
        }
        return null;
    })

    helpers._registerFactory("tile", function(name: string) {
        switch(helpers.stringTrim(name)) {
            case "transparency16":return transparency16;
        }
        return null;
    })

}
// Автоматически генерируемый код. Не редактируйте.
