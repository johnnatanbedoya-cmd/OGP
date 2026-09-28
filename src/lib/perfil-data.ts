import { prisma } from "@/lib/prisma";

export async function obtenerCargoConPerfil(cargoId: string, empresaId: string) {
  return prisma.cargo.findUnique({
    where: { id: cargoId, empresaId },
    include: {
      empresa: { select: { nombre: true } },
      departamento: true,
      jefeInmediato: { select: { id: true, nombre: true } },
      subordinados: { select: { id: true, nombre: true } },
      perfil: {
        include: {
          funciones: { orderBy: { orden: "asc" } },
          flujos: { include: { contraparteCargo: { select: { id: true, nombre: true } } } },
          riesgos: true,
          ajustes: true,
          competencias: true,
          decisiones: true,
          responsabilidadesSst: { orderBy: { orden: "asc" } },
          indicadores: true,
        },
      },
    },
  });
}

export type CargoConPerfil = NonNullable<Awaited<ReturnType<typeof obtenerCargoConPerfil>>>;

/** Todos los cargos de la empresa con Perfil publicado — para la descarga
 * masiva en .zip (ver /empresas/[id]/perfiles.zip). Deja afuera los
 * borradores a propósito: un .zip para entregar o archivar debe reflejar
 * solo lo que la empresa ya aprobó. */
export async function obtenerCargosPublicadosParaExportar(empresaId: string) {
  return prisma.cargo.findMany({
    where: { empresaId, perfil: { estado: "publicado" } },
    orderBy: { nombre: "asc" },
    include: {
      empresa: { select: { nombre: true } },
      departamento: true,
      jefeInmediato: { select: { id: true, nombre: true } },
      subordinados: { select: { id: true, nombre: true } },
      perfil: {
        include: {
          funciones: { orderBy: { orden: "asc" } },
          flujos: { include: { contraparteCargo: { select: { id: true, nombre: true } } } },
          riesgos: true,
          ajustes: true,
          competencias: true,
          decisiones: true,
          responsabilidadesSst: { orderBy: { orden: "asc" } },
          indicadores: true,
        },
      },
    },
  });
}

export async function obtenerVersiones(perfilId: string, empresaId: string) {
  // El scoping por empresaId se hace vía el cargo dueño del perfil, no hay
  // empresaId directo en Version — evita traer el historial de un perfil de
  // otra empresa si alguien adivina un perfilId ajeno.
  const perfil = await prisma.perfil.findFirst({
    where: { id: perfilId, cargo: { empresaId } },
    select: { id: true },
  });
  if (!perfil) return [];

  return prisma.version.findMany({
    where: { perfilId },
    orderBy: { numero: "desc" },
    select: { id: true, numero: true, autorNombre: true, motivoCambio: true, createdAt: true },
  });
}

/**
 * Cuántos Cargo hay con el mismo nombre en el mismo departamento — se usa
 * como sugerencia inicial de "número de puestos" en el Perfil (numeral 1 de
 * la ficha): en esta app cada puesto físico es su propio registro de Cargo
 * (ver decisión de relajar el @@unique de nombre), así que dos "Analista de
 * Nómina" en Talento Humano son 2 puestos del mismo perfil, no un error.
 * Es solo una sugerencia editable — el consultor puede cambiarla si el
 * número de puestos presupuestado no coincide con los cargos ya creados.
 */
export async function contarCargosConMismoNombre(empresaId: string, departamentoId: string, nombre: string): Promise<number> {
  return prisma.cargo.count({ where: { empresaId, departamentoId, nombre } });
}

export async function listarCargosParaSelector(empresaId: string) {
  return prisma.cargo.findMany({
    where: { empresaId },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, departamento: { select: { nombre: true } } },
  });
}
