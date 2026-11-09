import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {CATALOG_TESTS,COMPONENTS,SYSTEMS,guideFor} from './catalog.js';
import {questionIntent,normalizeQuestion,memoryFromMessages,priorAnswer} from './memory.js';
process.env.NODE_ENV='test';process.env.ACADEMY_LOCAL_ONLY='1';process.env.ACADEMY_ACCESS_CODE='local-fixed';process.env.ACADEMY_SECRET='development-tests-fixed-secret-kept-safe';
const {server,unseal,baseGrade}=await import('./server.js');
let host;
before(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));host='http://127.0.0.1:'+server.address().port});
after(()=>new Promise(ok=>server.close(ok)));
async function call(route,data){const r=await fetch(host+route,{method:'POST',headers:{'Content-Type':'application/json','x-academy-code':'local-fixed'},body:JSON.stringify(data)});assert.equal(r.status,200,await r.clone().text());return r.json()}
test('Catálogo libre: sistemas, componentes y 70+ revisiones disponibles',()=>{
 assert.ok(SYSTEMS.length>=6);assert.ok(CATALOG_TESTS.length>=70);assert.ok(COMPONENTS.electrico.some(x=>x.id==='bateria'));
 assert.ok(COMPONENTS.electrico.some(x=>x.id==='alternador'));assert.ok(COMPONENTS.electrico.some(x=>x.id==='ecu'));
 const meter=CATALOG_TESTS.find(x=>x.tool==='multimeter');assert.ok(guideFor(meter).some(x=>x.includes('Punta roja')));
});
test('Catálogo: medición incorrecta no registrada y lectura didáctica estable',async()=>{
 const {session}=await call('/api/case-start',{mode:'local'});const t=CATALOG_TESTS.find(x=>x.componentId==='bateria'&&x.tool==='multimeter');
 const bad=await call('/api/test',{session,id:t.id,mode:'OHM',positive:'x',negative:'y'});assert.equal(bad.connected,false);
 const d={session,id:t.id,mode:t.mode,positive:t.positive,negative:t.negative};const a=await call('/api/test',d),b=await call('/api/test',d);
 assert.equal(a.connected,true);assert.equal(a.generic,true);assert.deepEqual(a,b);
});
test('Respuestas locales distintas y nombres de hombres',async()=>{
 const {session,case:c}=await call('/api/case-start',{mode:'local'});assert.ok(['Matías','Ignacio','César','Alejandro','Rodrigo','Sebastián','Felipe','Francisco','Javier','Diego','Nicolás','Cristóbal','Andrés','Gabriel','Tomás'].includes(c.customer.name));
 const km=await call('/api/chat',{session,message:'¿Cuántos km tiene el auto?',history:[]});
 const val=await call('/api/chat',{session,message:'¿Desde cuándo lo nota?',history:[]});
 assert.notEqual(km.reply,val.reply);assert.match(km.reply,/km/);
});
test('Evaluación no cambia si se presiona dos veces sin nuevas acciones',async()=>{
 const {session}=await call('/api/case-start',{mode:'local'});const c=unseal(session),correct=c.repairs.find(x=>x.correct);
 const events=[{type:'message'},...c.tests.filter(x=>x.decisive).map(x=>({type:'test',id:x.id})),{type:'repair',id:correct.id},{type:'verify',success:true}];
 const answer={hypothesis:c.hiddenCause,justification:'Comprobé las pruebas discriminantes, comparé los resultados y confirmé la reparación mediante una verificación de funcionamiento.',customerMessage:'Le explico que se revisó la falla, se realizó la reparación necesaria y se comprobó que funciona correctamente.'};
 const req={session,events,answer,attempt:1};const a=await call('/api/evaluate',req),b=await call('/api/evaluate',req);
 assert.deepEqual(a,b);assert.equal(a.passed,true);assert.equal(a.score,100);assert.equal(a.communication,100);
});
test('Memoria aprende preguntas sin transferir automáticamente respuestas de otro cliente',()=>{
 const c={id:'case-1',vehicle:{brand:'Toyota',model:'Yaris'},complaint:'ralentí inestable'};
 const messages=[{role:'mechanic',text:'¿Cuántos km tiene el auto?'},{role:'client',text:'Tengo 156.000 kilómetros',source:'case-memory'}];
 let memo=memoryFromMessages(null,c,messages);memo=memoryFromMessages(memo,c,messages);assert.equal(memo.intents.mileage,1);
 assert.equal(priorAnswer(messages,'cuantos km tiene el auto'),'Tengo 156.000 kilómetros');
 assert.equal(questionIntent('¿Cuántos km tiene?'),'mileage');
 assert.equal(memo.examples[0].caseId,'case-1');assert.ok(!memo.examples.some(x=>x.caseId==='case-2'));
});
