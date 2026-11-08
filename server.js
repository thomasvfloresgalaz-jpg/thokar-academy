import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chooseLocalCase, offlineClientReply } from './offline-cases.js';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
const PORT=Number(process.env.PORT||3000);
const VERSION='2.1.0';
const FORCE_LOCAL=process.env.ACADEMY_LOCAL_ONLY==='1';
const MODEL=(process.env.GEMINI_MODEL||'gemini-3.8-flash').replace(/^models\//,'');
const GEMINI_API_KEY=process.env.GEMINI_API_KEY||'';
const ACCESS_CODE=process.env.ACADEMY_ACCESS_CODE||'';
const MOCK=process.env.MOCK_GEMINI==='1' && process.env.NODE_ENV==='test';
const CIPHER_KEY=crypto.createHash('sha256').update(process.env.ACADEMY_SECRET||GEMINI_API_KEY||'development-only').digest();
const counters=new Map();
const allowedAssets=new Map([
  ['/','index.html'],['/index.html','index.html'],['/style.css','style.css'],
  ['/app.js','app.js'],['/workshop3d.js','workshop3d.js'],
  ['/manifest.webmanifest','manifest.webmanifest'],['/sw.js','sw.js'],['/icon.svg','icon.svg']
]);
function send(res,status,body){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(JSON.stringify(body));}
function error(res,status,message){return send(res,status,{error:message});}
function clientIp(req){return String(req.socket.remoteAddress||'unknown');}
function rate(req,limit=36){const ip=clientIp(req);const t=Date.now();let entry=counters.get(ip);if(!entry||t-entry.time>60000)entry={time:t,requests:0};entry.requests++;counters.set(ip,entry);if(counters.size>500)for(const [k,v] of counters)if(t-v.time>120000)counters.delete(k);return entry.requests>limit;}
function compare(a,b){const aa=Buffer.from(a),bb=Buffer.from(b);return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb);}
function auth(req){return ACCESS_CODE && compare(String(req.headers['x-academy-code']||''),ACCESS_CODE);}
async function body(req,limit=180000){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>limit){const e=new Error('Solicitud demasiado grande');e.code=413;throw e;}}try{return JSON.parse(raw||'{}');}catch{const e=new Error('JSON inválido');e.code=400;throw e;}}
function seal(data){const iv=crypto.randomBytes(12);const cipher=crypto.createCipheriv('aes-256-gcm',CIPHER_KEY,iv);const encrypted=Buffer.concat([cipher.update(JSON.stringify(data),'utf8'),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),encrypted]).toString('base64url');}
function unseal(token){if(typeof token!=='string'||token.length>70000)throw new Error('Caso inválido');try{const bytes=Buffer.from(token,'base64url');if(bytes.length<30)throw Error();const iv=bytes.subarray(0,12),tag=bytes.subarray(12,28),payload=bytes.subarray(28);const d=crypto.createDecipheriv('aes-256-gcm',CIPHER_KEY,iv);d.setAuthTag(tag);const c=JSON.parse(Buffer.concat([d.update(payload),d.final()]).toString('utf8'));if(!c.vehicle||!c.tests)throw Error();return c;}catch{throw new Error('No se pudo restaurar el caso. Revisa ACADEMY_SECRET si cambiaste la clave API.');}}
const S={string:{type:'string'},number:{type:'number'},boolean:{type:'boolean'}};
const arr=item=>({type:'array',items:item});
const obj=(p,required=Object.keys(p))=>({type:'object',properties:p,required});
const testSchema=obj({id:S.string,label:S.string,tool:{type:'string',enum:['scanner','multimeter','visual','mechanical','pressure','oscilloscope']},zone:{type:'string',enum:['engine','electrical','front','rear','cabin','underbody']},setup:S.string,mode:S.string,positive:S.string,negative:S.string,result:S.string,reading:S.string,significance:S.string,decisive:S.boolean,minutes:S.number,cost:S.number,safety:S.string});
const repairSchema=obj({id:S.string,label:S.string,correct:S.boolean,minutes:S.number,cost:S.number,outcome:S.string});
const caseSchema=obj({vehicle:obj({brand:S.string,model:S.string,year:S.number,engine:S.string,kilometers:S.number,color:S.string,bodyType:{type:'string',enum:['hatchback','sedan','suv','pickup','van']}}),customer:obj({name:S.string,personality:S.string,opening:S.string,knowledge:S.string,history:S.string,answers:arr(S.string)}),title:S.string,complaint:S.string,environment:S.string,system:S.string,difficulty:S.string,hiddenCause:S.string,technicalReason:S.string,confirmation:S.string,tests:arr(testSchema),repairs:arr(repairSchema),learning:arr(S.string),referenceNotes:arr(S.string)});
const chatSchema=obj({reply:S.string});
const reviewSchema=obj({feedback:S.string,strengths:arr(S.string),improvements:arr(S.string),lesson:S.string,hypothesisCorrect:S.boolean});
const auditSchema=obj({approved:S.boolean,issues:arr(S.string)});
const studySchema=obj({title:S.string,summary:S.string,steps:arr(S.string),warnings:arr(S.string),quiz:arr(obj({question:S.string,answer:S.string})),sourceStatus:S.string});
const CORE=`Eres un diseñador de simuladores de diagnóstico automotriz para técnicos mecánicos chilenos. SOLO vehículos de combustión (no híbridos ni eléctricos). Usa lenguaje natural del taller en Chile. No inventes valores OEM ni afirmes manuales oficiales que no consultaste. Toda lectura es SIMULADA, diseñada para ese caso. Si la falla necesita un dato específico no verificado, usa comparaciones relativas, tensiones de alimentación bien fundamentadas o lectura cualitativa. Las pruebas se deben condicionar a estado de motor/conector/temperatura. Prohíbe métodos inseguros: jamás recomendar medir resistencia en circuito energizado, ni cortocircuitar pines, ni alta tensión, ni manipular sistemas de seguridad de forma peligrosa. Los casos deben tener causa fija y evidencias consistentes. Nunca atribuyas síntomas de forma imposible; la descripción es para entrenamiento, no reparación real.`;
const CASE_SYS=CORE+`\nGenera un NUEVO caso técnicamente coherente. No repitas vehículos/causas recientes que se incluyan en la solicitud. Privilegia marcas/modelos frecuentes de Chile, diferentes años/motores compatibles; si no estás seguro del motor exacto, usa "versión a confirmar" en lugar de inventarlo. Asigna bodyType según carrocería real del modelo (hatchback, sedan, suv, pickup o van). Vehículo con personalidad e historial originales; 8 a 11 pruebas diagnósticas, mezclando pruebas decisivas, neutras, verificación y descartes; cada prueba result y reading permanentes, no contradicciones; las pruebas con multímetro deben indicar mode (DCV/ACV/OHM/CONT), positive y negative (puntos de conexión claros) y safety; las otras pueden poner mode="N/A", positive="N/A", negative="N/A". Al menos 2 pruebas decisivas (decisive true), al menos 2 con multímetro si sistema es eléctrico o motor electrónico. 4 a 6 reparaciones y EXACTAMENTE UNA con correct=true; reparaciones incorrectas no solucionan la causa. No mostrar la causa al cliente. customer.answers contiene hechos que el propietario sí conoce para responder coherente; no información de scanner. Usa id cortos únicos letras/números. Alterna sistemas motor, electrónica de baja tensión, suspensión, dirección, frenos, transmisión, climatización, carga/arranque. No incluir sistema SRS/airbags o alto voltaje. Los valores en reading son didácticos, NO presentarlos como manual OEM. Toda lectura debe explicar las condiciones de medición en setup. Las lecturas se fijan para todo el caso. Revisa internamente coherencia antes de devolver JSON.`;
function jsonFromInteraction(j){let output=j.output_text;if(!output&&Array.isArray(j.outputs))output=j.outputs.filter(o=>o.type==='text').map(o=>o.text||'').join('');if(!output&&Array.isArray(j.output))output=j.output.filter(o=>o.type==='text').map(o=>o.text||'').join('');if(!output&&Array.isArray(j.steps))output=j.steps.filter(o=>o.type==='model_output').flatMap(o=>o.content||[]).map(o=>o.text||'').join('');if(!output)throw new Error('Gemini devolvió una respuesta sin texto.');try{return JSON.parse(String(output).replace(/^```json\s*|```\s*$/g,''));}catch{throw new Error('La respuesta de Gemini no fue JSON válido.');}}
async function gemini(system,payload,schema,thinking='medium'){
 if(MOCK)return mockResponse(system,payload);
 if(!GEMINI_API_KEY)throw new Error('Falta GEMINI_API_KEY en las variables de Render.');
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),40000);
 try{
  const response=await fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{
   method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':GEMINI_API_KEY},
   body:JSON.stringify({model:MODEL,store:false,system_instruction:system,input:JSON.stringify(payload),response_format:{type:'text',mime_type:'application/json',schema},generation_config:{thinking_level:thinking}}),signal:controller.signal
  });
  const j=await response.json().catch(()=>({}));if(!response.ok){const message=String(j.error?.message||`Gemini HTTP ${response.status}`);if(response.status===429)throw new Error('Gemini devolvió 429: cuota o límite de solicitudes agotado. Revisa los límites de tu proyecto en Google AI Studio.');if(response.status===403)throw new Error('Clave sin permiso o facturación pendiente para '+MODEL+'. '+message.slice(0,150));throw new Error(message.slice(0,330));}
  return jsonFromInteraction(j);
 }catch(e){if(e.name==='AbortError')throw new Error('Gemini demoró demasiado en responder. Inténtalo nuevamente.');throw e;}finally{clearTimeout(timeout);}
}
function validateCase(c){
 if(!c||typeof c.title!=='string'||!c.vehicle||!c.customer||!Array.isArray(c.tests)||!Array.isArray(c.repairs))throw new Error('La IA devolvió un caso incompleto.');
 if(c.tests.length<6||c.tests.length>14||c.repairs.length<3||c.repairs.length>8||c.repairs.filter(r=>r.correct===true).length!==1)throw new Error('El caso no superó las reglas de consistencia.');
 const ids=[...c.tests,...c.repairs].map(x=>x.id);if(new Set(ids).size!==ids.length)throw new Error('Identificadores duplicados en el caso.');
 if(c.tests.filter(t=>t.decisive).length<1)throw new Error('El caso no tiene pruebas concluyentes.');
 for(const t of c.tests){if(!['scanner','multimeter','visual','mechanical','pressure','oscilloscope'].includes(t.tool)||!['engine','electrical','front','rear','cabin','underbody'].includes(t.zone)||typeof t.result!=='string'||!t.label)throw new Error('Prueba inválida en el caso.');}
 for(const k of ['hiddenCause','technicalReason','confirmation'])if(typeof c[k]!=='string'||!c[k].trim())throw new Error('Falta justificación diagnóstica.');
 c.id=crypto.randomUUID();c.createdAt=new Date().toISOString();return c;
}
function publicCase(c){return {id:c.id,createdAt:c.createdAt,origin:c.origin==='local'?'local':'ai',title:c.title,vehicle:c.vehicle,customer:{name:c.customer.name,personality:c.customer.personality,opening:c.customer.opening},complaint:c.complaint,environment:c.environment,system:c.system,difficulty:c.difficulty,tests:c.tests.map(t=>({id:t.id,label:t.label,tool:t.tool,zone:t.zone,setup:t.setup,mode:t.mode,positive:t.positive,negative:t.negative,minutes:t.minutes,cost:t.cost,safety:t.safety})),repairs:c.repairs.map(r=>({id:r.id,label:r.label,minutes:r.minutes,cost:r.cost})),learning:c.learning,referenceNotes:c.referenceNotes};}
function baseGrade(c,events,answer,attempt){
 const done=new Set(events.filter(e=>e.type==='test').map(e=>e.id));const repairs=events.filter(e=>e.type==='repair');const applied=repairs.map(e=>c.repairs.find(r=>r.id===e.id)).filter(Boolean);const correct=applied.some(r=>r.correct===true);const verified=events.some(e=>e.type==='verify'&&e.success===true);const decisive=c.tests.filter(t=>t.decisive);const found=decisive.filter(t=>done.has(t.id)).length;
 const interview=Math.min(100,events.filter(e=>e.type==='message').length*22);
 const testing=Math.round(Math.min(100,(found/Math.max(1,decisive.length))*85+Math.min(15,done.size*2)));
 const timeMinutes=events.reduce((n,e)=>n+(e.type==='test'?Number(c.tests.find(t=>t.id===e.id)?.minutes||0):e.type==='repair'?Number(c.repairs.find(r=>r.id===e.id)?.minutes||0):0),0);
 const avoidable=applied.filter(r=>!r.correct).length;
 const safety=Math.max(0,100-avoidable*18-events.filter(e=>e.type==='unsafe').length*25);
 const reasoning=Math.max(0,Math.min(100,(correct?65:12)+(found?20:0)+(String(answer.hypothesis||'').length>=20?10:0)+(String(answer.justification||'').length>=35?5:0)));
 const communication=Math.min(100,(String(answer.customerMessage||'').length>35?65:15)+(interview*.35));
 let score=Math.round(reasoning*.3+testing*.25+safety*.15+communication*.15+(verified?100:20)*.15-avoidable*4);
 const passed=!!(correct&&verified&&found>=1&&String(answer.hypothesis||'').trim().length>4&&score>=65);
 score=Math.max(0,Math.min(100,score));return {score,passed,reasoning,testing,safety,communication:Math.round(communication),interview,verified,found,correct,timeMinutes,avoidable,secondChance:!passed&&attempt===1,attempt};
}
const docs={
 multimetro:{title:'Mediciones eléctricas sin adivinar',summary:'Qué medir, en qué condiciones y cómo interpretar resultados. Un solo valor rara vez confirma una avería.',steps:['Define el tipo de señal: tensión, resistencia, frecuencia o corriente.','Busca el diagrama correcto del vehículo y la identificación de terminales.','Para medir resistencia, desconecta alimentación y aísla el componente siguiendo el procedimiento del fabricante.','Para caída de tensión, mide con el circuito trabajando y compara puntos relevantes bajo carga.','Compara las lecturas con una especificación verificable del sistema, no con un valor universal.'],warnings:['No midas Ω en circuitos energizados.','No puentees pines ni pruebes componentes SRS o alto voltaje.','Una bobina COP moderna no siempre se diagnostica midiendo resistencia.'],sourceStatus:'Fundamentos generales, no cifras OEM.'},
 scanner:{title:'Datos en vivo y códigos DTC',summary:'Un DTC señala una condición detectada, no necesariamente una pieza que se debe reemplazar.',steps:['Confirma síntoma, condiciones de aparición y códigos actuales/pendientes.','Revisa datos con motor frío y caliente según corresponda.','Contrasta sensores relacionados y observa tendencias, no solo un valor aislado.','Documenta freeze frame si el equipo lo permite.','Verifica la reparación bajo las mismas condiciones iniciales.'],warnings:['Un escáner básico no tiene todas las funciones del fabricante.','No borres códigos sin registrar la evidencia previa.'],sourceStatus:'Guía didáctica de diagnóstico general.'},
 frenos:{title:'Inspección y diagnóstico de frenos',summary:'El ruido, la vibración y la desviación al frenar admiten varias causas; se requieren pruebas seguras y medidas.',steps:['Entrevista al cliente sobre velocidad, temperatura, frecuencia y tipo de ruido.','Inspecciona desgaste y estado de pastillas, discos, cálipers y elementos de suspensión.','Comprueba desgaste diferencial y arrastre según procedimiento apropiado.','Confirma la falla antes de presupuestar y verifica después de intervenir.'],warnings:['Nunca realices pruebas de ruta que comprometan la seguridad.','No manipules sistemas de freno sin herramientas y procedimientos adecuados.'],sourceStatus:'Principios generales. Las tolerancias exactas dependen del fabricante.'},
 diagnostico:{title:'Metodología del diagnóstico',summary:'Antes de reemplazar una pieza hay que demostrar cuál falla y por qué.',steps:['Verifica la queja del cliente y recopila antecedentes.','Identifica sistemas capaces de producir el síntoma.','Elige una prueba discriminante que descarte hipótesis.','Compara evidencia, condiciones y especificaciones fiables.','Repara solo tras justificar la causa y verifica bajo las condiciones de falla.'],warnings:['Una coincidencia de síntomas no es prueba concluyente.','Los valores simulados de la academia no sustituyen documentación de taller.'],sourceStatus:'Método general, no manual específico.'}
};
function stripText(s,max=4000){return typeof s==='string'?s.slice(0,max):'';}
function safeHistory(history){if(!Array.isArray(history))return [];return history.slice(-14).map(h=>({role:h.role==='client'?'client':'mechanic',text:stripText(h.text,550)}));}
function mockResponse(system,payload){if(system===CASE_SYS)return structuredClone(mockCase());if(system.includes('auditor independiente'))return {approved:true,issues:[]};if(system.includes('Eres un cliente'))return {reply:'Pucha, empezó hace unos días. No sé mucho más, pero me pasa sobre todo cuando llevo un rato andando.'};if(system.includes('Eres un profesor'))return {title:'Práctica de mediciones',summary:'Usa el diagrama antes de medir.',steps:['Identifica terminales.'],warnings:['No midas resistencia energizado.'],quiz:[{question:'¿Medir Ω con tensión?',answer:'No.'}],sourceStatus:'Fundamentos generales'};return {feedback:'Se evaluaron las pruebas, la justificación y la seguridad de tu proceso.',strengths:['Buena disposición para verificar'],improvements:['Elegir pruebas discriminantes antes de reparar'],lesson:'Confirmar el síntoma y estudiar el sistema completo.',hypothesisCorrect:true};}
function mockCase(){return {vehicle:{brand:'Toyota',model:'Yaris',year:2009,engine:'1.5 gasolina',kilometers:176000,color:'rojo',bodyType:'hatchback'},customer:{name:'Camila',personality:'Cercana y práctica',opening:'Hola, mi Yaris está temblando y a veces se apaga al parar. ¿Lo podrá revisar?',knowledge:'No sabe términos de mecánica',history:'No recuerda última limpieza del cuerpo',answers:['El problema ocurre en caliente','No observa testigo motor']},title:'Ralentí que cae al detenerse',complaint:'Motor vibra y se cala al parar',environment:'En caliente, con accesorios conectados',system:'Admisión y ralentí',difficulty:'Inicial',hiddenCause:'Suciedad severa del cuerpo de aceleración',technicalReason:'Caudal mínimo alterado, verificado con inspección y comportamiento al ralentí',confirmation:'Limpieza, reaprendizaje cuando corresponda y prueba estable',tests:[{id:'t1',label:'Inspección de admisión',tool:'visual',zone:'engine',setup:'Motor apagado',mode:'N/A',positive:'N/A',negative:'N/A',result:'Acumulación importante de depósitos en mariposa',reading:'Depósitos visibles',significance:'Evidencia directa',decisive:true,minutes:7,cost:0,safety:'Motor apagado'},{id:'t2',label:'Escáner ralentí',tool:'scanner',zone:'cabin',setup:'Motor en ralentí caliente',mode:'N/A',positive:'N/A',negative:'N/A',result:'Ralentí inestable sin DTC actuales',reading:'640–920 rpm (simulado)',significance:'Confirma queja',decisive:true,minutes:8,cost:0,safety:'Vehículo inmovilizado'},{id:'t3',label:'Tensión batería',tool:'multimeter',zone:'electrical',setup:'Motor encendido, medir en bornes',mode:'DCV',positive:'Batería +',negative:'Batería -',result:'Sistema de carga dentro de rango para este caso',reading:'14.1 V (simulado)',significance:'Reduce sospecha de baja tensión',decisive:false,minutes:6,cost:0,safety:'No juntar puntas'},{id:'t4',label:'Revisión de mangueras',tool:'visual',zone:'engine',setup:'Motor apagado',mode:'N/A',positive:'N/A',negative:'N/A',result:'Sin grietas visibles',reading:'Inspección sin anomalías visibles',significance:'No descarta fugas pequeñas',decisive:false,minutes:5,cost:0,safety:'Inspección en frío'},{id:'t5',label:'Revisión de filtro',tool:'visual',zone:'engine',setup:'Motor apagado',mode:'N/A',positive:'N/A',negative:'N/A',result:'Filtro sin obstrucción apreciable',reading:'Sin obstrucción visible',significance:'Descarta restricción importante',decisive:false,minutes:4,cost:0,safety:'Motor apagado'},{id:'t6',label:'Correcciones combustible',tool:'scanner',zone:'cabin',setup:'Motor caliente estable',mode:'N/A',positive:'N/A',negative:'N/A',result:'Correcciones levemente positivas',reading:'STFT +6%; LTFT +4% (simulados)',significance:'No sugiere una fuga mayor',decisive:false,minutes:6,cost:0,safety:'No distraerse del motor'},{id:'t7',label:'Inspección poleas',tool:'mechanical',zone:'front',setup:'Motor apagado',mode:'N/A',positive:'N/A',negative:'N/A',result:'Sin anomalías evidentes',reading:'Sin hallazgos',significance:'Poco discriminante',decisive:false,minutes:8,cost:0,safety:'No acercar manos con motor en marcha'},{id:'t8',label:'Voltaje de alimentación',tool:'multimeter',zone:'electrical',setup:'Contacto ON y procedimiento seguro',mode:'DCV',positive:'Terminal de alimentación',negative:'Masa de batería',result:'Alimentación presente',reading:'12.2 V (simulado)',significance:'Alimentación correcta',decisive:false,minutes:7,cost:0,safety:'Evita cortocircuitos'}],repairs:[{id:'r1',label:'Limpieza y aprendizaje del cuerpo de aceleración',correct:true,minutes:35,cost:18000,outcome:'Ralentí estabilizado bajo las condiciones simuladas'},{id:'r2',label:'Reemplazar batería',correct:false,minutes:30,cost:80000,outcome:'Síntoma persiste; se incurrió en un gasto innecesario'},{id:'r3',label:'Reemplazar sensor ECT',correct:false,minutes:40,cost:45000,outcome:'Síntoma persiste'},{id:'r4',label:'Cambiar bujías',correct:false,minutes:40,cost:50000,outcome:'Síntoma persiste'}],learning:['Ralentí electrónico','Lectura de DTC','Análisis de admisión'],referenceNotes:['Este caso usa mediciones simuladas. No sustituye datos OEM.']};}
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url||'/','http://localhost');
  if(req.method==='GET'&&url.pathname==='/api/status')return send(res,200,{ok:true,aiConfigured:!!GEMINI_API_KEY||MOCK,accessConfigured:!!ACCESS_CODE,localAvailable:true,model:MODEL,version:VERSION});
  if(req.method==='GET'&&url.pathname==='/healthz')return send(res,200,{ok:true,version:VERSION});
  if(req.method==='GET'&&allowedAssets.has(url.pathname)){
   const name=allowedAssets.get(url.pathname);const mime=name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.js')?'text/javascript; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':name.endsWith('.svg')?'image/svg+xml':name.endsWith('.webmanifest')?'application/manifest+json':'text/plain';
   const bytes=await fs.readFile(path.join(ROOT,name));res.writeHead(200,{'Content-Type':mime,'Cache-Control':name==='index.html'?'no-cache':'public, max-age=180','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'self'; connect-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'; worker-src 'self'; base-uri 'none'; object-src 'none'"});return res.end(bytes);
  }
  if(req.method!=='POST'||!url.pathname.startsWith('/api/'))return error(res,404,'No encontrado');
  if(rate(req))return error(res,429,'Demasiadas solicitudes; vuelve a intentar en un minuto.');
  if(!ACCESS_CODE)return error(res,503,'Configura ACADEMY_ACCESS_CODE en Render antes de usar el servidor.');
  if(!auth(req))return error(res,401,'Código de acceso incorrecto. Revísalo en Ajustes.');
  const d=await body(req);
  if(url.pathname==='/api/ping')return send(res,200,{ok:true,auth:true,model:MODEL,aiConfigured:!!GEMINI_API_KEY,localAvailable:true,version:VERSION});
  if(url.pathname==='/api/check-ai'){
   if(!GEMINI_API_KEY)return send(res,200,{ok:false,ai:false,message:'No hay GEMINI_API_KEY configurada en Render. La práctica local sí está disponible.'});
   try{const check=await gemini('Responde únicamente JSON en la estructura pedida.',{request:'Responde una frase simple sobre diagnóstico técnico.'},chatSchema,'low');return send(res,200,{ok:!!check.reply,ai:true,model:MODEL,message:'Gemini respondió correctamente.'});}
   catch(ex){return send(res,200,{ok:false,ai:false,model:MODEL,message:String(ex.message).slice(0,300)});}
  }
  if(url.pathname==='/api/case'){
   const hist=Array.isArray(d.history)?d.history.slice(-12).map(h=>({vehicle:stripText(h.vehicle,80),system:stripText(h.system,60),cause:stripText(h.cause,100),score:Math.min(100,Number(h.score)||0)})):[];
   const onlyLocal=d.mode==='local'||FORCE_LOCAL||(!GEMINI_API_KEY&&!MOCK);
   let c, notice='';
   if(onlyLocal){c=chooseLocalCase(hist);notice=FORCE_LOCAL?'Modo local solicitado en Render.':d.mode==='local'?'Elegiste generar un caso de práctica local.':'Gemini no está configurado; se cargó una práctica local para que puedas continuar.';}
   else{
    const level=hist.length===0?'Evaluación inicial':hist.slice(-4).every(h=>h.score>=80)?'Avanzar dificultad':'Progresión gradual según resultados';
    try{
     const directive={task:'generar caso',level,history:hist,nonce:crypto.randomBytes(6).toString('hex'),note:'Varía aleatoriamente vehículo, cliente, fallo y condiciones.'};
     c=validateCase(await gemini(CASE_SYS,directive,caseSchema,'medium'));
     c.origin='ai';
     // Una sola llamada por caso por defecto. Validación local obligatoria; auditor opcional.
     if(process.env.CASE_AUDIT==='1'){
       const audit=await gemini(CORE+'\nAudita si el caso es técnicamente coherente. Devuelve approved e issues.',{case:c},auditSchema,'low');
       if(!audit.approved)throw new Error('El caso generado fue rechazado por la revisión técnica.');
     }
    }catch(ex){
      console.warn('Generación IA falló; se habilitó modo local:',ex.message);
      c=chooseLocalCase(hist);
      notice='Gemini no pudo generar el caso ('+String(ex.message).slice(0,140)+'). Se abrió una práctica local, sin perder tu sesión.';
    }
   }
   c=validateCase(c);
   return send(res,200,{case:publicCase(c),session:seal(c),mode:c.origin==='local'?'local':'ai',notice});
  }
  if(url.pathname==='/api/chat'){
   const c=unseal(d.session);const message=stripText(d.message,800).trim();if(!message)return error(res,400,'Escribe una pregunta para el cliente.');
   const profile={name:c.customer.name,personality:c.customer.personality,opening:c.customer.opening,knowledge:c.customer.knowledge,history:c.customer.history,answers:c.customer.answers,complaint:c.complaint,environment:c.environment,vehicle:c.vehicle};
   const system=CORE+'\nEres un cliente CHILENO, persona humana informal natural, no un instructor. Responde de 1 a 3 frases, con variación realista. Solo sabes tu perfil y antecedentes de propietario, no sabes la causa, resultados ni intervención. Si no puedes conocer algo, di que no sabes o no te fijaste. No inventes información incompatible con el perfil. No entregues diagnósticos ni preguntes como robot. No reveles que eres IA ni describes el caso como simulación. Devuelve reply.';
   let reply,source='ai';
   if(c.origin==='local'||FORCE_LOCAL||(!GEMINI_API_KEY&&!MOCK)){reply=offlineClientReply(c,message);source='local';}
   else {try{const result=await gemini(system+'\nEres un cliente del taller.',{profile,history:safeHistory(d.history),question:message},chatSchema,'low');reply=stripText(result.reply,900)||'No sabría decirle, la verdad.';}
   catch(ex){console.warn('Chat IA degradado a local:',ex.message);reply=offlineClientReply(c,message);source='local';}}
   return send(res,200,{reply,source});
  }
  if(url.pathname==='/api/test'){
   const c=unseal(d.session),t=c.tests.find(x=>x.id===d.id);if(!t)return error(res,404,'Prueba no encontrada.');
   if(t.tool==='multimeter'){
    const correct=String(d.mode||'').toUpperCase()===String(t.mode||'').toUpperCase()&&String(d.positive||'')===String(t.positive)&&String(d.negative||'')===String(t.negative);
    if(!correct)return send(res,200,{connected:false,reading:'—',result:'La medición no es válida con esa escala o conexión. Revisa el procedimiento, los puntos y las condiciones antes de interpretar un valor.',safety:t.safety,setup:t.setup});
   }
   return send(res,200,{connected:true,reading:t.reading,result:t.result,significance:t.significance,safety:t.safety,setup:t.setup});
  }
  if(url.pathname==='/api/repair'){
   const c=unseal(d.session),r=c.repairs.find(x=>x.id===d.id);if(!r)return error(res,404,'Reparación no encontrada.');
   return send(res,200,{result:r.outcome,improved:!!r.correct,minutes:r.minutes,cost:r.cost});
  }
  if(url.pathname==='/api/evaluate'){
   const c=unseal(d.session),events=Array.isArray(d.events)?d.events.slice(0,150).map(e=>({type:String(e.type||'').slice(0,25),id:String(e.id||'').slice(0,80),success:e.success===true})):[];
   const attempt=d.attempt===2?2:1;const answer={hypothesis:stripText(d.answer?.hypothesis,600),justification:stripText(d.answer?.justification,900),customerMessage:stripText(d.answer?.customerMessage,800)};
   const grade=baseGrade(c,events,answer,attempt);
   const normalized=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ');
   const stop=new Set(['para','como','este','esta','del','los','las','con','por','una','unos','sus','que','de','la','el','en','se','falla','sistema','sensor','defectuoso','problema','causa','averia','motor','intermitente']);
   const tokens=normalized(c.hiddenCause).split(/\s+/).filter(w=>w.length>=4&&!stop.has(w));
   const answerText=normalized(answer.hypothesis+' '+answer.justification);
   const keywords=tokens.filter(w=>answerText.includes(w));
   const accepted=(Array.isArray(c.acceptedTerms)?c.acceptedTerms:[]).some(term=>answerText.includes(normalized(term)));
   const heuristicMatch=accepted || keywords.length>=Math.min(2,Math.max(1,tokens.length)) || (tokens.length===1&&keywords.length===1);

   let review;
   if(c.origin==='local'||FORCE_LOCAL||(!GEMINI_API_KEY&&!MOCK)){
     review={feedback:grade.passed?'Reuniste evidencia, reparaste y verificaste la condición simulada.':'La evidencia o la intervención no permite confirmar completamente el diagnóstico.',strengths:grade.found?['Incluiste pruebas que discriminan la falla']:['Registraste tu razonamiento inicial'],improvements:['Explica por qué tus mediciones descartan otras causas','Incluye siempre una verificación en la misma condición del síntoma'],lesson:'Compara la hipótesis con las pruebas, evita reemplazos por intuición y verifica el resultado.',hypothesisCorrect:heuristicMatch};
   }else{
     try{review=await gemini(CORE+'\nEres instructor técnico. No cambies el puntaje ni el resultado calculado por el motor; solo redacta retroalimentación pedagógica concreta. Si secondChance=true NO menciones causa, reparación correcta ni pruebas precisas que resuelvan el caso. Si es segundo intento o aprobado, explica la causa y comprobaciones. Acepta rutas alternativas válidas. Determina si la causa escrita por el alumno corresponde realmente al fallo oculto, en hypothesisCorrect (boolean). No basta que haya aplicado la pieza correcta al azar. Responde feedback, strengths, improvements, lesson, hypothesisCorrect.',{case:c,events,answer,grade},reviewSchema,'medium');}
     catch(e){console.warn('Retroalimentación IA no disponible:',e.message);review={feedback:grade.passed?'Reuniste evidencia y verificaste tu intervención.':'La evidencia reunida no fue suficiente para confirmar la reparación.',strengths:grade.found?['Realizaste al menos una prueba discriminante']:['Registraste tu razonamiento'],improvements:['Contrasta hipótesis con mediciones y condiciones de falla'],lesson:'Prioriza la comprobación antes del reemplazo.',hypothesisCorrect:undefined};}
   }
   if(review.hypothesisCorrect===false || (review.hypothesisCorrect===undefined && !heuristicMatch)){
     grade.passed=false;grade.score=Math.min(grade.score,59);grade.secondChance=attempt===1;
   }
   grade.hypothesisAssessment=review.hypothesisCorrect===undefined?'orientativa (sin revisión de IA)':'revisada por IA';
   if(grade.secondChance){review={feedback:'El diagnóstico todavía no tiene evidencia suficiente o la causa propuesta no está bien fundamentada. Puedes seguir investigando sin revelar la solución.',strengths:grade.found?['Realizaste pruebas relacionadas con el síntoma']:['Planteaste una hipótesis que puedes contrastar'],improvements:['Comprueba qué resultado distinguiría las posibles causas.','Revisa la coherencia entre el síntoma, tus mediciones y la intervención elegida.'],lesson:'La segunda oportunidad está abierta; intenta demostrar la causa con evidencia adicional.'};}
   if(grade.secondChance)return send(res,200,{...grade,reveal:'',review});
   return send(res,200,{...grade,reveal:c.hiddenCause,technicalReason:c.technicalReason,confirmation:c.confirmation,review,system:c.system,vehicle:c.vehicle,learning:c.learning});
  }
  if(url.pathname==='/api/study'){
   const key=String(d.topic||'diagnostico').slice(0,60).toLowerCase();const guide=docs[key];if(guide)return send(res,200,{guide});
   const guideOut=await gemini(CORE+'\nEres profesor de diagnóstico automotriz. Explica al alumno que ya sabe utilizar instrumentos qué medir, cómo validar la prueba, precauciones y cómo obtener especificaciones de fabricante. Prohibido inventar datos OEM o fuentes. Contenido de diagnóstico educativo, no servicio en un vehículo real. Incluye mini quiz.',{topic:key,vehicle:d.vehicle||null},studySchema,'medium');return send(res,200,{guide:guideOut});
  }
  return error(res,404,'Ruta de API desconocida');
 }catch(e){console.error('THOKAR:',e.message);const code=e.code||((e.message.includes('restaurar')||e.message.includes('inválido'))?400:502);return error(res,code,String(e.message).slice(0,360));}
});
if(process.env.NODE_ENV!=='test' || process.env.RUN_SERVER==='1')server.listen(PORT,'0.0.0.0',()=>console.log(`THOKAR Academy ${VERSION} · http://0.0.0.0:${PORT} · ${MODEL}`));
export {server,validateCase,publicCase,seal,unseal,baseGrade,mockCase,jsonFromInteraction};
