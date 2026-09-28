// Preguntas del taller de campo — a propósito en lenguaje de entrevista,
// distintas de los campos técnicos del formulario de Perfil (ver
// src/components/perfil-form.tsx). El taller lo responde el trabajador o
// quien conoce el cargo; el Perfil lo redacta el consultor/gestor, a mano o
// apoyado en estas respuestas como referencia (la traducción automática de
// una a otra es la Fase 3 — motor de estandarización con IA — todavía no
// construida).
//
// Cada bloque coincide 1 a 1 con los 6 bloques del Perfil, para que en el
// futuro el motor de IA pueda mapear una pregunta de taller a su campo
// correspondiente sin ambigüedad.

export type PreguntaTaller = { clave: string; texto: string };

export const BLOQUES_TALLER: { bloque: string; titulo: string; preguntas: PreguntaTaller[] }[] = [
  {
    bloque: "1",
    titulo: "Identificación, ubicación y propósito del cargo",
    preguntas: [
      { clave: "razonSer", texto: "En pocas palabras, ¿para qué existe este cargo? ¿Cuál es su razón de ser?" },
      {
        clave: "criticidad",
        texto: "Si este cargo dejara de existir mañana, ¿qué pasaría? ¿Qué se dejaría de hacer, o quién tendría que asumirlo?",
      },
      { clave: "jefeInmediato", texto: "¿A quién le reporta directamente quien ocupa este cargo?" },
      { clave: "personasACargo", texto: "¿Tiene personas a cargo? ¿Cuáles cargos le reportan a él o ella?" },
      {
        clave: "ubicacionModalidad",
        texto: "¿Dónde se realiza el trabajo (sede, ciudad) y bajo qué modalidad (presencial, remoto, desde casa, teletrabajo, híbrido)?",
      },
      {
        clave: "vinculacionRiesgo",
        texto: "¿Bajo qué tipo de contrato está vinculada (o se vincularía) esta persona (término indefinido, término fijo, obra o labor), y qué clase de riesgo ARL (I a V) tiene registrado este cargo o el área a la que pertenece?",
      },
    ],
  },
  {
    bloque: "2",
    titulo: "Funciones operativas y actividades",
    preguntas: [
      { clave: "diaTipico", texto: "Cuéntame cómo es un día normal de trabajo en este cargo, paso a paso." },
      {
        clave: "tareasFrecuencia",
        texto:
          "¿Qué tareas se hacen todos los días? ¿Cuáles solo cada cierto tiempo (semanal, mensual)? ¿Cuáles son ocasionales o imprevistas?",
      },
      {
        clave: "autonomia",
        texto: "De las decisiones que se toman en este cargo, ¿cuáles se pueden tomar sin consultar, y cuáles necesitan la aprobación de alguien más?",
      },
      {
        clave: "decisionesEjemplo",
        texto: "Da 2 o 3 ejemplos concretos de decisiones que tome esta persona, indicando si las toma sola, si primero consulta, o si necesita la aprobación de su jefe.",
      },
      {
        clave: "recursosACargo",
        texto: "¿Maneja dinero, equipos costosos, información confidencial, materiales o personal a su cargo? Descríbalo.",
      },
    ],
  },
  {
    bloque: "3",
    titulo: "Flujos de trabajo e interdependencias",
    preguntas: [
      {
        clave: "insumos",
        texto: "¿Qué necesita recibir de otras personas o áreas para poder hacer su trabajo? (información, materiales, documentos, aprobaciones)",
      },
      { clave: "salidas", texto: "Cuando termina su trabajo, ¿a quién se lo entrega o quién lo usa después?" },
      { clave: "comites", texto: "¿Participa en algún comité o reunión periódica de la empresa?" },
    ],
  },
  {
    bloque: "4",
    titulo: "Seguridad, salud en el trabajo y entorno (SST)",
    preguntas: [
      {
        clave: "riesgos",
        texto: "¿El trabajo tiene algún riesgo para la salud o seguridad? (ruido, posturas, químicos, estrés, manejo de maquinaria, etc.) Descríbalos.",
      },
      { clave: "epp", texto: "¿Qué elementos de protección personal usa (o debería usar) para trabajar de forma segura?" },
      { clave: "emergencias", texto: "Si pasa un accidente o una emergencia, ¿qué se debe hacer? ¿A quién se avisa?" },
      {
        clave: "controlesRiesgo",
        texto: "Para los riesgos que mencionó, ¿qué controles ya existen hoy (señalización, capacitación, procedimientos) además del EPP?",
      },
      {
        clave: "rolesSst",
        texto: "¿Ocupa algún rol especial de seguridad y salud en el trabajo (brigadista, miembro del COPASST o del Comité de Convivencia, responsable del SG-SST, coordinador de trabajo en alturas, líder del PESV)?",
      },
      {
        clave: "responsabilidadesSst",
        texto: "Además de sus tareas normales, ¿tiene alguna responsabilidad específica en seguridad y salud en el trabajo (reportar, revisar, liderar algo puntual)?",
      },
      {
        clave: "dotacion",
        texto: "¿Qué dotación o equipos de trabajo personal recibe (uniforme, botas, computador, celular, herramientas)?",
      },
    ],
  },
  {
    bloque: "5",
    titulo: "Inclusión laboral y ajustes razonables",
    preguntas: [
      {
        clave: "barreras",
        texto:
          "Pensando en este puesto de trabajo, ¿hay algo en el entorno (herramientas, instrucciones, espacio físico) que sería difícil de usar para alguien con una discapacidad?",
      },
      { clave: "apoyos", texto: "Si fuera así, ¿qué ayuda o ajuste le permitiría a esa persona hacer el trabajo igual de bien?" },
    ],
  },
  {
    bloque: "6",
    titulo: "Requisitos, herramientas y competencias",
    preguntas: [
      { clave: "formacion", texto: "¿Qué estudios o formación necesita alguien para hacer este trabajo?" },
      { clave: "experiencia", texto: "¿Cuánta experiencia previa se necesitaría, y en qué?" },
      { clave: "herramientas", texto: "¿Qué programas, sistemas o herramientas de software se usan en el día a día?" },
      {
        clave: "habilidades",
        texto: "¿Qué habilidades o actitudes (no técnicas) son clave para hacer bien este trabajo? (ej. trabajo en equipo, atención al detalle, paciencia)",
      },
    ],
  },
];
