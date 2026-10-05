import { expect } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

// Real MakeCode UI screenshots for this lesson, not drawings of its interface.
export async function captureUI(browser, directory) {
    let context;
    let page;
    const output = path.join(directory, 'images/ui');
    await mkdir(output, { recursive: true });
    async function project() {
        await context?.close();
        context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
        page = await context.newPage();
        page.setDefaultTimeout(120_000);
        await page.addLocatorHandler(page.locator('.teaching-bubble-close'), async close => close.click());
        await page.goto('https://arcade.makecode.com/?lang=ru', { waitUntil: 'domcontentloaded' });
        await page.locator('.newprojectcard').click();
        await page.getByRole('textbox').fill('Собираем звёзды');
        await page.getByRole('button', { name: /^(Создать|Create)$/ }).click();
        await page.locator('.blocklySvg:visible').first().waitFor();
        await page.waitForFunction(() => window.E?.getEditor()?.closeTour);
        await page.evaluate(() => window.E.getEditor().closeTour());
    }
    async function frame(name, clip) {
        await page.evaluate(async () => {
            await document.fonts.ready;
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        });
        await expect(page.locator('.teaching-bubble-container:visible')).toHaveCount(0);
        await page.screenshot({ path: path.join(output, `${name}.png`), clip, animations: 'disabled' });
        console.log(`UI: ${name}.png`);
    }
    async function mark(locator) {
        await locator.evaluate(el => { el.style.outline = '4px solid #ff8b22'; el.style.outlineOffset = '3px'; });
    }
    async function load(step, mode = 'javascript-micro') {
        await page.locator('.javascript-menuitem:visible').first().click();
        await page.waitForFunction(() => window.E.getEditor().editor.editor?.getModel?.()?.uri.path.endsWith('/main.ts') && !window.E.getEditor().updatingEditorFile);
        const source = await readFile(path.join(directory, `steps/${mode}/step${String(step).padStart(2, '0')}.ts`), 'utf8');
        await page.evaluate(code => window.E.getEditor().editor.editor.getModel().setValue(code), source);
        await expect.poll(() => page.evaluate(() => window.E.getEditor().editor.getCurrentSource()), { timeout: 120_000 }).toBe(source);
        await page.evaluate(() => window.E.getEditor().saveFileAsync());
        const result = await page.evaluate(() => window.E.compiler.compileAsync({ native: false }));
        if (!result.success || result.diagnostics?.some(d => d.category === 1)) throw new Error(`Step ${step}: ${JSON.stringify(result.diagnostics)}`);
        await page.waitForFunction(() => !window.E.getEditor().updatingEditorFile);
        await page.evaluate(() => window.E.getEditor().closeTour());
    }
    async function blocks(step) {
        // A fresh workspace avoids unused variables being renamed by decompilation.
        await project();
        await load(step, 'blocks-micro');
        await page.locator('.blocks-menuitem:visible').first().click();
        await page.waitForFunction(() => window.E.getEditor().editor === window.E.getEditor().blocksEditor);
        await page.evaluate(() => {
            const ws = window.E.getEditor().blocksEditor.editor;
            ws.cleanUp(); ws.setScale(1); ws.scrollCenter();
        });
    }
    async function variable(name) {
        if (!await page.getByText('Создать переменную...', { exact: true }).isVisible()) {
            await page.getByRole('treeitem', { name: 'Переменные', exact: true }).click();
        }
        await page.getByText('Создать переменную...', { exact: true }).click();
        const dialog = page.locator('.coredialog:visible');
        await dialog.locator('input').fill(name);
        await mark(dialog.locator('input'));
        await mark(dialog.getByRole('button', { name: 'OK', exact: true }));
        const box = await dialog.boundingBox();
        await frame(`create-variable-${name}`, { x: box.x - 16, y: box.y - 16, width: box.width + 32, height: box.height + 32 });
        await dialog.getByRole('button', { name: 'OK', exact: true }).click();
        await dialog.waitFor({ state: 'hidden' });
    }
    async function gallery(name, asset) {
        await page.locator('[title="Галерея"]:visible').click();
        const tile = page.locator(`.image-editor-gallery.visible [title="${asset}"]`);
        await tile.scrollIntoViewIfNeeded();
        await mark(tile.locator('..'));
        await frame(name, { x: 24, y: 24, width: 1318, height: 852 });
        await tile.click();
        await page.locator('[title="Готово"]:visible').click();
        await page.locator('.image-editor-region:visible').waitFor({ state: 'hidden' });
    }
    async function imageField(variableName) {
        const fieldId = await page.evaluate(name => {
            const ws = window.E.getEditor().blocksEditor.editor;
            const assignment = ws.getAllBlocks(false).find(b => b.type === 'variables_set' && b.getField('VAR').getVariable().name === name);
            const field = assignment.getDescendants(false).find(b => b.type === 'screen_image_picker').getField('img');
            return field.getSvgRoot().id;
        }, variableName);
        return page.locator(`[id=${JSON.stringify(fieldId)}]`);
    }
    async function palette(name, step) {
        await load(step);
        const line = await page.evaluate(variable => {
            const editor = window.E.getEditor().editor.editor;
            const lineNumber = editor.getValue().split('\n').findIndex(text => text.includes(`let ${variable} = sprites.create`)) + 1;
            editor.setPosition({ lineNumber, column: 1 });
            editor.revealLineInCenter(lineNumber, window.monaco.editor.ScrollType.Immediate);
            return lineNumber;
        }, step === 8 ? 'star' : 'player');
        await page.waitForFunction(lineNumber => {
            const editor = window.E.getEditor().editor.editor;
            const top = editor.getDomNode().getBoundingClientRect().top + editor.getScrolledVisiblePosition({ lineNumber, column: 1 }).top;
            const rangeReady = window.E.getEditor().editor.fieldEditors.liveRanges.some(r => r.line === lineNumber && r.range.endLineNumber === lineNumber);
            return rangeReady && [...document.querySelectorAll('.sprite-editor-glyph')].some(el => Math.abs(el.getBoundingClientRect().top - top) < 3);
        }, line);
        const index = await page.evaluate(lineNumber => {
            const editor = window.E.getEditor().editor.editor;
            const top = editor.getDomNode().getBoundingClientRect().top + editor.getScrolledVisiblePosition({ lineNumber, column: 1 }).top;
            return [...document.querySelectorAll('.sprite-editor-glyph')].findIndex(el => Math.abs(el.getBoundingClientRect().top - top) < 3);
        }, line);
        const glyph = page.locator('.sprite-editor-glyph').nth(index);
        await mark(glyph);
        const box = await glyph.boundingBox();
        await frame(name, { x: 552, y: Math.max(0, box.y - 45), width: 814, height: 135 });
        // Monaco changes the glyph on hover, so click its already verified position.
        await glyph.click({ force: true });
    }
    try {
        await project();
        await variable('player');
        await variable('star');
        await blocks(2);
        const playerField = await imageField('player');
        await mark(playerField);
        const playerBox = await playerField.boundingBox();
        await frame('open-player-image-blocks', { x: Math.max(553, playerBox.x - 365), y: Math.max(65, playerBox.y - 55), width: 780, height: 210 });
        await playerField.click();
        await gallery('choose-player-image-blocks', 'sprites.castle.heroWalkFront1');
        await blocks(6);
        await page.locator('g[aria-label="выпадающий список: Player"]').click();
        // Capture the actual new-kind menu; the instructions supply the name Star.
        const createKind = page.getByText('Создать kind...', { exact: true });
        await mark(createKind);
        const kindBox = await createKind.boundingBox();
        await frame('create-kind-star', { x: Math.max(552, kindBox.x - 260), y: Math.max(65, kindBox.y - 180), width: 700, height: 390 });
        await createKind.click();
        const kindDialog = page.locator('.coredialog:visible');
        await kindDialog.locator('input').fill('Star');
        await kindDialog.getByRole('button', { name: 'OK', exact: true }).click();
        await kindDialog.waitFor({ state: 'hidden' });
        await blocks(9);
        await (await imageField('star')).click();
        await gallery('choose-star-image-blocks', 'sprites.projectile.star3');
        // Compile every JS snapshot, including intermediate editable image literals.
        for (let step = 1; step <= 20; step++) await load(step);
        await load(1);
        await mark(page.locator('.javascript-menuitem:visible').first());
        await frame('js-open-editor', { x: 420, y: 0, width: 946, height: 240 });
        await palette('js-empty-img-literal-and-palette', 2);
        await gallery('js-choose-player-image', 'sprites.castle.heroWalkFront1');
        await palette('js-star-palette', 8);
        await gallery('js-choose-star-image', 'sprites.projectile.star3');
        const example = await readFile(path.join(directory, 'steps/javascript-micro/step10.ts'), 'utf8');
        const pixels = code => code.match(/img`([^`]*)`/g)?.map(image => image.replace(/\s/g, ''));
        await expect.poll(async () => pixels(await page.evaluate(() => window.E.getEditor().editor.getCurrentSource())), { timeout: 120_000 }).toEqual(pixels(example));
        console.log('Captured 11 UI screenshots; all 20 JS snapshots compile.');
    } finally {
        await context.close();
    }
}
