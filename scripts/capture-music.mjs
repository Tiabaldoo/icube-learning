import { chromium, expect } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
import { capture } from './capture-makecode-blocks/capture.mjs';

// Capture only real MakeCode resources for the collect-stars music improvement.
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(120000);
  await page.addLocatorHandler(page.locator('.teaching-bubble-close'), async close => close.click());
  await page.goto('https://arcade.makecode.com/?lang=ru', { waitUntil: 'domcontentloaded' });
  await page.locator('.newprojectcard').click();
  await page.getByRole('textbox').fill('Собери 10 звёзд — музыка');
  await page.getByRole('button', { name: /^(Создать|Create)$/ }).click();
  await page.locator('.blocklySvg:visible').first().waitFor();
  await page.waitForFunction(() => window.E?.getEditor()?.closeTour);
  await page.evaluate(() => window.E.getEditor().closeTour());
  await page.locator('.javascript-menuitem:visible').first().click();
  await page.waitForFunction(() => window.E.getEditor().editor.editor?.getModel?.()?.uri.path.endsWith('/main.ts') && !window.E.getEditor().updatingEditorFile);
  const source = await readFile('extras/music/blocks/steps/placed.ts', 'utf8');
  await page.evaluate(code => window.E.getEditor().editor.editor.getModel().setValue(code), source);
  await page.evaluate(() => window.E.getEditor().saveFileAsync());
  const result = await page.evaluate(() => window.E.compiler.compileAsync({ native: false }));
  if (!result.success || result.diagnostics?.some(d => d.category === 1)) throw new Error('Music program did not compile');
  await page.locator('.blocks-menuitem:visible').first().click();
  await page.waitForFunction(() => window.E.getEditor().editor === window.E.getEditor().blocksEditor);
  await page.evaluate(() => {
    const ws = window.E.getEditor().blocksEditor.editor;
    const renamed = ws.getVariableMap().getAllVariables().find(v => v.name === 'Звезда2');
    if (renamed) ws.getVariableMap().renameVariable(renamed, 'Звезда');
    ws.cleanUp(); ws.setScale(.8); ws.scrollCenter();
  });
  await mkdir('extras/music/images/ui', { recursive: true });
  async function frame(name, editor = false) {
    await page.evaluate(async () => { await document.fonts.ready; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); });
    let clip;
    if (editor) {
      const box = await page.locator('#melody-content-div').boundingBox();
      clip = { x: Math.max(0, box.x - 30), y: Math.max(0, box.y - 80), width: Math.min(700, 1600 - box.x + 30), height: Math.min(box.height + 100, 1000 - box.y + 80) };
    }
    await page.screenshot({ path: `extras/music/images/ui/${name}.png`, clip, animations: 'disabled' });
    console.log(`Captured ${name}`);
  }
  await page.getByRole('treeitem', { name: 'Музыка', exact: true }).click();
  await frame('music-category');
  await page.getByRole('treeitem', { name: 'Музыка', exact: true }).click();
  await frame('music-field');
  await page.evaluate(() => {
    const ws = window.E.getEditor().blocksEditor.editor;
    for (const block of ws.getAllBlocks(false)) for (const input of block.inputList) for (const field of input.fieldRow) {
      if (/C D E G E D C/.test(String(field.getValue?.()))) {
        field.showEditor_();
        return;
      }
    }
    throw new Error('Melody field not found: ' + JSON.stringify(ws.getAllBlocks(false).map(b => ({ type: b.type, fields: b.inputList.flatMap(i => i.fieldRow.map(f => ({ name: f.name, value: f.getValue?.() }))) }))));
  });
  await page.locator('#melody-content-div').waitFor({ state: 'visible' });
  const grid = page.locator('.melody-grid-div');
  while (await grid.locator('rect:not(.melody-default)').count()) await grid.locator('rect:not(.melody-default)').first().click({ force: true });
  await expect(grid.locator('rect:not(.melody-default)')).toHaveCount(0);
  await frame('melody-empty', true);
  const rows = [7, 6, 5, 3, 5, 6, 7];
  for (let column = 0; column < rows.length; column++) {
    const cell = grid.locator(`rect[data-x="${column}"][data-y="${rows[column]}"]`);
    await cell.click({ force: true });
    await expect(cell).not.toHaveClass('melody-default');
    await frame(`melody-note-${column + 1}`, true);
  }
  await expect(grid.locator('rect[data-x="7"]:not(.melody-default)')).toHaveCount(0);
  await page.locator('#melody-tempo-input').fill('120');
  await page.locator('#melody-play-button').click();
  await page.locator('.melody-confirm-button').click();
  await page.locator('#melody-content-div').waitFor({ state: 'hidden' });
  const noteValue = await page.evaluate(() => {
    const ws = window.E.getEditor().blocksEditor.editor;
    for (const block of ws.getAllBlocks(false)) for (const input of block.inputList) for (const field of input.fieldRow)
      if (/C D E G E D C/.test(String(field.getValue?.()))) return field.getValue();
  });
  if (String(noteValue).replace(/^"|"$/g, '').trim() !== 'C D E G E D C -') throw new Error(`Captured notes differ from the lesson melody: ${JSON.stringify(noteValue)}`);
  await page.evaluate(() => {
    const ws = window.E.getEditor().blocksEditor.editor;
    for (const block of ws.getAllBlocks(false)) for (const input of block.inputList) for (const field of input.fieldRow) {
      if (field.getOptions && field.getOptions().some(option => typeof option[0] === 'string' && /повторять.*фоновом/.test(option[0]))) { field.showEditor_(); return; }
    }
    throw new Error('Playback dropdown not found');
  });
  await page.locator('.blocklyMenuItem:visible').first().waitFor();
  await frame('playback-mode');
  console.log('Melody grid verified: C D E G E D C - at 120 BPM');
  await context.close();
  await capture(browser, 'extras/music/blocks/steps/placed.ts', 'extras/music/images/placed.png', ['Игрок', 'Звезда']);
  await capture(browser, 'extras/music/blocks/steps/add.ts', 'extras/music/images/add.png', ['Игрок', 'Звезда']);
  await capture(browser, 'extras/music/blocks/steps/loop.ts', 'extras/music/images/loop.png', ['Игрок', 'Звезда']);
} finally { await browser.close(); }
