import { prisma } from "@/lib/prisma";

/** Funciones/competencias/responsabilidades SST comunes de la empresa que aplican a este cargo puntual: las de alcance 'todos' más las de su nivel jerárquico (si tiene uno asignado). */
export async function obtenerComunesParaCargo(empresaId: string, nivelJerarquico: string | null) {
  const alcances = nivelJerarquico ? ["todos", nivelJerarquico] : ["todos"];

  const [funciones, competencias, responsabilidadesSst] = await Promise.all([
    prisma.funcionComunEmpresa.findMany({
      where: { empresaId, alcance: { in: alcances } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.competenciaComunEmpresa.findMany({
      where: { empresaId, alcance: { in: alcances } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.responsabilidadSstComunEmpresa.findMany({
      where: { empresaId, alcance: { in: alcances } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return { funciones, competencias, responsabilidadesSst };
}
