import fs from 'node:fs/promises';
import path from 'node:path';
import format from '../content/format.cjs';
const registry = JSON.parse(await fs.readFile('content/registry.json', 'utf8'));
const read = async p => JSON.parse(await fs.readFile(p, 'utf8'));
const catalog = await read('extras/catalog.json');
const games = [];
for (const entry of registry.games) {
  const resources = {}, lessons = {}, improvements = [];
  async function load(file, root) {
    const lesson = await read(file); delete lesson.quiz;
    for (const step of lesson.steps) {
      if (step.visual.codeFile) {
        format.safePath(step.visual.codeFile);
        await fs.access(root + step.visual.codeFile);
      }
      const paths = [step.visual.type === 'code' ? step.visual.codeFile : step.visual.src, ...(step.visual.images || []).map(image => image.src)];
      for (const relative of new Set(paths)) {
        format.safePath(relative);
        const key = root + relative;
        const bytes = await fs.readFile(key);
        // Canonical CRLF preserves the existing 1.0.0 package across Git checkout platforms.
        resources[key] = key.endsWith('.png') ? `data:image/png;base64,${bytes.toString('base64')}` : bytes.toString('utf8').replace(/\r?\n/g, '\r\n');
      }
    }
    return lesson;
  }
  for (const [mode, file] of Object.entries(entry.lessons)) lessons[mode] = await load(`lessons/${entry.id}/${file}`, `lessons/${entry.id}/`);
  for (const id of entry.improvements) {
    const metadata = { ...catalog.find(e => e.id === id), gameId: entry.id, optional: true };
    const mini = {};
    for (const mode of Object.keys(metadata.modes).filter(m => metadata.modes[m])) mini[mode] = await load(`extras/${id}/${mode}/lesson.json`, `extras/${id}/`);
    improvements.push({ metadata, lessons: mini });
  }
  games.push({ metadata: await read(`lessons/${entry.id}/game.json`), lessons, improvements, resources });
}
const bundle = { version: registry.version, formatVersion: 1, minAppVersion: '0.1.2', games };
format.validateBundle(bundle, '0.1.2');
const bytes = Buffer.from(JSON.stringify(bundle));
const packagePath = `versions/${registry.version}/bundle.json`;
const manifest = { version: registry.version, formatVersion: 1, minAppVersion: '0.1.2', files: [{ path: packagePath, size: bytes.length, sha256: format.sha256(bytes) }], games: games.map(g => ({ id: g.metadata.id, title: g.metadata.title })) };
format.verifyPackage(bytes, manifest, '0.1.2');
const output = path.join('public/content', packagePath);
await fs.mkdir(path.dirname(output), { recursive: true });
try { const previous = await fs.readFile(output); if (!previous.equals(bytes)) throw new Error('Content version already exists. Increment content/registry.json version.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; await fs.writeFile(output, bytes); }
// Write the manifest last. Pages deploys the complete artifact atomically.
await fs.writeFile('public/content/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
await fs.writeFile('content/version.json', JSON.stringify({ version: registry.version }) + '\n');
console.log(`Validated ${games.length} games; ${bytes.length} bytes; content ${registry.version}`);
