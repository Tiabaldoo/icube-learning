# Улучши свою игру

Это общая библиотека, не часть отдельной игры. Метаданные карточек находятся
в catalog.json; каждый мини-урок имеет blocks/lesson.json и javascript/lesson.json.
App передаёт выбранную игру только как адрес возврата, а режим наследует от урока.
Ни история, ни прогресс улучшений не сохраняются. Тестов здесь нет.

Для нового улучшения добавь metadata в catalog.json и файлы двух режимов.
src/extras.ts подхватит их через общий registry. Код JavaScript — короткие
фрагменты, а не новая полная программа; размещение описывает каждый шаг.

Настоящие изображения MakeCode создаются существующими capture helpers:

```bash
node scripts/capture-extras.mjs
# Только необходимые картинки:
node scripts/capture-extras.mjs --blocks sound/sound-add
node scripts/capture-extras.mjs --ui
```

Генератор открывает только редактор MakeCode для создания assets,
не приложение Айкуб Игры и не опубликованный сайт.

Справочники MakeCode для использованных команд:
- https://arcade.makecode.com/reference/scene/set-background-image
- https://arcade.makecode.com/reference/music/play
- https://arcade.makecode.com/reference/music/string-playable
- https://arcade.makecode.com/reference/info/set-life
- https://arcade.makecode.com/reference/info/change-life-by
- https://arcade.makecode.com/reference/info/start-countdown
- https://arcade.makecode.com/reference/info/on-countdown-end
