# THOKAR Academy 2.1 — Corrección de generación y conexión Gemini

Versión corregida para **GitHub + Render**, preparada para Android como PWA. Los **13 archivos del ZIP van directamente en la raíz** del repositorio. No hay carpetas que subir. No contiene contraseñas ni claves de Gemini.

## Qué se corrigió

- El botón **Generar caso** ahora cambia inmediatamente al Taller y muestra que está preparando el diagnóstico, en vez de quedar sin respuesta en Inicio.
- Si Gemini devuelve **429 (cuota)**, **403 (acceso)**, un caso incompleto, demora demasiado o no hay API configurada, el servidor prepara un **caso local de entrenamiento** y explica por qué. La generación ya no queda bloqueada por Gemini. Si Render está caído o el código de acceso es incorrecto, la aplicación muestra un mensaje accionable; en ese caso no puede solicitar casos al servidor.
- Se agregó **Practicar sin Gemini (modo local)** para generar inmediatamente un caso sin consumir cuota de Google. No necesita cambiar GitHub para alternar modos.
- Se comprobó que las mediciones de cada caso son fijas, que la causa oculta no se envía al cliente y que el instructor permite una segunda oportunidad sin revelarla.
- La creación de un caso con IA usa **una consulta** por defecto, en lugar de crear el caso y solicitar una segunda auditoría automáticamente. Esto reduce la cuota consumida. La validación estructural de casos sigue activa; el auditor IA adicional es opcional.
- El botón **Ajustes → Comprobar acceso** valida realmente el código con Render. **Ajustes → Probar Gemini** realiza una consulta pequeña real y muestra si hay cuota / problemas de modelo.
- Si el cliente simulado depende de Gemini pero la conexión falla después, se activan respuestas de respaldo (informando del cambio). Las pruebas y reparaciones no dependen de que Gemini responda en cada acción.
- Se renovó el caché de la PWA para facilitar la actualización sobre la versión anterior.
- Se mantiene el almacenamiento anterior (`thokar-academy-v2-state`) y su sistema de respaldo; no borres los datos del navegador.

## Primeros pasos: actualizar GitHub

1. Haz un respaldo JSON de tu progreso en la aplicación anterior, si puedes abrir Ajustes.
2. Descarga el ZIP, **descomprímelo** y selecciona los **13 archivos**.
3. Abre tu repositorio de GitHub y ve a **Add file → Upload files**.
4. Sube los 13 archivos **directamente a la raíz** del repositorio. Reemplaza los anteriores y realiza **Commit changes**.
5. En Render, abre tu **Web Service**, revisa que esté conectado al repositorio y ejecuta **Manual Deploy → Deploy latest commit** si no despliega automáticamente.
6. No crees carpetas adicionales, no subas el ZIP sin descomprimir y **no borres** el repositorio anterior.

### Configuración de Render

| Variable | Valor | Uso |
|---|---|---|
| `ACADEMY_ACCESS_CODE` | Código privado que tú eliges | **Obligatoria** para proteger el servidor. Es el código que se introduce en Ajustes de la app. |
| `ACADEMY_SECRET` | Cadena privada larga, estable | **Muy recomendada** para poder reabrir tus casos. No cambies su valor después. |
| `GEMINI_API_KEY` | Clave de Google AI Studio | Opcional para casos locales; necesaria para los casos y conversaciones con IA. |
| `GEMINI_MODEL` | `gemini-3.8-flash` | Opcional. Debes tener cuota para el modelo elegido. |
| `CASE_AUDIT` | `0` o sin definir | No realiza una segunda consulta IA por caso. Si lo estableces en `1`, habrá una auditoría IA adicional que consume cuota. |
| `ACADEMY_LOCAL_ONLY` | `1` para forzar modo local | Opcional, útil si quieres evitar totalmente llamadas a Gemini. |

Render: **Runtime Node**, **Build Command `npm install`**, **Start Command `npm start`**, **Root Directory vacío**.

La aplicación usa la [API Interactions de Gemini](https://ai.google.dev/gemini-api/docs/interactions-overview), modelo predeterminado `gemini-3.8-flash`. El código de la app utiliza `response_format` con salida JSON estructurada y `store: false`. Cambiar el modelo **no soluciona por sí solo** una cuota de Google agotada o igual a cero; revisa la disponibilidad real en [AI Studio → Rate Limits](https://aistudio.google.com/rate-limit).

## Cómo comprobar la instalación desde el teléfono

1. Abre tu URL de Render, por ejemplo `https://tu-servicio.onrender.com/`.
2. En **Ajustes**, escribe `ACADEMY_ACCESS_CODE` exactamente como aparece en Render. **No pegues `GEMINI_API_KEY` aquí.** Guarda.
3. Abre Ajustes de nuevo y pulsa **Comprobar acceso**. Debe indicar que el servidor responde y el código es correcto.
4. Pulsa **Probar Gemini** para una prueba real de la API (esta prueba consume una llamada).
5. Pulsa **Generar nuevo diagnóstico**. La pantalla cambiará a Taller mientras se prepara.
6. Si Google rechaza la llamada, verás un aviso de **práctica local** y podrás seguir con el caso. También puedes elegir directamente **Practicar sin Gemini**.

### Qué significa el modo local

El servidor tiene **cinco escenarios de respaldo revisados** (Nissan Qashqai, Hyundai Accent, Chevrolet Sail, Suzuki Swift y Peugeot 3008) con variaciones de nombre del cliente y kilometraje. Los mismos escenarios pueden volver a aparecer; no son generación ilimitada mediante IA. La generación verdaderamente abierta de combinaciones nuevas utiliza Gemini **cuando tu cuota lo permite**. Los escenarios locales identifican sus mediciones como didácticas y no como datos OEM verificados.

El modo local **no consume Gemini**, pero sí requiere que tu **servidor Render esté accesible** y que tengas el código de acceso correcto. No es un sistema completamente desconectado de internet.

### Errores y soluciones

- **Se queda en Inicio:** comprueba que GitHub y Render estén usando los archivos de la versión 2.1. En `https://tu-servicio.onrender.com/api/status` debe aparecer `"version":"2.1.0"`.
- **Error 401:** código incorrecto; escribe el valor de `ACADEMY_ACCESS_CODE` en Ajustes.
- **Error 503 por código sin configurar:** añade `ACADEMY_ACCESS_CODE` en Environment de Render y vuelve a desplegar.
- **Gemini 429 / cuota:** funciona en modo local. Para generar casos por IA debes corregir los límites en AI Studio; la aplicación no puede aumentar la cuota.
- **Clave 403 o modelo no disponible:** comprueba `GEMINI_API_KEY` y el modelo elegido en tu proyecto.
- **Render duerme en el plan gratuito:** abre el enlace y espera a que responda el servicio. Si está caído, la app no puede solicitar casos.
- **Una sesión antigua dejó de abrir:** revisa que no hayas cambiado `ACADEMY_SECRET` (o la clave API utilizada anteriormente como secreto implícito).
- **Se ve código o interfaz antiguos:** recarga la app después del despliegue, cierra y vuelve a abrir Chrome. La versión actual trae un nuevo identificador de caché. No borres datos del sitio sin respaldo.

## Pruebas realizadas

Ejecuta `npm test` localmente (Node >= 20). El paquete incluye pruebas de:

- API y código de acceso (correcto/incorrecto).
- Generación de casos simulada con Gemini.
- **Fallos de Gemini 429 simulados**: generación de caso local y conversaciones de respaldo.
- Casos locales diferentes sin actualización de archivos.
- Cifrado y separación de la causa oculta.
- Mediciones reproducibles y pruebas de multímetro.
- Reparaciones, verificación, informe y segunda oportunidad.
- Evaluación de hipótesis y contenidos mínimos de la interfaz.

**Alcances de la verificación:** las pruebas automatizadas pasaron, pero **no se ha podido probar una clave Gemini real** ni completar una prueba visual en un Android real desde este entorno. Gemini puede seguir devolviendo 429 si tu proyecto no tiene cuota; en ese caso se ofrece el modo local. Los modelos 3D siguen siendo representaciones genéricas y la precisión técnica de los casos IA debe tratarse como didáctica, no como documentación de fabricante.

## Estructura plana del ZIP

- `index.html`
- `style.css`
- `app.js`
- `workshop3d.js`
- `server.js`
- `offline-cases.js`
- `package.json`
- `manifest.webmanifest`
- `sw.js`
- `icon.svg`
- `README.md`
- `tests.mjs`
- `resilience-tests.mjs`
