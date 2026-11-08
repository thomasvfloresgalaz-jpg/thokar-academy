/* Biblioteca de procedimientos de práctica. Los resultados fuera del caso NO son especificaciones OEM. */
const SHARED_SAFETY='Confirma el diagrama del fabricante. Evita cortocircuitos y desconecta el circuito cuando corresponda.';
const S=[
 {id:'electrico',name:'Eléctrico y electrónico',description:'Alimentación, sensores, actuadores y comunicaciones',icon:'zap',components:[
 ['bateria','Batería','electrical',[
  ['Tensión en reposo','multimeter','DCV','Borne positivo de batería','Borne negativo de batería','Contacto apagado, vehículo detenido','Tensión de batería registrada (simulación)','Referencia de entrenamiento: 12,5 V'],
  ['Tensión durante el arranque','multimeter','DCV','Borne positivo de batería','Borne negativo de batería','Durante accionamiento de arranque y con precaución','Caída observada en la partida (simulación)','Lectura de partida: consultar límites del fabricante'],
  ['Inspección de bornes y sujeción','visual','N/A','','','Motor apagado','Bornes sin sulfatación visible (simulación)','Inspección visual completada']]],
 ['alternador','Alternador y regulador','electrical',[
  ['Tensión del sistema de carga','multimeter','DCV','Borne B+ del alternador','Carcasa del alternador','Motor encendido, accesorios según procedimiento','Resultado de sistema de carga didáctico','Medición de tensión de carga simulada'],
  ['Caída de tensión del cable B+','multimeter','DCV','Salida B+ del alternador','Borne positivo de batería','Motor en marcha y consumidores conectados','Comprobación de conexión positiva (simulación)','Caída evaluada cualitativamente'],
  ['Inspección de conector y fijaciones','visual','N/A','','','Motor apagado y frío','Conector y fijaciones revisados','Inspección completada']]],
 ['correa','Correa de accesorios y tensor','engine',[
  ['Estado de la correa','visual','N/A','','','Motor apagado, llaves fuera del contacto','Sin cortes evidentes en la inspección simulada','Revisar desgaste y tensión conforme al sistema'],
  ['Poleas y tensor','mechanical','N/A','','','Motor apagado, sin tocar componentes giratorios','Chequeo de tensor y poleas completado','Revisar recorrido, alineación y ruido']]],
 ['ecu','Computador del motor (ECU/ECM)','cabin',[
  ['Escanear DTC del motor','scanner','N/A','','','Contacto encendido, escáner compatible','Lectura de DTC completada (simulación)','No todos los módulos admiten las mismas funciones'],
  ['Alimentación del computador','multimeter','DCV','Alimentación de ECU (pin verificado)','Masa de batería','Contacto en ON, pin identificado por diagrama','Alimentación evaluada (simulación)','No aplicar puntas sin esquema de pines'],
  ['Masas del computador','multimeter','DCV','Masa ECU (pin verificado)','Borne negativo de batería','Bajo carga y procedimiento de caída de tensión','Retorno de masa revisado (simulación)','Comprobar contra referencia del fabricante']]],
 ['partida','Motor de partida','electrical',[
  ['Alimentación de arranque','multimeter','DCV','Borne principal motor de partida','Carcasa motor de partida','Durante partida, con vehículo asegurado','Alimentación de arranque revisada','Medición de tensión didáctica'],
  ['Caída de tensión masa partida','multimeter','DCV','Carcasa motor de partida','Borne negativo de batería','Durante arranque, vehículo inmovilizado','Conexión de masa evaluada','Sin especificación OEM en esta práctica']]],
 ['fusibles','Fusibles y caja de fusibles','electrical',[
  ['Continuidad de fusible retirado','multimeter','CONT','Extremo 1 del fusible','Extremo 2 del fusible','Circuito apagado, fusible retirado','Continuidad comprobada','No confundir continuidad con funcionamiento bajo carga'],
  ['Tensión a ambos lados del fusible','multimeter','DCV','Punto de prueba del fusible','Masa de batería','Circuito alimentado, prueba segura','Alimentación observada a ambos lados','Verifica ambos puntos, no solo uno']]],
 ['reles','Relés','electrical',[
  ['Alimentación y mando del relé','multimeter','DCV','Terminal de mando verificado','Masa de batería','Relé identificado con diagrama y circuito activo','Mando verificado (simulación)','No puentear terminales sin procedimiento'],
  ['Resistencia de bobina de relé','multimeter','OHM','Pin bobina 1','Pin bobina 2','Relé retirado y desenergizado','Resistencia didáctica observada','Valor OEM específico no disponible']]],
 ['masas','Masas y cableado','electrical',[
  ['Caída de tensión de masa','multimeter','DCV','Masa del componente','Borne negativo de batería','Circuito trabajando bajo carga','Caída de tensión evaluada','Una continuidad en reposo no descarta mala masa'],
  ['Continuidad en arnés desconectado','multimeter','CONT','Extremo A del cable aislado','Extremo B del cable aislado','Cable aislado y sin alimentación','Continuidad comprobada','Verificar posible resistencia alta bajo carga']]],
 ['bobinas','Bobinas de encendido','engine',[
  ['Alimentación de bobina','multimeter','DCV','Pin alimentación bobina (identificado)','Masa batería','Contacto ON, esquema de terminales confirmado','Alimentación verificada','No diagnosticar COP solo con resistencia'],
  ['Prueba de contribución / intercambio','mechanical','N/A','','','Motor apagado para mover componentes; según fabricante','Comparación de respuesta del cilindro','Confirmar con contador de fallos'],
  ['DTC y contadores de falla de encendido','scanner','N/A','','','Motor en condiciones de la falla','Lectura de contadores registrada','Observar cilindro implicado']]],
 ['bujias','Bujías','engine',[
  ['Inspección de bujías','visual','N/A','','','Motor frío y apagado; seguir procedimiento','Estado visual revisado','No concluir solo por color'],
  ['Separación de electrodos','mechanical','N/A','','','Bujía desmontada de modo seguro','Separación inspeccionada','Comparar con fabricante']]],
 ['inyectores','Inyectores de combustible','engine',[
  ['Alimentación del inyector','multimeter','DCV','Pin alimentación inyector (identificado)','Masa batería','Contacto ON, siguiendo esquema','Alimentación comprobada','Prohibido puentear el inyector'],
  ['Prueba de equilibrio de cilindros','scanner','N/A','','','Con herramienta compatible y procedimiento seguro','Equilibrio evaluado didácticamente','Compatibilidad depende de marca'],
  ['Inspección de fugas externas','visual','N/A','','','Motor frío y sin fuentes de ignición','Inspección visual completada','Precaución con combustible']]],
 ['maf','Sensor MAF','engine',[
  ['Datos en vivo del caudal de aire','scanner','N/A','','','Condiciones de ralentí y aceleración controladas','Señal MAF examinada','Interpretar según motor y carga'],
  ['Alimentación y masa del MAF','multimeter','DCV','Pin alimentación MAF (identificado)','Pin masa MAF (identificado)','Contacto ON, esquema verificado','Circuito eléctrico MAF revisado','No suponer tensión para todos los sensores']]],
 ['map','Sensor MAP','engine',[
  ['Datos de presión absoluta','scanner','N/A','','','Contacto ON y distintas condiciones del motor','Datos MAP consultados','Relación con presión atmosférica'],
  ['Señal de MAP','multimeter','DCV','Pin de señal MAP','Masa de sensor MAP','Conector identificado, según fabricante','Señal MAP evaluada','No asumir escala sin datos técnicos']]],
 ['ect','Sensor ECT','engine',[
  ['Comparar ECT en frío','scanner','N/A','','','Motor frío, antes de partir','ECT cotejada con temperatura ambiente','Compara ECT e IAT cuando proceda'],
  ['Resistencia de ECT aislado','multimeter','OHM','Terminal 1 ECT','Terminal 2 ECT','Sensor desconectado y circuito sin energía','Resistencia revisada sin especificación OEM','El valor depende de la temperatura']]],
 ['ckp','Sensor CKP (cigüeñal)','engine',[
  ['Señal de RPM durante arranque','scanner','N/A','','','Durante partida, vehículo asegurado','Señal RPM revisada','No todos los sensores CKP se miden en ohmios'],
  ['Alimentación según tipo de CKP','multimeter','DCV','Pin de alimentación CKP (verificado)','Masa de sensor CKP','Solo si se confirma que es sensor alimentado','Comprobación según diseño','Usa diagrama y tipo de sensor']]],
 ['cmp','Sensor CMP (árbol de levas)','engine',[
  ['Sincronización de señales','scanner','N/A','','','Motor en marcha o arranque según equipo','Sincronización consultada','Los PID varían por fabricante'],
  ['Alimentación CMP','multimeter','DCV','Pin alimentación CMP','Masa sensor CMP','Conectores verificados en diagrama','Comprobación eléctrica registrada','No aplicar método universal a sensores inductivos']]],
 ['can','Red CAN y comunicaciones','cabin',[
  ['Escáner: módulos accesibles','scanner','N/A','','','Contacto ON, escáner compatible','Módulos y comunicación revisados','Un fallo de comunicación requiere investigar alimentación y red'],
  ['Resistencia de terminación (solo aislado)','multimeter','OHM','CAN-H (pines verificados)','CAN-L (pines verificados)','Red completamente desenergizada; confirmar aislamiento','Resistencia evaluada (sin valor OEM)','No medir resistencia con red energizada']]]]},
 {id:'motor',name:'Motor y combustible',description:'Admisión, inyección, lubricación y refrigeración',icon:'settings-2',components:[
 ['admision','Admisión y vacío','engine',[
  ['Inspección de mangueras de admisión','visual','N/A','','','Motor apagado','Mangueras revisadas','Inspección no descarta fuga pequeña'],
  ['Prueba de fugas de admisión','mechanical','N/A','','','Equipo de humo apropiado, motor detenido','Verificación de fugas completada','Evitar métodos combustibles o inflamables']]],
 ['aceleracion','Cuerpo de aceleración electrónico','engine',[
  ['Lectura TPS / posición mariposa','scanner','N/A','','','Contacto ON, según procedimiento','Posición de aceleración examinada','Adaptaciones dependen del fabricante'],
  ['Inspección de acumulación de suciedad','visual','N/A','','','Motor apagado; evitar forzar mariposa','Mariposa y conducto revisados','No limpiar sin procedimiento específico']]],
 ['combustible','Presión y suministro de combustible','engine',[
  ['Presión de alimentación','pressure','N/A','','','Equipo de presión compatible, sin fugas ni fuentes de ignición','Presión evaluada según montaje','No hay valor OEM definido para este vehículo'],
  ['Lectura de correcciones STFT/LTFT','scanner','N/A','','','Motor caliente en control cerrado','Correcciones examinadas','Evaluar en ralentí y carga']]],
 ['compresion','Compresión mecánica','engine',[
  ['Prueba de compresión por cilindro','mechanical','N/A','','','Seguir protocolo seguro de inmovilización/deshabilitación','Compresión relativa examinada','Comparar cilindros y datos OEM'],
  ['Prueba de fugas de cilindro','mechanical','N/A','','','Herramienta apropiada y PMS confirmado','Fugas internas evaluadas','Requiere procedimiento preciso']]],
 ['refrigeracion','Refrigeración y termostato','engine',[
  ['ECT durante calentamiento','scanner','N/A','','','Motor frío hasta temperatura de operación','Tendencia térmica observada','No usar valores de otro motor'],
  ['Inspección de fugas de refrigerante','visual','N/A','','','Motor completamente frío','Conexiones visibles revisadas','No abrir tapa de presión en caliente']]],
 ['lubricacion','Lubricación','engine',[
  ['Nivel y estado de aceite','visual','N/A','','','Superficie plana y procedimiento fabricante','Nivel examinado','No sustituye presión de aceite'],
  ['Presión de lubricación','pressure','N/A','','','Manómetro con adaptador correcto','Presión de lubricación comprobada','Especificación depende de régimen y temperatura']]]]},
 {id:'frenos',name:'Frenos',description:'Frenos de servicio, ABS y sistema hidráulico',icon:'disc',components:[
 ['pastillas','Pastillas, discos y cálipers','front',[
  ['Inspección de pastillas y discos','visual','N/A','','','Vehículo inmovilizado y apoyado correctamente','Desgaste inspeccionado','Comparar espesores con valores OEM'],
  ['Revisión de guías de cáliper','mechanical','N/A','','','Rueda retirada de forma segura','Movimiento de guías evaluado','No contaminar superficies de fricción']]],
 ['abs','ABS y sensores de rueda','front',[
  ['DTC y velocidades de rueda','scanner','N/A','','','Escáner capaz de leer ABS','Lecturas comparadas','No todos los escáneres acceden a ABS'],
  ['Inspección de cableado sensor ABS','visual','N/A','','','Vehículo inmovilizado','Arnés inspeccionado','No dañar conectores']]],
 ['hidraulico','Sistema hidráulico de frenos','front',[
  ['Revisión de fugas de líquido de frenos','visual','N/A','','','Vehículo seguro y sin contaminación','Fugas visibles revisadas','No conducir si hay pérdida de presión'],
  ['Prueba de recorrido de pedal','mechanical','N/A','','','Vehículo inmovilizado','Respuesta del pedal evaluada','No sustituye comprobación profesional']]]]},
 {id:'tren',name:'Suspensión y dirección',description:'Tren delantero, tren trasero y dirección',icon:'move-horizontal',components:[
 ['bieletas','Bieletas y barra estabilizadora','front',[
  ['Comprobar juego en bieletas','mechanical','N/A','','','Vehículo apoyado de modo seguro','Holgura revisada','No confundir juego con deformación elástica'],
  ['Inspección de bujes','visual','N/A','','','Vehículo inmovilizado','Bujes observados','Revisar fisuras y separación']]],
 ['rotulas','Rótulas y terminales de dirección','front',[
  ['Comprobación de holguras','mechanical','N/A','','','Vehículo correctamente elevado, apoyos certificados','Holgura evaluada','Nunca apoyarse bajo gata sin torres'],
  ['Inspección de guardapolvos','visual','N/A','','','Vehículo inmovilizado','Guardapolvos revisados','Rupturas favorecen entrada de suciedad']]],
 ['amortiguadores','Amortiguadores y resortes','front',[
  ['Inspección de fugas y resortes','visual','N/A','','','Vehículo inmovilizado','Fugas y daños evaluados','No desarmar resorte sin equipo'],
  ['Revisión de anclajes','mechanical','N/A','','','Con suspensión descargada si corresponde','Anclajes revisados','Revisar torque de fabricante']]],
 ['direccion','Dirección asistida','front',[
  ['DTC de dirección asistida','scanner','N/A','','','Escáner compatible con EPS','Diagnóstico de dirección consultado','Seguir manual EPS'],
  ['Inspección de terminales y cremallera','visual','N/A','','','Vehículo seguro','Puntos de desgaste revisados','No manipular componentes energizados']]]]},
 {id:'transmision',name:'Transmisión y embrague',description:'Caja, embrague, semiejes y soportes',icon:'git-merge',components:[
 ['embrague','Embrague','underbody',[
  ['Prueba funcional del embrague','mechanical','N/A','','','Vehículo en zona segura','Comportamiento registrado','Evitar pruebas de sobrecarga'],
  ['Inspección de circuito hidráulico','visual','N/A','','','Motor apagado','Fugas visibles verificadas','Seguir procedimiento del sistema']]],
 ['semiejes','Semiejes y juntas homocinéticas','front',[
  ['Inspección de fuelles','visual','N/A','','','Vehículo seguro','Fuelles inspeccionados','No conducir con componente inseguro'],
  ['Prueba de holgura','mechanical','N/A','','','Vehículo inmovilizado','Holgura comparada','No exceder desplazamientos normales']]],
 ['caja','Caja de cambios','underbody',[
  ['Inspección de pérdidas de aceite','visual','N/A','','','Motor apagado','Fugas visibles revisadas','Cuidado con superficies calientes'],
  ['Lectura de DTC de transmisión','scanner','N/A','','','Solo si equipa módulo de transmisión compatible','DTC consultados','Caja manual puede no tener TCM']]]]},
 {id:'climatizacion',name:'Climatización y carrocería',description:'Aire acondicionado y equipos auxiliares',icon:'wind',components:[
 ['aire','Aire acondicionado','engine',[
  ['Lectura de presión con manifold compatible','pressure','N/A','','','Equipo y refrigerante correctos','Presiones examinadas didácticamente','Manipulación requiere formación y equipo'],
  ['Inspección de correa y polea de compresor','visual','N/A','','','Motor apagado','Correa y polea inspeccionadas','No intervenir con motor andando']]],
 ['luces','Iluminación y accesorios','electrical',[
  ['Tensión de alimentación en ampolleta','multimeter','DCV','Positivo de la ampolleta','Masa del portalámparas','Circuito encendido, puntas adecuadas','Alimentación medida','Comparar con alimentación de batería'],
  ['Inspección de conectores','visual','N/A','','','Circuito apagado','Conectores inspeccionados','No sustituir fusibles por valores mayores']]]]}];
const SYSTEMS=S.map(s=>({id:s.id,name:s.name,description:s.description,icon:s.icon}));
const COMPONENTS=Object.fromEntries(S.map(s=>[s.id,s.components.map(([id,name,zone])=>({id,name,zone}))]));
const CATALOG_TESTS=S.flatMap(s=>s.components.flatMap(([componentId,componentName,zone,tests],ci)=>tests.map((t,i)=>({id:`cat_${s.id}_${componentId}_${i}`,systemId:s.id,componentId,componentName,label:t[0],tool:t[1],mode:t[2],positive:t[3],negative:t[4],zone,setup:t[5],result:t[6],reading:t[7],significance:'Prueba de exploración general: no es evidencia suficiente por sí sola para confirmar la falla oculta del caso.',safety:t[1]==='multimeter'&&['OHM','CONT'].includes(t[2])?'¡Importante! Realiza esta prueba únicamente con el circuito desenergizado y aislado. '+SHARED_SAFETY:SHARED_SAFETY,minutes:t[1]==='visual'?4:8,cost:0,decisive:false,kind:'catalog'}))));
const BY_ID=new Map(CATALOG_TESTS.map(t=>[t.id,t]));
const key=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const RULES=[
 ['alternador','electrico',/alternador|regulador|sistema de carga|tension con motor|tensi[oó]n de carga|born(e|es) de alternador/],
 ['bateria','electrico',/bater[ií]a|tensi[oó]n en reposo|en partida|de bater[ií]a/],
 ['correa','electrico',/correa|polea|tensor/],['ecu','electrico',/dtc|c[oó]digos|c[oó]mputador|ecu|ecm|esc[aá]ner|centralita/],
 ['bobinas','electrico',/bobina|encendido|misfire|fallo de cilindro|contador de fallos/],
 ['inyectores','electrico',/inyector/],['masas','electrico',/ca[ií]da de tensi[oó]n|masa bajo|cableado|tierra/],
 ['fusibles','electrico',/fusible/],['reles','electrico',/rel[eé]/],['partida','electrico',/motor de partida|arranque/],
 ['maf','electrico',/maf|caudal de aire/],['map','electrico',/map|presi[oó]n absoluta/],['ect','electrico',/ect|temperatura de refrigerante/],
 ['ckp','electrico',/ckp|cig[uü]e[nñ]al/],['cmp','electrico',/cmp|[aá]rbol de levas/],['can','electrico',/can|comunicaci[oó]n/],
 ['aceleracion','motor',/mariposa|aceleraci[oó]n|ralent[ií]/],['admision','motor',/admisi[oó]n|vac[ií]o|manguera|fuga de aire/],
 ['combustible','motor',/combustible|presi[oó]n de gasolina|correcci[oó]n|stft|ltft/],
 ['compresion','motor',/compresi[oó]n|leakdown/],['refrigeracion','motor',/refrigerante|termostato/],
 ['pastillas','frenos',/c[aá]liper|pastillas|discos|freno|gu[ií]a de caliper/],['abs','frenos',/abs|sensor de rueda/],
 ['bieletas','tren',/bieleta|estabilizadora|bujes/],['rotulas','tren',/r[oó]tula|terminal|holgura/],['amortiguadores','tren',/amortiguador|resorte/],
 ['embrague','transmision',/embrague/],['semiejes','transmision',/semieje|homocin[eé]tica/],
 ['aire','climatizacion',/aire acondicionado|compresor de aire/],
];
function classifyTest(test,scenario={}){
 const k=key(test.label);
 for(const [componentId,systemId,re] of RULES)if(re.test(k))return {systemId,componentId};
 const scene=key(scenario.system||'');
 if(/carga|alternador|electric|tension/.test(scene))return {systemId:'electrico',componentId:test.tool==='scanner'?'ecu':'masas'};
 if(/fren|caliper/.test(scene))return {systemId:'frenos',componentId:'pastillas'};
 if(/suspens|direccion|tren/.test(scene))return {systemId:'tren',componentId:'bieletas'};
 if(/emisi[oó]n|motor|admis|encendid|inyecci/.test(scene))return {systemId:'motor',componentId:'admision'};
 if(test.zone==='front'||test.zone==='rear')return {systemId:'tren',componentId:'bieletas'};
 if(test.zone==='electrical'||test.zone==='cabin')return {systemId:'electrico',componentId:'ecu'};
 return {systemId:'motor',componentId:'admision'};
}
function guideFor(test){
 const mode=test.mode==='DCV'?'Tensión continua (V⎓)':test.mode==='OHM'?'Resistencia (Ω)':test.mode==='CONT'?'Continuidad':test.mode==='ACV'?'Tensión alterna (V~)':null;
 const how=[`Confirma el componente y qué quieres comprobar: ${test.label}.`,`Condiciones: ${test.setup}.`,mode?`Selecciona en el multímetro: ${mode}.`:'Utiliza la herramienta indicada y revisa el procedimiento de taller.',test.tool==='multimeter'?`Punta roja: ${test.positive}; punta negra: ${test.negative}.`:'Registra el hallazgo y contrástalo con otros síntomas.',test.safety,'Interpreta el resultado solo junto a las demás pruebas; utiliza los valores OEM cuando estén disponibles.'];
 return how;
}
export {SYSTEMS,COMPONENTS,CATALOG_TESTS,BY_ID,classifyTest,guideFor};
