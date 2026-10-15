import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
// Actual Blockly blocks and toolbox, never a rendered imitation. Only new assembly images.
export async function captureStory(page, directory, job) {
 const images=[];
 const rounded=r=>{const x=Math.max(0,+r.x.toFixed(3)),y=Math.max(0,+r.y.toFixed(3));return{x,y,width:Math.min(+r.width.toFixed(3),100-x),height:Math.min(+r.height.toFixed(3),100-y)};};
 async function frame(){await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});}
 async function snap(name,caption,clip,region,type='blocks'){
  const src='images/ui/story-'+name+'.png',destination=path.join(directory,src);
  await page.screenshot({path:destination,clip,animations:'disabled'});
  const bytes=await fs.readFile(destination);await fs.writeFile(destination,await sharp(bytes).png({compressionLevel:9,adaptiveFiltering:true}).toBuffer());
  images.push({src,caption,type,focus:[rounded({x:(region.x-clip.x)/clip.width*100,y:(region.y-clip.y)/clip.height*100,width:region.width/clip.width*100,height:region.height/clip.height*100})]});
 }
 async function program(index,caption,focusPart){
  await frame();
  await page.evaluate(()=>{
   const roots=[...window.lessonStory.targets,...window.lessonStory.parts.flat().map(p=>p.block)];
   for(const root of roots)if(root.outputConnection?.targetConnection||root.previousConnection?.targetConnection){
    for(const b of root.getDescendants(false)){
    if(typeof b.getDisabledReasons==='function')for(const reason of b.getDisabledReasons())b.setDisabledReason(false,reason);
    if(typeof b.setEnabled==='function')b.setEnabled(true);
    if(typeof b.setDisabled==='function')b.setDisabled(false);
    }
   }
  });
  await frame();
  const {clip,region}=await page.evaluate(({index,focusPart})=>{
   const story=window.lessonStory,main=story.targets[index],root=main.getRootBlock();
   let r=root.getSvgRoot().getBoundingClientRect();const a=main.getSvgRoot().getBoundingClientRect();if(story.crop&&r.height>650)r={x:a.x-16,y:Math.max(r.y,a.y-70),width:a.width+32,height:a.height+70};const b=focusPart==='main'?main.getSvgRoot().getBoundingClientRect():story.parts[index][focusPart].block.getSvgRoot().getBoundingClientRect();
   return{clip:{x:Math.max(0,Math.floor(r.x-12)),y:Math.max(0,Math.floor(r.y-12)),width:Math.ceil(r.width+24),height:Math.ceil(r.height+24)},region:{x:b.x,y:b.y,width:b.width,height:b.height}};
  },{index,focusPart});
  await snap(job.step+'-'+images.length,caption,clip,region);
 }
 async function palette(index,partIndex,main=false){
  const info=await page.evaluate(({index,partIndex,main})=>{
   const story=window.lessonStory,b=main?story.targets[index]:story.parts[index][partIndex].block;
   const variable=b.type==='variables_get'?b.getField('VAR').getVariable().name:b.type==='argument_reporter_custom'?b.toString():null;
   return{dropdown:!main&&Boolean(story.parts[index][partIndex].dropdown),type:b.type,text:b.toString(),variable,value:b.getFieldValue('BOOL'),numeric:/^(math_number|spriteSpeedPicker)/.test(b.type),local:variable&&['location','sprite','otherSprite','sprite2','otherSprite2'].includes(variable)};
  },{index,partIndex,main});
  if(info.dropdown){
   await frame();
   const menu=await page.evaluate(({index,partIndex})=>{
    const s=window.lessonStory,p=s.parts[index][partIndex],b=p.block,root=s.targets[index].getRootBlock();
    const f=b.getField('VAR');if(!f?.getOptions)throw Error('Not a variable dropdown');
    document.querySelectorAll('#story-variable-dropdown').forEach(n=>n.removeAttribute('id'));const field=f.getSvgRoot();field.id='story-variable-dropdown';
    return {variable:f.getVariable().name};
   },{index,partIndex});
   await page.locator('#story-variable-dropdown').click();await frame();
   const {clip,region}=await page.evaluate(({index})=>{
    const main=window.lessonStory.targets[index],root=main.getRootBlock(),a=main.getSvgRoot().getBoundingClientRect(),r=root.getSvgRoot().getBoundingClientRect();
    const menu=[...document.querySelectorAll('.blocklyWidgetDiv .blocklyDropdownMenu,.blocklyDropDownDiv,.blocklyWidgetDiv .goog-menu')].map(n=>n.getBoundingClientRect()).filter(b=>b.width>0&&b.height>0).at(-1);
    if(!menu)throw Error('Variable menu is not visible');
    const context=r.height<650?r:a;const left=Math.min(context.left,menu.left)-12,top=Math.min(r.height<650?r.top:a.top-45,menu.top)-12;
    return{clip:{x:Math.max(0,Math.floor(left)),y:Math.max(0,Math.floor(top)),width:Math.ceil(Math.max(context.right,menu.right)+12-left),height:Math.ceil(Math.max(a.bottom,menu.bottom)+12-top)},region:{x:menu.x,y:menu.y,width:menu.width,height:menu.height}};
   },{index});
   await snap(job.step+'-'+images.length,'Нажми стрелку в поле спрайта и выбери «'+menu.variable+'»',clip,region,'ui');
   // Choose through the real menu; the program variable itself is unchanged.
   const option=page.getByRole('menuitem',{name:menu.variable,exact:true});
   if(await option.count())await option.click();else {await page.getByText(menu.variable,{exact:true}).filter({visible:true}).last().click();}
   return;
  }
  if(info.local){
   // Event parameters come from their header, not from the global Variables toolbox.
   await frame();const data=await page.evaluate(({index,name})=>{const root=window.lessonStory.targets[index].getRootBlock(),r=root.getSvgRoot().getBoundingClientRect(),text=[...root.getSvgRoot().querySelectorAll('text')].find(n=>n.textContent===name);if(!text)throw Error('Event argument header missing '+name);const b=text.getBoundingClientRect();return{clip:{x:Math.floor(r.x-12),y:Math.floor(r.y-12),width:Math.ceil(r.width+24),height:Math.ceil(r.height+24)},region:{x:b.x-8,y:b.y-6,width:b.width+16,height:b.height+12}};},{index,name:info.variable});await snap(job.step+'-'+images.length,`Возьми «${info.variable}» из заголовка события`,data.clip,data.region);return;
  }
  const category=main?job.category:info.variable?'Переменные':/^logic_|controls_if/.test(info.type)?'Логика':/^math_|^device_random/.test(info.type)?'Математика':/^info_|^hudScore$/.test(info.type)?'Информация':/^lists_|arrays_/.test(info.type)?'Массивы':/tiles|tilemap|scene|maplocation/i.test(info.type)?'Сцена':null;
  if(!category)throw Error('Unknown component category '+JSON.stringify(info));
  const signature=(category+'-'+info.type+'-'+(info.variable||info.value||(/function.*call|procedure.*call/i.test(info.type)?info.text:''))).replace(/[^a-zA-Zа-яА-ЯёЁ0-9_-]/g,'_');
  const fileKey='palette-'+createHash('sha256').update(signature).digest('hex').slice(0,12);
  const cachePath=path.join(directory,'images/ui/story-'+fileKey+'.json');
  let cached;try{cached=JSON.parse(await fs.readFile(cachePath,'utf8'));}catch{}
  if(cached&&!job.defaults){images.push(cached);return;}
  if(category==='Массивы'||category==='Функции'){
   const advanced=page.locator('.blocklyTreeRow[data-ns=advancedcollapsed]');if(await advanced.isVisible())await advanced.click();
  }
  await page.locator('.blocklyTreeRow').filter({hasText:category}).click({timeout:15000});
  await page.waitForFunction(()=>window.E.getEditor().blocksEditor.editor.getFlyout()?.isVisible());
  info.index=index;info.partIndex=partIndex;info.main=main;info.copyDefaults=Boolean(job.defaults);info.dropdownJob=Boolean(job.dropdownVariables);info.copyTile=Boolean(job.deferTile);
  const target=await page.evaluate(info=>{
   const ws=window.E.getEditor().blocksEditor.editor,fly=ws.getFlyout().getWorkspace();
   let block=fly.getAllBlocks(false).find(b=>b.type===info.type&&!b.getParent()&&(!/function.*call|procedure.*call/i.test(info.type)||b.toString()===info.text));
   if(!block)block=fly.getAllBlocks(false).find(b=>b.type===info.type);
   if(!block&&info.type==='gameOver')block=fly.getAllBlocks(false).find(b=>b.type==='gameOver2');
   if(!block)throw Error('Toolbox block absent '+info.type+'; '+fly.getAllBlocks(false).map(b=>b.type).join(','));
   if(info.main&&info.dropdownJob){for(const p of window.lessonStory.parts[info.index].filter(p=>p.dropdown))if(block.getInput(p.input.name)?.connection?.targetBlock()?.type!=='variables_get')throw Error('Toolbox has no variable dropdown in '+p.input.name);}
   if(info.main&&info.copyTile){const real=window.lessonStory.targets[info.index];for(const input of block.inputList){const proto=input.connection?.targetBlock(),current=real.getInput(input.name)?.connection?.targetBlock();if(proto?.type==='tileset_tile_picker'&&current?.type===proto.type)for(const row of proto.inputList)for(const f of row.fieldRow)if(f.name){const target=current.getField(f.name);if(target){window.lessonStory.numbers.push({field:target,value:target.getValue()});target.setValue(f.getValue());}}}real.workspace.render();}
   if(info.variable){const v=ws.getVariableMap().getAllVariables().find(v=>v.name===info.variable);if(!v)throw Error('Variable missing '+info.variable);block.setFieldValue(v.getId(),'VAR');}
   if(info.value)block.setFieldValue(info.value,'BOOL');
   if(info.copyDefaults){
    const real=info.main?window.lessonStory.targets[info.index]:window.lessonStory.parts[info.index][info.partIndex].block;
    function defaults(proto,current){if(proto.type!==current.type)return;
     for(const input of proto.inputList)for(const field of input.fieldRow)if(field.name&&/^(math_number|spriteSpeedPicker)/.test(proto.type)&&/^-?\d+(\.\d+)?$/.test(String(field.getValue()))){const f=current.getField(field.name);if(f)f.setValue(field.getValue());}
     for(const input of proto.inputList){const child=input.connection?.targetBlock(),other=current.getInput(input.name)?.connection?.targetBlock();if(child&&other)defaults(child,other);}
    }defaults(block,real);real.workspace.render();
   }
   document.querySelectorAll('#story-toolbox-target').forEach(el=>el.removeAttribute('id'));
   block.getSvgRoot().id='story-toolbox-target';
   const b=block.getSvgRoot().getBoundingClientRect(),view=fly.getParentSvg().getBoundingClientRect();if(b.bottom>view.bottom||b.top<view.top)fly.scroll(fly.scrollX,fly.scrollY+view.top+60-b.top);
   return block.type;
  },info);
  await frame();const b=await page.locator('#story-toolbox-target').boundingBox(),c=await page.locator('.blocklyTreeRow').filter({hasText:category}).boundingBox();
  const x=Math.max(0,Math.floor(Math.min(b.x,c.x)-8)),y=Math.max(0,Math.floor(Math.min(b.y,c.y)-8));
  const clip={x,y,width:Math.ceil(Math.max(b.x+b.width,c.x+c.width)+8-x),height:Math.ceil(Math.max(b.y+b.height,c.y+c.height)+8-y)};
  if(job.crop&&clip.height>500){clip.x=Math.max(0,Math.floor(b.x-8));clip.y=Math.max(0,Math.floor(b.y-8));clip.width=Math.ceil(b.width+16);clip.height=Math.ceil(b.height+16);}
  await snap(fileKey,info.variable?`В «Переменные» выбери овал «${info.variable}»`:`В «${category}» найди ${main?'основную команду':/^logic_compare/.test(info.type)?'сравнение':/^logic_operation/.test(info.type)?'блок «и»':/^logic_boolean/.test(info.type)?'«'+(info.value==='TRUE'?'истина':'ложь')+'»':'нужный вложенный блок'}`,clip,b,'ui');
  const last=images.at(-1);await fs.writeFile(cachePath,JSON.stringify(last));
  await page.evaluate(()=>window.E.getEditor().blocksEditor.editor.getFlyout().hide());
 }
 await page.evaluate(job=>{
  const ws=window.E.getEditor().blocksEditor.editor;
  const targets=job.targets.map(spec=>{const blocks=ws.getAllBlocks(false).filter(b=>(!spec.match||new RegExp(spec.match,'i').test(b.type))&&(!spec.text||new RegExp(spec.text,'i').test(b.toString()))&&(!spec.variable||b.getField('VAR')?.getVariable()?.name===spec.variable)&&(!spec.owner||b.getRootBlock().toString().includes(spec.owner))&&(!spec.rootMatch||new RegExp(spec.rootMatch).test(b.getRootBlock().type)));if(spec.last)blocks.reverse();const b=blocks[0];if(!b)throw Error('Story target absent '+job.step+' '+JSON.stringify(spec)+'; '+ws.getAllBlocks(false).map(b=>b.type+':'+b.toString()).join(';'));if(blocks.length>1&&!spec.last&&spec.last!==false)throw Error('Ambiguous story target '+job.step+'; specify its owner');return b;});
  const story={targets,parts:[],numbers:[],links:[],crop:Boolean(job.crop)};window.lessonStory=story;
  const parameter=b=>/^(math_number|spriteSpeedPicker|image_picker|spritekind|tileset_tile_picker|tilemap|device_note|device_beat|melody_editor|sound_picker|toggle)/.test(b.type)||/picker$/i.test(b.type);
  for(let index=0;index<targets.length;index++){
   const main=targets[index],spec=job.targets[index],parts=[];story.parts.push(parts);
   function detach(parent,input,path){const child=input.connection?.targetBlock();if(!child||!child.outputConnection||parameter(child)||spec.existing?.includes(path))return;
    const dropdown=Boolean(job.dropdownVariables&&parent===main&&child.type==='variables_get'&&child.getField('VAR')?.getOptions);
    parts.push({parent,input,block:child,path,dropdown});
    if(dropdown)return;
    for(const sub of child.inputList)if(sub.connection)detach(child,sub,path+'/'+sub.name);
    input.connection.setShadowDom(null);child.outputConnection.disconnect();child.getSvgRoot().style.display='none';
   }
   for(const input of main.inputList)if(input.connection&&(!spec.inputs||spec.inputs.includes(input.name)))detach(main,input,input.name);
   function valuesOnly(block){return [block,...block.inputList.flatMap(i=>{const child=i.connection?.targetBlock();return child?.outputConnection?valuesOnly(child):[];})];}
   for(const b of [main,...parts.map(p=>p.block)].flatMap(valuesOnly))if(/^(math_number|spriteSpeedPicker)/.test(b.type))for(const input of b.inputList)for(const f of input.fieldRow)if(f.name&&/^-?\d+(\.\d+)?$/.test(String(f.getValue()))&&!story.numbers.some(n=>n.field===f)){story.numbers.push({field:f,value:f.getValue()});if(spec.resetNumbers!==false)f.setValue('0');}
   if(index>0){const previous=main.previousConnection?.targetConnection,next=main.nextConnection?.targetConnection;if(previous){story.links[index]={previous,next};main.unplug(true);}main.getSvgRoot().style.display='none';}
  }
  ws.render();
 },job);
 for(let index=0;index<job.targets.length;index++){
  if(index)await page.evaluate(index=>{const s=window.lessonStory,b=s.targets[index],link=s.links[index];b.getSvgRoot().style.display='';if(link){const next=link.previous.targetConnection;if(next)link.previous.disconnect();link.previous.connect(b.previousConnection);if(next)b.nextConnection.connect(next);}b.workspace.render();},index);
  await palette(index,0,true);
  await program(index,job.targets[index].baseCaption||'Поставь основную команду в указанное место','main');
  const parts=await page.evaluate(index=>window.lessonStory.parts[index].map(p=>({type:p.block.type,parent:p.parent.type,input:p.input.name,path:p.path,name:p.block.type==='variables_get'?p.block.getField('VAR').getVariable().name:p.block.toString()})),index);
  for(let n=0;n<parts.length;n++){
   await palette(index,n);
   await page.evaluate(({index,n})=>{const p=window.lessonStory.parts[index][n];if(p.dropdown)return;p.block.getSvgRoot().style.display='';p.input.connection.connect(p.block.outputConnection);
    if(typeof p.block.setShadow==='function')p.block.setShadow(false);
    if(typeof p.block.getDisabledReasons==='function')for(const reason of p.block.getDisabledReasons())p.block.setDisabledReason(false,reason);
    if(typeof p.block.setEnabled==='function')p.block.setEnabled(true);
    if(typeof p.block.setDisabled==='function')p.block.setDisabled(false);
    p.block.workspace.render();},{index,n});
   const part=parts[n],label=/^variables_get$|^argument_reporter_custom$/.test(part.type)?'«'+part.name+'»':/^logic_compare/.test(part.type)?'сравнение':/^logic_operation/.test(part.type)?'блок «и»':/^logic_boolean/.test(part.type)?'логическое значение':/^math_|^device_random/.test(part.type)?'случайное число':/^info_|^hudScore$/.test(part.type)?'счёт':/^lists_/.test(part.type)?'получение элемента списка':'список мест плитки';
   const place=/^IF/.test(part.input)?'в условие «если»':part.parent==='logic_compare'?(part.input==='A'?'в левую часть сравнения':'в правую часть сравнения'):part.parent==='logic_operation'?(part.input==='A'?'в левую часть «и»':'в правую часть «и»'):part.input==='VALUE'?'в значение установки':/sprite/i.test(part.input)?'в место для спрайта':/location/i.test(part.input)?'в место клетки':/list/i.test(part.input)?'в место списка':'в свободное место команды';
   await program(index,job.dropdownVariables&&part.type==='variables_get'?'В поле спрайта выбран '+part.name:'Вставь '+label+' '+place,n);
  }
  await page.evaluate(()=>{for(const n of window.lessonStory.numbers)n.field.setValue(n.value);window.E.getEditor().blocksEditor.editor.render();});
  if(job.targets[index].settings)await program(index,job.targets[index].settings,'main');
 }
 await page.evaluate(()=>{window.lessonStory.targets.at(-1).getSvgRoot().id='instruction-command';});
 return images;
}
