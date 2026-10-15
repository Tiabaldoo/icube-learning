const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');const React=require('react');
function load(file,react=React,overrides={}){const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;vm.runInNewContext(code,{module:m,exports:m.exports,require:name=>name==='react'?react:overrides[name]||require(name)});return m.exports;}
const navigation=load('src/lessonNavigation.ts');
test('reminder counts the set of viewed pictures, including returning to picture one',()=>{assert(!navigation.needsImageReminder(1,[0]));assert(navigation.needsImageReminder(3,[0,2]));assert(!navigation.needsImageReminder(3,[0,1,2]));assert(navigation.needsImageReminder(2,[0,0]));});
test('difficulty sorting is stable in categories and all games without mutating the catalog',()=>{
 const {filterByDifficulty}=load('src/catalog.ts');
 const games=[{metadata:{id:'stars',difficulty:1}},{metadata:{id:'maze',difficulty:2}},{metadata:{id:'maze-2',difficulty:3}},{metadata:{id:'meteors',difficulty:1}},{metadata:{id:'five',difficulty:5}},{metadata:{id:'four',difficulty:4}}];
 const ids=(id)=>Array.from(filterByDifficulty(games,id),g=>g.metadata.id);
 assert.deepEqual(ids('beginner'),['stars','meteors','maze']);
 assert.deepEqual(ids('intermediate'),['maze-2']);assert.deepEqual(ids('advanced'),['four','five']);
 assert.deepEqual(ids('all'),['stars','meteors','maze','maze-2','four','five']);
 assert.deepEqual(games.map(g=>g.metadata.id),['stars','maze','maze-2','meteors','five','four']);
 assert.deepEqual(ids('beginner'),['stars','meteors','maze']);
});
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

// UI actions use the legacy image-only format; code steps use one code viewer.
// Duplicate sibling keys make React reuse the wrong child on later transitions.
test('meteor UI steps use legacy image format and code keys survive navigation',()=>{
 const Code=()=>null,Images=()=>null;
 let state=[],cursor=0;
 const mock={...React,useEffect:()=>{},useRef:()=>({current:null}),useState:initial=>{const i=cursor++;if(!(i in state))state[i]=initial;return[state[i],v=>{state[i]=typeof v==='function'?v(state[i]):v}];}};
 const Player=load('src/LessonPlayer.tsx',mock,{'./LessonImages':{default:Images,__esModule:true},'./JavaScriptCode':{default:Code,__esModule:true},'./codeProtection':{codeProtection:{}},'./lessonNavigation':navigation}).default;
 function nodes(tree,match,result=[]){if(!tree||typeof tree!=='object')return result;if(match(tree))result.push(tree);for(const child of[tree.props?.children].flat(Infinity))nodes(child,match,result);return result;}
 const cases=[];
 for(const root of['lessons/dodge-meteors-01',...['music','lives','speed'].map(x=>'extras/meteors-'+x)])for(const mode of['javascript','python']){
  const lesson=JSON.parse(fs.readFileSync(root+'/'+mode+'/lesson.json'));
  for(const s of lesson.steps)assert(!(s.visual.type==='code'&&s.visual.images?.length),root+' '+s.id+' uses two visual panes');
  cases.push({root,mode,lesson});
 }
 // Keep the unique-key regression covered for the general mixed format too.
 const sample=cases[0].lesson.steps.find(s=>s.visual.type==='code');
 cases.push({root:'mixed-format-fixture',mode:'javascript',lesson:{id:'fixture',title:'fixture',steps:[{...sample,id:'mixed',visual:{...sample.visual,images:[{src:'example.png',caption:'example'}]}},{...sample,id:'code'}]}});
 for(const {root,mode,lesson}of cases){state=[];
  const props={lesson,mode,onBack:()=>{},...(root.startsWith('extras/')?{onFinish:()=>{}}:{})};
  function render(){cursor=0;return Player(props);}
  const visits=[...lesson.steps.keys(),...Array.from(lesson.steps.keys()).reverse(),...lesson.steps.keys()];
  for(const index of visits){const before=render();nodes(before,n=>n.type==='button'&&n.props['aria-label']?.startsWith('Шаг '+(index+1)+':'))[0].props.onClick();const tree=render(),s=lesson.steps[index],viewers=nodes(tree,n=>n.type===Code);
   assert.equal(viewers.length,s.visual.type==='code'?1:0,s.id);if(viewers.length){assert.equal(viewers[0].props.codeFile,s.visual.codeFile);assert.equal(viewers[0].props.newLines,s.newLines);assert.equal(viewers[0].props.changedLines,s.changedLines);}
   const visual=nodes(tree,n=>n.props.className==='lesson-code-visual')[0],children=[visual?.props.children].flat(Infinity).filter(n=>n&&typeof n==='object');
   assert.equal(new Set(children.map(n=>n.key)).size,children.length,root+' '+mode+' '+s.id+' sibling keys');
   assert.equal(nodes(tree,n=>n.type===Images).length,s.visual.type!=='code'||s.visual.images?.length?1:0);
  }
 }
});
