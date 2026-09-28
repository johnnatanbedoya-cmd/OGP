import { prisma } from "@/lib/prisma";

export async function obtenerCargosParaOrganigrama(empresaId: string) {
  return prisma.cargo.findMany({
    where: { empresaId },
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      nivelJerarquico: true,
      jefeInmediatoId: true,
      departamento: { select: { nombre: true } },
      trabajadores: {
        where: { estado: "activo" },
        select: { nombres: true },
        orderBy: { nombres: "asc" },
      },
    },
  });
}

export type CargoParaOrganigrama = Awaited<ReturnType<typeof obtenerCargosParaOrganigrama>>[number];

export type NodoOrganigrama = {
  id: string;
  nombre: string;
  nivelJerarquico: string | null;
  jefeInmediatoId: string | null;
  departamento: string;
  trabajadores: string[];
  hijos: NodoOrganigrama[];
};

/** Ids de un cargo y todos sus descendientes — para excluirlos como posible
 * jefe de sí mismos al reasignar en vivo desde el organigrama. */
export function idsDeSubarbol(nodo: NodoOrganigrama): string[] {
  return [nodo.id, ...nodo.hijos.flatMap(idsDeSubarbol)];
}

/**
 * Cada Cargo aparece en exactamente un lugar del bosque resultante — como
 * raíz (jefeInmediatoId null) o como hijo de un único padre — así que no hay
 * forma de construir un ciclo ni una referencia duplicada con este método:
 * es un bosque por construcción, no un grafo recorrido en vivo.
 */
export function construirArbol(cargos: CargoParaOrganigrama[]): NodoOrganigrama[] {
  const nodos = new Map<string, NodoOrganigrama>();
  for (const c of cargos) {
    nodos.set(c.id, {
      id: c.id,
      nombre: c.nombre,
      nivelJerarquico: c.nivelJerarquico,
      jefeInmediatoId: c.jefeInmediatoId,
      departamento: c.departamento.nombre,
      trabajadores: c.trabajadores.map((t) => t.nombres),
      hijos: [],
    });
  }

  const raices: NodoOrganigrama[] = [];
  for (const c of cargos) {
    const nodo = nodos.get(c.id)!;
    const padre = c.jefeInmediatoId ? nodos.get(c.jefeInmediatoId) : undefined;
    if (padre) padre.hijos.push(nodo);
    else raices.push(nodo);
  }
  return raices;
}
