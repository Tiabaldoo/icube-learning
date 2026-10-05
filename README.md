# icube-learning

Нужен Node.js 20.19+ или 22.12+.

Учебный плеер использует существующий `lessons/collect-stars-01/lesson.json`.
Прогресс и результат теста сохраняются в браузере через localStorage.

```bash
npm install
npm run dev
npm run build
```

Для генерации русских блоков нужен доступ к интернету:

```bash
npm install
npx playwright install chromium
npm run capture:blocks -- lessons/collect-stars-01
```

PNG сохраняются в `lessons/collect-stars-01/images/`. Можно передать папку
`steps/` или один файл `steps/step03.ts`. При ошибке скрипт сообщает файл и
завершается с ненулевым кодом. Скрипт использует внутренний API редактора
MakeCode; изменения сайта могут потребовать обновления скрипта.
