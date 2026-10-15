import fs from'node:fs/promises';import path from'node:path';import{chromium}from'@playwright/test';import{capture}from'./capture-makecode-blocks/capture.mjs';
const browser=await chromium.launch(),results=[];
try{for(const root of['lessons/dodge-meteors-01',...['music','lives','speed'].map(x=>'extras/meteors-'+x)]){
await capture(browser,path.resolve(root+'/reference.ts'),path.resolve(root+'/images/final.png'),['Игрок','Метеорит'],undefined,{
 async prepare(page){console.log('BLOCK_TYPES',root,await page.evaluate(()=>[...new Set(window.E.getEditor().blocksEditor.editor.getAllBlocks(false).map(b=>b.type))]));},
 async captured(page){
  const python=await fs.readFile(root+'/python/reference.py','utf8');
  await page.evaluate(()=>window.E.getEditor().openPython());
  await page.waitForFunction(()=>window.E.getEditor().editor.editor?.getModel?.()?.uri.path.endsWith('/main.py')&&!window.E.getEditor().updatingEditorFile);
  await page.evaluate(code=>window.E.getEditor().editor.editor.getModel().setValue(code),python);await page.evaluate(()=>window.E.getEditor().saveFileAsync());
  const result=await page.evaluate(async()=>{const r=await window.E.compiler.compileAsync({native:false});return{success:r.success,diagnostics:r.diagnostics};});
  if(!result.success||result.diagnostics?.some(d=>d.category===1))throw Error('PYTHON '+JSON.stringify(result));
  results.push({root,typescript:true,blocks:true,python:true});await fs.writeFile('.meteor-compile-results.json',JSON.stringify(results,null,2));
 }
});}
}finally{await browser.close();}
