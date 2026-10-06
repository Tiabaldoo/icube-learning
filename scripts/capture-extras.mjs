import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { capture } from './capture-makecode-blocks/capture.mjs';
import { captureUI } from './capture-collect-stars/ui.mjs';

// Reuse the existing real MakeCode capture helpers; no application UI testing.
const catalog = JSON.parse(await readFile('extras/catalog.json', 'utf8'));
const mode = process.argv[2];
if (mode && !['--blocks', '--ui'].includes(mode)) throw new Error('Use --blocks or --ui.');
const selected = process.argv.slice(3);
const browser = await chromium.launch();
try {
    if (mode !== '--ui') {
        const jobs = [];
        for (const extra of catalog) {
            const directory = path.resolve('extras', extra.id);
            const lesson = JSON.parse(await readFile(path.join(directory, 'blocks/lesson.json'), 'utf8'));
            const seen = new Set();
            for (const step of lesson.steps) {
                if (step.visual.type !== 'blocks' || seen.has(step.visual.src)) continue;
                seen.add(step.visual.src);
                if (selected.length && !selected.includes(`${extra.id}/${step.id}`)) continue;
                jobs.push({ directory, step });
            }
        }
        await Promise.all([0, 1].map(async worker => {
            for (const { directory, step } of jobs.filter((_, index) => index % 2 === worker)) {
                await capture(browser, path.join(directory, step.visual.codeFile), path.join(directory, step.visual.src));
            }
        }));
        console.log(`Captured ${jobs.length} improvement block images.`);
    }
    if (mode !== '--blocks') {
        await captureUI(browser, path.resolve('extras/background'), ['editor', 'palette'], true);
    }
} finally {
    await browser.close();
}
