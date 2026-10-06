# Лабиринт

Вторая отдельная игра, registry id maze-01. Blocks: 32 шага, JavaScript: 30,
Python: 32. По 5 вопросов в каждом режиме; общие extras наследуют режим.

## Карта

Источник геометрии и стен — официальный готовый шаблон MakeCode Gallery
gallerytilemaps.stairs, 20 × 20, плитка 16 px:
https://github.com/microsoft/pxt-arcade/blob/master/libs/device/tilemaps/gallery.ts

Эталон — снимок level1, приложенный пользователем. Индексы ниже начинаются с 0:
- старт: (0, 11), sprites.dungeon.collectibleInsignia;
- финиш: (12, 12), sprites.dungeon.chestClosed;
- враг: (12, 7), sprites.dungeon.floorLight3.

В исходном шаблоне старые floorLight3/floorLight4 находятся в (7, 12)/(8, 12).
Они заменены floorLight0; это отдельный шаг, чтобы маркер врага был единственным.
Геометрия, слой стен и проходимые лестницы не меняются. Ребёнок берёт карту
из Gallery, ставит метки мышью, не рисует весь лабиринт и не выставляет стены.

steps/template.ts — неизменённый шаблон; steps/map.ts — шаблон с эталонными
метками; steps/reference.ts — исходная логика из ТЗ. JavaScript/reference.ts,
python/reference.py и assets/tilemap.g.* получены через реальный редактор MakeCode.
Матрицы картинок и карта — ресурсы редактора, не фрагменты для ручного ввода.
В Python автоматическое имя player2 нормализовано до player. Имена/порядок
функций и тройные кавычки tilemap сохранены такими, как показывает MakeCode.

## Только необходимые assets

Генератор использует существующий capture helper, не проверяет UI приложения:
```bash
node scripts/capture-maze.mjs          # UI карты, рисунков, имён; референсы
node scripts/capture-maze.mjs --remaining # только недостающие UI-кадры
node scripts/capture-maze.mjs --blocks # 15 схем только новой игры
```

Снимки — реальный MakeCode на русском; оранжевые рамки и подписи добавлены
поверх интерфейса перед снятием кадра. Никакого внешнего image generation.
На code шагах защищены полный код, «Что написать» и «Было / Стало».
На UI шагах работает общий левый image viewer с zoom/pan/fullscreen.

Справочники:
- https://arcade.makecode.com/reference/tiles/tilemap
- https://arcade.makecode.com/reference/tiles/place-on-random-tile
- https://arcade.makecode.com/reference/scene/camera-follow-sprite
- https://arcade.makecode.com/reference/sprites/sprite/vx
- https://arcade.makecode.com/reference/sprites/sprite/set-bounce-on-wall
