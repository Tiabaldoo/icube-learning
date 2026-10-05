# icube-learning

Для генерации блоков нужен Node.js 20+ и доступ к интернету:

```bash
npm install
npx playwright install chromium
npm run capture:blocks -- lessons/collect-stars-01
```

PNG сохраняются в `lessons/collect-stars-01/images/`. Можно передать папку
`steps/` или один файл `steps/step03.ts`. При ошибке скрипт сообщает файл и
завершается с ненулевым кодом. Скрипт использует внутренний API редактора
MakeCode; изменения сайта могут потребовать обновления скрипта.
