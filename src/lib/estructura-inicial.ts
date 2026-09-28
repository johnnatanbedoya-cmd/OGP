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
