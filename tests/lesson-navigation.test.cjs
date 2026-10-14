const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');const React=require('react');
function load(file,react=React,overrides={}){const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;vm.runInNewContext(code,{module:m,exports:m.exports,require:name=>name==='react'?react:overrides[name]||require(name)});return m.exports;}
const navigation=load('src/lessonNavigation.ts');
test('reminder counts the set of viewed pictures, including returning to picture one',()=>{assert(!navigation.needsImageReminder(1,[0]));assert(navigation.needsImageReminder(3,[0,2]));assert(!navigation.needsImageReminder(3,[0,1,2]));assert(navigation.needsImageReminder(2,[0,0]));});
test('difficulty groups keep order and existing star ratings',()=>{const {filterByDifficulty}=load('src/catalog.ts');const games=[1,3,2,5,4].map(difficulty=>({metadata:{difficulty}}));assert.deepEqual(filterByDifficulty(games,'beginner').map(g=>g.metadata.difficulty),[1,2]);assert.deepEqual(filterByDifficulty(games,'intermediate').map(g=>g.metadata.difficulty),[3]);assert.deepEqual(filterByDifficulty(games,'advanced').map(g=>g.metadata.difficulty),[5,4]);assert.equal(filterByDifficulty(games,'all'),games);});
test('step scale bypasses reminders; next warns and both reminder choices work',()=>{
 let state=[{phase:'lesson',step:0},{step:'a',viewed:[0],selected:0},false],cursor=0;
 const mock={...React,useEffect:()=>{},useRef:()=>({current:null}),useState:initial=>{const i=cursor++;return[state[i]??initial,v=>{state[i]=typeof v==='function'?v(state[i]):v}];}};
 const Player=load('src/LessonPlayer.tsx',mock,{'./LessonImages':{default:()=>null,__esModule:true},'./JavaScriptCode':{default:()=>null,__esModule:true},'./codeProtection':{codeProtection:{}},'./lessonNavigation':navigation}).default;
 const s={title:'test',goal:'',instructions:[],blocks:[],commands:[],check:'',challenge:'',theory:'',change:{before:'',after:''},visual:{type:'ui',src:'one.png',images:[{src:'one.png'},{src:'two.png'}]}};
 const props={lesson:{id:'test',title:'test',steps:[{...s,id:'a'},{...s,id:'b'},{...s,id:'c'}]},mode:'blocks',onBack:()=>{}};
 function render(){cursor=0;return Player(props)}
 function find(tree,predicate){if(!tree||typeof tree!=='object')return; if(predicate(tree))return tree;for(const child of [tree.props?.children].flat(Infinity)){const hit=find(child,predicate);if(hit)return hit;}}
 const next=t=>find(t,x=>x.type==='button'&&x.props.className==='button primary'&&!x.props.autoFocus);
 let tree=render();next(tree).props.onClick();assert.equal(state[2],true);assert.equal(state[0].step,0);
 tree=render();const pictures=find(tree,x=>x.type==='button'&&x.props.autoFocus);pictures.props.onClick();assert.equal(state[1].selected,1);assert.deepEqual(Array.from(state[1].viewed),[0,1]);assert.equal(state[2],false);
 next(render()).props.onClick();assert.equal(state[0].step,1);assert.deepEqual(Array.from(state[1].viewed),[0]);
 next(render()).props.onClick();assert.equal(state[2],true);
 tree=render();find(tree,x=>x.type==='button'&&x.props.children==='Всё равно дальше').props.onClick();assert.equal(state[0].step,2);
 tree=render();find(tree,x=>x.type==='button'&&x.props['aria-label']==='Шаг 1: test').props.onClick();assert.equal(state[0].step,0);assert.equal(state[2],false);
});
