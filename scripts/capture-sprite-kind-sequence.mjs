import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {capture} from './capture-makecode-blocks/capture.mjs';

// Capture the actual kind menu on each NEW sprite, leaving the Player untouched.
const root='lessons/maze-01',mapSource=await fs.readFile(root+'/steps/map.ts','utf8');
const map=mapSource.slice(mapSource.indexOf('tiles.createTilemap'),mapSource.lastIndexOf(')'));
const browser=await chromium.launch(),results=[];
if(process.argv.includes('--variables')){
 try{for(const [name,file,key]of[['Финиш','step16.ts','finish'],['Враг','step24.ts','enemy']]){
 const src='images/ui/variable-'+key+'-before-sprite.png';let focus;
 await capture(browser,path.resolve(root+'/steps/blocks/'+file),path.resolve(root+'/images/ui/variable-'+key+'-verification.png'),['Игрок','Финиш','Враг'],map,{async prepare(page){
 await page.getByRole('treeitem',{name:'Переменные',exact:true}).click();await page.getByText('Создать переменную...',{exact:true}).click();
 const dialog=page.locator('.coredialog:visible');await dialog.locator('input').fill(name);
 const a=await dialog.boundingBox(),b=await dialog.locator('input').boundingBox(),clip={x:Math.floor(a.x-8),y:Math.floor(a.y-8),width:Math.ceil(a.width+16),height:Math.ceil(a.height+16)};
 await page.screenshot({path:path.resolve(root,src),clip,animations:'disabled'});focus=[{x:(b.x-clip.x)/clip.width*100,y:(b.y-clip.y)/clip.height*100,width:b.width/clip.width*100,height:b.height/clip.height*100}];
 const ok=dialog.getByRole('button',{name:/^(OK|ОК)$/i});if(await ok.count())await ok.click();else await dialog.getByText(/^(OK|ОК)$/i,{exact:true}).click();await dialog.waitFor({state:'hidden'});
 await page.evaluate(name=>{if(!window.E.getEditor().blocksEditor.editor.getVariableMap().getAllVariables().some(v=>v.name===name))throw Error('Variable not created');},name);
 }});await fs.unlink(root+'/images/ui/variable-'+key+'-verification.png');results.push({name,src,focus});
 }await fs.writeFile('.variable-capture-results.json',JSON.stringify(results,null,2));}finally{await browser.close();}process.exit(0);
}
try {
 for(const [name,kind,file,key] of [['Финиш','ТипФиниша','step17.ts','finish'],['Враг','ТипВрага','step25.ts','enemy']]){
  const images=[];
  await capture(browser,path.resolve(root+'/steps/blocks/'+file),path.resolve(root+'/images/ui/kind-'+key+'-verification.png'),['Игрок','Финиш','Враг'],map,{
   async prepare(page){
    async function frame(){await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});}
    async function snap(suffix,caption,type='blocks',dialog=false){
     await frame();const {clip,regions}=await page.evaluate(({dialog,menuOpen})=>{
      const main=window.kindSequence.main,r=main.getRootBlock().getSvgRoot().getBoundingClientRect(),a=main.getSvgRoot().getBoundingClientRect();
      const context=r.height<650?r:{left:a.left,top:a.top-60,right:a.right,bottom:a.bottom};
      const menu=menuOpen?[...document.querySelectorAll('.blocklyWidgetDiv .blocklyDropdownMenu,.blocklyDropDownDiv,.blocklyWidgetDiv .goog-menu')].map(n=>n.getBoundingClientRect()).filter(r=>r.width&&r.height).at(-1):null;
      const modal=dialog?document.querySelector('.coredialog input')?.getBoundingClientRect():null;
      const target=modal||menu||a;const x=Math.max(0,Math.floor(Math.min(context.left,target.left)-12)),y=Math.max(0,Math.floor(Math.min(context.top,target.top)-12));
      return{clip:{x,y,width:Math.ceil(Math.max(context.right,target.right)+12)-x,height:Math.ceil(Math.max(context.bottom,target.bottom)+12)-y},regions:[{x:target.x,y:target.y,width:target.width,height:target.height}]};
     },{dialog,menuOpen:suffix==='menu'});
     const src='images/ui/kind-'+key+'-'+suffix+'.png',target=path.resolve(root,src);await page.screenshot({path:target,clip,animations:'disabled'});
     await fs.writeFile(target,await sharp(await fs.readFile(target)).png({compressionLevel:9,adaptiveFiltering:true}).toBuffer());
     images.push({src,caption,type,focus:regions.map(r=>({x:(r.x-clip.x)/clip.width*100,y:(r.y-clip.y)/clip.height*100,width:r.width/clip.width*100,height:r.height/clip.height*100}))});
    }
    await page.evaluate(name=>{
     const ws=window.E.getEditor().blocksEditor.editor,main=ws.getAllBlocks(false).find(b=>b.type==='variables_set'&&b.getField('VAR')?.getVariable().name===name);
     if(!main)throw Error('New sprite assignment missing');
     const sprite=main.getInput('VALUE').connection.targetBlock(),kind=sprite.inputList.map(i=>i.connection?.targetBlock()).find(b=>b?.type==='spritekind');
     if(!kind)throw Error('New sprite kind field missing');
     const field=kind.getField('MEMBER');field.getSvgRoot().id='new-sprite-kind-field';window.kindSequence={main,field};
     const player=ws.getAllBlocks(false).find(b=>b.type==='variables_set'&&b.getField('VAR')?.getVariable().name==='Игрок');
     window.kindSequence.player=player.getDescendants(false).find(b=>b.type==='spritekind').getFieldValue('MEMBER');
     if(window.kindSequence.player!=='Player'||field.getValue()!=='Player')throw Error('Expected untouched Player kinds before creation');
    },name);
    await snap('untyped','Поставь создание нового спрайта в «при начале» и выбери '+name+' в первом списке');
    await page.locator('#new-sprite-kind-field').click();
    await snap('menu','В создании '+name+' открой список типа Player → «Создать kind...»','ui');
    await page.getByText('Создать kind...', {exact:true}).click();
    const dialog=page.locator('.coredialog:visible');await dialog.locator('input').fill(kind);
    await snap('dialog','Введи '+kind+' и нажми OK','ui',true);
    const ok=dialog.getByRole('button',{name:/^(OK|ОК)$/i});
    if(await ok.count())await ok.click();else await dialog.getByText(/^(OK|ОК)$/i,{exact:true}).click();
    await dialog.waitFor({state:'hidden'});
    await page.waitForFunction(kind=>window.kindSequence.field.getValue()===kind,kind);
    await page.evaluate(()=>{const ws=window.E.getEditor().blocksEditor.editor,player=ws.getAllBlocks(false).find(b=>b.type==='variables_set'&&b.getField('VAR')?.getVariable().name==='Игрок');if(player.getDescendants(false).find(b=>b.type==='spritekind').getFieldValue('MEMBER')!=='Player')throw Error('Player kind changed');});
    await snap('typed','У '+name+' выбран '+kind+'. Игрок остаётся Player');
   }
  });
  await fs.unlink(root+'/images/ui/kind-'+key+'-verification.png');results.push({name,kind,images});await fs.writeFile('.kind-capture-results.json',JSON.stringify(results,null,2));
 }
}finally{await browser.close();}
