import { chromium, expect as playwrightExpect } from '@playwright/test';
import { mkdir, readFile, readdir, stat, unlink, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const timeout = 120_000;
const expect = playwrightExpect.configure({ timeout });

async function inputs(argument) {
    if (!argument) throw new Error('Usage: npm run capture:blocks -- <lesson directory | steps directory | step.ts>');
    const input = path.resolve(argument);
    const metadata = await stat(input);
    if (metadata.isFile()) {
        if (path.extname(input) !== '.ts') throw new Error('Expected a .ts file');
        return [input];
    }
    const directory = path.basename(input) === 'steps' ? input : path.join(input, 'steps');
    const files = (await readdir(directory, { withFileTypes: true }))
        .filter(entry => entry.isFile() && entry.name.endsWith('.ts'))
        .map(entry => path.join(directory, entry.name)).sort();
    if (!files.length) throw new Error(`No TypeScript files in ${directory}`);
    return files;
}

// Use MakeCode's actual Blockly workspace, not toolbox preview blocks.
function workspace() {
    return window.E?.getEditor()?.blocksEditor?.editor;
}

export async function capture(browser, file, outputFile) {
    const source = await readFile(file, 'utf8');
    if (!source.trim()) throw new Error('The TypeScript file is empty');
    const destination = outputFile || path.join(path.dirname(path.dirname(file)), 'images', `${path.basename(file, '.ts')}.png`);
    const directory = path.dirname(destination);
    const temporary = `${destination}.tmp`;
    await mkdir(directory, { recursive: true });
    // A failed recapture must not leave an old image looking like a success.
    await unlink(destination).catch(error => { if (error.code !== 'ENOENT') throw error; });
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
    // Async MakeCode APIs do not have Playwright timeouts of their own.
    let deadlineExceeded = false;
    const watchdog = setTimeout(() => {
        deadlineExceeded = true;
        void context.close().catch(() => {});
    }, timeout * 2);
    const page = await context.newPage();
    page.setDefaultTimeout(timeout);
    page.setDefaultNavigationTimeout(timeout);
    try {
        // The onboarding tour is fetched asynchronously and can appear at any point.
        await page.addLocatorHandler(page.locator('.teaching-bubble-close'), async close => close.click());
        console.log(`Loading MakeCode for ${path.basename(file)}...`);
        await page.goto('https://arcade.makecode.com/?lang=ru', { waitUntil: 'domcontentloaded' });
        await page.locator('.newprojectcard').click();
        await page.getByRole('textbox').fill(path.basename(file, '.ts'));
        await page.getByRole('button', { name: /^(Создать|Create)$/ }).click();
        await page.locator('.blocklySvg:visible').first().waitFor();
        await page.locator('.ReactModal__Overlay:visible').waitFor({ state: 'hidden' });
        // closeTour handles the first-run teaching bubble even if it is still mounting.
        await page.waitForFunction(() => typeof window.E?.getEditor()?.closeTour === 'function');
        await page.evaluate(() => window.E.getEditor().closeTour());
        await page.locator('.javascript-menuitem:visible').first().click();
        await page.waitForFunction(() => !!window.monaco?.editor.getModels().find(model => model.uri.path.endsWith('/main.ts')));
        await page.waitForFunction(() => !window.E.getEditor().updatingEditorFile);
        await page.evaluate(code => {
            const model = window.monaco.editor.getModels().find(model => model.uri.path.endsWith('/main.ts'));
            model.setValue(code);
        }, source);
        await expect.poll(() => page.evaluate(() => window.E.getEditor().editor.getCurrentSource())).toBe(source);
        await page.evaluate(() => window.E.getEditor().saveFileAsync());
        await expect.poll(() => page.evaluate(() => window.E.pkg.mainPkg.readFile('main.ts'))).toBe(source);
        const compilation = await page.evaluate(async () => {
            const result = await window.E.compiler.compileAsync({ native: false });
            return { success: result.success, diagnostics: result.diagnostics };
        });
        await page.waitForFunction(() => !window.E.getEditor().updatingEditorFile);
        await page.evaluate(() => window.E.getEditor().closeTour());
        if (!compilation.success || compilation.diagnostics?.some(diagnostic => diagnostic.category === 1)) {
            throw new Error(`TypeScript compile error: ${JSON.stringify(compilation.diagnostics)}`);
        }
        await page.locator('.blocks-menuitem:visible').first().click();
        console.log('Waiting for Blocks conversion...');
        await page.locator('.blocklySvg:visible').first().waitFor();
        await page.waitForFunction(() => window.E.getEditor().editor === window.E.getEditor().blocksEditor);
        await page.waitForFunction(workspace);
        await expect.poll(() => page.evaluate(() => window.E.getEditor().blocksEditor.editor.getAllBlocks(false).length)).toBeGreaterThan(0);
        await expect(page.locator('.ReactModal__Overlay:visible')).toHaveCount(0);
        await expect(page.locator('.teaching-bubble-container:visible')).toHaveCount(0);
        const types = await page.evaluate(() => window.E.getEditor().blocksEditor.editor.getAllBlocks(false).map(block => block.type));
        if (types.some(type => /^(typescript|ts)_(statement|expression)$/.test(type))) {
            throw new Error('MakeCode left unconverted JavaScript blocks');
        }
        const language = await page.evaluate(() => ({
            locale: window.pxt.Util.userLanguage(),
            labels: window.E.getEditor().blocksEditor.editor.getAllBlocks(false).map(block => block.toString()).join(' ')
        }));
        if (!language.locale.startsWith('ru') || !/[а-яё]/i.test(language.labels)) {
            throw new Error('MakeCode blocks are not in Russian');
        }

        await page.evaluate(() => {
            const ws = window.E.getEditor().blocksEditor.editor;
            ws.cleanUp();
            ws.setScale(1);
        });
        const size = await page.evaluate(() => {
            const box = window.E.getEditor().blocksEditor.editor.getBlocksBoundingBox();
            return { width: box.right - box.left, height: box.bottom - box.top };
        });
        if (!Number.isFinite(size.width) || !Number.isFinite(size.height) || size.width <= 0 || size.height <= 0) {
            throw new Error('Blockly returned empty block bounds');
        }
        await page.setViewportSize({ width: Math.max(1600, Math.ceil(size.width + 900)), height: Math.max(1000, Math.ceil(size.height + 300)) });
        await page.evaluate(() => {
            const ws = window.E.getEditor().blocksEditor.editor;
            ws.resize();
            ws.zoomToFit();
            ws.setScale(1);
            ws.scrollCenter();
        });
        // Wait for browser layout and font loading, never a fixed sleep.
        await page.evaluate(async () => {
            await document.fonts.ready;
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        });
        const clip = await page.evaluate(() => {
            const ws = window.E.getEditor().blocksEditor.editor;
            const roots = ws.getTopBlocks(false).map(block => block.getSvgRoot().getBoundingClientRect());
            const left = Math.min(...roots.map(r => r.left));
            const top = Math.min(...roots.map(r => r.top));
            const right = Math.max(...roots.map(r => r.right));
            const bottom = Math.max(...roots.map(r => r.bottom));
            const view = ws.getParentSvg().getBoundingClientRect();
            const metrics = ws.getMetrics();
            const usableLeft = view.left + metrics.absoluteLeft;
            if (left < usableLeft || top < view.top || right > view.right || bottom > view.bottom) {
                throw new Error('Some blocks are outside the visible workspace');
            }
            const margin = 16;
            const x = Math.max(usableLeft, Math.floor(left - margin));
            const y = Math.max(view.top, Math.floor(top - margin));
            return { x, y, width: Math.min(view.right, Math.ceil(right + margin)) - x, height: Math.min(view.bottom, Math.ceil(bottom + margin)) - y };
        });
        await page.screenshot({ path: temporary, type: 'png', clip, animations: 'disabled' });
        const png = await readFile(temporary);
        if (png.length < 24 || png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || !png.readUInt32BE(16) || !png.readUInt32BE(20)) {
            throw new Error('The generated file is not a nonempty PNG');
        }
        await rename(temporary, destination);
        console.log(`${path.relative(process.cwd(), file)} -> ${path.relative(process.cwd(), destination)} (${png.readUInt32BE(16)}×${png.readUInt32BE(20)}, ${types.length} blocks)`);
    } catch (error) {
        if (deadlineExceeded) throw new Error('MakeCode did not finish within 240 seconds', { cause: error });
        throw error;
    } finally {
        clearTimeout(watchdog);
        await context.close();
        await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; });
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    let browser;
    try {
        const files = await inputs(process.argv[2]);
        browser = await chromium.launch();
        for (const file of files) {
            try { await capture(browser, file); }
            catch (error) { throw new Error(`${file}: ${error.message}`, { cause: error }); }
        }
        console.log(`Captured ${files.length} PNG images.`);
    } catch (error) {
        console.error(`Capture failed: ${error.message}`);
        process.exitCode = 1;
    } finally {
        await browser?.close();
    }
}
