const { createHash } = require('node:crypto');
const MODES = ['blocks', 'javascript', 'python'];
const MAX_BYTES = 40 * 1024 * 1024;
function assert(ok, message = 'Invalid content') { if (!ok) throw new Error(message); }
function safePath(value) {
  assert(typeof value === 'string' && /^[a-zA-Z0-9_./-]+$/.test(value));
  assert(!value.startsWith('/') && value.split('/').every(p => p && p !== '.' && p !== '..'), 'Unsafe path');
  return value;
}
function version(value) {
  assert(typeof value === 'string' && /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value), 'Invalid version');
  const parts = value.split('.').map(Number);
  assert(parts.every(Number.isSafeInteger), 'Invalid version');
  return parts;
}
function compareVersions(a, b) {
  const x = version(a), y = version(b);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i] ? 1 : -1;
  return 0;
}
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
function compatible(data, appVersion) {
  assert(data.formatVersion === 1, 'Unsupported content format');
  assert(compareVersions(appVersion, data.minAppVersion) >= 0, 'Application update required');
  version(data.version);
}
function validateManifest(m, appVersion) {
  compatible(m, appVersion);
  assert(m.files?.length === 1 && m.games?.length > 0);
  const f = m.files[0];
  assert(f.path === `versions/${m.version}/bundle.json`, 'Invalid package path');
  safePath(f.path);
  assert(Number.isSafeInteger(f.size) && f.size > 0 && f.size <= MAX_BYTES);
  assert(/^[a-f0-9]{64}$/.test(f.sha256));
  return m;
}
function validateBundle(data, appVersion) {
  compatible(data, appVersion);
  assert(Array.isArray(data.games) && data.games.length > 0 && data.games.length <= 100);
  const ids = new Set();
  const string = v => assert(typeof v === 'string' && v.length < 1000000);
  function lesson(l, resources, root, expectedId) {
    assert(l.id === expectedId); string(l.title);
    assert(Array.isArray(l.steps) && l.steps.length > 0 && l.steps.length < 1000);
    const steps = new Set();
    for (const s of l.steps) {
      string(s.id); assert(!steps.has(s.id)); steps.add(s.id);
      for (const k of ['title', 'goal', 'check', 'theory', 'challenge', 'actionType']) string(s[k]);
      assert(Array.isArray(s.instructions) && s.instructions.length > 0); s.instructions.forEach(string);
      assert(['code', 'ui', 'blocks'].includes(s.visual?.type)); string(s.visual.caption);
      const p = root + safePath(s.visual.type === 'code' ? s.visual.codeFile : s.visual.src);
      assert(Object.hasOwn(resources, p), `Missing resource: ${p}`);
      assert(s.visual.type === 'code' ? /\.(ts|py)$/.test(p) : /\.png$/.test(p));
      if (s.visual.images !== undefined) {
        assert(compareVersions(data.minAppVersion, '0.1.1') >= 0, 'Image sequences require application 0.1.1');
        assert(Array.isArray(s.visual.images) && s.visual.images.length > 0 && s.visual.images.length <= 20);
        for (const image of s.visual.images) {
          string(image.caption);
          assert(image.type === undefined || ['ui', 'blocks'].includes(image.type));
          const imagePath = root + safePath(image.src);
          assert(/\.png$/.test(imagePath) && Object.hasOwn(resources, imagePath), 'Missing image sequence resource');
        }
      }
      for (const k of ['newLines', 'changedLines']) assert(Array.isArray(s[k]) && s[k].every(r => Array.isArray(r) && r.length === 2 && r.every(n => Number.isSafeInteger(n) && n > 0) && r[0] <= r[1]));
      assert(Array.isArray(s.blocks) && Array.isArray(s.commands));
      for (const b of s.blocks) { string(b.category); string(b.name); string(b.purpose); }
      for (const c of s.commands) { string(c.code); string(c.purpose); }
      string(s.change?.before); string(s.change?.after);
    }
  }
  for (const g of data.games) {
    const m = g.metadata;
    assert(m && /^[a-z0-9-]+$/.test(m.id) && !ids.has(m.id)); ids.add(m.id);
    string(m.title); string(m.description);
    assert(Number.isInteger(m.difficulty) && m.difficulty >= 1 && m.difficulty <= 5);
    assert(Array.isArray(m.learns)); m.learns.forEach(string);
    string(m.cover?.hero); string(m.cover?.collectible);
    if (m.cover.enemy !== undefined) string(m.cover.enemy);
    if (m.cover.layout !== undefined) { string(m.cover.layout); assert(/^[a-z-]+$/.test(m.cover.layout)); }
    assert(g.resources && typeof g.resources === 'object' && !Array.isArray(g.resources));
    for (const [p, value] of Object.entries(g.resources)) {
      safePath(p); assert(p.startsWith(`lessons/${m.id}/`) || p.startsWith('extras/'));
      assert(typeof value === 'string');
      if (p.endsWith('.png')) {
        assert(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(value));
        assert(Buffer.from(value.split(',')[1], 'base64').subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
      } else assert(/\.(ts|py)$/.test(p) && value.length < 1000000);
    }
    assert(g.lessons && Object.keys(g.lessons).length > 0);
    for (const mode of Object.keys(g.lessons)) { assert(MODES.includes(mode) && m.modes?.[mode]?.available === true); lesson(g.lessons[mode], g.resources, `lessons/${m.id}/`, m.id); }
    for (const mode of Object.keys(m.modes)) assert(MODES.includes(mode) && typeof m.modes[mode].available === 'boolean' && (!m.modes[mode].available || g.lessons[mode]));
    assert(Array.isArray(g.improvements)); const extraIds = new Set();
    for (const e of g.improvements) {
      const em = e.metadata;
      assert(em.gameId === m.id && em.optional === true && /^[a-z0-9-]+$/.test(em.id) && !extraIds.has(em.id)); extraIds.add(em.id);
      string(em.title); string(em.description); string(em.icon);
      assert(e.lessons && Object.keys(e.lessons).length > 0);
      for (const mode of Object.keys(e.lessons)) { assert(MODES.includes(mode) && g.lessons[mode]); lesson(e.lessons[mode], g.resources, `extras/${em.id}/`, em.id); }
    }
  }
  return data;
}
function verifyPackage(bytes, manifest, appVersion) {
  validateManifest(manifest, appVersion);
  const file = manifest.files[0];
  assert(bytes.length === file.size && sha256(bytes) === file.sha256, 'Damaged package');
  const bundle = validateBundle(JSON.parse(bytes.toString('utf8')), appVersion);
  assert(bundle.version === manifest.version && bundle.minAppVersion === manifest.minAppVersion);
  assert(JSON.stringify(manifest.games) === JSON.stringify(bundle.games.map(g => ({ id: g.metadata.id, title: g.metadata.title }))));
  return bundle;
}
module.exports = { MAX_BYTES, safePath, compareVersions, sha256, validateManifest, validateBundle, verifyPackage };
