import { chromium } from '@playwright/test';
import path from 'node:path';
import { captureUI } from './capture-collect-stars/ui.mjs';

// Only new Python palette assets; reuse the existing gallery images.
const browser = await chromium.launch();
try {
    await captureUI(browser, path.resolve('lessons/collect-stars-01'),
        ['python-player-palette', 'python-star-palette'], false, true);
} finally {
    await browser.close();
}
