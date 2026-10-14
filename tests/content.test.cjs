const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const format = require('../content/format.cjs');
const { mergeGames } = require('../content/merge.mjs');
const { createStore } = require('../electron/content-store.cjs');
const baseline = require('../public/content/manifest.json');
async function fixture(version = '1.1.0') {
  const original = await fs.readFile(path.join('public/content', baseline.files[0].path));
  const data = JSON.parse(original); data.version = version;
  const bytes = Buffer.from(JSON.stringify(data));
  const manifest = { ...baseline, version, files: [{ path: `versions/${version}/bundle.json`, size: bytes.length, sha256: format.sha256(bytes) }] };
  return { manifest, bytes, data };
}
test('semantic version comparison and invalid versions', () => {
  assert.equal(format.compareVersions('1.10.0', '1.2.9'), 1);
  assert.equal(format.compareVersions('1.0.0', '1.0.0'), 0);
  assert.equal(format.compareVersions('0.9.0', '1.0.0'), -1);
  assert.throws(() => format.compareVersions('../1', '1.0.0'));
});
test('manifest, SHA-256, size and corrupted JSON are verified', async () => {
  assert.equal(format.sha256(Buffer.from('abc')), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  const { bytes, manifest } = await fixture();
  assert.equal(format.verifyPackage(bytes, manifest, '0.1.0').games.length, 2);
  const corrupted = Buffer.from(bytes); corrupted[10] ^= 1;
  assert.throws(() => format.verifyPackage(corrupted, manifest, '0.1.0'));
  assert.throws(() => format.verifyPackage(bytes.subarray(1), manifest, '0.1.0'));
  const invalid = Buffer.from('{');
  assert.throws(() => format.verifyPackage(invalid, { ...manifest, files: [{ ...manifest.files[0], size: 1, sha256: format.sha256(invalid) }] }, '0.1.0'));
});
test('unsafe paths, missing assets and executable resources are rejected', async () => {
  for (const p of ['../x', '/x', 'C:/x', 'images/../../x', 'images\\x', 'images/%2e%2e/x', 'https://x', 'a//b']) assert.throws(() => format.safePath(p));
  assert.equal(format.safePath('images/ui/image.png'), 'images/ui/image.png');
  const { data, manifest } = await fixture();
  assert.throws(() => format.validateManifest({ ...manifest, files: [{ ...manifest.files[0], path: '../bundle.json' }] }, '0.1.0'));
  const bad = structuredClone(data); bad.games[0].lessons.blocks.steps[0].visual.src = '../bad.png';
  assert.throws(() => format.validateBundle(bad, '0.1.0'));
  const missing = structuredClone(data); missing.games[0].resources = {};
  assert.throws(() => format.validateBundle(missing, '0.1.0'));
  const executable = structuredClone(data); executable.games[0].resources['extras/music/evil.html'] = '<script>run()</script>';
  assert.throws(() => format.validateBundle(executable, '0.1.0'));
});
test('format and minimum application version compatibility', async () => {
  const { data, manifest } = await fixture();
  assert.throws(() => format.validateBundle({ ...data, formatVersion: 2 }, '0.1.0'));
  assert.throws(() => format.validateManifest({ ...manifest, minAppVersion: '0.2.0' }, '0.1.0'));
  assert.doesNotThrow(() => format.validateManifest(manifest, '0.1.0'));
});
test('downloaded content wins by stable ID; new games are added once', async () => {
  const { data } = await fixture(); const builtin = data.games;
  const replacement = { ...builtin[0], metadata: { ...builtin[0].metadata, title: 'Обновлённая игра' } };
  const added = { ...replacement, metadata: { ...replacement.metadata, id: 'new-game' } };
  const merged = mergeGames(builtin, [replacement, added]);
  assert.equal(merged.length, 3); assert.equal(merged[0], replacement); assert.equal(merged[2], added);
});
test('atomic installation survives corruption, failed network and offline restart; damaged active falls back', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'icube-content-test-'));
  try {
    let current = await fixture(); let failure = false, corrupt = false;
    const fetchBytes = async url => {
      if (failure) throw new Error('offline');
      if (url.endsWith('manifest.json')) return Buffer.from(JSON.stringify(current.manifest));
      return corrupt ? Buffer.from('damaged') : current.bytes;
    };
    let store = createStore(root, '0.1.0', '1.0.0', fetchBytes);
    assert.equal(await store.load(), null);
    assert.equal((await store.check()).state, 'available');
    assert.equal((await store.install()).version, '1.1.0');
    const workingPointer = await fs.readFile(path.join(root, 'active.json'), 'utf8');
    current = await fixture('1.2.0'); await store.check(); corrupt = true;
    await assert.rejects(store.install());
    assert.equal(await fs.readFile(path.join(root, 'active.json'), 'utf8'), workingPointer);
    assert.equal((await store.load()).version, '1.1.0');
    corrupt = false; failure = true; await assert.rejects(store.check());
    store = createStore(root, '0.1.0', '1.0.0', fetchBytes);
    assert.equal((await store.load()).version, '1.1.0');
    failure = false; await store.check(); await store.install();
    const active = JSON.parse(await fs.readFile(path.join(root, 'active.json'), 'utf8'));
    await fs.writeFile(path.join(root, active.current, 'bundle.json'), 'damaged');
    assert.equal((await createStore(root, '0.1.0', '1.0.0', fetchBytes).load()).version, '1.1.0');
    assert.equal(await createStore(root, '0.1.0', '2.0.0', fetchBytes).load(), null);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});
