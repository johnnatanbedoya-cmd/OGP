import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { BLOQUES_TALLER } from "@/lib/taller-preguntas";
import {
  FRECUENCIAS_FUNCION,
  TIPOS_FLUJO,
  TIPOS_RIESGO,
  NIVELES_RIESGO,
  TIPOS_BARRERA,
  TIPOS_COMPETENCIA,
  NIVELES_COMPETENCIA,
  MODALIDADES_TRABAJO,
  NIVELES_AUTONOMIA,
  NIVELES_RECURSO,
  ROLES_SST,
  TIPOS_VINCULACION,
  CLASES_RIESGO_ARL,
} from "@/lib/validaciones";

const MODELO = "claude-sonnet-5";

// Precios de claude-sonnet-5 por millón de tokens (USD) — si el MODELO de
// arriba cambia alguna vez, hay que actualizar esto también. Fuente: tabla de
// precios de la API de Anthropic vigente al 2026-09-28.
const PRECIO_ENTRADA_POR_MILLON_USD = 2.0;
const PRECIO_SALIDA_POR_MILLON_USD = 10.0;

export type UsoIA = { tokensEntrada: number; tokensSalida: number; costoUsd: number; modelo: string };

// Verbos de acción por nivel cognitivo — Taxonomía de Bloom (adaptación en
// español, la misma que usan los consultores de RR.HH. para redactar
// funciones de cargo con verbos precisos en vez de descripciones vagas).
// Se usa como referencia para el Bloque 2 (funciones) — ver instrucción en
// SYSTEM_PROMPT más abajo.
const TAXONOMIA_BLOOM = `Taxonomía de Bloom — verbos de acción por nivel cognitivo (de menor a mayor complejidad):

1. CONOCIMIENTO (recordar/memorizar): apuntar, definir, describir, encontrar, enlistar, identificar, marcar,
   memorizar, nombrar, numerar, reconocer, recordar, registrar, relatar, repetir, subrayar.
2. COMPRENSIÓN (entender/explicar): completar, describir, descubrir, ejemplificar, esquematizar, explicar,
   expresar, identificar, informar, interpretar, listar, localizar, narrar, organizar, predecir, preparar,
   reconocer, relacionar, resumir, revisar, traducir, ubicar.
3. APLICACIÓN (usar/ejecutar en la práctica): aplicar, clasificar, completar, construir, demostrar, ejecutar,
   emplear, examinar, experimentar, ilustrar, interpretar, operar, planear, practicar, programar, tramitar,
   usar, utilizar.
4. ANÁLISIS (descomponer, comparar, encontrar relaciones): analizar, calcular, catalogar, categorizar,
   comparar, contrastar, cuestionar, diagnosticar, diferenciar, discriminar, distinguir, examinar,
   inspeccionar, investigar, organizar, revisar, verificar.
5. SÍNTESIS (combinar partes en un todo nuevo): coordinar, componer, construir, crear, diseñar, dirigir,
   ensamblar, establecer, formular, gestionar, integrar, organizar, planear, preparar, priorizar, proponer,
   recomendar, reunir.
6. EVALUACIÓN (juzgar valor, decidir, crear con criterio propio): aprobar, calificar, decidir, elaborar,
   estimar, evaluar, juzgar, medir, planificar, resolver, seleccionar, supervisar, validar, valorar.

Un cargo operativo/asistencial usa sobre todo verbos de los niveles 1 a 3; un cargo de coordinación o
dirección usa más verbos de los niveles 4 a 6 — el nivel debe reflejar la complejidad real de la tarea
descrita en el taller, no inflarse artificialmente.`;

// Fórmula de redacción adaptada de la Guía DAFP para Manuales de Funciones —
// se usa tanto para razonSer/funciones (VERBO EN INFINITIVO + OBJETO +
// CONDICIÓN) como para el criterio de desempeño de cada función (mismo
// orden pero con el verbo conjugado, porque describe un resultado ya
// logrado, no una instrucción).
const FORMULA_REDACCION = `Fórmula de redacción (razón de ser y cada función):

VERBO EN INFINITIVO + OBJETO + CONDICIÓN
- Verbo: SIEMPRE en infinitivo (termina en -ar, -er o -ir — "procesar", no "procesa"; "atender", no "atiende").
  Toma el verbo de la Taxonomía de Bloom de arriba, en el nivel cognitivo que de verdad corresponda.
- Objeto: sobre qué recae esa acción.
- Condición: el estándar o requerimiento de calidad esperado en el resultado (según qué, cómo, o para qué).

Ejemplo: "Procesar (verbo, infinitivo) la nómina quincenal del personal (objeto) dentro de los plazos
establecidos por la empresa (condición)."

El criterio de desempeño de cada función usa el mismo objeto y condición, pero con el verbo CONJUGADO (no en
infinitivo) porque describe un resultado ya logrado, no una instrucción — ej. para la función "Procesar la
nómina quincenal...", su criterio de desempeño sería: "La nómina quincenal se procesa dentro de los plazos
establecidos, sin errores en los pagos."`;

const SYSTEM_PROMPT = `Eres un asistente que ayuda a un consultor de Recursos Humanos en Colombia a redactar
Perfiles Ocupacionales técnicos y formales, a partir de un Taller de campo: una entrevista hecha en lenguaje
cotidiano a quien ocupa (o conoce) un cargo.

Tu tarea: leer las respuestas del taller y traducirlas a las secciones técnicas de un Perfil ocupacional,
entregando el resultado con la herramienta "entregar_borrador_perfil".

${TAXONOMIA_BLOOM}

${FORMULA_REDACCION}

Reglas importantes:
- No inventes información que no esté respaldada por las respuestas. Si una sección no tiene información
  suficiente, entrégala vacía (cadena vacía o arreglo vacío) — es preferible dejarla en blanco a inventar.
- Redacta en tono formal, profesional, impersonal (no "Yo proceso...", ni tampoco "Procesa..." — ver la
  fórmula: el verbo va en infinitivo, "Procesar...").
- razonSer y cada "función" (Bloque 2) deben seguir la fórmula VERBO EN INFINITIVO + OBJETO + CONDICIÓN de
  arriba — nunca el verbo conjugado, y nunca verbos vagos como "hacer", "encargarse de", "apoyar en" o "ayudar
  con" si existe uno más preciso en la Taxonomía de Bloom.
- No te limites a parafrasear la respuesta del taller casi literal. Tu trabajo es AYUDAR A REDACTAR MEJOR:
  toma lo que la persona contó en sus palabras y elabora una versión técnica, completa y bien construida de
  cada función — con vocabulario propio de un perfil de cargo, aclarando el objeto y la condición aunque el
  taller solo los haya insinuado, y separando en varias funciones bien delimitadas lo que en la respuesta
  vino mezclado en una sola frase. Redactar mejor no es inventar hechos nuevos: es dar forma profesional a los
  hechos que sí están en la respuesta.
- Cada función que entregues debe traer también su "criterioDesempeno": el mismo objeto y condición de esa
  función, pero con el verbo conjugado (ver fórmula) — describe el resultado logrado, no la instrucción. Si
  no hay suficiente información en las respuestas para construir un criterio de desempeño confiable para esa
  función en particular, entrega cadena vacía en ese campo — no inventes un estándar de calidad que el taller
  no mencionó ni se puede inferir razonablemente de lo dicho.
- Antes de fijar la lista final de "funciones" (Bloque 2), diagnostica qué tipo de respuesta dio el taller para
  cada tarea o bloque de tareas, y trátala según corresponda — no apliques una sola estrategia (ni dividir todo,
  ni agrupar todo) a todo el taller por igual, decide caso por caso:
  1. Respuesta objetiva, puntual y con límites claros (ya describe un único resultado concreto): consérvala como
     una sola función — solo mejora su redacción con la fórmula, sin fragmentarla ni fusionarla con otras.
  2. Respuesta muy general que en realidad mezcla varias tareas o resultados distintos en una sola frase (ej.
     "me encargo de todo el proceso de nómina", o la descripción de "un día típico" con varios pasos separables):
     desglósala en varias funciones, una por cada resultado distinto — no la dejes como una sola función vaga.
  3. Respuesta excesivamente detallada que en realidad describe pasos o variaciones de un mismo resultado (ej.
     filas separadas para "recibir el archivo", "revisar el archivo" y "subir el archivo al sistema", que son
     pasos de una sola función "procesar el archivo de novedades"): agrúpalas y contextualízalas en una función
     más completa, en vez de fragmentar el mismo resultado en varias filas redundantes.
  Cada función final debe describir un resultado distinto y bien delimitado — ni tan genérica que oculte tareas
  distintas, ni tan fragmentada que repita el mismo resultado en varias filas.
- Las "decisiones" (autoridad y toma de decisiones) se derivan de los ejemplos concretos que dé el taller —
  cada una con su nivel de autonomía (autónoma / requiere consulta previa / requiere aprobación), tal como lo
  haya descrito la persona. No inventes ejemplos que no se hayan mencionado.
- Los "recursos a cargo" (personas, dinero, equipos, información confidencial, materiales) solo se llenan si el
  taller menciona explícitamente que la persona maneja ese tipo de recurso; el nivel (alta/media/baja) es una
  estimación razonable a partir de lo descrito (por ejemplo, "maneja la caja menor de la oficina" es un nivel
  bajo/medio de dinero, no alto). Si no se menciona un tipo de recurso, dejar su nivel y descripción vacíos.
- Las "evidencias" (evidenciaProducto, evidenciaDesempeno, evidenciaConocimiento) describen cómo se comprobaría
  que alguien cumple este perfil, a partir de las funciones ya descritas: evidenciaProducto es un entregable
  concreto y verificable (ej. "reporte de nómina del mes"); evidenciaDesempeno es algo observable en el puesto
  de trabajo (ej. "observación directa al atender una PQR"); evidenciaConocimiento es una forma de evaluar
  saber teórico (ej. "prueba escrita sobre el manejo del sistema de nómina"). Solo llénalas si se derivan con
  naturalidad de las funciones descritas — de lo contrario, cadena vacía.
- Los riesgos de SST llevan también "controlesExistentes" (medidas que el taller mencione que ya existen, más
  allá del EPP: señalización, capacitación, procedimientos) y "eppRequerido" (el elemento de protección
  específico para ESE riesgo puntual, si el taller lo asocia a él) — cadena vacía si no hay información.
- "rolesSst" solo incluye los roles de la lista cerrada que el taller mencione explícitamente que la persona
  ejerce (brigadista, COPASST, comité de convivencia, responsable del SG-SST, coordinador de alturas, líder
  del PESV) — arreglo vacío si no se menciona ninguno.
- "responsabilidadesSst" son responsabilidades puntuales de SST distintas de las funciones normales del cargo
  (ej. "revisar mensualmente el botiquín", "liderar el simulacro de evacuación de su área") — solo si el
  taller las menciona.
- requisitoEducacionFormal, requisitoFormacionComplementaria, requisitoExperienciaGeneral y
  requisitoExperienciaEspecifica se derivan de las respuestas sobre formación y experiencia — con el mismo
  criterio de no inventar: si el taller no distingue formación "formal" de "complementaria", o experiencia
  "general" de "específica", usa el criterio profesional para clasificarlas y deja vacío lo que no aplique.
- equiposHerramientas y dotacion se derivan de las respuestas sobre programas/herramientas/dotación —
  equiposHerramientas son las herramientas de trabajo (software, maquinaria, equipos), dotacion son los
  elementos personales que recibe el trabajador (uniforme, calzado, dispositivos personales).
- tipoVinculacion y claseRiesgoArl son datos administrativos/legales precisos, no una impresión general — solo
  los llenas si el taller da un valor claro y exacto que coincida con la lista cerrada (ej. "estamos a término
  indefinido", "somos clase de riesgo III"). Si la respuesta es vaga, dudosa, o no se menciona, deja el campo
  vacío para que el asesor lo confirme — equivocarte aquí tiene consecuencias legales/contractuales reales.
- En los campos que piden un valor de una lista cerrada (enum), usa siempre uno de los valores permitidos —
  nunca inventes una categoría fuera de la lista.
- Las respuestas del Bloque 1 sobre "a quién reporta" y "personas a cargo" son solo contexto estructural (el
  organigrama ya lo modela aparte, en otra parte de la plataforma) — NO las repitas dentro de razonSer ni
  criticidadAusencia.
- Nunca uses el nombre propio de una persona específica en ningún campo del borrador (razonSer, criticidadAusencia,
  autonomiaDecision, decisiones, participacionComites, responsabilidadesSst, etc.), aunque el taller lo mencione
  por su nombre. El jefe inmediato de un cargo puede cambiar en el organigrama sin que el Perfil se actualice
  solo, así que un nombre propio queda obsoleto tarde o temprano — refiérete siempre al rol, cargo o área (ej.
  "su jefe inmediato", "la Dirección de Talento Humano", "el área de SST") en vez del nombre de la persona que
  hoy ocupa ese cargo.
- Este es un borrador que un humano va a revisar antes de guardar nada — prioriza la fidelidad a lo dicho por
  encima de qué tan "completo" se vea el resultado.`;

const HERRAMIENTA_BORRADOR: Anthropic.Tool = {
  name: "entregar_borrador_perfil",
  description: "Entrega el borrador del Perfil ocupacional en español, listo para que un consultor de RR.HH. lo revise.",
  input_schema: {
    type: "object",
    properties: {
      razonSer: { type: "string", description: "Razón de ser del cargo — verbo en infinitivo + objeto + condición (ej. 'Procesar la nómina...'). Cadena vacía si no hay información suficiente." },
      criticidadAusencia: { type: "string", description: "Qué pasaría si el cargo no existiera. Cadena vacía si no hay información." },
      sede: { type: "string", description: "Sede o ubicación donde se realiza el trabajo. Cadena vacía si no se menciona." },
      modalidadTrabajo: { type: "string", enum: ["", ...MODALIDADES_TRABAJO], description: "Modalidad de trabajo. Cadena vacía si no se menciona." },
      tipoVinculacion: { type: "string", enum: ["", ...TIPOS_VINCULACION], description: "Tipo de vinculación contractual. Cadena vacía si el taller no da un dato claro y exacto." },
      claseRiesgoArl: { type: "string", enum: ["", ...CLASES_RIESGO_ARL], description: "Clase de riesgo ARL (I a V). Cadena vacía si el taller no da un dato claro y exacto." },
      autonomiaDecision: { type: "string", description: "Nivel de autonomía y toma de decisiones. Cadena vacía si no hay información." },
      recursoPersonasNivel: { type: "string", enum: ["", ...NIVELES_RECURSO] },
      recursoPersonasDescripcion: { type: "string" },
      recursoDineroNivel: { type: "string", enum: ["", ...NIVELES_RECURSO] },
      recursoDineroDescripcion: { type: "string" },
      recursoEquiposNivel: { type: "string", enum: ["", ...NIVELES_RECURSO] },
      recursoEquiposDescripcion: { type: "string" },
      recursoInfoConfidencialNivel: { type: "string", enum: ["", ...NIVELES_RECURSO] },
      recursoInfoConfidencialDescripcion: { type: "string" },
      recursoMaterialesNivel: { type: "string", enum: ["", ...NIVELES_RECURSO] },
      recursoMaterialesDescripcion: { type: "string" },
      participacionComites: { type: "string", description: "Comités o reuniones periódicas en las que participa. Cadena vacía si no aplica." },
      eppRequerido: { type: "string", description: "Elementos de protección personal requeridos en general. Cadena vacía si no aplica." },
      protocolosEmergencia: { type: "string", description: "Protocolo de reporte de incidentes o emergencias. Cadena vacía si no hay información." },
      rolesSst: { type: "array", items: { type: "string", enum: [...ROLES_SST] }, description: "Roles especiales de SST que ejerce, solo si se mencionan explícitamente." },
      requisitoEducacionFormal: { type: "string" },
      requisitoFormacionComplementaria: { type: "string" },
      requisitoExperienciaGeneral: { type: "string" },
      requisitoExperienciaEspecifica: { type: "string" },
      dotacion: { type: "string" },
      equiposHerramientas: { type: "string" },
      evidenciaProducto: { type: "string", description: "Entregable concreto que demuestra el cumplimiento del perfil. Cadena vacía si no se puede derivar de las funciones." },
      evidenciaDesempeno: { type: "string", description: "Algo observable en el puesto de trabajo que demuestra la competencia. Cadena vacía si no se puede derivar de las funciones." },
      evidenciaConocimiento: { type: "string", description: "Forma de evaluar el saber teórico requerido (prueba oral/escrita). Cadena vacía si no se puede derivar de las funciones." },
      funciones: {
        type: "array",
        description: "Funciones/tareas concretas del cargo, derivadas de la descripción del día a día y su frecuencia.",
        items: {
          type: "object",
          properties: {
            descripcion: {
              type: "string",
              description: "Verbo en infinitivo + objeto + condición (ej. 'Procesar la nómina quincenal...'). Nunca el verbo conjugado.",
            },
            frecuencia: { type: "string", enum: [...FRECUENCIAS_FUNCION] },
            criterioDesempeno: {
              type: "string",
              description: "Resultado medible de esta función, mismo objeto/condición pero con el verbo conjugado. Cadena vacía si no hay base suficiente.",
            },
          },
          required: ["descripcion", "frecuencia", "criterioDesempeno"],
        },
      },
      flujos: {
        type: "array",
        description: "Insumos que recibe y salidas que entrega este cargo.",
        items: {
          type: "object",
          properties: {
            tipo: { type: "string", enum: [...TIPOS_FLUJO] },
            descripcion: { type: "string" },
            contraparte: { type: "string", description: "Con quién (persona, área o cargo). Cadena vacía si no se menciona." },
          },
          required: ["tipo", "descripcion", "contraparte"],
        },
      },
      riesgos: {
        type: "array",
        items: {
          type: "object",
          properties: {
            tipo: { type: "string", enum: [...TIPOS_RIESGO] },
            descripcion: { type: "string" },
            nivel: { type: "string", enum: [...NIVELES_RIESGO] },
            controlesExistentes: { type: "string" },
            eppRequerido: { type: "string" },
          },
          required: ["tipo", "descripcion", "nivel", "controlesExistentes", "eppRequerido"],
        },
      },
      ajustes: {
        type: "array",
        description: "Barreras de accesibilidad y el ajuste razonable sugerido para resolverlas.",
        items: {
          type: "object",
          properties: {
            tipoBarrera: { type: "string", enum: [...TIPOS_BARRERA] },
            descripcionBarrera: { type: "string" },
            apoyoSugerido: { type: "string" },
          },
          required: ["tipoBarrera", "descripcionBarrera", "apoyoSugerido"],
        },
      },
      competencias: {
        type: "array",
        items: {
          type: "object",
          properties: {
            nombre: { type: "string" },
            tipo: { type: "string", enum: [...TIPOS_COMPETENCIA] },
            nivelRequerido: { type: "string", enum: [...NIVELES_COMPETENCIA] },
          },
          required: ["nombre", "tipo", "nivelRequerido"],
        },
      },
      decisiones: {
        type: "array",
        description: "Ejemplos concretos de decisiones y su nivel de autonomía.",
        items: {
          type: "object",
          properties: {
            descripcion: { type: "string" },
            nivelAutonomia: { type: "string", enum: [...NIVELES_AUTONOMIA] },
          },
          required: ["descripcion", "nivelAutonomia"],
        },
      },
      responsabilidadesSst: {
        type: "array",
        description: "Responsabilidades puntuales de SST distintas de las funciones normales del cargo.",
        items: {
          type: "object",
          properties: { descripcion: { type: "string" } },
          required: ["descripcion"],
        },
      },
    },
    required: [
      "razonSer",
      "criticidadAusencia",
      "sede",
      "modalidadTrabajo",
      "tipoVinculacion",
      "claseRiesgoArl",
      "autonomiaDecision",
      "recursoPersonasNivel",
      "recursoPersonasDescripcion",
      "recursoDineroNivel",
      "recursoDineroDescripcion",
      "recursoEquiposNivel",
      "recursoEquiposDescripcion",
      "recursoInfoConfidencialNivel",
      "recursoInfoConfidencialDescripcion",
      "recursoMaterialesNivel",
      "recursoMaterialesDescripcion",
      "participacionComites",
      "eppRequerido",
      "protocolosEmergencia",
      "rolesSst",
      "requisitoEducacionFormal",
      "requisitoFormacionComplementaria",
      "requisitoExperienciaGeneral",
      "requisitoExperienciaEspecifica",
      "dotacion",
      "equiposHerramientas",
      "evidenciaProducto",
      "evidenciaDesempeno",
      "evidenciaConocimiento",
      "funciones",
      "flujos",
      "riesgos",
      "ajustes",
      "competencias",
      "decisiones",
      "responsabilidadesSst",
    ],
  },
};

const enumOConVacio = <T extends readonly [string, ...string[]]>(valores: T) => z.enum(["", ...valores] as unknown as [string, ...string[]]);

const borradorSchema = z.object({
  razonSer: z.string(),
  criticidadAusencia: z.string(),
  sede: z.string(),
  modalidadTrabajo: enumOConVacio(MODALIDADES_TRABAJO),
  tipoVinculacion: enumOConVacio(TIPOS_VINCULACION),
  claseRiesgoArl: enumOConVacio(CLASES_RIESGO_ARL),
  autonomiaDecision: z.string(),
  recursoPersonasNivel: enumOConVacio(NIVELES_RECURSO),
  recursoPersonasDescripcion: z.string(),
  recursoDineroNivel: enumOConVacio(NIVELES_RECURSO),
  recursoDineroDescripcion: z.string(),
  recursoEquiposNivel: enumOConVacio(NIVELES_RECURSO),
  recursoEquiposDescripcion: z.string(),
  recursoInfoConfidencialNivel: enumOConVacio(NIVELES_RECURSO),
  recursoInfoConfidencialDescripcion: z.string(),
  recursoMaterialesNivel: enumOConVacio(NIVELES_RECURSO),
  recursoMaterialesDescripcion: z.string(),
  participacionComites: z.string(),
  eppRequerido: z.string(),
  protocolosEmergencia: z.string(),
  rolesSst: z.array(z.enum(ROLES_SST)),
  requisitoEducacionFormal: z.string(),
  requisitoFormacionComplementaria: z.string(),
  requisitoExperienciaGeneral: z.string(),
  requisitoExperienciaEspecifica: z.string(),
  dotacion: z.string(),
  equiposHerramientas: z.string(),
  evidenciaProducto: z.string(),
  evidenciaDesempeno: z.string(),
  evidenciaConocimiento: z.string(),
  funciones: z.array(
    z.object({ descripcion: z.string(), frecuencia: z.enum(FRECUENCIAS_FUNCION), criterioDesempeno: z.string() })
  ),
  flujos: z.array(z.object({ tipo: z.enum(TIPOS_FLUJO), descripcion: z.string(), contraparte: z.string() })),
  riesgos: z.array(
    z.object({
      tipo: z.enum(TIPOS_RIESGO),
      descripcion: z.string(),
      nivel: z.enum(NIVELES_RIESGO),
      controlesExistentes: z.string(),
      eppRequerido: z.string(),
    })
  ),
  ajustes: z.array(
    z.object({ tipoBarrera: z.enum(TIPOS_BARRERA), descripcionBarrera: z.string(), apoyoSugerido: z.string() })
  ),
  competencias: z.array(
    z.object({ nombre: z.string(), tipo: z.enum(TIPOS_COMPETENCIA), nivelRequerido: z.enum(NIVELES_COMPETENCIA) })
  ),
  decisiones: z.array(z.object({ descripcion: z.string(), nivelAutonomia: z.enum(NIVELES_AUTONOMIA) })),
  responsabilidadesSst: z.array(z.object({ descripcion: z.string() })),
});

export type BorradorPerfilIA = z.infer<typeof borradorSchema>;

function construirContexto(respuestasPorBloque: Record<string, Record<string, string>>): string {
  return BLOQUES_TALLER.map(({ bloque, titulo, preguntas }) => {
    const respuestas = respuestasPorBloque[bloque];
    if (!respuestas) return null;
    const lineas = preguntas
      .filter((p) => respuestas[p.clave])
      .map((p) => `- ${p.texto}\n  ${respuestas[p.clave]}`);
    if (lineas.length === 0) return null;
    return `Bloque ${bloque} — ${titulo}\n${lineas.join("\n")}`;
  })
    .filter((bloque): bloque is string => bloque !== null)
    .join("\n\n");
}

export async function generarBorradorPerfilConIA(
  cargoNombre: string,
  respuestasPorBloque: Record<string, Record<string, string>>
): Promise<{ borrador: BorradorPerfilIA; uso: UsoIA }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Falta configurar ANTHROPIC_API_KEY en el servidor para poder generar borradores con IA.");
  }

  const contexto = construirContexto(respuestasPorBloque);
  if (!contexto) {
    throw new Error("No hay respuestas de Taller suficientes para generar un borrador.");
  }

  const client = new Anthropic({ apiKey });
  const respuesta = await client.messages.create({
    model: MODELO,
    // 4096 se quedaba corto y truncaba a mitad de generación para cargos con
    // mucho contenido (varias funciones, competencias, ajustes, decisiones,
    // flujos...) — el JSON de la herramienta salía incompleto y fallaba la
    // validación de Zod con campos enteros faltantes, no por un error real
    // de formato. 8192 da margen de sobra para el perfil más completo.
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Cargo: ${cargoNombre}\n\nRespuestas del taller de campo (en palabras de quien ocupa el cargo):\n\n${contexto}`,
      },
    ],
    tools: [HERRAMIENTA_BORRADOR],
    tool_choice: { type: "tool", name: "entregar_borrador_perfil" },
  });

  if (respuesta.stop_reason === "max_tokens") {
    throw new Error(
      "El borrador quedó incompleto porque el cargo tiene demasiado contenido para generarlo de una sola vez — intenta de nuevo, y si persiste avísale al desarrollador."
    );
  }

  const bloqueHerramienta = respuesta.content.find(
    (bloque): bloque is Anthropic.ToolUseBlock => bloque.type === "tool_use"
  );
  if (!bloqueHerramienta) {
    throw new Error("La IA no devolvió un borrador — intenta de nuevo.");
  }

  const parsed = borradorSchema.safeParse(bloqueHerramienta.input);
  if (!parsed.success) {
    throw new Error("El borrador generado no tiene el formato esperado — intenta de nuevo.");
  }

  const tokensEntrada = respuesta.usage.input_tokens;
  const tokensSalida = respuesta.usage.output_tokens;
  const costoUsd =
    (tokensEntrada / 1_000_000) * PRECIO_ENTRADA_POR_MILLON_USD + (tokensSalida / 1_000_000) * PRECIO_SALIDA_POR_MILLON_USD;

  return { borrador: parsed.data, uso: { tokensEntrada, tokensSalida, costoUsd, modelo: MODELO } };
}
