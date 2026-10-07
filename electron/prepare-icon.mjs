import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// Reuse the existing orange/white iC brand mark; builder converts PNG to ICO/ICNS.
await mkdir(new URL('../build/', import.meta.url), { recursive: true });
await sharp(fileURLToPath(new URL('./icon.svg', import.meta.url)))
  .png().toFile(fileURLToPath(new URL('../build/icon.png', import.meta.url)));
