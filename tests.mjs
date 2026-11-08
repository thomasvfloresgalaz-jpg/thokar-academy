import test, {before,after} from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';
process.env.MOCK_GEMINI='1';
process.env.ACADEMY_ACCESS_CODE='test-access-code';
const {server,validateCase,publicCase,seal,unseal,baseGrade,mockCase,jsonFromInteraction}=await import('./server.js');
let url;
before(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));url='http://127.0.0.1:'+server.address().port});
after(async()=>{await new Promise(r=>server.close(r));});
async function request(route,payload,code='test-access-code'){const r=await fetch(url+route,{method:'POST',headers:{'Content-Type':'application/json','x-academy-code':code},body:JSON.stringify(payload)});return {status:r.status,data:await r.json()}}
test('status: Gemini 3.8 Flash configured by default',async()=>{const r=await fetch(url+'/api/status');const j=await r.json();assert.equal(j.model,'gemini-3.8-flash');assert.equal(j.ok,true)});
test('public case hides root cause, server decrypts it',()=>{const c=validateCase(mockCase());const pub=publicCase(c);assert.equal(pub.hiddenCause,undefined);assert.ok(!JSON.stringify(pub).includes('Suciedad severa'));const token=seal(c);assert.equal(unseal(token).hiddenCause,c.hiddenCause);assert.throws(()=>unseal(token.slice(1))) });
test('rejects invalid repair list',()=>{const c=mockCase();c.repairs[1].correct=true;assert.throws(()=>validateCase(c))});
test('API requires access code',async()=>{const r=await request('/api/case',{},'wrong');assert.equal(r.status,401)});
test('AI structured response extracts interaction steps',()=>{const j={steps:[{type:'model_output',content:[{type:'text',text:'{"reply":"bien"}'}]}]};assert.equal(jsonFromInteraction(j).reply,'bien')});
test('full lifecycle: case, client, measurements, repair, second chance and success',async()=>{
 const created=await request('/api/case',{history:[]});assert.equal(created.status,200,JSON.stringify(created.data));const {session,case:c}=created.data;assert.ok(c.tests.length>=6);assert.ok(!JSON.stringify(c).includes('Suciedad severa'));
 const chat=await request('/api/chat',{session,message:'¿Cuándo sucede?',history:[]});assert.equal(chat.status,200);assert.ok(chat.data.reply);
 const meter=c.tests.find(t=>t.tool==='multimeter');let m=await request('/api/test',{session,id:meter.id,mode:'OHM',positive:'X',negative:'Y'});assert.equal(m.data.connected,false);m=await request('/api/test',{session,id:meter.id,mode:meter.mode,positive:meter.positive,negative:meter.negative});assert.equal(m.data.connected,true);
 const wrong=await request('/api/repair',{session,id:c.repairs.find(r=>r.id==='r2').id});assert.equal(wrong.data.improved,false);
 const failed=await request('/api/evaluate',{session,attempt:1,events:[{type:'message'}],answer:{hypothesis:'Fallo por batería',justification:'La batería estaría muy mala para el arranque',customerMessage:'Revisaré y cobraré por la batería.'}});assert.equal(failed.status,200);assert.equal(failed.data.secondChance,true);assert.equal(failed.data.reveal,'');
 const correct=await request('/api/repair',{session,id:'r1'});assert.equal(correct.data.improved,true);
 const events=[{type:'message'},{type:'message'},{type:'message'},{type:'message'},...c.tests.filter(t=>t.id==='t1'||t.id==='t2'||t.id==='t3'||t.id==='t4').map(t=>({type:'test',id:t.id})),{type:'repair',id:'r1'},{type:'verify',success:true}];
 const passed=await request('/api/evaluate',{session,attempt:2,events,answer:{hypothesis:'Cuerpo de aceleración con suciedad',justification:'El ralentí fue inestable y se observó suciedad. La limpieza eliminó el síntoma y se verificó.',customerMessage:'Se limpió el cuerpo de aceleración y se comprobó el funcionamiento del vehículo en caliente.'}});assert.equal(passed.status,200);assert.equal(passed.data.passed,true);assert.ok(passed.data.reveal.includes('Suciedad severa'));
});
test('base grade requires evidence and verification',()=>{const c=validateCase(mockCase());const g=baseGrade(c,[{type:'repair',id:'r1'}],{hypothesis:'Aceleración',justification:'Verificar después',customerMessage:'Cliente'},1);assert.equal(g.passed,false)});
