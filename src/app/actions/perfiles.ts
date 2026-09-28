"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requerirGestionPerfil } from "@/lib/auth";
import { perfilSchema, ROLES_SST } from "@/lib/validaciones";
import { textoOpcional, listasParalelas } from "@/lib/form-utils";
import { obtenerCargoConPerfil } from "@/lib/perfil-data";
import { obtenerUltimoTallerPorBloque } from "@/lib/taller-data";
import { generarBorradorPerfilConIA } from "@/lib/ia-perfil";
import { camposFaltantesParaPublicar } from "@/lib/perfil-publicacion";
import type { PerfilDefaultValues } from "@/lib/perfil-defaults";

export type PerfilState = { error?: string };

const CAMPOS_TEXTO_PERFIL = [
  "razonSer",
  "criticidadAusencia",
  "sede",
  "autonomiaDecision",
  "recursoPersonasDescripcion",
  "recursoDineroDescripcion",
  "recursoEquiposDescripcion",
  "recursoInfoConfidencialDescripcion",
  "recursoMaterialesDescripcion",
  "participacionComites",
  "eppRequerido",
  "protocolosEmergencia",
  "evaluacionPreocupacional",
  "evaluacionPeriodica",
  "evaluacionPostIncapacidad",
  "evaluacionEgreso",
  "respSistemaCalidad",
  "respSistemaAmbiental",
  "respSistemaSeguridadVial",
  "respSistemaSeguridadInformacion",
  "respSistemaSagrilaft",
  "requisitoEducacionFormal",
  "requisitoTarjetaProfesional",
  "requisitoFormacionComplementaria",
  "requisitoCertificaciones",
  "requisitoExperienciaGeneral",
  "requisitoExperienciaEspecifica",
  "requisitoEquivalencias",
  "requisitoOtros",
  "dotacion",
  "equiposHerramientas",
  "evidenciaProducto",
  "evidenciaDesempeno",
  "evidenciaConocimiento",
] as const;

const CAMPOS_ENUM_OPCIONAL_PERFIL = [
  "modalidadTrabajo",
  "jornada",
  "claseRiesgoArl",
  "tipoVinculacion",
  "recursoPersonasNivel",
  "recursoDineroNivel",
  "recursoEquiposNivel",
  "recursoInfoConfidencialNivel",
  "recursoMaterialesNivel",
] as const;

function leerDatosPerfil(formData: FormData) {
  const funciones = listasParalelas(formData, {
    descripcion: "funcionDescripcion",
    frecuencia: "funcionFrecuencia",
    criterioDesempeno: "funcionCriterioDesempeno",
    porcentajeTiempo: "funcionPorcentajeTiempo",
  });
  const flujos = listasParalelas(formData, {
    tipo: "flujoTipo",
    descripcion: "flujoDescripcion",
    contraparte: "flujoContraparte",
    contraparteCargoId: "flujoContraparteCargoId",
  });
  const riesgos = listasParalelas(formData, {
    tipo: "riesgoTipo",
    descripcion: "riesgoDescripcion",
    nivel: "riesgoNivel",
    controlesExistentes: "riesgoControlesExistentes",
    eppRequerido: "riesgoEppRequerido",
  });
  const ajustes = listasParalelas(formData, {
    tipoBarrera: "ajusteTipoBarrera",
    descripcionBarrera: "ajusteDescripcionBarrera",
    apoyoSugerido: "ajusteApoyoSugerido",
  });
  const competencias = listasParalelas(formData, {
    nombre: "competenciaNombre",
    tipo: "competenciaTipo",
    nivelRequerido: "competenciaNivel",
  });
  const decisiones = listasParalelas(formData, {
    descripcion: "decisionDescripcion",
    nivelAutonomia: "decisionNivelAutonomia",
  });
  const responsabilidadesSst = listasParalelas(formData, {
    descripcion: "responsabilidadSstDescripcion",
  });
  const indicadores = listasParalelas(formData, {
    nombre: "indicadorNombre",
    formula: "indicadorFormula",
    meta: "indicadorMeta",
    frecuencia: "indicadorFrecuencia",
  });

  const rolesSst = formData
    .getAll("rolesSst")
    .map((v) => String(v))
    .filter((v): v is (typeof ROLES_SST)[number] => (ROLES_SST as readonly string[]).includes(v));

  const parsed = perfilSchema.safeParse({
    ...Object.fromEntries(CAMPOS_TEXTO_PERFIL.map((campo) => [campo, formData.get(campo) ?? ""])),
    ...Object.fromEntries(CAMPOS_ENUM_OPCIONAL_PERFIL.map((campo) => [campo, formData.get(campo) ?? ""])),
    numeroPuestos: formData.get("numeroPuestos") ?? "",
    rolesSst,
    funciones,
    flujos,
    riesgos,
    ajustes,
    competencias,
    decisiones,
    responsabilidadesSst,
    indicadores,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" } as const;
  }

  return {
    data: {
      ...Object.fromEntries(CAMPOS_TEXTO_PERFIL.map((campo) => [campo, textoOpcional(formData, campo)])),
      ...Object.fromEntries(CAMPOS_ENUM_OPCIONAL_PERFIL.map((campo) => [campo, textoOpcional(formData, campo)])),
      numeroPuestos: parsed.data.numeroPuestos === "" ? null : parsed.data.numeroPuestos,
      rolesSst: parsed.data.rolesSst,
      funciones: parsed.data.funciones.map((f) => ({
        descripcion: f.descripcion,
        frecuencia: f.frecuencia,
        criterioDesempeno: f.criterioDesempeno,
        porcentajeTiempo: f.porcentajeTiempo === "" ? null : f.porcentajeTiempo,
      })),
      flujos: parsed.data.flujos.map((f) => ({
        tipo: f.tipo,
        descripcion: f.descripcion,
        contraparte: f.contraparte || null,
        contraparteCargoId: f.contraparteCargoId || null,
      })),
      riesgos: parsed.data.riesgos,
      ajustes: parsed.data.ajustes,
      competencias: parsed.data.competencias,
      decisiones: parsed.data.decisiones,
      responsabilidadesSst: parsed.data.responsabilidadesSst.map((r, i) => ({ orden: i, descripcion: r.descripcion })),
      indicadores: parsed.data.indicadores,
    },
  } as const;
}

export async function guardarPerfilAction(
  cargoId: string,
  _prevState: PerfilState,
  formData: FormData
): Promise<PerfilState> {
  const cargo = await prisma.cargo.findUnique({ where: { id: cargoId } });
  if (!cargo) return { error: "Cargo no encontrado" };
  const { session: sesion } = await requerirGestionPerfil(cargo.empresaId);

  const leido = leerDatosPerfil(formData);
  if ("error" in leido) return { error: leido.error };
  const { funciones, flujos, riesgos, ajustes, competencias, decisiones, responsabilidadesSst, indicadores, ...datosPerfil } =
    leido.data;

  const contenidoHijos = {
    funciones: { create: funciones.map((f, i) => ({ orden: i, ...f })) },
    flujos: { create: flujos },
    riesgos: { create: riesgos },
    ajustes: { create: ajustes },
    competencias: { create: competencias },
    decisiones: { create: decisiones },
    responsabilidadesSst: { create: responsabilidadesSst },
    indicadores: { create: indicadores },
  };

  const perfilExistente = await prisma.perfil.findUnique({ where: { cargoId } });

  const perfilId = await prisma.$transaction(
    async (tx) => {
      let id: string;
      if (perfilExistente) {
        id = perfilExistente.id;
        // En paralelo — son tablas independientes, y encadenarlas una por una
        // agrega suficiente latencia de red (Neon serverless por WebSocket)
        // como para superar el timeout de la transacción.
        await Promise.all([
          tx.funcionPerfil.deleteMany({ where: { perfilId: id } }),
          tx.flujoPerfil.deleteMany({ where: { perfilId: id } }),
          tx.riesgoPerfil.deleteMany({ where: { perfilId: id } }),
          tx.ajustePerfil.deleteMany({ where: { perfilId: id } }),
          tx.competenciaPerfil.deleteMany({ where: { perfilId: id } }),
          tx.decisionAutonomiaPerfil.deleteMany({ where: { perfilId: id } }),
          tx.responsabilidadSstPerfil.deleteMany({ where: { perfilId: id } }),
          tx.indicadorPerfil.deleteMany({ where: { perfilId: id } }),
        ]);
        await tx.perfil.update({ where: { id }, data: { ...datosPerfil, ...contenidoHijos } });
      } else {
        const creado = await tx.perfil.create({ data: { cargoId, ...datosPerfil, ...contenidoHijos } });
        id = creado.id;
      }

      const [snapshot, ultimaVersion] = await Promise.all([
        tx.perfil.findUniqueOrThrow({
          where: { id },
          include: {
            funciones: true,
            flujos: true,
            riesgos: true,
            ajustes: true,
            competencias: true,
            decisiones: true,
            responsabilidadesSst: true,
            indicadores: true,
          },
        }),
        tx.version.findFirst({ where: { perfilId: id }, orderBy: { numero: "desc" } }),
      ]);
      await tx.version.create({
        data: {
          perfilId: id,
          numero: (ultimaVersion?.numero ?? 0) + 1,
          snapshot: snapshot as object,
          autorId: sesion.sub,
          autorNombre: sesion.nombre,
        },
      });

      return id;
    },
    { timeout: 15000 }
  );

  void perfilId;
  revalidatePath(`/cargos/${cargoId}`);
  redirect(`/cargos/${cargoId}`);
}

export type BorradorPerfilState = { error?: string; borrador?: PerfilDefaultValues };

/**
 * Motor de estandarización (Fase 3): genera un borrador con IA a partir de
 * las respuestas del Taller y lo combina con el Perfil actual — SOLO llena
 * los campos que hoy están vacíos, nunca sobreescribe contenido ya guardado.
 * No persiste nada; el consultor revisa el formulario pre-llenado y decide
 * si guarda.
 */
export async function generarBorradorPerfilAction(cargoId: string): Promise<BorradorPerfilState> {
  const cargo = await prisma.cargo.findUnique({ where: { id: cargoId } });
  if (!cargo) return { error: "Cargo no encontrado" };
  await requerirGestionPerfil(cargo.empresaId);

  const respuestasTaller = await obtenerUltimoTallerPorBloque(cargoId);
  if (Object.keys(respuestasTaller).length === 0) {
    return { error: "Este cargo todavía no tiene respuestas de Taller — aplica un Taller primero." };
  }

  let borradorIA;
  try {
    const resultado = await generarBorradorPerfilConIA(cargo.nombre, respuestasTaller);
    borradorIA = resultado.borrador;
    // Se registra el gasto real de la llamada a la IA para el informe de
    // costos del consultor (/empresas/[id]/trabajadores) — no bloquea la
    // generación del borrador si por algo fallara este insert.
    await prisma.generacionIaPerfil
      .create({
        data: {
          empresaId: cargo.empresaId,
          cargoId,
          modelo: resultado.uso.modelo,
          tokensEntrada: resultado.uso.tokensEntrada,
          tokensSalida: resultado.uso.tokensSalida,
          costoUsd: resultado.uso.costoUsd,
        },
      })
      .catch(() => {});
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo generar el borrador con IA." };
  }

  const actual = await prisma.perfil.findUnique({
    where: { cargoId },
    include: {
      funciones: true,
      flujos: true,
      riesgos: true,
      ajustes: true,
      competencias: true,
      decisiones: true,
      responsabilidadesSst: true,
      indicadores: true,
    },
  });

  const textoActual = (campo: keyof typeof borradorIA) =>
    (actual?.[campo as keyof typeof actual] as string | null) || (borradorIA[campo] as string);

  const borrador: PerfilDefaultValues = {
    razonSer: textoActual("razonSer"),
    criticidadAusencia: textoActual("criticidadAusencia"),
    numeroPuestos: actual?.numeroPuestos != null ? String(actual.numeroPuestos) : "",
    sede: textoActual("sede"),
    modalidadTrabajo: textoActual("modalidadTrabajo"),
    jornada: actual?.jornada ?? "",
    claseRiesgoArl: textoActual("claseRiesgoArl"),
    tipoVinculacion: textoActual("tipoVinculacion"),
    autonomiaDecision: textoActual("autonomiaDecision"),
    recursoPersonasNivel: textoActual("recursoPersonasNivel"),
    recursoPersonasDescripcion: textoActual("recursoPersonasDescripcion"),
    recursoDineroNivel: textoActual("recursoDineroNivel"),
    recursoDineroDescripcion: textoActual("recursoDineroDescripcion"),
    recursoEquiposNivel: textoActual("recursoEquiposNivel"),
    recursoEquiposDescripcion: textoActual("recursoEquiposDescripcion"),
    recursoInfoConfidencialNivel: textoActual("recursoInfoConfidencialNivel"),
    recursoInfoConfidencialDescripcion: textoActual("recursoInfoConfidencialDescripcion"),
    recursoMaterialesNivel: textoActual("recursoMaterialesNivel"),
    recursoMaterialesDescripcion: textoActual("recursoMaterialesDescripcion"),
    participacionComites: textoActual("participacionComites"),
    eppRequerido: textoActual("eppRequerido"),
    protocolosEmergencia: textoActual("protocolosEmergencia"),
    rolesSst: actual && actual.rolesSst.length > 0 ? actual.rolesSst : borradorIA.rolesSst,
    evaluacionPreocupacional: actual?.evaluacionPreocupacional ?? "",
    evaluacionPeriodica: actual?.evaluacionPeriodica ?? "",
    evaluacionPostIncapacidad: actual?.evaluacionPostIncapacidad ?? "",
    evaluacionEgreso: actual?.evaluacionEgreso ?? "",
    respSistemaCalidad: actual?.respSistemaCalidad ?? "",
    respSistemaAmbiental: actual?.respSistemaAmbiental ?? "",
    respSistemaSeguridadVial: actual?.respSistemaSeguridadVial ?? "",
    respSistemaSeguridadInformacion: actual?.respSistemaSeguridadInformacion ?? "",
    respSistemaSagrilaft: actual?.respSistemaSagrilaft ?? "",
    requisitoEducacionFormal: textoActual("requisitoEducacionFormal"),
    requisitoTarjetaProfesional: actual?.requisitoTarjetaProfesional ?? "",
    requisitoFormacionComplementaria: textoActual("requisitoFormacionComplementaria"),
    requisitoCertificaciones: actual?.requisitoCertificaciones ?? "",
    requisitoExperienciaGeneral: textoActual("requisitoExperienciaGeneral"),
    requisitoExperienciaEspecifica: textoActual("requisitoExperienciaEspecifica"),
    requisitoEquivalencias: actual?.requisitoEquivalencias ?? "",
    requisitoOtros: actual?.requisitoOtros ?? "",
    dotacion: textoActual("dotacion"),
    equiposHerramientas: textoActual("equiposHerramientas"),
    evidenciaProducto: textoActual("evidenciaProducto"),
    evidenciaDesempeno: textoActual("evidenciaDesempeno"),
    evidenciaConocimiento: textoActual("evidenciaConocimiento"),
    funciones:
      actual && actual.funciones.length > 0
        ? actual.funciones.map((f) => ({
            descripcion: f.descripcion,
            frecuencia: f.frecuencia ?? "diaria",
            criterioDesempeno: f.criterioDesempeno ?? "",
            porcentajeTiempo: f.porcentajeTiempo != null ? String(f.porcentajeTiempo) : "",
          }))
        : borradorIA.funciones.map((f) => ({ ...f, porcentajeTiempo: "" })),
    flujos:
      actual && actual.flujos.length > 0
        ? actual.flujos.map((f) => ({
            tipo: f.tipo,
            descripcion: f.descripcion,
            contraparte: f.contraparte ?? "",
            contraparteCargoId: f.contraparteCargoId ?? "",
          }))
        : borradorIA.flujos.map((f) => ({ ...f, contraparteCargoId: "" })),
    riesgos:
      actual && actual.riesgos.length > 0
        ? actual.riesgos.map((r) => ({
            tipo: r.tipo,
            descripcion: r.descripcion,
            nivel: r.nivel,
            controlesExistentes: r.controlesExistentes ?? "",
            eppRequerido: r.eppRequerido ?? "",
          }))
        : borradorIA.riesgos,
    ajustes:
      actual && actual.ajustes.length > 0
        ? actual.ajustes.map((a) => ({
            tipoBarrera: a.tipoBarrera,
            descripcionBarrera: a.descripcionBarrera,
            apoyoSugerido: a.apoyoSugerido,
          }))
        : borradorIA.ajustes,
    competencias:
      actual && actual.competencias.length > 0
        ? actual.competencias.map((c) => ({ nombre: c.nombre, tipo: c.tipo, nivelRequerido: c.nivelRequerido }))
        : borradorIA.competencias,
    decisiones:
      actual && actual.decisiones.length > 0
        ? actual.decisiones.map((d) => ({ descripcion: d.descripcion, nivelAutonomia: d.nivelAutonomia }))
        : borradorIA.decisiones,
    responsabilidadesSst:
      actual && actual.responsabilidadesSst.length > 0
        ? actual.responsabilidadesSst.map((r) => ({ descripcion: r.descripcion }))
        : borradorIA.responsabilidadesSst,
    indicadores:
      actual && actual.indicadores.length > 0
        ? actual.indicadores.map((i) => ({
            nombre: i.nombre,
            formula: i.formula ?? "",
            meta: i.meta ?? "",
            frecuencia: i.frecuencia ?? "",
          }))
        : [],
  };

  return { borrador };
}

export type PublicarPerfilState = { error?: string; camposFaltantes?: string[] };

export async function publicarPerfilAction(cargoId: string, _prevState: PublicarPerfilState): Promise<PublicarPerfilState> {
  const cargoBasico = await prisma.cargo.findUnique({ where: { id: cargoId } });
  if (!cargoBasico) redirect("/empresas");
  await requerirGestionPerfil(cargoBasico.empresaId);

  const cargo = await obtenerCargoConPerfil(cargoId, cargoBasico.empresaId);
  if (!cargo?.perfil) redirect(`/cargos/${cargoId}`);

  const camposFaltantes = camposFaltantesParaPublicar(cargo);
  if (camposFaltantes.length > 0) {
    return {
      error: "Faltan datos importantes para publicar este perfil — revisa y completa lo siguiente:",
      camposFaltantes,
    };
  }

  await prisma.perfil.update({
    where: { id: cargo.perfil.id },
    data: { estado: "publicado", publishedAt: new Date() },
  });
  revalidatePath(`/cargos/${cargoId}`);
  redirect(`/cargos/${cargoId}`);
}
