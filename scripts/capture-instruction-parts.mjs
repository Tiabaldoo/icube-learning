import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { capture } from './capture-makecode-blocks/capture.mjs';
// Capture only missing assembly stages in real Blockly; final lesson code is read-only.
const allJobs=JSON.parse(await fs.readFile('scripts/instruction-capture-jobs.json','utf8'));
const previous=JSON.parse(await fs.readFile('.instruction-capture-results.json','utf8').catch(()=> '[]'));
for(const j of allJobs)if(j.root.includes('maze')){const text=await fs.readFile('lessons/maze-01/steps/map.ts','utf8');j.map=text.slice(text.indexOf('tiles.createTilemap'),text.lastIndexOf(')'));}
const selected=process.argv.slice(2);
const jobs=allJobs.filter(j=>!selected.length||selected.includes(j.root+'/'+j.step)).filter(j=>!previous.some(p=>p.root===j.root&&p.step===j.step));
const browser=await chromium.launch();const results=previous;
try {
 for(const job of jobs){
  const directory=path.resolve(job.root);await fs.mkdir(path.join(directory,'images/ui'),{recursive:true});
  const entry={...job};
  await capture(browser,path.join(directory,job.code),path.join(directory,job.partial),['Игрок','Звезда','Враг','Финиш','Ключ','Дверь','Уровень','ЕстьКлюч'],job.map,{
   async assets(page){if(job.root==='lessons/maze-02'||job.root==='extras/maze-chase'){
    const text=await fs.readFile('lessons/maze-02/assets/level2.ts','utf8');const expression=text.slice(text.indexOf('tiles.createTilemap'),text.lastIndexOf(')'));
    await page.evaluate(async expression=>{const project=window.pxt.react.getTilemapProject();const data=window.pxt.sprite.decodeTilemap(expression,'typescript',project);project.createNewTilemapFromData(data,'level2');await window.E.pkg.mainEditorPkg().buildAssetsAsync()},expression);
   }},
   async decompiled(page){if(job.root==='lessons/maze-02'||job.root==='extras/maze-chase')await page.evaluate(()=>{
    const ws=window.E.getEditor().blocksEditor.editor;
    for(const b of ws.getAllBlocks(false))if(/^(typescript|ts)_(statement|expression)$/.test(b.type)){
      const text=b.toString(),parent=b.getParent();if(text==='null'&&parent?.type==='variables_set'&&parent.getField('VAR').getVariable().name==='Дверь'){parent.unplug(true);parent.dispose(false);continue;}throw Error('Unexpected unconverted block: '+text);
    }
    const startup=ws.getTopBlocks(false).find(b=>b.type==='pxt-on-start'), variable=ws.getVariableMap().getAllVariables().find(v=>v.name==='ЕстьКлюч');
    if(startup&&variable){const connection=startup.getInput('HANDLER').connection;let b=connection.targetBlock(),found=false;while(b){if(b.type==='variables_set'&&b.getField('VAR').getVariable().name===variable.name)found=true;b=b.getNextBlock();}
      if(!found){const setter=ws.newBlock('variables_set');setter.setFieldValue(variable.getId(),'VAR');setter.initSvg();const value=ws.newBlock('logic_boolean');value.setFieldValue('FALSE','BOOL');value.initSvg();setter.getInput('VALUE').connection.connect(value.outputConnection);const first=connection.targetConnection;if(first)connection.disconnect();connection.connect(setter.previousConnection);if(first)setter.nextConnection.connect(first);value.render();setter.render();}
    }
   });},
   async prepare(page){
    if(job.final)return;
    if(job.foundation){
      await page.evaluate(job=>{
        const ws=window.E.getEditor().blocksEditor.editor;
        const target=ws.getAllBlocks(false).find(b=>new RegExp(job.match,'i').test(b.type)&&(!job.owner||b.getRootBlock().toString().includes(job.owner))&&(!job.rootMatch||new RegExp(job.rootMatch).test(b.getRootBlock().type))&&(!job.variable||b.getField('VAR')?.getVariable()?.name===job.variable));
        if(!target)throw Error('Foundation not found '+job.step+' '+ws.getAllBlocks(false).map(b=>b.type).join(','));
        target.getSvgRoot().id='instruction-command';
        for(const name of job.inputs){const input=target.getInput(name);if(!input?.connection)throw Error('Input missing '+name+' '+target.inputList.map(i=>i.name));const child=input.connection.targetBlock();input.connection.setShadowDom(null);if(child)child.dispose(false);}
        ws.render();
      },job);return;
    }
    if(job.category){
      if(job.category==='Массивы') await page.locator('.blocklyTreeRow[data-ns=advancedcollapsed]').click({timeout:15000});
      await page.locator('.blocklyTreeRow').filter({hasText:job.category}).click({timeout:15000});
      await page.waitForFunction(()=>!!window.E.getEditor().blocksEditor.editor.getFlyout()?.isVisible());
      const target=await page.evaluate(match=>{const ws=window.E.getEditor().blocksEditor.editor.getFlyout().getWorkspace();const b=ws.getAllBlocks(false).find(b=>new RegExp(match,'i').test(b.type+' '+b.toString()));if(!b)throw Error('Palette target missing '+match+' '+ws.getAllBlocks(false).map(b=>b.type+':'+b.toString()).join(';'));b.getSvgRoot().id='instruction-toolbox';const box=b.getSvgRoot().getBoundingClientRect();const view=ws.getParentSvg().getBoundingClientRect();if(box.bottom>view.bottom||box.top<view.top)ws.scroll(ws.scrollX,ws.scrollY+view.top+60-box.top);return 'instruction-toolbox';},job.match);
      await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
      const bbox=await page.locator('#'+target).boundingBox(),size=page.viewportSize();
      entry.menuFocus=[{x:bbox.x/size.width*100,y:bbox.y/size.height*100,width:bbox.width/size.width*100,height:bbox.height/size.height*100}];
      await page.screenshot({path:path.join(directory,job.menu),animations:'disabled'});
      await page.evaluate(()=>window.E.getEditor().blocksEditor.editor.getFlyout().hide());return;
    }
    const variable = await page.evaluate(name=>{
      const ws=window.E.getEditor().blocksEditor.editor;
      const variables=ws.getVariableMap().getAllVariables();
      const variable=variables.find(v=>v.name===name)||variables.find(v=>v.name.startsWith(name));
      if(!variable)throw Error('Variable missing: '+name);
      return variable.name;
    },job.variable);
    const category=page.getByRole('treeitem',{name:/^Переменные$/});await category.click();
    await page.waitForFunction(()=>!!window.E.getEditor().blocksEditor.editor.getFlyout()?.isVisible());
    await page.waitForFunction(()=>window.E.getEditor().blocksEditor.editor.getFlyout().getWorkspace().getAllBlocks(false).some(b=>b.type==='variables_get'));
    await page.evaluate(name=>{const ws=window.E.getEditor().blocksEditor.editor;const getter=ws.getFlyout().getWorkspace().getAllBlocks(false).find(b=>b.type==='variables_get');const variable=ws.getVariableMap().getAllVariables().find(v=>v.name===name);getter.setFieldValue(variable.getId(),'VAR');},variable);
    const targetId=await page.evaluate(name=>{
      const ws=window.E.getEditor().blocksEditor.editor.getFlyout().getWorkspace();
      const block=ws.getAllBlocks(false).find(b=>b.type==='variables_get'&&b.getField('VAR').getVariable().name===name);
      if(!block)throw Error('Variable getter missing '+name);
      block.getSvgRoot().id='instruction-variable';return 'instruction-variable';
    },variable);
    await page.locator('#'+targetId).scrollIntoViewIfNeeded();
    const bbox=await page.locator('#'+targetId).boundingBox();
    await page.screenshot({path:path.join(directory,job.menu),animations:'disabled'});
    const size=page.viewportSize();entry.menuFocus=[{x:bbox.x/size.width*100,y:bbox.y/size.height*100,width:bbox.width/size.width*100,height:bbox.height/size.height*100}];
    await page.evaluate(()=>window.E.getEditor().blocksEditor.editor.getFlyout().hide());
    await page.evaluate(({variable,match,owner})=>{
      const ws=window.E.getEditor().blocksEditor.editor;
      const blocks=ws.getAllBlocks(false).filter(b=>new RegExp(match,'i').test(b.type)&&(!owner||b.getRootBlock().toString().includes(owner)));
      const target=blocks.reverse().find(b=>b.inputList.some(i=>{const child=i.connection?.targetBlock();return child?.type==='variables_get'&&child.getField('VAR').getVariable().name===variable}));
      if(!target)throw Error('Input not found '+match+' '+variable+' '+JSON.stringify(ws.getAllBlocks(false).map(b=>({type:b.type,inputs:b.inputList.map(i=>({name:i.name,type:i.connection?.targetBlock()?.type,text:i.connection?.targetBlock()?.toString()}))}))));
      target.getSvgRoot().id='instruction-command';
      const input=target.inputList.find(i=>{const child=i.connection?.targetBlock();return child?.type==='variables_get'&&child.getField('VAR').getVariable().name===variable});
      input.connection.targetBlock().dispose(false);
      ws.render();
    },{variable,match:job.match,owner:job.owner});
   },
   async captured(page,clip){if(job.category)return;if(job.final)await page.evaluate(()=>{const ws=window.E.getEditor().blocksEditor.editor;const b=ws.getAllBlocks(false).find(b=>/follow/i.test(b.type));if(!b)throw Error('Follow command missing');b.getSvgRoot().id='instruction-command';});const box=await page.locator('#instruction-command').boundingBox();entry.partialFocus=[{x:Math.max(0,(box.x-clip.x)/clip.width*100),y:Math.max(0,(box.y-clip.y)/clip.height*100),width:Math.min(box.width/clip.width*100,100),height:Math.min(box.height/clip.height*100,100)}];}
  });if(job.category)await fs.unlink(path.join(directory,job.partial));results.push(entry);await fs.writeFile('.instruction-capture-results.json',JSON.stringify(results,null,2));
 }
}finally{await browser.close();}
