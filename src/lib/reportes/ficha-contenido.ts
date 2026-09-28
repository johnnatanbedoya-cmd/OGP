// Modelo de contenido compartido entre el generador de PDF (react-pdf) y el
// de Word (docx) — para que ambos exports queden exactamente iguales entre
// sí, y ambos sigan al pie de la letra la plantilla real
// docs/plantillas/Ficha_Base_Descripcion_de_Cargo.docx (17 numerales, mismas
// tablas, mismos anchos de columna en pulgadas, mismos colores de encabezado
// — ver el análisis hecho sobre esa plantilla). Ninguno de los dos
// renderizadores decide contenido por su cuenta: solo pintan lo que este
// archivo produce.
import type { CargoConPerfil } from "@/lib/perfil-data";
import {
  ETIQUETAS_NIVEL_JERARQUICO,
  ETIQUETAS_MODALIDAD_TRABAJO,
  ETIQUETAS_JORNADA,
  ETIQUETAS_TIPO_VINCULACION,
  ETIQUETAS_NIVEL_AUTONOMIA,
  ETIQUETAS_TIPO_RIESGO,
  ETIQUETAS_NIVEL_RIESGO,
  ETIQUETAS_TIPO_BARRERA,
  etiqueta,
} from "@/lib/etiquetas";

export type VersionResumen = { numero: number; autorNombre: string; motivoCambio: string | null; createdAt: Date };

const VACIO = "—";

// Igual a como la plantilla real rotula los 3 tipos de competencia
// (num. 10) — plural, distinto del singular que usa el formulario en pantalla.
const ETIQUETA_TIPO_COMPETENCIA_FICHA: Record<string, string> = {
  organizacional: "Organizacionales",
  comportamental: "Comportamentales del cargo",
  tecnica: "Técnicas / Conocimientos",
};

const ETIQUETA_NIVEL_COMPETENCIA_FICHA: Record<string, string> = {
  basico: "1",
  intermedio: "2",
  avanzado: "3",
  experto: "4",
};

export type BloqueContenido =
  | { tipo: "parrafo"; texto: string; enfasis?: boolean }
  | { tipo: "grid2"; filas: [string, string, string, string][] }
  | {
      tipo: "tabla";
      encabezados: string[];
      anchosIn: number[];
      filas: string[][];
      colorEncabezado: "oscuro" | "claro";
      columnaEtiqueta?: boolean; // si la primera columna de cada fila de datos va sombreada como "etiqueta" (E7E6E6)
    }
  | { tipo: "checkboxes"; encabezado: string; filas: [string, boolean][][] }
  | { tipo: "constancia" };

export type SeccionFicha = { numero: number; titulo: string; bloques: BloqueContenido[] };

export type FichaContenido = {
  nombreCargo: string;
  nombreEmpresa: string;
  secciones: SeccionFicha[];
};

function nn(valor: string | null | undefined): string {
  return valor && valor.trim() !== "" ? valor : VACIO;
}

export function construirFichaContenido(cargo: CargoConPerfil, nombreEmpresa: string, versiones: VersionResumen[]): FichaContenido {
  const perfil = cargo.perfil!;

  const secciones: SeccionFicha[] = [];

  // 1. Identificación del cargo
  secciones.push({
    numero: 1,
    titulo: "Identificación del cargo",
    bloques: [
      {
        tipo: "grid2",
        filas: [
          ["Denominación", cargo.nombre, "Código del cargo", nn(cargo.codigo)],
          [
            "Nivel jerárquico",
            etiqueta(ETIQUETAS_NIVEL_JERARQUICO, cargo.nivelJerarquico),
            "No. de puestos",
            perfil.numeroPuestos != null ? String(perfil.numeroPuestos) : VACIO,
          ],
          ["Área / Proceso", cargo.departamento.nombre, "Centro de trabajo / Sede", nn(perfil.sede)],
          [
            "Jefe inmediato",
            cargo.jefeInmediato?.nombre ?? VACIO,
            "Cargos que supervisa",
            cargo.subordinados.length > 0 ? cargo.subordinados.map((s) => s.nombre).join(", ") : "Ninguno",
          ],
          [
            "Modalidad de trabajo",
            etiqueta(ETIQUETAS_MODALIDAD_TRABAJO, perfil.modalidadTrabajo),
            "Jornada",
            etiqueta(ETIQUETAS_JORNADA, perfil.jornada),
          ],
          [
            "Clase de riesgo ARL",
            perfil.claseRiesgoArl ? `Clase ${perfil.claseRiesgoArl}` : VACIO,
            "Tipo de vinculación de referencia",
            etiqueta(ETIQUETAS_TIPO_VINCULACION, perfil.tipoVinculacion),
          ],
        ],
      },
    ],
  });

  // 2. Propósito principal del cargo
  secciones.push({
    numero: 2,
    titulo: "Propósito principal del cargo",
    bloques: [
      { tipo: "parrafo", texto: nn(perfil.razonSer) },
      ...(perfil.criticidadAusencia
        ? [{ tipo: "parrafo" as const, texto: `Criticidad si el cargo no existiera: ${perfil.criticidadAusencia}` }]
        : []),
    ],
  });

  // 3. Funciones esenciales
  const filasFunciones = perfil.funciones.map((f, i) => [
    String(i + 1),
    f.descripcion,
    f.frecuencia ? ({ diaria: "D", semanal: "S", mensual: "M", eventual: "E" }[f.frecuencia] ?? f.frecuencia) : VACIO,
    f.porcentajeTiempo != null ? `${f.porcentajeTiempo}%` : VACIO,
  ]);
  filasFunciones.push([
    String(perfil.funciones.length + 1),
    "Las demás funciones asignadas por el jefe inmediato, acordes con la naturaleza, el nivel y el propósito del cargo.",
    VACIO,
    VACIO,
  ]);
  secciones.push({
    numero: 3,
    titulo: "Funciones esenciales",
    bloques: [
      {
        tipo: "tabla",
        encabezados: ["No.", "Descripción de la función", "Frecuencia", "% de tiempo"],
        anchosIn: [0.42, 4.36, 1.18, 0.97],
        filas: filasFunciones,
        colorEncabezado: "claro",
      },
      {
        tipo: "parrafo",
        enfasis: true,
        texto: "Frecuencia: D = diaria, S = semanal, M = mensual, E = eventual. La suma del % de tiempo debe ser 100 %.",
      },
    ],
  });

  // 4. Responsabilidades específicas en el SG-SST
  const rolesSet = new Set(perfil.rolesSst);
  const filasRoles: [string, boolean][][] = [
    [
      ["Responsable del SG-SST", rolesSet.has("responsable_sgsst")],
      ["Miembro del COPASST / Vigía de SST", rolesSet.has("copasst")],
    ],
    [
      ["Miembro del Comité de Convivencia Laboral", rolesSet.has("convivencia")],
      ["Brigadista de emergencias", rolesSet.has("brigada")],
    ],
    [
      ["Coordinador de trabajo en alturas", rolesSet.has("alturas")],
      ["Líder del PESV", rolesSet.has("pesv")],
    ],
  ];
  secciones.push({
    numero: 4,
    titulo: "Responsabilidades específicas en el SG-SST",
    bloques: [
      {
        tipo: "tabla",
        encabezados: ["No.", "Responsabilidad en seguridad y salud en el trabajo"],
        anchosIn: [0.42, 6.51],
        filas:
          perfil.responsabilidadesSst.length > 0
            ? perfil.responsabilidadesSst.map((r, i) => [String(i + 1), r.descripcion])
            : [[VACIO, "Sin responsabilidades específicas registradas."]],
        colorEncabezado: "claro",
      },
      { tipo: "checkboxes", encabezado: "Roles especiales en SST", filas: filasRoles },
    ],
  });

  // 5. Responsabilidades en otros sistemas de gestión
  secciones.push({
    numero: 5,
    titulo: "Responsabilidades en otros sistemas de gestión",
    bloques: [
      {
        tipo: "tabla",
        encabezados: ["Sistema", "Responsabilidad específica del cargo"],
        anchosIn: [1.94, 4.98],
        colorEncabezado: "oscuro",
        columnaEtiqueta: true,
        filas: [
          ["Calidad", nn(perfil.respSistemaCalidad)],
          ["Gestión ambiental", nn(perfil.respSistemaAmbiental)],
          ["Seguridad vial (PESV)", nn(perfil.respSistemaSeguridadVial)],
          ["Seguridad de la información / Datos personales", nn(perfil.respSistemaSeguridadInformacion)],
          ["SAGRILAFT / PTEE", nn(perfil.respSistemaSagrilaft)],
        ],
      },
    ],
  });

  // 6. Autoridad y toma de decisiones
  secciones.push({
    numero: 6,
    titulo: "Autoridad y toma de decisiones",
    bloques: [
      ...(perfil.autonomiaDecision ? [{ tipo: "parrafo" as const, texto: perfil.autonomiaDecision }] : []),
      {
        tipo: "tabla",
        encabezados: ["Decisiones que toma el cargo", "Nivel de autonomía"],
        anchosIn: [4.15, 2.78],
        colorEncabezado: "oscuro",
        filas:
          perfil.decisiones.length > 0
            ? perfil.decisiones.map((d) => [d.descripcion, etiqueta(ETIQUETAS_NIVEL_AUTONOMIA, d.nivelAutonomia)])
            : [[VACIO, VACIO]],
      },
    ],
  });

  // 7. Responsabilidad por recursos
  function filaRecurso(nombre: string, nivel: string | null, descripcion: string | null): string[] {
    return [
      nombre,
      nivel === "alta" ? "X" : "",
      nivel === "media" ? "X" : "",
      nivel === "baja" ? "X" : "",
      nn(descripcion),
    ];
  }
  secciones.push({
    numero: 7,
    titulo: "Responsabilidad por recursos",
    bloques: [
      {
        tipo: "tabla",
        encabezados: ["Tipo de recurso", "Alta", "Media", "Baja", "Descripción"],
        anchosIn: [2.36, 0.79, 0.79, 0.79, 2.18],
        colorEncabezado: "oscuro",
        columnaEtiqueta: true,
        filas: [
          filaRecurso("Personas a cargo", perfil.recursoPersonasNivel, perfil.recursoPersonasDescripcion),
          filaRecurso("Dinero, valores o títulos", perfil.recursoDineroNivel, perfil.recursoDineroDescripcion),
          filaRecurso("Equipos, herramientas y vehículos", perfil.recursoEquiposNivel, perfil.recursoEquiposDescripcion),
          filaRecurso("Información confidencial", perfil.recursoInfoConfidencialNivel, perfil.recursoInfoConfidencialDescripcion),
          filaRecurso("Materiales e inventarios", perfil.recursoMaterialesNivel, perfil.recursoMaterialesDescripcion),
        ],
      },
    ],
  });

  // 8. Relaciones de trabajo (a partir de los flujos insumo/salida)
  const relacionesInternas = perfil.flujos.filter((f) => f.contraparteCargo);
  const relacionesExternas = perfil.flujos.filter((f) => !f.contraparteCargo);
  function filaRelacion(tipo: string, flujos: typeof perfil.flujos): string[][] {
    if (flujos.length === 0) return [[tipo, VACIO, VACIO]];
    return flujos.map((f) => [
      tipo,
      f.contraparteCargo?.nombre ?? nn(f.contraparte),
      `(${f.tipo === "insumo" ? "Insumo" : "Salida"}) ${f.descripcion}`,
    ]);
  }
  secciones.push({
    numero: 8,
    titulo: "Relaciones de trabajo",
    bloques: [
      {
        tipo: "tabla",
        encabezados: ["Tipo", "Con quién (cargos / entidades)", "Propósito de la relación"],
        anchosIn: [1.25, 2.5, 3.17],
        colorEncabezado: "oscuro",
        columnaEtiqueta: true,
        filas: [...filaRelacion("Internas", relacionesInternas), ...filaRelacion("Externas", relacionesExternas)],
      },
      ...(perfil.participacionComites
        ? [{ tipo: "parrafo" as const, texto: `Participación en comités: ${perfil.participacionComites}` }]
        : []),
    ],
  });

  // 9. Requisitos del cargo
  secciones.push({
    numero: 9,
    titulo: "Requisitos del cargo",
    bloques: [
      {
        tipo: "tabla",
        encabezados: ["Requisito", "Descripción"],
        anchosIn: [2.22, 4.7],
        colorEncabezado: "oscuro",
        columnaEtiqueta: true,
        filas: [
          ["Educación formal", nn(perfil.requisitoEducacionFormal)],
          ["Tarjeta o matrícula profesional", nn(perfil.requisitoTarjetaProfesional)],
          ["Formación complementaria", nn(perfil.requisitoFormacionComplementaria)],
          ["Certificaciones obligatorias", nn(perfil.requisitoCertificaciones)],
          ["Experiencia general", nn(perfil.requisitoExperienciaGeneral)],
          ["Experiencia específica / relacionada", nn(perfil.requisitoExperienciaEspecifica)],
          ["Equivalencias", nn(perfil.requisitoEquivalencias)],
          ["Otros requisitos", nn(perfil.requisitoOtros)],
        ],
      },
    ],
  });

  // 10. Competencias requeridas
  const filasCompetencias: string[][] =
    perfil.competencias.length > 0
      ? perfil.competencias.map((c) => [
          ETIQUETA_TIPO_COMPETENCIA_FICHA[c.tipo] ?? c.tipo,
          c.nombre,
          ETIQUETA_NIVEL_COMPETENCIA_FICHA[c.nivelRequerido] ?? c.nivelRequerido,
        ])
      : [[VACIO, "Sin competencias registradas.", VACIO]];
  secciones.push({
    numero: 10,
    titulo: "Competencias requeridas",
    bloques: [
      {
        tipo: "tabla",
        encabezados: ["Tipo", "Competencia", "Nivel (1-4)"],
        anchosIn: [2.22, 3.87, 0.83],
        colorEncabezado: "oscuro",
        columnaEtiqueta: true,
        filas: filasCompetencias,
      },
    ],
  });

  // 11. Condiciones de trabajo y exposición a peligros (GTC 45)
  const riesgosPorTipo = new Map(perfil.riesgos.map((r) => [r.tipo, r]));
  const ordenRiesgos = ["biologico", "fisico", "quimico", "psicosocial", "biomecanico", "seguridad", "fenomenos_naturales"];
  secciones.push({
    numero: 11,
    titulo: "Condiciones de trabajo y exposición a peligros (GTC 45)",
    bloques: [
      {
        tipo: "tabla",
        encabezados: ["Clasificación del peligro", "Descripción / fuente", "Controles existentes", "EPP requerido"],
        anchosIn: [1.6, 2.22, 1.72, 1.39],
        colorEncabezado: "oscuro",
        columnaEtiqueta: true,
        filas: ordenRiesgos.map((tipo) => {
          const r = riesgosPorTipo.get(tipo);
          const etiquetaTipo = etiqueta(ETIQUETAS_TIPO_RIESGO, tipo);
          if (!r) return [etiquetaTipo, VACIO, VACIO, VACIO];
          const nivel = etiqueta(ETIQUETAS_NIVEL_RIESGO, r.nivel);
          return [etiquetaTipo, `(Nivel ${nivel}) ${r.descripcion}`, nn(r.controlesExistentes), nn(r.eppRequerido)];
        }),
      },
      {
        tipo: "parrafo",
        enfasis: true,
        texto:
          "La información debe coincidir con la matriz de identificación de peligros, evaluación y valoración de riesgos vigente de la empresa.",
      },
    ],
  });

  // 12. Evaluaciones médicas ocupacionales
  secciones.push({
    numero: 12,
    titulo: "Evaluaciones médicas ocupacionales",
    bloques: [
      {
        tipo: "tabla",
        encabezados: ["Tipo de evaluación", "Énfasis / pruebas complementarias"],
        anchosIn: [2.22, 4.7],
        colorEncabezado: "oscuro",
        columnaEtiqueta: true,
        filas: [
          ["Preocupacional o de ingreso", nn(perfil.evaluacionPreocupacional)],
          ["Periódica (frecuencia)", nn(perfil.evaluacionPeriodica)],
          ["Post-incapacidad o reintegro", nn(perfil.evaluacionPostIncapacidad)],
          ["De egreso", nn(perfil.evaluacionEgreso)],
        ],
      },
    ],
  });

  // 13. Inclusión laboral y ajustes razonables
  const textoAjustes =
    perfil.ajustes.length > 0
      ? perfil.ajustes
          .map((a) => `• ${etiqueta(ETIQUETAS_TIPO_BARRERA, a.tipoBarrera)}: ${a.descripcionBarrera} — ${a.apoyoSugerido}`)
          .join("\n")
      : "Sin barreras ni ajustes razonables identificados para este cargo.";
  secciones.push({
    numero: 13,
    titulo: "Inclusión laboral y ajustes razonables",
    bloques: [{ tipo: "parrafo", texto: textoAjustes }],
  });

  // 14. Indicadores de desempeño
  secciones.push({
    numero: 14,
    titulo: "Indicadores de desempeño",
    bloques: [
      {
        tipo: "tabla",
        encabezados: ["Indicador", "Fórmula", "Meta", "Frecuencia de medición"],
        anchosIn: [1.94, 2.34, 1.32, 1.32],
        colorEncabezado: "claro",
        filas:
          perfil.indicadores.length > 0
            ? perfil.indicadores.map((i) => [i.nombre, nn(i.formula), nn(i.meta), nn(i.frecuencia)])
            : [[VACIO, VACIO, VACIO, VACIO]],
      },
    ],
  });

  // 15. Dotación, elementos y herramientas de trabajo
  secciones.push({
    numero: 15,
    titulo: "Dotación, elementos y herramientas de trabajo",
    bloques: [
      {
        tipo: "tabla",
        encabezados: ["Dotación (art. 230 CST)", "Equipos y herramientas asignados"],
        anchosIn: [3.46, 3.46],
        colorEncabezado: "oscuro",
        filas: [[nn(perfil.dotacion), nn(perfil.equiposHerramientas)]],
      },
    ],
  });

  // 16. Constancia de recibido y aceptación
  secciones.push({ numero: 16, titulo: "Constancia de recibido y aceptación", bloques: [{ tipo: "constancia" }] });

  // 17. Control de cambios de la ficha
  secciones.push({
    numero: 17,
    titulo: "Control de cambios de la ficha",
    bloques: [
      {
        tipo: "tabla",
        encabezados: ["Versión", "Fecha", "Descripción del cambio", "Numerales afectados", "Aprobado por"],
        anchosIn: [0.69, 1.08, 2.79, 1.25, 1.11],
        colorEncabezado: "claro",
        filas: [...versiones]
          .sort((a, b) => a.numero - b.numero)
          .map((v) => [
            String(v.numero).padStart(2, "0"),
            new Intl.DateTimeFormat("es-CO", { dateStyle: "short" }).format(v.createdAt),
            v.motivoCambio ?? "Actualización de la ficha.",
            "Todos",
            // En blanco a propósito: "Aprobado por" es una aprobación formal de
            // la empresa, no "quién guardó" (eso ya está en el historial de
            // versiones interno) — lo diligencia la empresa a mano al imprimir.
            "",
          ]),
      },
    ],
  });

  return { nombreCargo: cargo.nombre, nombreEmpresa, secciones };
}
