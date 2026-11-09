import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {COMPONENTS,CATALOG_TESTS,classifyTest} from './catalog.js';
process.env.NODE_ENV='test';
process.env.ACADEMY_ACCESS_CODE='academy-27-test-code';
process.env.ACADEMY_LOCAL_ONLY='1';
process.env.ACADEMY_SECRET='permanent-dedicated-secret-for-test-27';
const {server,baseGrade,validateCase,mockCase,unseal}=await import('./server.js');
let url;
before(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));url='http://127.0.0.1:'+server.address().port});
after(()=>new Promise(resolve=>server.close(resolve)));
async function post(endpoint,value={}){const r=await fetch(url+'/api/'+endpoint,{method:'POST',headers:{'Content-Type':'application/json','x-academy-code':'academy-27-test-code'},body:JSON.stringify(value)});assert.equal(r.status,200,`Error ${endpoint}: ${await r.clone().text()}`);return await r.json()}
test('Reparar y verificar completa un caso sin obligación de revisar las pruebas internas',async()=>{
 const {session}=await post('case-start',{mode:'local'});const c=unseal(session);const correct=c.repairs.find(r=>r.correct);
 const events=[{type:'repair',id:correct.id},{type:'verify',success:true}];
 const answer={hypothesis:'Reparación comprobada',justification:'La reparación corrigió el síntoma y se comprobó en las mismas condiciones.',customerMessage:'Se efectuó el trabajo y se confirmó el funcionamiento.'};
 const result=await post('evaluate',{session,events,answer,attempt:1});
 assert.equal(result.passed,true);assert.equal(result.secondChance,false);assert.equal(result.found,0);assert.equal(result.reveal,c.hiddenCause);assert.ok(result.score<100,'No debería regalar nota perfecta por omitir evidencia');
 const again=await post('evaluate',{session,events,answer,attempt:1});assert.deepEqual(again,result,'Evaluación repetida estable');
});
test('Sin reparación correcta y verificación, se mantiene la segunda oportunidad',async()=>{
 const c=validateCase(mockCase());const result=baseGrade(c,[{type:'test',id:'t1'}],{hypothesis:c.hiddenCause,justification:'Se verificó una prueba, sin reparación aún.',customerMessage:'Se realizaron las pruebas, falta reparación.'},1);
 assert.equal(result.passed,false);assert.equal(result.secondChance,true);
});
test('Pistas progresivas sin revelar la falla y rendición con causa y evidencia',async()=>{
 const {session}=await post('case-start',{mode:'local'});const c=unseal(session);
 for(let level=1;level<=3;level++){const h=await post('hint',{session,level});assert.equal(h.level,level);assert.ok(h.hint.length>20);assert.equal(JSON.stringify(h).includes(c.hiddenCause),false);}
 const final=await post('surrender',{session});assert.equal(final.surrendered,true);assert.equal(final.score,0);assert.equal(final.reveal,c.hiddenCause);assert.ok(final.correctRepair);assert.ok(final.decisive.length>=1);
});
test('Sensor de oxígeno disponible en motor y en electrónico, con pruebas seguras',()=>{
 for(const category of ['motor','electrico']) assert.ok(COMPONENTS[category].find(c=>c.id==='oxigeno'),category);
 for(const category of ['motor','electrico']) assert.ok(CATALOG_TESTS.filter(t=>t.componentId==='oxigeno'&&t.systemId===category).length>=3);
 for(const phrase of ['Medir sensor de oxígeno antes del catalizador','Consultar sonda lambda','Señal O2 sensor']) assert.equal(classifyTest({label:phrase,tool:'scanner',zone:'engine'},{}).componentId,'oxigeno');
});
test('Página tiene controles de pista, rendirse y CTA a informe; navegación catálogo no deja desplazamiento heredado',async()=>{
 const html=await (await fetch(url+'/')).text(),js=await(await fetch(url+'/app.js')).text(),css=await(await fetch(url+'/style.css')).text();
 for(const id of ['hintBtn','surrenderBtn','hintCounter','goReportAfterVerify','toolFilters'])assert.ok(html.includes(`id="${id}"`),id);
 assert.ok(js.includes('function catalogTop()'));assert.ok(js.includes('catalogTop()'));assert.ok(css.includes('overflow-anchor:none'));
});
