# MODO: REANUDACIÓN EN FRÍO (continue!!)

**Instrucción Inmediata para el Agente:** Estás iniciando una nueva sesión o retomando el trabajo después de un tiempo inactivo. Tu prioridad es ahorrar tokens y recuperar el contexto operativo exacto.

1. **Lectura de Memoria Inmediata:**
   - Lee el archivo `memoria_estado.md` en la raíz del proyecto. **No ejecutes ninguna otra acción ni comando hasta haberlo leído y procesado**.
   
2. **Reconstrucción del Contexto (Silenciosa):**
   - Asimila el bloque `[ESTADO ACTUAL]` y `[ÚLTIMA ACCIÓN]`. 
   - Identifica exactamente cuál es el `[SIGUIENTE PASO]` dictado en la memoria.

3. **Restricción de Análisis:**
   - No intentes leer las conversaciones anteriores completas a menos que el estado en la memoria sea ambiguo. Confía en `memoria_estado.md` como la única fuente de verdad actual.
   - No le pidas al usuario que te resuma qué estaban haciendo.

4. **Acción:**
   - Inicia tu respuesta con un resumen de una sola línea siguiendo este formato:
     `CONTEXTO CARGADO: [Estado actual] | SIGUIENTE: [Paso pendiente]`
   - Ejecuta inmediatamente el paso pendiente si tienes la información necesaria, o pide la directiva para avanzar.
