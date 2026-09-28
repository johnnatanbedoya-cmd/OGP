import { prisma } from "@/lib/prisma";

export type ConteoPorClave = { clave: string; total: number };

export type DatosDashboardEmpresa = {
  departamentos: number;
  cargos: number;
  trabajadoresActivos: number;
  perfilesPublicados: number;
  perfilesPendientes: number; // cargos sin perfil, o con perfil en borrador
  porNivelJerarquico: ConteoPorClave[];
  porClaseRiesgoArl: ConteoPorClave[];
  porJornada: ConteoPorClave[];
  porModalidadTrabajo: ConteoPorClave[];
  porTipoVinculacion: ConteoPorClave[];
  antiguedadPromedioAnios: number | null;
};

function agrupar(valores: (string | null)[]): ConteoPorClave[] {
  const conteo = new Map<string, number>();
  for (const v of valores) {
    if (!v) continue;
    conteo.set(v, (conteo.get(v) ?? 0) + 1);
  }
  return Array.from(conteo.entries())
    .map(([clave, total]) => ({ clave, total }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Estadísticas de solo lectura para el dashboard de empresa — arma todo a
 * partir de datos que YA existen (nadie registra género, edad ni horas
 * trabajadas hoy en la app), así que no depende de ningún campo nuevo.
 */
export async function obtenerDatosDashboardEmpresa(empresaId: string): Promise<DatosDashboardEmpresa> {
  const [departamentos, cargos, trabajadoresActivos, perfiles] = await Promise.all([
    prisma.departamento.count({ where: { empresaId } }),
    prisma.cargo.count({ where: { empresaId } }),
    prisma.trabajador.count({ where: { empresaId, estado: "activo" } }),
    prisma.perfil.findMany({
      where: { cargo: { empresaId } },
      select: { estado: true, claseRiesgoArl: true, jornada: true, modalidadTrabajo: true, tipoVinculacion: true },
    }),
  ]);

  const perfilesPublicados = perfiles.filter((p) => p.estado === "publicado").length;
  const perfilesPendientes = cargos - perfilesPublicados;

  const trabajadoresConFecha = await prisma.trabajador.findMany({
    where: { empresaId, estado: "activo", fechaIngreso: { not: null } },
    select: { fechaIngreso: true },
  });
  let antiguedadPromedioAnios: number | null = null;
  if (trabajadoresConFecha.length > 0) {
    const ahora = Date.now();
    const sumaAnios = trabajadoresConFecha.reduce((suma, t) => {
      const anios = (ahora - t.fechaIngreso!.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return suma + anios;
    }, 0);
    antiguedadPromedioAnios = Math.round((sumaAnios / trabajadoresConFecha.length) * 10) / 10;
  }

  const cargosConNivel = await prisma.cargo.findMany({ where: { empresaId }, select: { nivelJerarquico: true } });

  return {
    departamentos,
    cargos,
    trabajadoresActivos,
    perfilesPublicados,
    perfilesPendientes,
    porNivelJerarquico: agrupar(cargosConNivel.map((c) => c.nivelJerarquico)),
    porClaseRiesgoArl: agrupar(perfiles.map((p) => p.claseRiesgoArl)),
    porJornada: agrupar(perfiles.map((p) => p.jornada)),
    porModalidadTrabajo: agrupar(perfiles.map((p) => p.modalidadTrabajo)),
    porTipoVinculacion: agrupar(perfiles.map((p) => p.tipoVinculacion)),
    antiguedadPromedioAnios,
  };
}
