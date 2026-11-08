/* THOKAR Academy: clasificación orientativa de preguntas. Sin datos privados entre casos. */
export function normalizeQuestion(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim()}
const INTENTS=[
 ['mileage',/\b(kilometraje|kilometros|cuantos km|cuanto km|odometro|kilometro)\b/],
 ['vehicle',/\b(que auto|que vehiculo|que modelo|que marca|de que ano|que motor|cilindrada)\b/],
 ['since',/\b(desde cuando|hace cuanto|cuando empezo|cuando comenzo|primera vez|cuantos dias|hace tiempo)\b/],
 ['frequency',/\b(siempre|a veces|seguido|frecuencia|cada cuanto|todos los dias|intermitente|constantemente)\b/],
 ['temperature',/\b(frio|caliente|temperatura|se calienta|calentando|en la manana)\b/],
 ['warnings',/\b(luz|luces del tablero|check engine|testigo|testigos|codigo|tablero|enciende algo)\b/],
 ['maintenance',/\b(mantencion|mantenimiento|ultima revision|cambiaron|cambiaste|reparado|reparacion anterior|bujia|filtro|aceite|bateria nueva)\b/],
 ['power',/\b(subida|cuesta|pendiente|aceler|potencia|tirone|fuerza|velocidad)\w*/],
 ['noise',/\b(frena|freno|bache|lomo de toro|hoyo|ruido|golpe|vibra|tiembla|volante|dobla|virar)\w*/],
 ['fuel',/\b(consumo|bencina|diesel|combustible|estan(q|c)ue|rendimiento)\b/],
 ['smell',/\b(olor|humo|fuga|liquido|charco|perdida de agua)\b/],
 ['start',/\b(arranque|partir|enciende|prende|motor de partida|le cuesta partir)\b/],
 ['cost',/\b(presupuesto|cobrar|precio|cuanto sale|cuanto cuesta|repuesto|valor)\b/],
 ['appointment',/\b(puedo revisar|venir|disponible|cita|horario|cuando puede|ubicacion|donde esta)\b/],
 ['conditions',/\b(cuando pasa|en que momento|en que condiciones|como sucede|como se presenta|mas detalle|que paso)\b/],
 ['diagnosis',/\b(diagnostico|que crees|que piensa|de que sera|que puede ser|que tiene)\b/]
];
export function questionIntent(value){const q=normalizeQuestion(value);for(const [id,re] of INTENTS)if(re.test(q))return id;return 'other'}
export function caseFingerprint(c){const v=c?.vehicle||c?.case?.vehicle||{};const comp=c?.complaint||c?.case?.complaint||'';return normalizeQuestion(`${v.brand||''} ${v.model||''} ${v.engine||''} ${comp}`).slice(0,180)}
export function memoryFromMessages(existing,caseInfo,messages){const out=existing&&typeof existing==='object'?structuredClone(existing):{intents:{},examples:[]};out.intents=out.intents||{};out.examples=Array.isArray(out.examples)?out.examples:[];for(let i=0;i<messages.length-1;i++){const q=messages[i],r=messages[i+1];if(q.role!=='mechanic'||r.role!=='client'||!r.text||r.text.startsWith('['))continue;const intent=questionIntent(q.text);const fp=caseFingerprint(caseInfo);const itemKey=caseInfo.id+'|'+normalizeQuestion(q.text);out.seen=Array.isArray(out.seen)?out.seen:[];if(out.seen.includes(itemKey))continue;out.seen.push(itemKey);out.intents[intent]=Math.min(999,(out.intents[intent]||0)+1);if(intent==='other')continue;if(!out.examples.some(x=>x.caseId===caseInfo.id&&x.question===normalizeQuestion(q.text))){out.examples.push({caseId:caseInfo.id,fingerprint:fp,intent,question:normalizeQuestion(q.text),answer:String(r.text).slice(0,600),source:r.source||'local',date:new Date().toISOString()});}}out.examples=out.examples.slice(-180);out.seen=(out.seen||[]).slice(-500);return out}
export function priorAnswer(messages,question){const normalized=normalizeQuestion(question);for(let i=messages.length-2;i>=0;i--){if(messages[i].role==='mechanic'&&normalizeQuestion(messages[i].text)===normalized&&messages[i+1]?.role==='client'&&!messages[i+1].text.startsWith('['))return messages[i+1].text;}return ''}
