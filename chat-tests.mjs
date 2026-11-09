import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';
process.env.ACADEMY_ACCESS_CODE='chat-test-pass';
process.env.ACADEMY_SECRET='stable-private-key-chat-test';
process.env.GEMINI_API_KEY='fake-chat-test-key';
delete process.env.MOCK_GEMINI;
const {server,seal,mockCase,validateCase,interactionText,normalizeChatText,aiFailureCategory}=await import('./server.js');
const realFetch=globalThis.fetch;
let calls=[],responseMode='ok',replySeq=0;
globalThis.fetch=async(url,opt={})=>{
 if(String(url).startsWith('https://generativelanguage.googleapis.com/')){
  const payload=JSON.parse(opt.body||'{}');calls.push(payload);
  if(responseMode==='quota')return new Response(JSON.stringify({error:{message:'You exceeded your current quota'}}),{status:429,headers:{'Content-Type':'application/json'}});
  if(responseMode==='access')return new Response(JSON.stringify({error:{message:'Permission denied'}}),{status:403,headers:{'Content-Type':'application/json'}});
  if(responseMode==='empty')return new Response(JSON.stringify({status:'completed',steps:[{type:'model_output',content:[]}]}),{status:200,headers:{'Content-Type':'application/json'}});
  replySeq++;
  const question=JSON.parse(payload.input).ultimaPregunta||JSON.parse(payload.input).pregunta||'';
  return new Response(JSON.stringify({status:'completed',steps:[{type:'model_output',content:[{type:'text',text:question.includes('fren')?'No, cuando freno no he escuchado nada raro.':'En frío generalmente anda bien; el problema aparece al calentarse.'}]}]}),{status:200,headers:{'Content-Type':'application/json'}});
 }
 return realFetch(url,opt);
};
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
const session=seal(validateCase(mockCase()));
async function post(path,data){const r=await realFetch(base+path,{method:'POST',headers:{'Content-Type':'application/json','x-academy-code':'chat-test-pass'},body:JSON.stringify(data)});return {status:r.status,body:await r.json()};}
test.after(async()=>{globalThis.fetch=realFetch;await new Promise(r=>server.close(r));});
test('normal chat queries use Gemini plain-text, no JSON schema, one request per new message',async()=>{
 responseMode='ok';calls=[];
 const a=await post('/api/chat',{session,message:'¿Le pasa con el motor frío o caliente?',history:[]});
 assert.equal(a.status,200);assert.equal(a.body.source,'ai');assert.match(a.body.reply,/calentarse/);
 assert.equal(calls.length,1);
 assert.equal(calls[0].response_format,undefined);
 assert.equal(calls[0].store,false);
 assert.equal(calls[0].model,'gemini-3.8-flash');
 assert.match(calls[0].system_instruction,/SOLO TEXTO/);
 const h=[{role:'mechanic',text:'¿Le pasa con el motor frío o caliente?'},{role:'client',text:a.body.reply}];
 const b=await post('/api/chat',{session,message:'¿Cuando frena escucha algún ruido?',history:h});
 assert.equal(b.status,200);assert.equal(b.body.source,'ai');assert.match(b.body.reply,/freno/);
 assert.equal(calls.length,2);
 assert.equal(JSON.parse(calls[1].input).historialConversacion.length,2);
 const c=await post('/api/chat',{session,message:'¿Le pasa con el motor frío o caliente?',history:h});
 assert.equal(c.body.source,'memory');assert.equal(c.body.reply,a.body.reply);assert.equal(calls.length,2);
});
test('Gemini quota failure is clear and fallback still answers question without leaking hiddenCause',async()=>{
 responseMode='quota';
 const r=await post('/api/chat',{session,message:'¿En qué momento le pasa exactamente?',history:[]});
 assert.equal(r.status,200);assert.equal(r.body.source,'local');assert.equal(r.body.aiReason,'quota');assert.match(r.body.aiNotice,/429/);assert.ok(r.body.reply.length>30);assert.doesNotMatch(r.body.reply,/Suciedad severa del cuerpo de aceleración/);
});
test('Permission failure classified without claiming Gemini is fine',async()=>{
 responseMode='access';const r=await post('/api/chat',{session,message:'¿Cómo ocurrió la primera vez?',history:[]});
 assert.equal(r.body.source,'local');assert.equal(r.body.aiReason,'access');assert.match(r.body.aiNotice,/credenciales|permisos/);
});
test('Empty output falls back, API status stays 200 and conversation continues',async()=>{
 responseMode='empty';const r=await post('/api/chat',{session,message:'¿Qué más debería saber sobre esta falla?',history:[]});
 assert.equal(r.status,200);assert.equal(r.body.aiReason,'service');assert.ok(r.body.reply);
});
test('Check AI uses same plain-text chat adapter as real messages',async()=>{
 responseMode='ok';calls=[];const r=await post('/api/check-ai',{});
 assert.equal(r.status,200);assert.equal(r.body.ok,true);assert.equal(calls[0].response_format,undefined);
 responseMode='quota';const fail=await post('/api/check-ai',{});assert.equal(fail.body.ok,false);assert.equal(fail.body.reason,'quota');
});
test('Text response extraction and compatibility with JSON replies',()=>{
 assert.equal(interactionText({steps:[{type:'thought',content:[{type:'text',text:'not display'}]},{type:'model_output',content:[{type:'text',text:'Hola, sí.'}]}]}),'Hola, sí.');
 assert.equal(normalizeChatText('```json\n{"reply":"Sí, me pasa al acelerar."}\n```'),'Sí, me pasa al acelerar.');
 assert.equal(aiFailureCategory(new Error('Gemini HTTP 429: RESOURCE_EXHAUSTED')),'quota');
});
