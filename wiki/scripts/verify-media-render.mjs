import fs from 'node:fs';
import path from 'node:path';
import Module,{createRequire} from 'node:module';
import ts from 'typescript';
import assert from 'node:assert/strict';
import {mediaRefs} from './layout-media.mjs';
const require=createRequire(path.resolve('package.json'));
const React=require('react'),{renderToStaticMarkup:render}=require('react-dom/server');
function component(file,deps={}){const m=new Module(path.resolve(file+'.test.cjs'));m.require=id=>deps[id]||require(id);m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,m.id);return m.exports;}
const media=component('app/media.tsx'),content=component('app/content.tsx',{'./media':media}),awakening=component('app/awakening.tsx',{'./media':media});
const b=JSON.parse(fs.readFileSync('public/data/board.json')),raw=JSON.parse(fs.readFileSync('research/board-live.json'));
const markup=c=>render(React.createElement(content.Markdown,{text:c.body,attachments:c.attachments}));
let renderedCards=0,mediaInstances=0;
for(const c of b.cards.filter(c=>c.body)){const html=markup(c);assert.ok(!html.includes('[[media:')&&!html.includes('[[demo:'),'Unrendered marker '+c.id);for(const a of c.attachments.filter(a=>a.inline)){assert.ok(html.includes(a.videoLocal||a.local||'原附件不可用'),'Inline attachment omitted '+c.id+' '+a.id);mediaInstances++;}if(mediaRefs(raw.cards.find(r=>r.shortLink===c.id).desc).length)renderedCards++;}
const ps=b.cards.find(c=>c.id==='juZtli72'),psHTML=markup(ps);
for(const [heading,id,next] of [['足球设置','6af1edbc79c8da221e5e1e79','躲避球设置'],['躲避球设置','6af1ee0778ba4496463e9297','橄榄球设置']]){const file=ps.attachments.find(a=>a.id===id).local;assert.ok(psHTML.indexOf(heading)<psHTML.indexOf(file)&&psHTML.indexOf(file)<psHTML.indexOf(next),'Wrong section for '+heading);}
const npcIndex=psHTML.indexOf('生成一名基础 NPC'),firstNPC=psHTML.indexOf(ps.attachments.find(a=>a.id==='6aaefa53303c7dc9acaf4431').local),secondNPC=psHTML.indexOf('生成1—50名 NPC');assert.ok(npcIndex<firstNPC&&firstNPC<secondNPC,'NPC media separated from its step');
const volley=b.cards.find(c=>c.id==='J71RjV1k'),vHTML=markup(volley);const serve=volley.attachments.find(a=>a.id==='6a9ca2c9795218104e934206');assert.ok(vHTML.indexOf('<strong>发球</strong>')<vHTML.indexOf(serve.videoLocal)&&vHTML.indexOf(serve.videoLocal)<vHTML.indexOf('<strong>鱼跃救球</strong>'),'Serve video placed in wrong section');
const flow=b.cards.find(c=>c.articleId==='style-perfect-copy').awakening,flowHTML=render(React.createElement(awakening.AwakeningFlow,{flow}));assert.ok(flowHTML.includes('招架250次'));assert.equal((flowHTML.match(/<span>待补<\/span>/g)||[]).length,2);assert.ok(flowHTML.includes(flow.media[0].local));
console.log(JSON.stringify({renderedCards,inlineMedia:mediaInstances,flowMedia:25,paragraphOrder:'passed',partialStageLabels:'passed'}));
