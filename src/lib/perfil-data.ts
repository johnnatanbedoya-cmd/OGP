import { prisma } from "@/lib/prisma";
import type { PerfilDefaultValues } from "@/lib/perfil-defaults";

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
type PerfilConHijos = NonNullable<CargoConPerfil["perfil"]>;

/**
 * Traduce un Perfil ya guardado (con sus tablas hijas) a los valores planos
 * que espera el formulario — misma forma que usa tanto la página de editar
 * (perfil ya existente) como "copiar perfil" (perfil de OTRO cargo, para
 * prellenar uno nuevo o completar uno incompleto).
 */
export function mapearPerfilAValoresFormulario(perfil: PerfilConHijos): PerfilDefaultValues {
  return {
    razonSer: perfil.razonSer ?? "",
    criticidadAusencia: perfil.criticidadAusencia ?? "",
    numeroPuestos: perfil.numeroPuestos != null ? String(perfil.numeroPuestos) : "",
    sede: perfil.sede ?? "",
    modalidadTrabajo: perfil.modalidadTrabajo ?? "",
    jornada: perfil.jornada ?? "",
    claseRiesgoArl: perfil.claseRiesgoArl ?? "",
    tipoVinculacion: perfil.tipoVinculacion ?? "",
    autonomiaDecision: perfil.autonomiaDecision ?? "",
    recursoPersonasNivel: perfil.recursoPersonasNivel ?? "",
    recursoPersonasDescripcion: perfil.recursoPersonasDescripcion ?? "",
    recursoDineroNivel: perfil.recursoDineroNivel ?? "",
    recursoDineroDescripcion: perfil.recursoDineroDescripcion ?? "",
    recursoEquiposNivel: perfil.recursoEquiposNivel ?? "",
    recursoEquiposDescripcion: perfil.recursoEquiposDescripcion ?? "",
    recursoInfoConfidencialNivel: perfil.recursoInfoConfidencialNivel ?? "",
    recursoInfoConfidencialDescripcion: perfil.recursoInfoConfidencialDescripcion ?? "",
    recursoMaterialesNivel: perfil.recursoMaterialesNivel ?? "",
    recursoMaterialesDescripcion: perfil.recursoMaterialesDescripcion ?? "",
    participacionComites: perfil.participacionComites ?? "",
    eppRequerido: perfil.eppRequerido ?? "",
    protocolosEmergencia: perfil.protocolosEmergencia ?? "",
    rolesSst: perfil.rolesSst,
    evaluacionPreocupacional: perfil.evaluacionPreocupacional ?? "",
    evaluacionPeriodica: perfil.evaluacionPeriodica ?? "",
    evaluacionPostIncapacidad: perfil.evaluacionPostIncapacidad ?? "",
    evaluacionEgreso: perfil.evaluacionEgreso ?? "",
    respSistemaCalidad: perfil.respSistemaCalidad ?? "",
    respSistemaAmbiental: perfil.respSistemaAmbiental ?? "",
    respSistemaSeguridadVial: perfil.respSistemaSeguridadVial ?? "",
    respSistemaSeguridadInformacion: perfil.respSistemaSeguridadInformacion ?? "",
    respSistemaSagrilaft: perfil.respSistemaSagrilaft ?? "",
    requisitoEducacionFormal: perfil.requisitoEducacionFormal ?? "",
    requisitoTarjetaProfesional: perfil.requisitoTarjetaProfesional ?? "",
    requisitoFormacionComplementaria: perfil.requisitoFormacionComplementaria ?? "",
    requisitoCertificaciones: perfil.requisitoCertificaciones ?? "",
    requisitoExperienciaGeneral: perfil.requisitoExperienciaGeneral ?? "",
    requisitoExperienciaEspecifica: perfil.requisitoExperienciaEspecifica ?? "",
    requisitoEquivalencias: perfil.requisitoEquivalencias ?? "",
    requisitoOtros: perfil.requisitoOtros ?? "",
    dotacion: perfil.dotacion ?? "",
    equiposHerramientas: perfil.equiposHerramientas ?? "",
    evidenciaProducto: perfil.evidenciaProducto ?? "",
    evidenciaDesempeno: perfil.evidenciaDesempeno ?? "",
    evidenciaConocimiento: perfil.evidenciaConocimiento ?? "",
    funciones: perfil.funciones.map((f) => ({
      descripcion: f.descripcion,
      frecuencia: f.frecuencia ?? "diaria",
      criterioDesempeno: f.criterioDesempeno ?? "",
      porcentajeTiempo: f.porcentajeTiempo != null ? String(f.porcentajeTiempo) : "",
    })),
    flujos: perfil.flujos.map((f) => ({
      tipo: f.tipo,
      descripcion: f.descripcion,
      contraparte: f.contraparte ?? "",
      contraparteCargoId: f.contraparteCargoId ?? "",
    })),
    riesgos: perfil.riesgos.map((r) => ({
      tipo: r.tipo,
      descripcion: r.descripcion,
      nivel: r.nivel,
      controlesExistentes: r.controlesExistentes ?? "",
      eppRequerido: r.eppRequerido ?? "",
    })),
    ajustes: perfil.ajustes.map((a) => ({
      tipoBarrera: a.tipoBarrera,
      descripcionBarrera: a.descripcionBarrera,
      apoyoSugerido: a.apoyoSugerido,
    })),
    competencias: perfil.competencias.map((c) => ({
      nombre: c.nombre,
      tipo: c.tipo,
      nivelRequerido: c.nivelRequerido,
    })),
    decisiones: perfil.decisiones.map((d) => ({ descripcion: d.descripcion, nivelAutonomia: d.nivelAutonomia })),
    responsabilidadesSst: perfil.responsabilidadesSst.map((r) => ({ descripcion: r.descripcion })),
    indicadores: perfil.indicadores.map((i) => ({
      nombre: i.nombre,
      formula: i.formula ?? "",
      meta: i.meta ?? "",
      frecuencia: i.frecuencia ?? "",
    })),
  };
}

/**
 * Combina dos juegos de valores del formulario de Perfil: conserva cada
 * campo de `base` si ya tiene contenido, y solo toma el de `relleno` cuando
 * `base` está vacío (cadena vacía o arreglo sin elementos) — mismo criterio
 * no-destructivo que usa el borrador con IA, reutilizado por "copiar perfil"
 * para nunca pisar algo que el consultor ya escribió a mano.
 */
export function combinarValoresPerfil(base: PerfilDefaultValues, relleno: PerfilDefaultValues): PerfilDefaultValues {
  const resultado = { ...base };
  for (const clave of Object.keys(base) as (keyof PerfilDefaultValues)[]) {
    const valorBase = base[clave];
    const estaVacio = Array.isArray(valorBase) ? valorBase.length === 0 : valorBase === "";
    if (estaVacio) {
      (resultado as Record<string, unknown>)[clave] = relleno[clave];
    }
  }
  return resultado;
}

/** Cargos de la empresa que ya tienen un Perfil con contenido — candidatos
 * para "copiar perfil" desde otro cargo parecido. Los que comparten el mismo
 * nombre de cargo van primero (suele ser el mismo puesto en otra área). */
export async function listarCargosParaCopiarPerfil(empresaId: string, cargoExcluidoId: string, nombreCargoActual: string) {
  const cargos = await prisma.cargo.findMany({
    where: { empresaId, id: { not: cargoExcluidoId }, perfil: { isNot: null } },
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      departamento: { select: { nombre: true } },
      perfil: { select: { estado: true } },
    },
  });

  return cargos
    .map((c) => ({
      id: c.id,
      nombre: c.nombre,
      departamento: c.departamento.nombre,
      estado: c.perfil?.estado ?? "borrador",
    }))
    .sort((a, b) => {
      const aCoincide = a.nombre === nombreCargoActual ? 0 : 1;
      const bCoincide = b.nombre === nombreCargoActual ? 0 : 1;
      if (aCoincide !== bCoincide) return aCoincide - bCoincide;
      return a.nombre.localeCompare(b.nombre);
    });
}

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

/** Cargos de la empresa con sus funciones esenciales — insumo para detectar
 * solapamiento (ver solapamiento-funciones.ts). Solo trae la descripción de
 * cada función, no el resto del Perfil. */
export async function listarCargosConFuncionesParaEmpresa(empresaId: string) {
  const cargos = await prisma.cargo.findMany({
    where: { empresaId },
    select: {
      id: true,
      nombre: true,
      departamento: { select: { nombre: true } },
      perfil: { select: { funciones: { select: { descripcion: true } } } },
    },
  });
  return cargos.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    departamento: c.departamento.nombre,
    funciones: c.perfil?.funciones ?? [],
  }));
}

export async function listarCargosParaSelector(empresaId: string) {
  return prisma.cargo.findMany({
    where: { empresaId },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, departamento: { select: { nombre: true } } },
  });
}
