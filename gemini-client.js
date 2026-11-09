// THOKAR Academy 2.8 · Adaptador de Gemini basado en THOKAR ZERO 5.4.1
// Endpoint oficial generateContent. No usa Interactions ni transmite claves al navegador.
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';
const clean = v=>String(v||'').trim().replace(/^models\//,'');
export function geminiModels(kind='case') {
  const primary=clean((kind==='chat'&&process.env.GEMINI_CHAT_MODEL)||process.env.GEMINI_MODEL||'gemini-3.8-flash');
  const backup=clean(process.env.GEMINI_FALLBACK_MODEL||'gemini-3.5-flash-lite');
  return [...new Set([primary,backup].filter(Boolean))];
}
function geminiError(status, data, model, retryAfter){
  const detail=String(data?.error?.message||data?.message||'').slice(0,260);
  const prefix= status===429?'Gemini alcanzó la cuota de solicitudes (429).':
    (status===401||status===403)?'La clave API no tiene acceso a Gemini (401/403).':
    status===404?`El modelo ${model} no está disponible para esta clave (404).`:
    status===400?'Gemini rechazó los parámetros enviados (400).':
    status>=500?'Los servidores de Gemini no pudieron completar la consulta.':`Gemini respondió HTTP ${status}.`;
  const e=new Error(prefix+(detail?' '+detail:''));e.status=status;e.code=status;
  if(retryAfter)e.retryAfter=retryAfter;return e;
}
export function textFromGenerateContent(j){
  const candidates=Array.isArray(j?.candidates)?j.candidates:[];
  const candidate=candidates.find(x=>x?.content?.parts?.some(p=>typeof p.text==='string'))||candidates[0];
  const txt=(candidate?.content?.parts||[]).filter(p=>typeof p.text==='string'&&!p.thought).map(p=>p.text).join('\n').trim();
  if(txt)return txt;
  const reason=candidate?.finishReason||j?.promptFeedback?.blockReason||'sin contenido';
  const err=new Error('Gemini no entregó texto utilizable (motivo: '+reason+').');err.code=502;throw err;
}
export function parseGeminiJSON(text){
  const raw=String(text||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
  try{return JSON.parse(raw);}catch{
    const a=raw.indexOf('{'),b=raw.lastIndexOf('}');
    if(a>=0&&b>a)try{return JSON.parse(raw.slice(a,b+1));}catch{}
    const err=new Error('Gemini devolvió JSON incompleto o inválido; no se creó el diagnóstico.');err.code=502;throw err;
  }
}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const RETRYABLE=new Set([408,429,500,502,503,504]);
export async function requestGemini({system='',contents,kind='chat',json=false,schema=null,timeoutMs,temperature, maxOutputTokens}){
  const key=String(process.env.GEMINI_API_KEY||'').trim();
  if(!key){const err=new Error('GEMINI_API_KEY no está configurada en Render.');err.code=503;throw err;}
  const entries=Array.isArray(contents)&&contents.length?contents:[];
  if(!entries.length){const err=new Error('Falta el mensaje que debe recibir Gemini.');err.code=400;throw err;}
  const models=geminiModels(kind), limit=timeoutMs|| (kind==='case'?115000:38000);
  let previous;
  for(let index=0;index<models.length;index++){
    if(index&&previous&&!RETRYABLE.has(Number(previous.status||previous.code)))break;
    if(index)await pause(1000);
    const model=models[index],controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),limit);
    try{
      const config={thinkingConfig:{thinkingLevel:'low'}};
      if(typeof temperature==='number')config.temperature=temperature;
      if(Number.isInteger(maxOutputTokens))config.maxOutputTokens=maxOutputTokens;
      if(json){config.responseMimeType='application/json';if(schema)config.responseSchema=schema;}
      const request={contents:entries.map(x=>({role:x.role==='model'?'model':'user',parts:[{text:String(x.text||'').slice(0,22000)}]})),systemInstruction:{parts:[{text:String(system).slice(0,18000)}]},generationConfig:config};
      const call=()=>fetch(`${BASE}${encodeURIComponent(model)}:generateContent`,{
        method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key,'User-Agent':'THOKAR-Academy/2.8'},body:JSON.stringify(request),signal:controller.signal
      });
      let response=await call();
      let data=await response.json().catch(()=>({}));
      // Algunos proyectos/modelos aceptan JSON pero rechazan esquemas complejos.
      // Recuperar UNA sola vez sin responseSchema, conservando responseMimeType JSON.
      if(response.status===400 && json && request.generationConfig.responseSchema &&
         /schema|responsemime|response.?format|unsupported|not supported/i.test(String(data?.error?.message||''))){
        delete request.generationConfig.responseSchema;
        response=await call();data=await response.json().catch(()=>({}));
      }
      if(!response.ok)throw geminiError(response.status,data,model,Number(response.headers.get('retry-after')||0));
      const text=textFromGenerateContent(data);
      return {text,model,value:json?parseGeminiJSON(text):undefined};
    }catch(err){
      previous=err?.name==='AbortError'?Object.assign(new Error('Gemini demoró demasiado con '+model+'; se agotó el tiempo de esta consulta.'),{code:504,status:504}):err;
      if(!RETRYABLE.has(Number(previous.status||previous.code))||index===models.length-1)throw previous;
    }finally{clearTimeout(timer);}
  }
  throw previous||new Error('Gemini no respondió.');
}
