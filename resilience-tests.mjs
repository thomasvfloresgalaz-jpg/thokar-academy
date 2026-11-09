import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
process.env.NODE_ENV='test';
process.env.GEMINI_API_KEY='fake-key-for-429-test';
process.env.ACADEMY_ACCESS_CODE='local-test-code';
process.env.ACADEMY_SECRET='test-secret-permanent-over-32-characters';
const {server,unseal}=await import('./server.js');
let base;
const nativeFetch=globalThis.fetch.bind(globalThis);
let blockedRequests=0;
globalThis.fetch=async(url,opts)=>{
 if(String(url).includes('generativelanguage.googleapis.com')){
  blockedRequests++;
  return new Response(JSON.stringify({error:{code:'quota_exceeded',message:'You exceeded your current quota'}}),{status:429,headers:{'Content-Type':'application/json'}});
 }
 return nativeFetch(url,opts);
};
before(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port});
after(async()=>{await new Promise(r=>server.close(r));globalThis.fetch=nativeFetch});
async function post(route,data={},code='local-test-code'){
 const r=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json','x-academy-code':code},body:JSON.stringify(data)});
 return {status:r.status,data:await r.json()};
}
test('GET health/version and protected API access',async()=>{
 const r=await fetch(base+'/api/status');const d=await r.json();assert.equal(d.version,'2.7.0');assert.equal(d.localAvailable,true);
 const bad=await post('/api/ping',{},'mal');assert.equal(bad.status,401);
 const ok=await post('/api/ping');assert.equal(ok.status,200);assert.equal(ok.data.auth,true);
});
test('Gemini 429 triggers a ready-to-use local case instead of an error',async()=>{
 const r=await post('/api/case',{history:[]});assert.equal(r.status,200,JSON.stringify(r.data));assert.equal(r.data.mode,'local');assert.ok(/Gemini/i.test(r.data.notice));assert.ok(r.data.case.tests.length>=6);assert.equal(r.data.case.origin,'local');assert.ok(blockedRequests>=1);
 const secret=unseal(r.data.session);assert.ok(secret.hiddenCause);assert.ok(!JSON.stringify(r.data.case).includes(secret.hiddenCause));
 const chat=await post('/api/chat',{session:r.data.session,message:'¿Cuándo empezó?',history:[]});assert.equal(chat.status,200);assert.equal(chat.data.source,'local');assert.ok(chat.data.reply.length>10);
 const t=r.data.case.tests[0];const a=await post('/api/test',{session:r.data.session,id:t.id});const b=await post('/api/test',{session:r.data.session,id:t.id});assert.equal(a.status,200);assert.deepEqual(a.data,b.data);
});
test('Local mode does not call Gemini and cases vary without app updates',async()=>{
 const beforeCalls=blockedRequests;
 let history=[];let brands=new Set();
 for(let i=0;i<5;i++){
  const r=await post('/api/case',{mode:'local',history});assert.equal(r.status,200);brands.add(r.data.case.vehicle.brand);history.push({vehicle:`${r.data.case.vehicle.brand} ${r.data.case.vehicle.model}`,system:r.data.case.system,score:85});
 }
 assert.equal(blockedRequests,beforeCalls);assert.ok(brands.size>=4,`Only ${brands.size} unique brands generated`);
});
test('Second chance hides the cause, correct validated repair can pass without IA',async()=>{
 const r=await post('/api/case',{mode:'local'});assert.equal(r.status,200);
 const session=r.data.session;const c=unseal(session);
 const failure=await post('/api/evaluate',{session,attempt:1,events:[{type:'message'}],answer:{hypothesis:'No sé qué es',justification:'Sin pruebas suficientes',customerMessage:'Volveré a revisar el vehículo'} });
 assert.equal(failure.status,200);assert.equal(failure.data.secondChance,true);assert.equal(failure.data.reveal,'');
 const correct=c.repairs.find(x=>x.correct);
 const events=[{type:'message'},{type:'message'},{type:'message'},{type:'message'},...c.tests.filter(t=>t.decisive).map(t=>({type:'test',id:t.id})),{type:'repair',id:correct.id},{type:'verify',success:true}];
 const report={hypothesis:`La causa es ${c.acceptedTerms[0]}.`,justification:`Encontré ${c.acceptedTerms[0]} porque las pruebas decisivas señalan el problema y la intervención lo confirmó.`,customerMessage:'Se comprobó la falla, se reparó el componente y se verificó el resultado con el vehículo inmovilizado.'};
 const verified=await post('/api/evaluate',{session,attempt:2,events,answer:report});assert.equal(verified.status,200);assert.equal(verified.data.passed,true,JSON.stringify(verified.data));assert.ok(verified.data.reveal.length>5);
});
test('Gemini diagnostic endpoint reports quota error without crashing',async()=>{
 const r=await post('/api/check-ai');assert.equal(r.status,200);assert.equal(r.data.ok,false);assert.ok(/429|cuota/i.test(r.data.message));
});
test('JS syntax and expected UI element ids are available',async()=>{
 const html=await fs.readFile(new URL('./index.html',import.meta.url),'utf8');
 const js=await fs.readFile(new URL('./app.js',import.meta.url),'utf8');
 for(const id of ['generationScreen','newCaseBtn','localCaseBtn','emptyLocalBtn','emptyWorkshop','activeWorkshop','settingsBtn','modalOverlay','workshopCanvas','reportForm','chatForm','connectionBadge'])assert.ok(html.includes(`id="${id}"`),`Missing ${id}`);
 for(const fn of ['startNewCase','settings','renderWorkshop','showEvaluation','sendMessage'])assert.ok(js.includes(`function ${fn}`));
});
