# THOKAR Academy 1.0 — instrucciones de instalación

## Archivos (todos en la raíz)
- `index.html`: interfaz Android/PWA, taller 3D procedimental y simulador.
- `server.js`: servidor Node y conexión segura con Gemini.
- `package.json`: arranque de Render.
- `manifest.webmanifest`: instalación PWA.
- `sw.js`: caché de la aplicación para acceso básico sin conexión.

No se necesita carpeta `public`, `assets` ni `images`. No se necesitan paquetes npm externos.

## Publicar en GitHub
1. Crea un repositorio nuevo, por ejemplo `thokar-academy`.
2. En **Add file > Upload files**, arrastra los cinco archivos de esta carpeta directamente a la raíz del repositorio (y opcionalmente este README). No subas el ZIP sin descomprimir.
3. Confirma el commit.

## Publicar en Render
1. Render > **New > Web Service** > conecta el repositorio de GitHub.
2. Runtime: **Node**.
3. Build Command: `npm install`.
4. Start Command: `npm start`.
5. Environment > **Add Environment Variable**:
   - Key: `GEMINI_API_KEY`
   - Value: tu clave personal de Google AI Studio.
   - Opcional: `GEMINI_MODEL` = `gemini-2.5-flash` (cámbialo por un modelo compatible con JSON si es necesario).
6. Guarda y despliega. Abre `https://TU-SERVICIO.onrender.com/healthz` y verifica `"aiConfigured":true`.
7. Abre la URL normal en Android. En Chrome > menú > **Añadir a pantalla principal** / **Instalar aplicación**.

## Obtener la clave Gemini
1. Abre https://aistudio.google.com/apikey
2. Crea una clave API en tu proyecto de Google AI Studio.
3. Copia la clave únicamente en la variable `GEMINI_API_KEY` de Render. **Nunca la subas a GitHub, la pegues en index.html o la compartas por chat.**
4. El proveedor puede aplicar cuotas o cargos según tu cuenta y uso. Compruébalos antes de usarlo.

## Cómo funciona
- La primera vez se genera un caso para evaluación inicial.
- Conversa con el cliente, revisa el taller, realiza pruebas, elige reparaciones y redacta tu informe.
- La evaluación llega al final. Si no apruebas el primer intento, puedes reintentar sin revelar la solución.
- Si apruebas o terminas el segundo intento, puedes decidir si generar otro caso.
- Los casos y el progreso se guardan en `localStorage` del navegador. Exporta respaldos periódicamente en Ajustes.

## Límites de esta primera versión
- El vehículo del taller es un **modelo procedimental genérico 3D proyectado en canvas**, no un modelo exacto de cada marca o motor. Las zonas de inspección son generales; las pruebas del caso proporcionan los datos específicos.
- Las mediciones de casos generados por IA son ficticias para práctica, **no valores oficiales de fabricante**. La IA puede equivocarse y las fichas no sustituyen manuales de taller.
- El multímetro interactivo incluye una práctica básica independiente del caso. La conexión de puntas a terminales específicos y otros instrumentos avanzados se desarrollarán en versiones posteriores.
- Los clientes requieren internet y una API configurada. Los casos ya guardados y las pruebas preparadas se pueden consultar sin IA, pero no se pueden generar nuevas conversaciones offline.
- No existe aún un validador externo de especificaciones de fábrica: la IA recibe reglas para evitar datos OEM inventados, pero debe verificarse el contenido antes de utilizarlo en un vehículo real.
- El guardado local no sincroniza dispositivos. Si borras datos del sitio, se pierde el progreso salvo que tengas respaldo.
- El proveedor de IA y Render pueden imponer límites de uso o costos.
