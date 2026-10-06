import { chromium, expect } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { capture } from './capture-makecode-blocks/capture.mjs';

const directory = path.resolve('lessons/maze-01');
const browser = await chromium.launch();
if (process.argv.includes('--blocks')) {
    const lesson = JSON.parse(await readFile(path.join(directory, 'blocks/lesson.json'), 'utf8'));
    const source = await readFile(path.join(directory, 'steps/map.ts'), 'utf8');
    const expression = source.slice(source.indexOf('tiles.createTilemap'), source.lastIndexOf(')'));
    const jobs = lesson.steps.filter(step => step.visual.type === 'blocks' && !existsSync(path.join(directory, step.visual.src)));
    try {
        await Promise.all([0, 1].map(async worker => {
            for (const step of jobs.filter((_, index) => index % 2 === worker))
                await capture(browser, path.join(directory, step.visual.codeFile), path.join(directory, step.visual.src), ['Игрок', 'Финиш', 'Враг'], expression);
        }));
    } finally { await browser.close(); }
    console.log('Captured ' + jobs.length + ' maze block images.');
    process.exit(0);
}
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
const page = await context.newPage();
page.setDefaultTimeout(120000);
await mkdir(path.join(directory, 'images/ui'), { recursive: true });
try {
    async function markBox(box, label) {
        await page.evaluate(({box,label}) => {
            document.getElementById('maze-focus')?.remove();
            const frame = document.createElement('div'); frame.id='maze-focus';
            Object.assign(frame.style, { position:'fixed', left:box.x+'px', top:box.y+'px',
                width:box.width+'px', height:box.height+'px', border:'6px solid #ff7900',
                borderRadius:'5px', boxSizing:'border-box', pointerEvents:'none', zIndex:'2147483647' });
            const caption = document.createElement('span');caption.textContent=label;
            Object.assign(caption.style,{position:'absolute',left:'-6px',bottom:'calc(100% + 6px)',
                background:'#ff7900',color:'#241600',font:'bold 18px sans-serif',padding:'5px 10px',whiteSpace:'nowrap'});
            frame.append(caption);document.body.append(frame);
        }, {box,label});
    }
    await page.addLocatorHandler(page.locator('.teaching-bubble-close'), async close => close.click());
    await page.goto('https://arcade.makecode.com/?lang=ru', { waitUntil: 'domcontentloaded' });
    await page.locator('.newprojectcard').click();
    await page.getByRole('textbox').fill('Лабиринт');
    await page.getByRole('button', { name: /^(Создать|Create)$/ }).click();
    await page.locator('.blocklySvg:visible').first().waitFor();
    await page.waitForFunction(() => window.E?.getEditor()?.closeTour);
    await page.evaluate(() => window.E.getEditor().closeTour());
    await page.locator('.javascript-menuitem:visible').first().click();
    await page.waitForFunction(() => window.E.getEditor().editor.editor?.getModel?.()?.uri.path.endsWith('/main.ts') && !window.E.getEditor().updatingEditorFile);
    const remaining = process.argv.includes('--remaining');
    const template = await readFile(path.join(directory, remaining ? 'steps/map.ts' : 'steps/template.ts'), 'utf8');
    await page.evaluate(async text => {
        const project = window.pxt.react.getTilemapProject();
        const expression = text.slice(text.indexOf('tiles.createTilemap'), text.lastIndexOf(')'));
        const data = window.pxt.sprite.decodeTilemap(expression, 'typescript', project);
        if (!data) throw new Error('Cannot decode Gallery stairs');
        project.createNewTilemapFromData(data, 'level1');
        await window.E.pkg.mainEditorPkg().buildAssetsAsync();
    }, template);
    const source = remaining ? await readFile(path.join(directory,'javascript/reference.ts'),'utf8') : 'tiles.setCurrentTilemap(tilemap`level1`)\n';
    await page.evaluate(code => window.E.getEditor().editor.editor.getModel().setValue(code), source);
    await page.evaluate(() => window.E.getEditor().saveFileAsync());
    await page.evaluate(() => window.E.getEditor().openBlocksAsync());
    await page.waitForFunction(() => window.E.getEditor().isBlocksActive());
    await page.evaluate(() => {
        const ws = window.E.getEditor().blocksEditor.editor;
        ws.cleanUp(); ws.setScale(1); ws.scrollCenter();
    });
    const fieldId = await page.evaluate(() => {
        const ws = window.E.getEditor().blocksEditor.editor;
        const fields = ws.getAllBlocks(false).flatMap(b => b.inputList.flatMap(i => i.fieldRow));
        const field = fields.find(f => f.constructor.name === 'FieldTilemap' || f.getValue?.()?.startsWith?.('tilemap'));
        if (!field) throw new Error('Map field not found: ' + fields.map(f => f.constructor.name + ':' + f.getValue?.()).join(','));
        const svg = field.getSvgRoot();
        svg.id = 'maze-map-field';
        svg.style.outline = '6px solid #ff7900';
        return svg.id;
    });
    if (!remaining) {
    await page.locator('#' + fieldId).locator('..').screenshot({ path: path.join(directory, 'images/ui/open-blocks.png') });
    await page.locator('#' + fieldId).click();
    await page.locator('.image-editor-region:visible').waitFor();
    await page.locator('[title="Галерея"]:visible').click();
    await page.locator('.image-editor-gallery.visible').waitFor();
    const stairs = page.locator('.image-editor-gallery.visible [title="stairs"]');
    await stairs.scrollIntoViewIfNeeded();
    await stairs.evaluate(el => { el.style.outline = '6px solid #ff7900'; });
    await page.screenshot({ path: path.join(directory, 'images/ui/gallery.png') });
    await stairs.click();
    await page.locator('.image-editor-gallery.visible').waitFor({ state: 'hidden' });
    await page.locator('[title="Forest"]:visible').click();
    await page.getByText('Dungeon', { exact: true }).click();
    await page.locator('[title="Готово"]:visible').click();
    const mapSource = await readFile(path.join(directory, 'steps/map.ts'), 'utf8');
    await page.evaluate(async text => {
        const project = window.pxt.react.getTilemapProject();
        const expression = text.slice(text.indexOf('tiles.createTilemap'), text.lastIndexOf(')'));
        const asset = window.pxt.lookupProjectAssetByTSReference('tilemap`level1`', project);
        asset.data = window.pxt.sprite.decodeTilemap(expression, 'typescript', project);
        project.updateAsset(asset);
        await window.E.pkg.mainEditorPkg().buildAssetsAsync();
    }, mapSource);
    await page.locator('#' + fieldId).click();
    await page.locator('.paint-surface.main:visible').waitFor();
    for (const [name,x,y,label] of [
        ['start',0,11,'Старт'],['finish',12,12,'Финиш'],
        ['clear-enemy',7,12,'Обычный пол'],['enemy',12,7,'Место врага']
    ]) {
        const box=await page.locator('.paint-surface.main:visible').boundingBox();
        await markBox({x:box.x+x*box.width/20,y:box.y+y*box.height/20,width:box.width/20,height:box.height/20},label);
        await page.screenshot({ path:path.join(directory,'images/ui',name+'.png') });
    }
    await page.evaluate(()=>document.getElementById('maze-focus')?.remove());
    await page.locator('[title="Готово"]:visible').click();
    await page.locator('.image-editor-region:visible').waitFor({state:'hidden'});
    await page.locator('.javascript-menuitem:visible').first().click();
    await page.waitForFunction(()=>window.E.getEditor().editor.editor?.getModel?.()?.uri.path.endsWith('/main.ts')&&!window.E.getEditor().updatingEditorFile);
    const reference=(await readFile(path.join(directory,'steps/reference.ts'),'utf8')).replace(/tiles.setCurrentTilemap\(tiles.createTilemap[\s\S]*?TileScale.Sixteen\)\)/,'tiles.setCurrentTilemap(tilemap`level1`)');
    await page.evaluate(text=>window.E.getEditor().editor.editor.getModel().setValue(text),reference);
    await page.evaluate(()=>window.E.getEditor().saveFileAsync());
    const compile=await page.evaluate(()=>window.E.compiler.compileAsync({native:false}));
    if(!compile.success) throw new Error(JSON.stringify(compile.diagnostics));
    await page.evaluate(()=>window.E.getEditor().openBlocksAsync());
    await page.waitForFunction(()=>window.E.getEditor().isBlocksActive());
    await page.evaluate(()=>window.E.getEditor().saveFileAsync());
    // Canonical MakeCode code and resources; never execute the lesson application.
    await mkdir(path.join(directory,'javascript'),{recursive:true});
    await writeFile(path.join(directory,'javascript/reference.ts'),await page.evaluate(()=>window.E.pkg.mainPkg.readFile('main.ts')));
    await mkdir(path.join(directory,'assets'),{recursive:true});
    for(const file of ['tilemap.g.jres','tilemap.g.ts']) {
        const content=await page.evaluate(name=>window.E.pkg.mainPkg.readFile(name),file);
        if(content)await writeFile(path.join(directory,'assets',file),content);
    }
    }
    for(const [variable,asset,name] of [
        ['Игрок','sprites.castle.heroWalkFront1','player-gallery'],
        ['Финиш','sprites.dungeon.chestClosed','finish-gallery'],
        ['Враг','sprites.castle.skellyWalkFront1','enemy-gallery']
    ].filter(item=>!remaining||!existsSync(path.join(directory,'images/ui',item[2].replace('gallery','editor')+'.png')))) {
        const id=await page.evaluate(variable=>{
            const ws=window.E.getEditor().blocksEditor.editor;
            const assignment=ws.getAllBlocks(false).find(b=>b.type==='variables_set'&&b.getField('VAR').getVariable().name===variable);
            const image=assignment.getDescendants(false).find(b=>b.type==='screen_image_picker')?.getField('img');
            if(!image)throw new Error('Image field missing: '+variable);
            document.getElementById('maze-image-field')?.removeAttribute('id');
            const el=image.getSvgRoot();el.id='maze-image-field';return el.id;
        },variable);
        await page.locator('#'+id).click();
        await page.screenshot({path:path.join(directory,'images/ui',name.replace('gallery','editor')+'.png')});
        await page.locator('[title="Галерея"]:visible').click();
        const item=page.locator('.image-editor-gallery.visible [title="'+asset+'"]');
        await item.scrollIntoViewIfNeeded();
        const box=await item.locator('..').boundingBox();await markBox(box,'Выбери этот рисунок');
        await page.screenshot({path:path.join(directory,'images/ui',name+'.png')});
        await page.evaluate(()=>document.getElementById('maze-focus')?.remove());
        await item.click();await page.locator('[title="Готово"]:visible').click();
        await page.locator('.image-editor-region:visible').waitFor({state:'hidden'});
    }
    for(const variable of ['Игрок','Финиш','Враг']) {
        if (remaining && existsSync(path.join(directory,'images/ui','variable-'+({'Игрок':'player','Финиш':'finish','Враг':'enemy'})[variable]+'.png'))) continue;
        if (!await page.getByText('Создать переменную...', {exact:true}).isVisible())
            await page.getByRole('treeitem',{name:'Переменные',exact:true}).click();
        await page.getByText('Создать переменную...', {exact:true}).click();
        const dialog=page.locator('.coredialog:visible');await dialog.locator('input').fill(variable);
        await markBox(await dialog.locator('input').boundingBox(),'Имя переменной');
        await page.screenshot({path:path.join(directory,'images/ui','variable-'+({'Игрок':'player','Финиш':'finish','Враг':'enemy'})[variable]+'.png')});
        await page.evaluate(()=>document.getElementById('maze-focus')?.remove());
        await dialog.locator('.closeIcon').click();
    }
    for(const [variable,kind,name] of [['Финиш','ТипФиниша','kind-finish'],['Враг','ТипВрага','kind-enemy']]){
        if (remaining && existsSync(path.join(directory,'images/ui',name+'.png'))) continue;
        const id=await page.evaluate(variable=>{
            const ws=window.E.getEditor().blocksEditor.editor;
            const assignment=ws.getAllBlocks(false).find(b=>b.type==='variables_set'&&b.getField('VAR').getVariable().name===variable);
            const field=assignment.getDescendants(false).find(b=>b.type==='spritekind').getField('MEMBER');
            document.getElementById('maze-kind')?.removeAttribute('id');
            const el=field.getSvgRoot();el.id='maze-kind';return el.id;
        },variable);
        await page.locator('#'+id).click();
        await page.getByText('Создать kind...', {exact:true}).click();
        const dialog=page.locator('.coredialog:visible');await dialog.locator('input').fill(kind);
        await markBox(await dialog.locator('input').boundingBox(),'Новый тип объекта');
        await page.screenshot({path:path.join(directory,'images/ui',name+'.png')});
        await page.evaluate(()=>document.getElementById('maze-focus')?.remove());
        await dialog.locator('.closeIcon').click();
    }
    await page.locator('.javascript-menuitem:visible').first().click();
    await page.waitForFunction(()=>window.E.getEditor().editor.editor?.getModel?.()?.uri.path.endsWith('/main.ts')&&!window.E.getEditor().updatingEditorFile);
    const canonical=await page.evaluate(()=>window.E.getEditor().editor.getCurrentSource());
    await writeFile(path.join(directory,'javascript/reference.ts'),canonical);
    const english=canonical.replaceAll('ТипВрага','EnemyKind').replaceAll('ТипФиниша','FinishKind')
        .replaceAll('Игрок','player').replaceAll('Финиш','finish').replaceAll('Враг','enemy');
    await page.evaluate(text=>window.E.getEditor().editor.editor.getModel().setValue(text),english);
    await page.evaluate(()=>window.E.getEditor().saveFileAsync());
    await page.evaluate(()=>window.E.getEditor().openBlocksAsync());
    await page.waitForFunction(()=>window.E.getEditor().isBlocksActive());
    await page.evaluate(()=>window.E.getEditor().openPython());
    await page.waitForFunction(()=>window.E.getEditor().editor.editor?.getModel?.()?.uri.path.endsWith('/main.py')&&!window.E.getEditor().updatingEditorFile);
    const python=(await page.evaluate(()=>window.E.getEditor().editor.getCurrentSource())).replace(/\bplayer2\b/g,'player');
    await mkdir(path.join(directory,'python'),{recursive:true});
    await writeFile(path.join(directory,'python/reference.py'),python);
    console.log('Saved real MakeCode Python reference.');
    for(const mode of ['python','javascript']){
        if(mode==='javascript'){
            await page.evaluate(()=>window.E.getEditor().openJavaScript());
            await page.waitForFunction(()=>window.E.getEditor().editor.editor?.getModel?.()?.uri.path.endsWith('/main.ts')&&!window.E.getEditor().updatingEditorFile);
        }
        const text=mode==='python'?'tiles.set_current_tilemap(tilemap("""\n    level1\n    """))\n':'tiles.setCurrentTilemap(tilemap`level1`)\n';
        await page.evaluate(text=>window.E.getEditor().editor.editor.getModel().setValue(text),text);
        await page.evaluate(()=>window.E.getEditor().saveFileAsync());
        const glyph=page.locator('.ms-Icon--Nav2DMapView:visible').first();
        await glyph.waitFor();
        const box=await glyph.boundingBox();await markBox(box,'Открыть карту');
        const editorBox=await page.locator('.monaco-editor:visible').last().boundingBox();
        await page.screenshot({path:path.join(directory,'images/ui','open-'+mode+'.png'),clip:{x:editorBox.x,y:Math.max(70,editorBox.y),width:Math.min(editorBox.width,1200),height:240}});
        await page.evaluate(()=>document.getElementById('maze-focus')?.remove());
    }

} finally {
    await context.close();
    await browser.close();
}
