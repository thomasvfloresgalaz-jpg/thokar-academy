import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';
process.env.ACADEMY_ACCESS_CODE='test-code';
process.env.ACADEMY_SECRET='testing-secret-fixed';
process.env.GEMINI_API_KEY='fake-private-key';
delete process.env.MOCK_GEMINI;
const {server,mockCase}=await import('./server.js');
const realFetch=globalThis.fetch;
let postCount=0,getCount=0,quotaFail=false, forceDone=false, latestReq=null;
const mockCaseText=JSON.stringify(mockCase());
globalThis.fetch=async(url,opts={})=>{
 if(String(url).startsWith('https://generativelanguage.googleapis.com/')){
  if(opts.method==='POST'){
   postCount++;latestReq=JSON.parse(opts.body);
   if(quotaFail)return new Response(JSON.stringify({error:{message:'RESOURCE_EXHAUSTED'}}),{status:429,headers:{'content-type':'application/json'}});
   return new Response(JSON.stringify({id:'example-interaction-123456',status:forceDone?'completed':'in_progress',...(forceDone?{output_text:mockCaseText}:{})}),{status:200,headers:{'content-type':'application/json'}});
  }
  getCount++;
  return new Response(JSON.stringify({id:'example-interaction-123456',status:getCount<2?'in_progress':'completed',...(getCount<2?{}:{output_text:mockCaseText})}),{status:200,headers:{'content-type':'application/json'}});
 }
 return realFetch(url,opts);
};
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
async function post(path,payload={}){const res=await realFetch(base+path,{method:'POST',headers:{'Content-Type':'application/json','x-academy-code':'test-code'},body:JSON.stringify(payload)});return {status:res.status,json:await res.json()};}
test.after(()=>{globalThis.fetch=realFetch;server.close();});
test('Gemini background case starts once and follows same job to completion without another generation', async()=>{
 const started=await post('/api/case-start',{mode:'ai',history:[]});
 assert.equal(started.status,200);assert.equal(started.json.status,'pending');assert.ok(started.json.job);
 assert.equal(postCount,1);assert.equal(latestReq.background,true);assert.equal(latestReq.store,true);
 const before=await post('/api/case-progress',{job:started.json.job});assert.equal(before.json.status,'pending');
 const finished=await post('/api/case-progress',{job:started.json.job});assert.equal(finished.json.status,'completed');assert.equal(finished.json.mode,'ai');
 assert.ok(finished.json.case?.vehicle);assert.ok(finished.json.session);
 assert.equal('hiddenCause' in finished.json.case,false);
 assert.equal(postCount,1);assert.equal(getCount,2);
 const again=await post('/api/case-progress',{job:started.json.job});assert.equal(again.json.case.id,finished.json.case.id);
});
test('Gemini 429 reports error and does not silently open local case',async()=>{
 quotaFail=true;
 const res=await post('/api/case-start',{mode:'ai'});
 assert.equal(res.status,502);assert.match(res.json.error,/cuota.*429|429.*cuota/i);assert.equal(res.json.case,undefined);
 quotaFail=false;
});
test('Explicit local choice works without requesting Gemini',async()=>{
 const count=postCount;
 const res=await post('/api/case-start',{mode:'local'});
 assert.equal(res.status,200);assert.equal(res.json.mode,'local');assert.equal(postCount,count);
});
test('Already completed background request returns ready case directly',async()=>{
 forceDone=true;const res=await post('/api/case-start',{mode:'ai'});
 assert.equal(res.status,200);assert.equal(res.json.status,'completed');assert.equal(res.json.mode,'ai');forceDone=false;
});
