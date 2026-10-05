# icube-learning

Нужен Node.js 20.19+ или 22.12+.

В игре «Собираем звёзды» 16 шагов в Блоках и 17 в JavaScript.
Число шагов зависит от действий режима, а не от общего шаблона.
Уроки: `lessons/collect-stars-01/lesson.json` и `javascript/lesson.json`.
Прохождение и результат теста живут только в текущей сессии, без localStorage.

```bash
npm ci
npm run dev
npm run build
```

Для снимков обновлённого урока (11 схем блоков и 9 реальных UI-скриншотов)
нужен доступ к интернету:

```bash
npx playwright install chromium
npm run capture:lesson
# Можно повторить только одну часть:
npm run capture:lesson -- --blocks
npm run capture:lesson -- --ui
# При необходимости можно выбрать конкретные assets:
npm run capture:lesson -- --blocks blocks-12
npm run capture:lesson -- --ui js-choose-star-image
```

Новые снимки сохраняются в `images/blocks/` и `images/ui/`.
При подготовке UI-снимков компилируются только необходимые образцы MakeCode.
Скрипт использует внутренний API MakeCode; изменения сайта могут потребовать
обновления скрипта. При ошибке команда завершается с ненулевым кодом.

Прежняя команда `npm run capture:blocks -- lessons/collect-stars-01` сохранена
для исходных шести файлов `steps/step*.ts`: её PNG остаются в `images/`.
Ей также можно передать папку `steps/` или один файл `steps/step03.ts`.

`actionType` описывает действие, `visual.type` выбирает схему блоков,
скриншот интерфейса или code viewer. У `modify-code` есть `change.before/after`
и `changedLines`; новые строки задаются в `newLines`.
Образцы программ находятся в `steps/blocks-micro/` и `steps/javascript-micro/`.
Код рисунков ребёнок не переписывает: вводит img с двумя обратными кавычками, открывает палитру
и выбирает изображение в галерее MakeCode.
