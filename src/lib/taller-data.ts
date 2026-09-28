import { prisma } from "@/lib/prisma";

/**
 * Última respuesta guardada por bloque para este cargo — cada vez que se
 * guarda el taller se crean filas nuevas (no se sobrescriben), así que esto
 * es simplemente "la más reciente de cada bloque", igual de sencillo que
 * Version para el Perfil pero sin necesitar numeración.
 */
export async function obtenerUltimoTallerPorBloque(cargoId: string): Promise<Record<string, Record<string, string>>> {
  const respuestas = await prisma.respuestaTaller.findMany({
    where: { cargoId },
    orderBy: { createdAt: "desc" },
  });

  const porBloque: Record<string, Record<string, string>> = {};
  for (const r of respuestas) {
    if (porBloque[r.bloque]) continue; // ya se guardó la más reciente de este bloque
    porBloque[r.bloque] = r.datos as Record<string, string>;
  }
  return porBloque;
}
