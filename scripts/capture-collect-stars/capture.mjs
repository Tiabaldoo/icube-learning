import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { capture } from '../capture-makecode-blocks/capture.mjs';
import { captureUI } from './ui.mjs';

const lessonDirectory = path.resolve('lessons/collect-stars-01');
const lesson = JSON.parse(await readFile(path.join(lessonDirectory, 'lesson.json'), 'utf8'));
const mode = process.argv[2];
if (mode && !['--blocks', '--ui'].includes(mode)) throw new Error('Use --blocks, --ui or no argument for both.');
const browser = await chromium.launch();
try {
    if (mode !== '--ui') {
        const steps = lesson.steps.filter(step => step.visual.type === 'blocks');
        // Two independent MakeCode projects keep the one-lesson capture reasonably quick.
        await Promise.all([0, 1].map(async worker => {
            for (const step of steps.filter((_, index) => index % 2 === worker)) {
                for (let attempt = 1; attempt <= 2; attempt++) {
                    try {
                        await capture(browser, path.join(lessonDirectory, step.visual.codeFile), path.join(lessonDirectory, step.visual.src));
                        break;
                    } catch (error) {
                        if (attempt === 2) throw new Error(`${step.id}: ${error.message}`, { cause: error });
                        console.warn(`Retrying ${step.id} after MakeCode capture failed: ${error.message}`);
                    }
                }
            }
        }));
        console.log(`Captured ${steps.length} Blocks screenshots.`);
    }
    if (mode !== '--blocks') await captureUI(browser, lessonDirectory);
} finally {
    await browser.close();
}
