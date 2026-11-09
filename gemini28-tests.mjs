import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';
process.env.ACADEMY_ACCESS_CODE='test-28-access';
process.env.ACADEMY_SECRET='test-28-stable-private-key';
process.env.GEMINI_API_KEY='test-gemini-key';
process.env.GEMINI_MODEL='gemini-3.8-flash';
process.env.GEMINI_CHAT_MODEL='gemini-3.8-flash';
process.env.GEMINI_FALLBACK_MODEL='gemini-3.5-flash-lite';
delete process.env.MOCK_GEMINI;
const {server,seal,validateCase,mockCase}=await import('./server.js');
const {textFromGenerateContent,parseGeminiJSON}=await import('./gemini-client.js');
const realFetch=globalThis.fetch;
let calls=[],scenario='chat',responses=0;
globalThis.fetch=async(url,options={})=>{
 if(String(url).startsWith('https://generativelanguage.googleapis.com/')){
  const req=JSON.parse(options.body);calls.push({url:String(url),req});responses++;
  if(scenario==='schema-error' && req.generationConfig?.responseSchema)return new Response(JSON.stringify({error:{message:'responseSchema not supported for this request'}}),{status:400,headers:{'Content-Type':'application/json'}});
  if(scenario==='quota')return new Response(JSON.stringify({error:{message:'Quota exceeded'}}),{status:429,headers:{'Content-Type':'application/json'}});
  if(scenario==='forbidden')return new Response(JSON.stringify({error:{message:'Permission denied'}}),{status:403,headers:{'Content-Type':'application/json'}});
  if(scenario==='broken')return new Response(JSON.stringify({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[]}}]}),{status:200,headers:{'Content-Type':'application/json'}});
  const isCase=req.generationConfig?.responseMimeType==='application/json';
  const text=isCase?JSON.stringify(mockCase()):req.contents.at(-1).parts[0].text.toLowerCase().includes('fren')?'No, al frenar no he sentido nada extraño, compadre.':'Lo noto más con el motor caliente, después de manejar unos minutos.';
  return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text}]}}]}),{status:200,headers:{'Content-Type':'application/json'}});
 }
 return realFetch(url,options);
};
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port;
async function post(path,value){const response=await realFetch(base+path,{method:'POST',headers:{'Content-Type':'application/json','x-academy-code':'test-28-access'},body:JSON.stringify(value)});return {status:response.status,data:await response.json()};}
const token=seal(validateCase(mockCase()));
async function poll(job){for(let i=0;i<80;i++){const r=await post('/api/case-progress',{job});if(r.data.status!=='pending')return r.data;await new Promise(r=>setTimeout(r,25));}throw Error('Test job took too long');}
test.after(async()=>{globalThis.fetch=realFetch;await new Promise(ok=>server.close(ok));});
test('check-ai uses THOKAR ZERO generateContent, not Interactions',async()=>{
 scenario='chat';calls=[];const r=await post('/api/check-ai',{});assert.equal(r.status,200);assert.equal(r.data.ok,true);
 assert.match(calls[0].url,/models\/gemini-3\.8-flash:generateContent$/);
 assert.ok(Array.isArray(calls[0].req.contents));assert.equal(calls[0].req.response_format,undefined);
});
test('chat responds to distinct questions and carries history with separate roles',async()=>{
 scenario='chat';calls=[];
 const a=await post('/api/chat',{session:token,message:'¿Cuándo comenzó la falla?',history:[]});
 assert.equal(a.data.source,'ai');assert.match(a.data.reply,/caliente/);
 const hist=[{role:'mechanic',text:'¿Cuándo comenzó la falla?'},{role:'client',text:a.data.reply}];
 const b=await post('/api/chat',{session:token,message:'¿Y al frenar siente algo?',history:hist});
 assert.equal(b.data.source,'ai');assert.match(b.data.reply,/frenar/);
 const c=calls.at(-1).req.contents;assert.equal(c[0].role,'user');assert.equal(c[1].role,'model');assert.equal(c[2].role,'user');
 assert.doesNotMatch(JSON.stringify(calls.at(-1).req),/Suciedad severa del cuerpo de aceleración/);
});
test('Gemini case is generated in server-side job then returned with only one generation call',async()=>{
 scenario='case';calls=[];
 const start=await post('/api/case-start',{mode:'ai',history:[]});
 assert.equal(start.status,200);assert.equal(start.data.status,'pending');
 const done=await poll(start.data.job);
 assert.equal(done.status,'completed');assert.equal(done.mode,'ai');assert.ok(done.case.tests.length>=6);
 assert.equal(done.case.hiddenCause,undefined);assert.equal(calls.length,1);
 const repeated=await post('/api/case-progress',{job:start.data.job});assert.equal(repeated.data.case.id,done.case.id);assert.equal(calls.length,1);
});
test('Schema unsupported: retries once as JSON without schema, same model',async()=>{
 scenario='schema-error';calls=[];const started=await post('/api/case-start',{mode:'ai'});const result=await poll(started.data.job);
 assert.equal(result.status,'completed');assert.equal(result.mode,'ai');assert.equal(calls.length,2);
 assert.equal(calls[0].req.generationConfig.responseMimeType,'application/json');
 assert.equal(calls[1].req.generationConfig.responseSchema,undefined);
 assert.match(calls[1].url,/gemini-3\.8-flash:generateContent/);
});
test('Gemini quota 429 is reported, not silently switched to local',async()=>{
 scenario='quota';calls=[];
 const started=await post('/api/case-start',{mode:'ai'});const result=await poll(started.data.job);
 assert.equal(result.status,'failed');assert.match(result.message,/429|cuota/i);assert.equal(result.case,undefined);
 assert.equal(calls.length,2);assert.match(calls[1].url,/flash-lite:generateContent/);
});
test('Invalid API output fails explicitly and does not show local case',async()=>{
 scenario='broken';calls=[];
 const started=await post('/api/case-start',{mode:'ai'});const result=await poll(started.data.job);
 assert.equal(result.status,'failed');assert.match(result.message,/sin contenido|no entregó texto/i);
});
test('Chat quota failure replies from original case, source tagged local, and no hallucinated diagnosis',async()=>{
 scenario='quota';const r=await post('/api/chat',{session:token,message:'¿A qué velocidad ocurre?',history:[]});
 assert.equal(r.status,200);assert.equal(r.data.source,'local');assert.equal(r.data.aiReason,'quota');assert.ok(r.data.reply);
 assert.doesNotMatch(r.data.reply,/Suciedad severa del cuerpo de aceleración/);
});
test('JSON and text parsing support native generateContent candidates',()=>{
 assert.equal(textFromGenerateContent({candidates:[{content:{parts:[{text:'Hola, buenas'}]}}]}),'Hola, buenas');
 assert.equal(parseGeminiJSON('```json\n{"foo":3}\n```').foo,3);
});
test('Access errors do not trigger fallback model',async()=>{
 scenario='forbidden';calls=[];const r=await post('/api/check-ai',{});
 assert.equal(r.data.ok,false);assert.equal(r.data.reason,'access');assert.equal(calls.length,1);
});
