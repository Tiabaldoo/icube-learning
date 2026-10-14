import fs from 'node:fs';import assert from 'node:assert/strict';import ts from 'typescript';
const root='lessons/maze-02',read=p=>fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n');
for(const mode of ['blocks','javascript','python']){
 const lesson=JSON.parse(read(root+'/'+mode+'/lesson.json'));
 const source=s=>read(root+'/'+s.visual.codeFile);
 assert.equal(source(lesson.steps[0]),read(mode==='blocks'?'lessons/maze-01/steps/blocks/step32.ts':mode==='python'?'lessons/maze-01/python/steps/step32.py':'lessons/maze-01/javascript/steps/step30.ts'));
 assert.equal(source(lesson.steps.at(-1)),read(root+(mode==='python'?'/python/steps/10.py':'/javascript/steps/9.ts')));
 let memoryCreated=false,drawn=false;const spriteCounts=mode==='python'?[/my_player = sprites.create/g,/enemy = sprites.create/g,/finish = sprites.create/g]:[/Игрок = sprites.create/g,/let Враг = sprites.create/g,/let Финиш = sprites.create/g];
 for(const step of lesson.steps){const code=source(step);
   for(const path of [step.visual.codeFile,step.visual.type==='code'?null:step.visual.src,...(step.visual.images||[]).map(i=>i.src)].filter(Boolean))assert(fs.existsSync(root+'/'+path),path);
   for(const range of [...step.newLines,...step.changedLines])assert(range[1]<=code.split('\n').length);
   const init=mode==='python'?'have_key = False':'let ЕстьКлюч = false';if(code.includes(init))memoryCreated=true;if(memoryCreated)assert(code.includes(init),'Initial false disappeared at '+step.title);
   for(const pattern of spriteCounts){if(mode==='python'&&step===lesson.steps[0]&&pattern===spriteCounts[0])continue;assert.equal((code.match(pattern)||[]).length,1,'Existing sprite changed at '+step.title);}
   const key=code.match(mode==='python'?/key = sprites.create\(img\("""([\s\S]*?)"""\)/:/let Ключ = sprites.create\(img`([\s\S]*?)`/);
   if(step.title==='Нарисуй ключ')drawn=true;
   if(key&&!drawn)assert(!/[1-9a-f]/.test(key[1]),'Key drawn too early at '+step.title);
   if(key&&drawn)assert(/[1-9a-f]/.test(key[1]),'Key drawing disappeared at '+step.title);
   if(mode!=='python'){
     const ast=ts.createSourceFile('step.ts',code,ts.ScriptTarget.Latest,true);
     const functions=new Set(ast.statements.filter(ts.isFunctionDeclaration).map(f=>f.name.text));
     const visit=node=>{if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&['начатьПопытку','загрузитьУровень'].includes(node.expression.text))assert(functions.has(node.expression.text),'Function called before creation');ts.forEachChild(node,visit)};visit(ast);assert.equal(ast.parseDiagnostics.length,0);
   }
 }
 console.log(mode+': '+lesson.steps.length+' steps; resources, highlights, initial/final equality, sprite and memory continuity OK');
}
