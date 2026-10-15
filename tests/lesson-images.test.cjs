const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const format = require('../content/format.cjs');
const legacy = JSON.parse(fs.readFileSync('public/content/versions/1.0.5/bundle.json'));
function imageFixture() {
  const data = structuredClone(legacy); data.minAppVersion = '0.1.1';
  const step = data.games[0].lessons.blocks.steps[0];
  step.visual.images = [{ src: step.visual.src, caption: 'Первый рисунок', type: 'blocks' }, { src: step.visual.src, caption: 'Второй рисунок', type: 'ui' }];
  return data;
}
test('old single images remain valid; sequences require a compatible application', () => {
  assert.doesNotThrow(() => format.validateBundle(legacy, '0.1.1'));
  const data = imageFixture();
  assert.doesNotThrow(() => format.validateBundle(data, '0.1.1'));
  assert.throws(() => format.validateBundle(data, '0.1.0'), /Application update required/);
  data.minAppVersion = '0.1.0';
  assert.throws(() => format.validateBundle(data, '0.1.1'), /Image sequences require/);
});
test('all sequence paths, captions and offline resources are validated', () => {
  for (const image of [{ src: '../bad.png', caption: 'x' }, { src: 'images/missing.png', caption: 'x' }, { src: 'images/missing.ts', caption: 'x' }, { src: 'images/missing.png', caption: 42 }]) {
    const data = imageFixture(); data.games[0].lessons.blocks.steps[0].visual.images[1] = image;
    assert.throws(() => format.validateBundle(data, '0.1.1'));
  }
  const data = imageFixture(); data.games[0].lessons.blocks.steps[0].visual.images = [];
  assert.throws(() => format.validateBundle(data, '0.1.1'));
});
function gallery(index = 0) {
  let next;
  const source = fs.readFileSync('src/LessonImages.tsx', 'utf8').replace(/const images = import.meta.glob[^;]+;/, 'const images = {};');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { exports: module.exports, module, require: name => name === 'react' ? { useState: initial => [initial === 0 ? index : initial, value => { next = value; }] } : name === './BlocksImage' ? { __esModule: true, default: props => React.createElement('img', { src: props.src, alt: props.alt }) } : require(name) });
  return { render: props => module.exports.default(props), next: () => next };
}
const props = { lessonId: 'test', title: 'Урок', mini: false, resources: { 'lessons/test/one.png': '/offline-one.png', 'lessons/test/two.png': '/offline-two.png' }, visual: { src: 'one.png', caption: 'Одна картинка', type: 'ui', codeFile: '' } };
test('single image has no extra navigation; sequences change only their image', () => {
  let g = gallery();
  const oldHtml = renderToStaticMarkup(g.render(props));
  assert(oldHtml.includes('/offline-one.png')); assert(!oldHtml.includes('picture-navigation'));
  const multiple = { ...props, visual: { ...props.visual, images: [{ src: 'one.png', caption: 'Первая' }, { src: 'two.png', caption: 'Вторая' }] } };
  const first = g.render(multiple), html = renderToStaticMarkup(first);
  assert(html.includes('Картинка 1 из 2')); assert(html.includes('Первая')); assert(!html.includes('/offline-two.png'));
  first.props.children[2].props.children[2].props.onClick(); assert.equal(g.next(), 1);
  g = gallery(1); const second = g.render(multiple);
  assert(renderToStaticMarkup(second).includes('/offline-two.png'));
  second.props.children[2].props.children[0].props.onClick(); assert.equal(g.next(), 0);
  assert(renderToStaticMarkup(gallery().render(multiple)).includes('Картинка 1 из 2'));
});
test('published package contains every sequence resource and has matching SHA-256', () => {
  const manifest = JSON.parse(fs.readFileSync('public/content/manifest.json'));
  const data = format.verifyPackage(fs.readFileSync('public/content/' + manifest.files[0].path), manifest, '0.1.3');
  assert.equal(manifest.minAppVersion, '0.1.3');
  for (const game of data.games) for (const lesson of Object.values(game.lessons)) for (const step of lesson.steps) for (const image of step.visual.images || []) assert(game.resources['lessons/' + game.metadata.id + '/' + image.src]);
  assert.throws(() => format.validateManifest(manifest, '0.1.0'));
});

// Resolve the real glob patterns, rather than stubbing the bundled source maps.
test('code sources load from new and legacy paths while offline resources take priority',()=>{
 const path=require('node:path');
 const source=fs.readFileSync('src/JavaScriptCode.tsx','utf8').replace(/import\.meta\.glob<string>\(([\s\S]*?), \{[\s\S]*?\}\)/g,(_,patterns)=>'resolveGlob('+patterns+')');
 const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const m={exports:{}},mock={...React,useEffect:()=>{},useRef:()=>({current:null}),useState:initial=>[initial,()=>{}]};
 vm.runInNewContext(code,{module:m,exports:m.exports,require:name=>name==='react'?mock:name==='./codeProtection'?{codeProtection:{}}:require(name),resolveGlob:patterns=>Object.fromEntries(fs.globSync(Array.from(typeof patterns==='string'?[patterns]:patterns),{cwd:path.resolve('src')}).map(p=>[p.replaceAll('\\','/'),fs.readFileSync(path.resolve('src',p),'utf8')]))});
 const Viewer=m.exports.default;
 for(const root of['lessons/dodge-meteors-01','lessons/collect-stars-01',...['music','lives','speed'].map(x=>'extras/meteors-'+x)])for(const language of['javascript','python']){
  const lesson=JSON.parse(fs.readFileSync(root+'/'+language+'/lesson.json'));
  for(const step of lesson.steps.filter(s=>s.visual.type==='code')){
   const props={lessonId:lesson.id,sourceRoot:root.startsWith('extras/')?'extras':'lessons',language,codeFile:step.visual.codeFile,newLines:step.newLines,changedLines:step.changedLines};
   assert.equal(Viewer(props).props.className,'code-panel',root+'/'+step.visual.codeFile);
   const html=renderToStaticMarkup(Viewer({...props,sourceText:'offline_override = 1\nchanged_value = 2\n',newLines:[[1,1]],changedLines:[[2,2]]}));
   assert(html.includes('offline_override'));assert(html.includes('new-code'));assert(html.includes('changed-code'));
  }
 }
 assert.equal(Viewer({lessonId:'downloaded',sourceRoot:'lessons',language:'python',codeFile:'downloaded.py',sourceText:'offline_only = 1',newLines:[],changedLines:[]}).props.className,'code-panel');
});
