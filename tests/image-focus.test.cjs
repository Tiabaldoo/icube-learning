const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const format = require('../content/format.cjs');
const old = JSON.parse(fs.readFileSync('public/content/versions/1.0.6/bundle.json'));
const regions = [{ x: 10, y: 20, width: 40, height: 30 }, { x: 30, y: 25, width: 40, height: 30 }];
function fixture(focus) {
  const d = structuredClone(old); d.minAppVersion = '0.1.2';
  d.games[0].lessons.blocks.steps[0].visual.focus = focus;
  return d;
}
test('focus validates bounds, overlap and compatibility without changing legacy images', () => {
  assert.doesNotThrow(() => format.validateBundle(old, '0.1.2'));
  assert.doesNotThrow(() => format.validateBundle(fixture(regions), '0.1.2'));
  assert.throws(() => format.validateBundle(fixture(regions), '0.1.1'), /Application update required/);
  const incompatible = fixture(regions); incompatible.minAppVersion = '0.1.1';
  assert.throws(() => format.validateBundle(incompatible, '0.1.2'), /Image focus requires/);
  for (const invalid of [[], null, [{ x: -1, y: 0, width: 1, height: 1 }], [{ x: 90, y: 0, width: 11, height: 10 }], [{ x: 0, y: 0, width: 0, height: 10 }], [{ x: 0, y: 0, width: 10, height: Infinity }], [{ x: '0', y: 0, width: 10, height: 10 }]]) assert.throws(() => format.validateBundle(fixture(invalid), '0.1.2'));
  const sequence = fixture(undefined), v = sequence.games[0].lessons.blocks.steps[0].visual;
  v.images = [{src:v.src,caption:v.caption,focus:regions}];
  assert.doesNotThrow(() => format.validateBundle(sequence, '0.1.2'));
  v.images[0].focus = [{x:0,y:99,width:10,height:2}];
  assert.throws(() => format.validateBundle(sequence, '0.1.2'));
});
function load(file, react = React, overrides = {}) {
  const module = {exports:{}};
  const code = ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  vm.runInNewContext(code,{module,exports:module.exports,require:name=>name==='react'?react:overrides[name]||require(name)});
  return module.exports.default;
}
const Mask = load('src/ImageFocusMask.tsx');
test('one luminance mask leaves the union of overlapping rectangles clear', () => {
  const html = renderToStaticMarkup(React.createElement(Mask,{focus:regions,id:'mask-test'}));
  assert.equal((html.match(/<mask /g)||[]).length,1);
  assert.equal((html.match(/fill="black"/g)||[]).length,2);
  assert(html.includes('rgba(0, 0, 0, 0.45)'));
  assert(html.includes('viewBox="0 0 100 100"'));
  assert(!html.includes('stroke='));
});
test('toggle shares state with fullscreen and image and mask share the transform', () => {
  let values = [], setters = [], cursor = 0;
  const mocked = {...React,useEffect:()=>{},useId:()=> 'mask-test',useRef:()=>({current:null}),useState:initial=>{const i=cursor++;const value=values[i]===undefined?initial:values[i];return [value, next=>{setters[i]=typeof next==='function'?next(value):next}];}};
  const Image = load('src/BlocksImage.tsx',mocked,{'./ImageFocusMask':{__esModule:true,default:Mask}});
  const props={src:'test.png',alt:'test',onError:()=>{},focus:regions};
  function owner(expanded, visible){values=[expanded,visible];cursor=0;return Image(props)}
  let tree=owner(false,true);const zoom=tree.props.children[0];assert.equal(zoom.props.focusVisible,true);
  zoom.props.onToggleFocus();assert.equal(setters[1],false);
  tree=owner(true,false);assert.equal(tree.props.children[1].props.focusVisible,false);
  tree.props.children[1].props.onToggleFocus();assert.equal(setters[1],true);
  function view(focus, visible){values=[{width:500,height:300},{width:1000,height:500},2,{x:25,y:10},false];cursor=0;return zoom.type({...zoom.props,focus,focusVisible:visible});}
  const active=view(regions,true), plane=active.props.children[1].props.children;
  assert(plane.props.style.transform.includes('translate(25px, 10px) scale(2)'));
  assert.equal(plane.props.children[0].type,'img');assert.equal(plane.props.children[1].type,Mask);
  assert(renderToStaticMarkup(active).includes('Показать всё'));
  const hidden=view(regions,false);assert.equal(hidden.props.children[1].props.children.props.children[1],null);
  assert(renderToStaticMarkup(hidden).includes('Показать выделение'));
  const legacyHtml=renderToStaticMarkup(view(undefined,true));assert(!legacyHtml.includes('focus-toggle'));assert(!legacyHtml.includes('<svg'));
});
