# THOKAR Academy 2.7 — Corrección de evaluaciones, pistas y catálogo

## Qué cambia

1. **La reparación correcta y su verificación resuelven el caso:** el informe puede cerrarse sin abrir todas las pruebas ni ejecutar cada comprobación marcada como decisiva. Las mediciones y una hipótesis fundamentada siguen influyendo en la puntuación, pero ya no impiden revelar la solución cuando la reparación realmente fue correcta y la verificación resultó satisfactoria.
2. **Acceso al informe tras verificar:** aparece el botón «Continuar con el informe».
3. **Pistas progresivas:** botón «Pista» durante el diagnóstico; hasta tres pistas metodológicas que no revelan la causa. Se conservan durante la sesión y no requieren llamadas a Gemini.
4. **Rendirse:** requiere confirmación; revela causa, fundamento, prueba(s) relevantes y reparación correcta. Registra el caso con 0 puntos y sin XP.
5. **Sensor de oxígeno / sonda lambda:** incluido en el catálogo tanto en «Eléctrico y electrónico» como en «Motor y combustible», con inspecciones, lectura por escáner y comprobación del circuito del calefactor. No se presentan valores universales como especificaciones OEM. La medición depende del tipo de sonda, del vehículo y de la herramienta.
6. **Corrección de scroll del catálogo:** al elegir componentes situados al final de una lista larga (como Relés), el catálogo vuelve a mostrar la cabecera y las pruebas en lugar de conservar el desplazamiento anterior.
7. Conserva los avances anteriores (misma clave `thokar-academy-v2-state` en el almacenamiento local) y mantiene la integración de Gemini 2.6 para generación y conversaciones.

## Subir a GitHub y desplegar en Render

Descomprime el archivo ZIP y sube **todos los archivos directamente a la raíz** del mismo repositorio, reemplazando los anteriores. No se necesitan carpetas.

Render, Web Service Node.js:

- Build Command: `npm install`
- Start Command: `npm start`
- Mantén las variables de entorno existentes: `GEMINI_API_KEY`, `GEMINI_MODEL` (si la configuraste), `GEMINI_CHAT_MODEL` (si la usas), `ACADEMY_ACCESS_CODE`, `ACADEMY_SECRET`.
- **No cambies `ACADEMY_SECRET`**: es necesaria para abrir diagnósticos cifrados anteriores.
- Tras el despliegue, recarga la PWA si sigue mostrando el diseño previo. El service worker usa un nombre de caché nuevo para esta versión.

## Comprobaciones

En el entorno de desarrollo pasaron **33 pruebas automáticas**, incluidas: una reparación verificada sin pruebas decisivas, pistas sin filtración de la falla, rendición, catálogo de oxígeno, navegación de catálogo a nivel de código, la segunda oportunidad, la evaluación repetible y los flujos previos del chat y Gemini simulados.

La prueba interactiva visual con Chromium no pudo completarse porque el entorno bloqueó la navegación a páginas locales. Las pruebas de Gemini usan respuestas simuladas; la conexión real seguirá dependiendo del servicio, permisos y cuota de tu proyecto Google.

## Uso

- Durante un caso: **Pista** para pedir orientación. Puedes solicitar hasta tres.
- Durante un caso: **Rendirse** para finalizar conscientemente y estudiar la solución.
- En Herramientas: **Sistemas → Eléctrico y electrónico → Sensor de oxígeno (sonda lambda)**, o **Motor y combustible → Sensor de oxígeno (sonda lambda)**.
- Tras una reparación, pulsa **Realizar prueba posterior a la reparación** y luego **Continuar con el informe**. Ya no se exige revisar todo el catálogo para resolverlo.

Los resultados son simulaciones educativas; no sustituyen mediciones o manuales oficiales de servicio.
