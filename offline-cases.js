// Banco de escenarios de respaldo, sin instrucciones de reparación real ni valores OEM.
// Cada escenario mantiene una causa fija y mediciones didácticas consistentes.
const bases={
 scan:(id,label,zone,result,reading,decisive=false,setup='Vehículo inmovilizado; condiciones documentadas')=>({id,label,tool:'scanner',zone,setup,mode:'N/A',positive:'N/A',negative:'N/A',result,reading,significance:decisive?'Ayuda a discriminar la causa de esta simulación':'Aporta contexto a la investigación',decisive,minutes:6,cost:0,safety:'No manipules el escáner mientras conduces'}),
 visual:(id,label,zone,result,decisive=false,setup='Motor apagado y condiciones seguras')=>({id,label,tool:'visual',zone,setup,mode:'N/A',positive:'N/A',negative:'N/A',result,reading:result,significance:decisive?'Hallazgo relevante para confirmar la falla':'Hallazgo de inspección',decisive,minutes:7,cost:0,safety:'Evita superficies calientes y piezas móviles'}),
 mech:(id,label,zone,result,decisive=false,setup='Vehículo detenido, apoyado y asegurado')=>({id,label,tool:'mechanical',zone,setup,mode:'N/A',positive:'N/A',negative:'N/A',result,reading:result,significance:decisive?'Prueba discriminante':'Prueba complementaria',decisive,minutes:9,cost:0,safety:'Utiliza métodos seguros de elevación y apoyo; nunca dependas solo de un gato'}),
 meter:(id,label,zone,mode,positive,negative,reading,result,decisive=false,setup='Condición indicada en el procedimiento')=>({id,label,tool:'multimeter',zone,setup,mode,positive,negative,reading,result,significance:decisive?'Medición discriminante':'Medición complementaria',decisive,minutes:8,cost:0,safety:mode==='OHM'||mode==='CONT'?'Medir resistencia/continuidad exclusivamente con el circuito desenergizado y aislado':'Evita cortocircuitos y utiliza puntas y rango apropiados'}),
 pressure:(id,label,result,reading,decisive=false)=>({id,label,tool:'pressure',zone:'engine',setup:'Procedimiento de prueba de presión, adaptadores y seguridad apropiados',mode:'N/A',positive:'N/A',negative:'N/A',result,reading,significance:decisive?'Prueba discriminante':'Prueba complementaria',decisive,minutes:14,cost:0,safety:'No abras líneas presurizadas ni calientes sin el procedimiento adecuado'})
};
const {scan,visual,mech,meter,pressure}=bases;
function rep(id,label,correct,cost,minutes,outcome){return {id,label,correct,cost,minutes,outcome};}
const shared=(cause,vehicle,customer,title,complaint,system,tests,repairs,reason,confirmation,learning)=>({vehicle,customer,title,complaint,environment:'Condiciones indicadas por el cliente; replicar con seguridad',system,difficulty:'Adaptativa · práctica',hiddenCause:cause,technicalReason:reason,confirmation,tests,repairs,learning,referenceNotes:['Pruebas y resultados ficticios consistentes para formación. No representan valores OEM ni instrucciones específicas de fabricante.']});
const cases=[
 ()=>shared('Bobina de encendido del cilindro 2 con falla intermitente en caliente',
 {brand:'Nissan',model:'Qashqai',year:2014,engine:'2.0 gasolina · variante de entrenamiento',kilometers:151000,color:'gris',bodyType:'suv'},
 {name:'Valentina',personality:'Habla directo, un poco preocupada',opening:'Hola, mi Qashqai empezó a tironear cuando acelero. A ratos anda bien, pero después pierde fuerza. ¿Lo puede revisar?',knowledge:'No sabe qué son bobinas ni DTC',history:'Las bujías se cambiaron hace varios meses',answers:['Ocurre más cuando el motor está caliente','A veces parpadeó la luz del motor','Se siente peor cuando acelera para subir pendientes','Hace unos meses cambiaron las bujías']},
 'Tirones con motor caliente','Tirones y pérdida de fuerza al acelerar','Encendido',[
 scan('t1','Leer DTC y contadores de fallos','cabin','Se registra fallo de encendido concentrado en cilindro 2','P0302 y contador del cilindro 2 elevado (simulado)',true),
 visual('t2','Inspección de cables y conectores de bobinas','engine','Sin pines sulfatados ni conectores sueltos'),
 mech('t3','Intercambio controlado de bobinas 2 y 3','engine','Tras intercambiar las bobinas y repetir la condición, el fallo se traslada al cilindro 3',true,'Motor apagado, encendido desconectado; seguir desmontaje seguro y registrar posiciones'),
 scan('t4','Repetir contador de fallos tras intercambio','cabin','El contador ahora se incrementa en cilindro 3','Fallos cilindro 3; cilindro 2 normal (simulado)',true),
 meter('t5','Comprobar alimentación de bobina','electrical','DCV','Alimentación del conector','Masa de batería','Tensión de alimentación presente','Alimentación del arnés correcta en la condición de prueba',false,'Contacto ON; conector accesible; confirmar identificación de terminales en diagrama'),
 scan('t6','Datos en vivo del motor','cabin','Temperatura informada coherente con motor caliente','ECT normal para la condición simulada'),
 visual('t7','Inspeccionar admisión','engine','Sin mangueras desconectadas a simple vista'),
 mech('t8','Verificar condición general de bujías','engine','Bujía del cilindro 2 sin daño visible; el intercambio de bobinas sigue siendo decisivo')],
 [rep('r1','Sustituir la bobina que trasladó la falla y verificar',true,46000,35,'El fallo deja de reproducirse al sustituir la bobina defectuosa'),rep('r2','Cambiar el sensor ECT',false,39000,45,'Los tirones persisten'),rep('r3','Limpiar el cuerpo de aceleración',false,19000,30,'Los tirones persisten'),rep('r4','Cambiar batería',false,89000,35,'Los tirones persisten')],
 'La falla sigue a la bobina al cambiarla de cilindro; una lectura de resistencia aislada no basta para condenar una bobina COP.',
 'Repetir condiciones de carga y comprobar que los contadores de fallos no se incrementen.',
 ['Diagnóstico de fallas de encendido','Intercambio de componentes cuando sea seguro','Interpretación de contadores de fallo']),
 ()=>shared('Sistema de carga insuficiente por falla interna del alternador/regulador',
 {brand:'Hyundai',model:'Accent',year:2012,engine:'1.4 gasolina · variante de entrenamiento',kilometers:187000,color:'blanco',bodyType:'sedan'},
 {name:'Francisco',personality:'Práctico y algo apurado',opening:'Buenas, mi Accent prende el testigo de batería andando y de noche se me ponen bajas las luces. ¿Me ayuda?',knowledge:'Piensa que toda falla eléctrica es batería',history:'La batería tiene menos de un año',answers:['El testigo aparece con el motor andando','Las luces se ven tenues con el aire y desempañador','La batería la cambiaron el año pasado']},
 'Testigo de batería en marcha','Se enciende testigo de carga; luces disminuyen al conectar consumidores','Sistema de carga',[
 meter('t1','Medir tensión en batería con motor apagado','electrical','DCV','Batería +','Batería -','12,5 V (simulado)','La batería está cargada inicialmente',false,'Motor detenido; bornes accesibles'),
 meter('t2','Medir tensión con motor en marcha y consumidores','electrical','DCV','Batería +','Batería -','12,1 V con consumidores (simulado)','No se mantiene carga suficiente en esta simulación',true,'Motor en ralentí, vehículo seguro, luces y desempañador activados'),
 meter('t3','Medir salida en borne de alternador','electrical','DCV','Borne B+ del alternador','Carcasa del alternador','12,1 V en marcha (simulado)','Salida insuficiente del conjunto alternador/regulador',true,'Prueba con identificación correcta y precauciones para no cortocircuitar'),
 meter('t4','Caída de tensión en masa bajo carga','electrical','DCV','Carcasa del alternador','Batería -','0,06 V (simulado)','Sin caída de tensión anómala relevante para el caso',false,'Motor en marcha y consumidores activos; medición de caída de tensión'),
 visual('t5','Inspección de correa de accesorios','engine','Correa instalada y sin deslizamiento visible'),
 scan('t6','Revisar DTC relacionados con carga','cabin','Sin códigos que cambien la hipótesis','Sin DTC relevantes (simulado)'),
 visual('t7','Inspección de bornes y cables','electrical','Bornes firmes sin corrosión importante'),
 mech('t8','Revisión de tensado de correa','engine','Tensado coherente; sin deslizamiento observado')],
 [rep('r1','Reparar o sustituir el alternador/regulador y verificar',true,155000,90,'Se restablece la carga adecuada para las condiciones simuladas'),rep('r2','Reemplazar batería sin más pruebas',false,89000,40,'Testigo continúa al circular'),rep('r3','Cambiar ampolletas de faros',false,18000,20,'Testigo sigue encendido'),rep('r4','Reemplazar sensor ECT',false,42000,45,'La falla del sistema de carga continúa')],
 'La tensión baja tanto en la salida del alternador como en batería con motor en marcha, con cables y correa sin anomalías relevantes.',
 'Repetir la carga con consumidores, revisar caída de tensión y comprobar que el testigo se apague.',
 ['Medición de tensión bajo carga','Caída de tensión','Distinguir batería de alternador']),
 ()=>shared('Pasadores guía de cáliper delantero agarrotados que provocan desgaste desigual',
 {brand:'Chevrolet',model:'Sail',year:2018,engine:'1.5 gasolina · variante de entrenamiento',kilometers:112000,color:'azul',bodyType:'sedan'},
 {name:'Paola',personality:'Describe lo que siente, evita términos técnicos',opening:'Hola, el auto me hace un ruido al frenar y siento que una rueda se calienta mucho. Me preocupa, ¿podrá revisarlo?',knowledge:'No conoce piezas de freno',history:'Se cambiaron pastillas hace menos de un año',answers:['El ruido se nota al frenar suave','Una rueda delantera queda más caliente después de usarlo','Hace meses le pusieron pastillas nuevas']},
 'Frenada irregular','Ruido al frenar con calentamiento irregular de rueda delantera','Frenos',[
 visual('t1','Inspección de pastillas delanteras','front','Una pastilla presenta desgaste muy superior a la opuesta',true),
 mech('t2','Comprobar deslizamiento de pasadores guía','front','El pasador guía del cáliper afectado está agarrotado',true),
 mech('t3','Comprobar libre giro de rueda elevada','front','La rueda delantera afectada presenta resistencia al giro en condición controlada',true),
 visual('t4','Inspección de discos','front','Desgaste irregular compatible con arrastre; requiere medición según fabricante'),
 mech('t5','Revisión segura del accionamiento de pedal','cabin','Pedal mantiene respuesta consistente'),
 visual('t6','Inspección de latiguillos','front','No hay daños visibles en flexibles; el pasador sigue siendo hallazgo principal'),
 scan('t7','Revisión de DTC ABS si equipo compatible','cabin','No hay indicios electrónicos relevantes','Sin DTC relevante en la simulación'),
 visual('t8','Inspeccionar estado de la suspensión','front','Sin hallazgos que expliquen el arrastre de freno')],
 [rep('r1','Reparar deslizamiento del cáliper, revisar y renovar elementos afectados según condición',true,75000,95,'El cáliper desliza libremente y la rueda no presenta arrastre anómalo en la prueba segura'),rep('r2','Cambiar solo las pastillas sin solucionar el agarrotamiento',false,38000,55,'El desgaste irregular vuelve a aparecer'),rep('r3','Reemplazar el sensor de ABS',false,45000,50,'El arrastre mecánico persiste'),rep('r4','Cambiar amortiguador delantero',false,120000,120,'El arrastre de freno persiste')],
 'El desgaste desigual, la resistencia al giro y el pasador agarrotado explican el arrastre mecánico.',
 'Verificar deslizamiento, giro libre, frenada segura y controles establecidos por fabricante antes de entregar.',
 ['Inspección de frenos','Diferencia entre desgaste y causa raíz','Seguridad y verificación']),
 ()=>shared('Manguera de ventilación de cárter deteriorada, provocando entrada de aire no medida',
 {brand:'Suzuki',model:'Swift',year:2013,engine:'1.4 gasolina · variante de entrenamiento',kilometers:164000,color:'rojo',bodyType:'hatchback'},
 {name:'Sebastián',personality:'Muy conversador, da antecedentes sueltos',opening:'Hola, el Swift queda como acelerado y a veces casi se para. Me pasa más cuando estoy detenido, ¿qué será?',knowledge:'Le han comentado cosas del sensor de oxígeno',history:'Se ha encendido testigo motor alguna vez',answers:['En carretera se nota menos','En ralentí suben y bajan las revoluciones','El testigo se encendió un par de veces']},
 'Ralentí inestable y mezcla pobre','Ralentí irregular, correcciones positivas de combustible','Admisión',[
 scan('t1','Comparar STFT y LTFT en ralentí','cabin','Correcciones positivas elevadas al ralentí','STFT +22 %, LTFT +13 % (simulados)',true),
 scan('t2','Comparar correcciones a más rpm','cabin','Las correcciones disminuyen considerablemente','STFT +4 %, LTFT +8 % (simulados)',true),
 visual('t3','Inspección de manguera de ventilación','engine','Manguera deteriorada y agrietada en el lado de admisión',true),
 visual('t4','Inspección de filtro de aire','engine','Filtro sin restricción relevante'),
 scan('t5','Leer DTC y freeze frame','cabin','Código relacionado con mezcla pobre en ralentí','P0171 (simulado)'),
 meter('t6','Medir alimentación de sensor relacionado','electrical','DCV','Alimentación del sensor','Masa de batería','Alimentación presente en esta simulación','No se evidencia falta de alimentación',false,'Contacto ON; terminales confirmados por diagrama'),
 mech('t7','Comprobar condición de tapa de admisión','engine','Sin anomalías visibles adicionales'),
 scan('t8','ECT a temperatura operativa','cabin','ECT acorde con motor caliente en el ejercicio','Lectura coherente (simulada)')],
 [rep('r1','Sustituir manguera deteriorada y verificar correcciones',true,22000,45,'Disminuyen correcciones y se estabiliza el ralentí'),rep('r2','Reemplazar sensor de oxígeno sin verificar',false,68000,50,'Se mantienen correcciones positivas'),rep('r3','Cambiar batería',false,80000,30,'Ralentí sigue irregular'),rep('r4','Cambiar bobinas',false,100000,60,'Ralentí sigue irregular')],
 'El patrón de correcciones elevadas al ralentí que disminuyen a más rpm, junto con la manguera agrietada, es coherente con una entrada de aire no medida.',
 'Tras reparar la manguera, observar correcciones de combustible en condiciones equivalentes.',
 ['Interpretación de STFT/LTFT','Entrada de aire no medida','Contraste entre condiciones']),
 ()=>shared('Bieleta de barra estabilizadora delantera con articulación desgastada',
 {brand:'Peugeot',model:'3008',year:2018,engine:'Gasolina · motorización a confirmar',kilometers:129000,color:'gris oscuro',bodyType:'suv'},
 {name:'Marcela',personality:'Respetuosa, pero preocupada',opening:'Buenas tardes, siento un golpeteo adelante cuando paso por calles malas. En pavimento liso casi no se escucha.',knowledge:'No sabe el nombre de las piezas',history:'Hace seis meses cambiaron neumáticos',answers:['Suena al pasar lomos de toro o adoquines','En pavimento plano casi desaparece','No escucha ruido especialmente al frenar']},
 'Golpeteo sobre irregularidades','Golpeteo delantero al pasar baches y lomos de toro','Suspensión',[
 mech('t1','Inspección manual de bieleta con vehículo bien apoyado','front','Se observa holgura anormal en articulación de una bieleta delantera',true),
 mech('t2','Prueba controlada del elemento estabilizador','front','Se reproduce golpeteo en la articulación de la bieleta afectada',true),
 visual('t3','Inspección de guardapolvos de articulaciones','front','Guardapolvo deteriorado en bieleta afectada',true),
 mech('t4','Revisar juego de terminales de dirección','front','Sin juego significativo observado en ejercicio'),
 mech('t5','Inspección de rótulas de suspensión','front','Sin holgura relevante en esta simulación'),
 visual('t6','Inspección de soportes de amortiguador','front','Sin daño evidente en soportes'),
 visual('t7','Inspección de frenos delanteros','front','Pinzas y elementos sin holguras que expliquen el golpe'),
 mech('t8','Revisar elementos bajo carrocería','underbody','No hay escapes o protectores sueltos que generen el ruido')],
 [rep('r1','Sustituir bieleta afectada y verificar suspensión',true,55000,65,'Desaparece el golpeteo bajo la condición simulada'),rep('r2','Cambiar amortiguadores sin confirmar',false,240000,140,'El golpeteo persiste'),rep('r3','Cambiar pastillas de freno',false,64000,60,'El golpeteo persiste'),rep('r4','Alinear ruedas como única intervención',false,35000,40,'El golpeteo persiste')],
 'La holgura y el ruido localizados en la articulación de la bieleta son la evidencia más discriminante.',
 'Comprobar fijaciones y verificar el ruido en condiciones seguras después de intervenir.',
 ['Diagnóstico de ruido','Inspección por descarte','No sustituir amortiguadores por intuición'])
];
const names=['Camila','Matías','Daniela','Ignacio','Fernanda','César','Constanza','Alejandro','Carolina','Rodrigo'];
function chooseLocalCase(history=[]){
 const keys=new Set((history||[]).map(h=>String(h.vehicle||'').toLowerCase()));
 const candidates=cases.map((make,i)=>({make,i})).filter(x=>!Array.from(keys).some(k=>{const c=x.make();return k.includes(c.vehicle.brand.toLowerCase())&&k.includes(c.vehicle.model.toLowerCase())}));
 const pool=candidates.length?candidates:cases.map((make,i)=>({make,i}));
 const selected=pool[Math.floor(Math.random()*pool.length)].make();
 selected.customer.name=names[Math.floor(Math.random()*names.length)];
 selected.vehicle.kilometers+=Math.floor(Math.random()*21-10)*750;
 selected.customer.opening=selected.customer.opening.replace(/Hola|Buenas tardes|Buenas/g,m=>m);
 selected.origin='local';
 const aliases={
  Nissan:['bobina','bobina de encendido','bobina 2'],
  Hyundai:['alternador','regulador','carga'],
  Chevrolet:['pasador','guia','caliper','caliper agarrotado'],
  Suzuki:['manguera','entrada de aire','fuga de vacio','pcv'],
  Peugeot:['bieleta','estabilizadora']
 };
 selected.acceptedTerms=aliases[selected.vehicle.brand]||[];
 selected.id='local-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
 return selected;
}
function offlineClientReply(c,question){
 const q=String(question||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const answers=Array.isArray(c.customer.answers)?c.customer.answers:[];
 const find=(patterns)=>answers.find(a=>patterns.some(w=>a.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(w)));
 if(/hola|buenas|buenos dias/.test(q))return 'Hola, muchas gracias por responder. Me tiene medio preocupado lo que le pasa al auto.';
 if(/cuando|desde|hace cuanto|empezo|primera vez|frecuencia|siempre/.test(q))return `Me empezó hace unos días. ${answers[0]||'No siempre pasa igual, la verdad.'}`;
 if(/frio|caliente|temperatura|motor/.test(q))return find(['caliente','motor','ralenti','testigo'])||'No le sabría decir con precisión; tendría que fijarme.';
 if(/testigo|luz|tablero|check|codigo/.test(q))return find(['testigo','luz','parpade','codigo'])||'No me he fijado si prende alguna luz en el tablero.';
 if(/repar|mantencion|servicio|cambi|taller|bujia|bateria/.test(q))return c.customer.history||'No tengo anotadas todas las mantenciones.';
 if(/fren|ruido|vibra|golpe|aceler|potencia|sintoma/.test(q))return answers[1]||c.complaint;
 if(/km|kilometraje|ano|modelo/.test(q))return `El auto tiene cerca de ${Number(c.vehicle.kilometers||0).toLocaleString('es-CL')} kilómetros, según el tablero.`;
 return 'Mmm, no sé mucho de mecánica. ¿Me podría explicar qué tendría que revisar o en qué fijarme?';
}
export {chooseLocalCase,offlineClientReply};
