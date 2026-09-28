import type { Prisma } from "@/generated/prisma/client";

// Toda empresa nueva arranca con un tope real y seleccionable para la
// jerarquía: un departamento "Alta Dirección" con un único cargo "Junta
// Directiva" (sin jefe inmediato — es la raíz). Así, cuando el consultor (o
// el usuario empresa con control total) crea el primer cargo real (ej.
// "Gerente General"), ya existe algo lógico para ponerle de jefe en vez de
// dejarlo huérfano — y ese mismo cargo sirve de opción por defecto en el
// formulario de "Nuevo cargo" (ver CargoForm).
export const NOMBRE_DEPARTAMENTO_ALTA_DIRECCION = "Alta Dirección";
export const NOMBRE_CARGO_JUNTA_DIRECTIVA = "Junta Directiva";

export async function crearEstructuraInicial(tx: Prisma.TransactionClient, empresaId: string): Promise<void> {
  const departamento = await tx.departamento.create({
    data: { empresaId, nombre: NOMBRE_DEPARTAMENTO_ALTA_DIRECCION, descripcion: "Creado automáticamente." },
  });
  await tx.cargo.create({
    data: {
      empresaId,
      departamentoId: departamento.id,
      nombre: NOMBRE_CARGO_JUNTA_DIRECTIVA,
      nivelJerarquico: "directivo",
    },
  });
}

// Obligaciones del trabajador en materia de Seguridad y Salud en el Trabajo
// (Decreto 1072 de 2015, Art. 2.2.4.6.10, y Resolución 0312 de 2019) — son
// ley para cualquier empresa colombiana, así que toda empresa nueva nace con
// ellas ya cargadas como responsabilidad SST común de alcance "todos" (ver
// src/app/empresas/[id]/comunes). Van como "responsabilidad SST", no como
// "función", porque alimentan el numeral 4 de la Ficha ("Responsabilidades
// específicas en el SG-SST") — la plantilla real espera que las obligaciones
// de SST comunes vivan ahí, no mezcladas con las funciones propias del cargo
// (numeral 3). El consultor puede editarlas o quitarlas si el caso lo
// amerita, pero parten precargadas por defecto.
const RESPONSABILIDADES_SST_LEGALES: string[] = [
  "Procurar el cuidado integral de la propia salud, dentro y fuera del puesto de trabajo.",
  "Informar al empleador sobre condiciones de salud, antecedentes médicos o restricciones que puedan afectar su desempeño.",
  "Cumplir las normas, reglamentos y protocolos del Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST) de la empresa.",
  "Reportar al jefe inmediato o al área de SST los peligros, actos o condiciones inseguras, y los incidentes, accidentes o enfermedades laborales, de forma inmediata.",
  "Participar en las capacitaciones, entrenamientos, simulacros y programas de prevención programados por la empresa.",
  "Utilizar y conservar en buen estado los elementos y equipos de protección personal (EPP) suministrados.",
];

export async function sembrarResponsabilidadesSstComunes(tx: Prisma.TransactionClient, empresaId: string): Promise<void> {
  await tx.responsabilidadSstComunEmpresa.createMany({
    data: RESPONSABILIDADES_SST_LEGALES.map((descripcion) => ({ empresaId, alcance: "todos", descripcion })),
  });
}

// Funciones legales del Coordinador/Responsable del SG-SST (Decreto 1072 de
// 2015, Art. 2.2.4.6.8, y Resolución 0312 de 2019) — a diferencia de las
// RESPONSABILIDADES_SST_LEGALES de arriba (que aplican a CUALQUIER
// trabajador), estas son propias de quien lidera el SG-SST, así que van como
// funciones del cargo (numeral 3 de la Ficha), no como responsabilidad común.
// Se siembran solo en el Perfil del cargo cuyo nombre coincide con ese rol
// (ver esCargoCoordinadorSst) — nunca como función común de empresa, porque
// el modelo de "alcance" de FuncionComunEmpresa solo admite "todos" o un
// nivel jerárquico completo, no un cargo puntual.
const FUNCIONES_LEGALES_COORDINADOR_SST: { descripcion: string; frecuencia: string; criterioDesempeno: string }[] = [
  {
    descripcion:
      "Elaborar, ejecutar y hacer seguimiento al Plan Anual de Trabajo del Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST), conforme al ciclo PHVA.",
    frecuencia: "mensual",
    criterioDesempeno:
      "El Plan Anual de Trabajo se elabora, ejecuta y actualiza dentro de los plazos definidos, con evidencia de seguimiento mensual.",
  },
  {
    descripcion:
      "Identificar los peligros, evaluar y valorar los riesgos, y mantener actualizada la matriz de Identificación de Peligros, Evaluación y Valoración de Riesgos (IPEVR) de la empresa.",
    frecuencia: "mensual",
    criterioDesempeno: "La matriz IPEVR se mantiene actualizada y disponible, reflejando los riesgos reales de cada puesto de trabajo.",
  },
  {
    descripcion:
      "Coordinar y verificar el desarrollo de las capacitaciones, inducciones y reinducciones en Seguridad y Salud en el Trabajo dirigidas a todos los trabajadores.",
    frecuencia: "mensual",
    criterioDesempeno:
      "Los trabajadores reciben la inducción o reinducción en SST según el cronograma, con registros de asistencia firmados.",
  },
  {
    descripcion:
      "Investigar, en conjunto con el COPASST o Vigía de SST, los incidentes y accidentes de trabajo, y hacer seguimiento a las acciones correctivas derivadas.",
    frecuencia: "eventual",
    criterioDesempeno:
      "Todo incidente o accidente reportado cuenta con investigación documentada dentro de los plazos que exige la normatividad vigente.",
  },
  {
    descripcion:
      "Realizar inspecciones planeadas a las instalaciones, puestos de trabajo, máquinas y equipos, para verificar condiciones de seguridad y salud.",
    frecuencia: "mensual",
    criterioDesempeno: "Las inspecciones se realizan según el cronograma anual, con hallazgos documentados y planes de acción asociados.",
  },
  {
    descripcion:
      "Articular y apoyar la gestión del Comité Paritario de Seguridad y Salud en el Trabajo (COPASST) o Vigía de SST, y del Comité de Convivencia Laboral, facilitando su funcionamiento.",
    frecuencia: "mensual",
    criterioDesempeno: "El COPASST/Vigía y el Comité de Convivencia sesionan según su periodicidad legal, con actas registradas.",
  },
];

function normalizarNombreCargo(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** true si el nombre del cargo corresponde al Coordinador/Director del SG-SST — cubre variantes como
 * "Coordinador SST", "Coordinadora SG-SST", "Director de Seguridad y Salud en el Trabajo". */
export function esCargoCoordinadorSst(nombreCargo: string): boolean {
  const n = normalizarNombreCargo(nombreCargo);
  const tieneRolSst = /\bsst\b|sg-sst|sg sst|seguridad y salud en el trabajo/.test(n);
  const esCoordinadorODirector = /\bcoordinador|\bdirector/.test(n);
  return tieneRolSst && esCoordinadorODirector;
}

/**
 * Si el cargo es el Coordinador/Director del SG-SST (por nombre), le siembra
 * las 6 funciones legales de ese rol en su Perfil (creándolo en borrador si
 * todavía no existe). No hace nada si el Perfil ya tiene funciones cargadas,
 * para no pisar contenido real que el consultor ya haya escrito.
 */
export async function sembrarFuncionesCoordinadorSstSiAplica(
  tx: Prisma.TransactionClient,
  cargoId: string,
  nombreCargo: string
): Promise<void> {
  if (!esCargoCoordinadorSst(nombreCargo)) return;

  const perfil = await tx.perfil.upsert({
    where: { cargoId },
    create: { cargoId },
    update: {},
  });

  const yaTieneFunciones = await tx.funcionPerfil.count({ where: { perfilId: perfil.id } });
  if (yaTieneFunciones > 0) return;

  await tx.funcionPerfil.createMany({
    data: FUNCIONES_LEGALES_COORDINADOR_SST.map((f, i) => ({
      perfilId: perfil.id,
      orden: i + 1,
      descripcion: f.descripcion,
      frecuencia: f.frecuencia,
      criterioDesempeno: f.criterioDesempeno,
    })),
  });
}
