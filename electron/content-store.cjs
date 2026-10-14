const fs = require('node:fs/promises');
const path = require('node:path');
const { MAX_BYTES, compareVersions, validateManifest, verifyPackage } = require('../content/format.cjs');
const BASE = 'https://tiabaldoo.github.io/icube-learning/content/';
async function download(url, limit) {
  if (!url.startsWith(BASE)) throw new Error('Invalid content origin');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(url, { redirect: 'error', signal: controller.signal, cache: 'no-store' });
    if (!response.ok) throw new Error('Content unavailable');
    const chunks = []; let size = 0;
    for await (const chunk of response.body) {
      size += chunk.length; if (size > limit) throw new Error('Content too large');
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } finally { clearTimeout(timer); }
}
function createStore(root, appVersion, builtinVersion, fetchBytes = download) {
  let active = null, candidate = null, installing = false;
  const pointer = path.join(root, 'active.json');
  async function load() {
    try {
      const state = JSON.parse(await fs.readFile(pointer, 'utf8'));
      for (const id of [state.current, state.previous]) {
        if (typeof id !== 'string' || !/^package-[a-zA-Z0-9-]+$/.test(id)) continue;
        try {
          const folder = path.join(root, id);
          const manifest = JSON.parse(await fs.readFile(path.join(folder, 'manifest.json'), 'utf8'));
          const bundle = verifyPackage(await fs.readFile(path.join(folder, 'bundle.json')), manifest, appVersion);
          if (compareVersions(bundle.version, builtinVersion) <= 0) continue;
          active = { id, bundle };
          return bundle;
        } catch { /* Try the previous verified version. */ }
      }
    } catch { /* First run or damaged pointer: use built-in lessons. */ }
    active = null;
    return null;
  }
  async function check() {
    const manifest = validateManifest(JSON.parse((await fetchBytes(BASE + 'manifest.json', 128 * 1024)).toString('utf8')), appVersion);
    const current = active?.bundle.version || builtinVersion;
    candidate = compareVersions(manifest.version, current) > 0 ? manifest : null;
    return { state: candidate ? 'available' : 'current', version: manifest.version };
  }
  async function install() {
    if (installing || !candidate) throw new Error('No available update');
    installing = true;
    const manifest = candidate;
    let staging;
    try {
      await fs.mkdir(root, { recursive: true });
      staging = await fs.mkdtemp(path.join(root, 'package-'));
      const bytes = await fetchBytes(BASE + manifest.files[0].path, MAX_BYTES);
      await fs.writeFile(path.join(staging, 'bundle.json'), bytes);
      const bundle = verifyPackage(await fs.readFile(path.join(staging, 'bundle.json')), manifest, appVersion);
      await fs.writeFile(path.join(staging, 'manifest.json'), JSON.stringify(manifest));
      const id = path.basename(staging);
      // A complete immutable directory exists before the single atomic pointer switch.
      const temporaryPointer = path.join(root, 'active.next.json');
      await fs.writeFile(temporaryPointer, JSON.stringify({ current: id, previous: active?.id || null }));
      await fs.rename(temporaryPointer, pointer);
      active = { id, bundle }; candidate = null; staging = null;
      return bundle;
    } finally {
      if (staging) await fs.rm(staging, { recursive: true, force: true });
      installing = false;
    }
  }
  return { load, check, install };
}
module.exports = { BASE, createStore };
