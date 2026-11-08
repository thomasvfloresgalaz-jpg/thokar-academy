# THOKAR ACADEMY 2.4 · Rediseño y memoria (GitHub + Render)

Versión 2.4.0 del entrenador de diagnóstico automotriz. **Todos los archivos se suben sueltos a la raíz del repositorio**, sin carpetas adicionales.

## Actualizar desde una versión anterior

1. Antes de actualizar, en la aplicación anterior entra a **Ajustes → Exportar respaldo** y guarda el JSON si puedes.
2. Descomprime el ZIP y sube **todos** los archivos de su interior a la raíz del mismo repositorio de GitHub, sustituyendo archivos homónimos. No crees subcarpetas.
3. En Render, conecta el repositorio al **Web Service** Node existente y despliega el último commit. Configuración: `Build Command: npm install`, `Start Command: npm start`, Node >= 20.
4. En **Environment**, conserva las variables existentes:
   - `ACADEMY_ACCESS_CODE`: código privado para entrar a la aplicación.
   - `ACADEMY_SECRET`: frase aleatoria larga, estable, utilizada para cifrar los casos. **No la cambies si tienes casos guardados.**
   - `GEMINI_API_KEY`: tu clave de Google AI Studio para Gemini (opcional: sin ella funcionan casos locales).
   - `GEMINI_MODEL`: `gemini-3.8-flash` o un modelo admitido por tu cuota/proyecto.
   - `ACADEMY_LOCAL_ONLY`: `1` solo si quieres forzar práctica local y evitar consumo de Gemini.
5. Abre la misma URL en Android, cierra la pestaña anterior, vuelve a abrirla y recarga si todavía aparece la interfaz antigua. No borres los datos del sitio: la memoria y los casos se guardan localmente.
6. En **Ajustes** ingresa el código `ACADEMY_ACCESS_CODE` y utiliza **Comprobar acceso** o **Probar Gemini** antes de solicitar un caso nuevo.

## Qué cambió

- **Navegación y taller:** barra inferior con íconos SVG nuevos y transiciones; escena con cámara suavizada, controles táctiles simplificados y puntos de inspección discretos (ya no hay números sobre las piezas).
- **Catálogo abierto:** entra por **sistema → componente → comprobación**. No hay lista cerrada de las pruebas que conviene hacer para la falla. Las pruebas del caso aparecen integradas junto a un catálogo general de métodos. Puedes elegir independientemente.
- **Mediciones:** se elige escala, punta positiva y negativa. Después de **cinco conexiones o escalas incorrectas del mismo componente**, aparece una guía técnica de cómo medir sin revelar la avería oculta.
- **Clientes:** personajes masculinos y expresiones chilenas; el chat responde según el tema de la pregunta. Si la IA no está disponible, hay respuestas locales distintas para kilometraje, arranque, mantenciones, testigos, condiciones de la falla, etc.
- **Memoria local:** detecta temas de preguntas y conserva ejemplos y respuestas del **mismo caso** para reducir consultas repetidas. En un caso diferente NO recicla antecedentes personales de otro cliente. Usa temas aprendidos para variar los próximos casos de Gemini.
- **Casos nuevos:** cada pulsación envía una solicitud nueva a Gemini con una plantilla y contexto de diversidad; si hay un error de cuota o red, ofrece casos locales para continuar. Los casos locales no son infinitos; las variaciones por IA requieren acceso y cuota.
- **Evaluación estable:** la nota se calcula con criterios deterministas, y volver a consultar sin nuevas acciones conserva la evaluación; se puede obtener 100/100. La segunda oportunidad respeta el diagnóstico oculto.
- **Resultados:** pantalla de informe con explicación de evidencia, verificación y mejoras.

## Diferencias importantes entre pruebas del caso y catálogo general

Las mediciones de los **casos** son simulaciones didácticas, no especificaciones OEM certificadas. Las comprobaciones **generales** indican cómo abordar un componente, pero no implican que la falla de ese caso esté ahí ni inventan un voltaje o resistencia específico de fabricante. Consulta siempre manual técnico y condiciones exactas antes de medir vehículos reales. No utilices una simulación como dato de reparación.

El taller visual utiliza una carrocería 3D **procedimental genérica**; no es un modelo digital exacto del vehículo indicado por el cliente. Las comprobaciones del catálogo no convierten por sí solas la carrocería en un motor desmontable completo.

## Protección de la clave y privacidad

Nunca coloques `GEMINI_API_KEY` en el HTML, JavaScript del navegador, el repositorio público ni una captura. La clave se guarda **solo en Render**. El código de acceso es distinto de la clave API. Se recomienda un `ACADEMY_SECRET` largo y permanente. El progreso se guarda en el dispositivo/navegador; respáldalo desde **Ajustes → Exportar respaldo**, especialmente antes de cambiar de dominio o navegador.

## Diagnóstico si Gemini falla

En **Ajustes → Probar Gemini** puedes verificar si el modelo responde. Un error **429** es de cuota de Google, no significa que los archivos de Render estén dañados. Verifica cuotas del proyecto en https://aistudio.google.com/rate-limit y prueba un modelo realmente habilitado para tu proyecto. La práctica local está disponible incluso sin Gemini.

## Comprobación de código

Desde un entorno Node 20+ con los archivos del repositorio: `npm test` ejecuta pruebas de servidor y regresión: autorización, generación, caída de Gemini, memoria, catálogo, chat, mediciones y nota reproducible. Las pruebas no requieren tu clave API, pues simulan los servicios externos. **No sustituyen una prueba real con Gemini ni una validación de datos OEM por fabricante.**
