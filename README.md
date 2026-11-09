# THOKAR Academy 2.8 — Gemini reintegrado con el método de THOKAR ZERO

## Qué se cambió

- Se eliminó de los flujos de IA el uso de la API **Interactions** (creación, consulta y chat). La nueva integración utiliza **`models/{model}:generateContent`**, igual que THOKAR ZERO 5.4.1.
- El chat utiliza mensajes con roles `user` / `model`, instrucciones de cliente chileno y antecedentes del caso. No contiene la causa oculta, reparaciones ni resultados de pruebas que el cliente no podría conocer. Para conversaciones normales **no se solicita JSON**.
- Para crear diagnósticos se solicita JSON estructurado y se valida su coherencia antes de iniciar el caso. Si Gemini rechaza específicamente el esquema, se reintenta **una vez con salida JSON sin esquema**, no se abre un caso local automáticamente.
- Un trabajo de generación corre **en el servidor** mientras Android consulta su progreso. Esta técnica evita que una sola conexión HTTP de Render permanezca abierta durante todo el diagnóstico. El estado es temporal: si Render reinicia el servicio, la generación pendiente deberá solicitarse nuevamente. Los casos ya guardados no se afectan.
- Se puede utilizar el modelo alternativo configurado con `GEMINI_FALLBACK_MODEL` si el principal falla por cuota, demora o fallo temporal. Se intenta como máximo un modelo alternativo por acción; **ninguno puede sobrepasar la cuota de tu proyecto**.
- La app avisa expresamente si Gemini falla. Solo inicia una práctica local cuando la eliges.
- Se separó el contador de consultas de progreso del límite interno de solicitudes normales, para que esperar un caso no bloquee las funciones del taller.
- Las sesiones que estaban pendientes en el sistema anterior se descartan automáticamente al intentar generar un nuevo caso; **no se borran casos terminados ni el progreso**.

## Instalación en GitHub y Render

1. Haz un respaldo JSON desde Ajustes si es posible.
2. Descomprime el ZIP y selecciona **todos los archivos**. Súbelos directamente a la **raíz** de tu repositorio de GitHub. No hay carpetas adicionales.
3. En el servicio de Render, comprueba que esté conectado a ese repositorio y que tenga:

   - Runtime: **Node.js**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - `GEMINI_API_KEY`: tu clave existente (no ponerla en GitHub)
   - `GEMINI_MODEL`: `gemini-3.8-flash`
   - `GEMINI_FALLBACK_MODEL`: `gemini-3.5-flash-lite` (opcional)
   - `GEMINI_CHAT_MODEL`: `gemini-3.8-flash` (opcional; si se omite usa `GEMINI_MODEL`)
   - `ACADEMY_ACCESS_CODE`: el código de acceso ya configurado
   - `ACADEMY_SECRET`: **EXACTAMENTE EL MISMO VALOR ANTERIOR** para recuperar casos cifrados

4. Despliega los cambios. Comprueba que `https://TU-APP.onrender.com/api/status` muestre `"version":"2.8.0"`.
5. Abre la app en el teléfono y recarga la página. En **Ajustes → Probar chat Gemini** comprueba el acceso y luego inicia un diagnóstico de Gemini.

## Si no funciona Gemini

- **429/cuota:** el proyecto no tiene capacidad disponible. Ni el código ni volver a generar un token aumentan esa cuota. Revisa Google AI Studio → Rate Limits / facturación. La app puede probar el modelo alternativo una vez.
- **401/403:** revisa la clave y permisos, y que corresponda al proyecto de Google AI Studio.
- **404:** revisa el nombre del modelo.
- **400/schema:** se reintenta una vez sin esquema obligatorio, conservando JSON. Si falla, se muestra el error y no se inventa un caso.
- **Fallo del servicio o conexión:** entra a Render → Logs y revisa los mensajes `[Generación Gemini]` o `[Gemini chat]`.
- **Queda un caso pendiente tras actualizar:** vuelve a solicitar el caso; las solicitudes de Interactions de versiones anteriores no son recuperables con el nuevo método.

## Pruebas

`npm test` ejecuta pruebas de servidor, conversaciones, generación, cuotas, esquema JSON, pruebas técnicas, evaluación y guardado. Se ejecutaron con **respuestas simuladas** de la API, sin tu clave real. No se pudo completar una inspección visual en Android/Chromium debido a un bloqueo de navegación del entorno de pruebas.

## Limitaciones honestas

- No se hizo una llamada real a Gemini con tu clave; la cuota y acceso deben comprobarse desde tu Render.
- Render en su modalidad sin persistencia puede reiniciar el servidor y perder **solo una generación pendiente**, no los casos guardados en el navegador.
- Las mediciones de los casos son educativas/simuladas, no especificaciones oficiales de un fabricante.
