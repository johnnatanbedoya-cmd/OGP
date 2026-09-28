"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requerirGestionPerfil } from "@/lib/auth";
import { BLOQUES_TALLER } from "@/lib/taller-preguntas";
import {
  DURACION_INVITACION_DIAS,
  generarTokenInvitacion,
  hashTokenInvitacion,
  invitacionVencida,
} from "@/lib/taller-invitaciones";
import { enviarInvitacionTallerPorCorreo } from "@/lib/correo";

export type TallerState = { error?: string; guardado?: boolean };

export async function guardarTallerAction(
  cargoId: string,
  _prevState: TallerState,
  formData: FormData
): Promise<TallerState> {
  const cargo = await prisma.cargo.findUnique({ where: { id: cargoId } });
  if (!cargo) return { error: "Cargo no encontrado" };
  await requerirGestionPerfil(cargo.empresaId);

  const facilitador = (formData.get("facilitador") as string)?.trim() || null;
  const fechaTallerRaw = (formData.get("fechaTaller") as string)?.trim();
  const fechaTaller = fechaTallerRaw ? new Date(fechaTallerRaw) : null;

  let algunBloqueGuardado = false;

  for (const { bloque, preguntas } of BLOQUES_TALLER) {
    const datos: Record<string, string> = {};
    for (const { clave } of preguntas) {
      const valor = (formData.get(`taller_${bloque}_${clave}`) as string)?.trim();
      if (valor) datos[clave] = valor;
    }
    if (Object.keys(datos).length === 0) continue;

    await prisma.respuestaTaller.create({
      data: {
        empresaId: cargo.empresaId,
        cargoId,
        bloque,
        datos,
        facilitador,
        fechaTaller: fechaTaller && !Number.isNaN(fechaTaller.getTime()) ? fechaTaller : null,
      },
    });
    algunBloqueGuardado = true;
  }

  if (!algunBloqueGuardado) {
    return { error: "No escribiste ninguna respuesta — completa al menos una pregunta antes de guardar." };
  }

  revalidatePath(`/cargos/${cargoId}/taller`);
  revalidatePath(`/cargos/${cargoId}/perfil/editar`);
  redirect(`/cargos/${cargoId}`);
}

export type InvitacionTallerState = { error?: string; token?: string };

/** Genera un enlace de un solo trabajador para que diligencie su Taller sin cuenta. */
export async function generarInvitacionTallerAction(trabajadorId: string): Promise<InvitacionTallerState> {
  const trabajador = await prisma.trabajador.findUnique({ where: { id: trabajadorId } });
  if (!trabajador) return { error: "Trabajador no encontrado" };
  await requerirGestionPerfil(trabajador.empresaId);

  const token = generarTokenInvitacion();
  await prisma.invitacionTaller.create({
    data: {
      empresaId: trabajador.empresaId,
      trabajadorId,
      tokenHash: hashTokenInvitacion(token),
      expiresAt: new Date(Date.now() + DURACION_INVITACION_DIAS * 24 * 60 * 60 * 1000),
    },
  });

  return { token };
}

export type TallerAutoservicioState = { error?: string; enviado?: boolean };

/** Guarda las respuestas que el propio trabajador diligencia desde /t/[token], sin sesión. */
export async function guardarTallerAutoservicioAction(
  token: string,
  _prevState: TallerAutoservicioState,
  formData: FormData
): Promise<TallerAutoservicioState> {
  const invitacion = await prisma.invitacionTaller.findUnique({
    where: { tokenHash: hashTokenInvitacion(token) },
    include: { trabajador: true },
  });
  if (!invitacion) return { error: "Este enlace no es válido." };
  if (invitacionVencida(invitacion.expiresAt)) return { error: "Este enlace ya venció — pide uno nuevo." };
  if (invitacion.completadaEn) return { error: "Ya enviaste tus respuestas para este taller. ¡Gracias!" };

  let algunBloqueGuardado = false;

  for (const { bloque, preguntas } of BLOQUES_TALLER) {
    const datos: Record<string, string> = {};
    for (const { clave } of preguntas) {
      const valor = (formData.get(`taller_${bloque}_${clave}`) as string)?.trim();
      if (valor) datos[clave] = valor;
    }
    if (Object.keys(datos).length === 0) continue;

    await prisma.respuestaTaller.create({
      data: {
        empresaId: invitacion.empresaId,
        cargoId: invitacion.trabajador.cargoId,
        trabajadorId: invitacion.trabajadorId,
        bloque,
        datos,
        fechaTaller: new Date(),
      },
    });
    algunBloqueGuardado = true;
  }

  if (!algunBloqueGuardado) {
    return { error: "No respondiste ninguna pregunta — completa al menos una antes de enviar." };
  }

  await prisma.invitacionTaller.update({ where: { id: invitacion.id }, data: { completadaEn: new Date() } });
  revalidatePath(`/cargos/${invitacion.trabajador.cargoId}/taller`);
  revalidatePath(`/cargos/${invitacion.trabajador.cargoId}/perfil/editar`);
  return { enviado: true };
}

export type EnvioMasivoTallerState = {
  error?: string;
  resultado?: {
    enviados: number;
    yaCompletados: number;
    sinCorreo: number;
    fallidos: string[];
  };
};

/**
 * Genera y envía por correo (vía Resend) el enlace de autoservicio del Taller
 * a todos los trabajadores activos de la empresa que todavía no lo hayan
 * completado — mismo asunto/cuerpo que el botón manual de un solo trabajador
 * (ver GenerarInvitacionTallerButton), pero mandado de verdad en lugar de
 * abrir un mailto: uno por uno.
 */
export async function enviarInvitacionesTallerMasivoAction(
  empresaId: string,
  _prevState: EnvioMasivoTallerState,
  _formData: FormData
): Promise<EnvioMasivoTallerState> {
  const { empresa } = await requerirGestionPerfil(empresaId);

  const encabezados = await headers();
  const host = encabezados.get("host");
  const protocolo = encabezados.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  const origen = `${protocolo}://${host}`;

  const trabajadores = await prisma.trabajador.findMany({
    where: { empresaId, estado: "activo" },
    include: {
      cargo: { select: { nombre: true } },
      invitacionesTaller: { where: { completadaEn: { not: null } }, select: { id: true }, take: 1 },
    },
  });

  let enviados = 0;
  let yaCompletados = 0;
  let sinCorreo = 0;
  const fallidos: string[] = [];

  for (const trabajador of trabajadores) {
    if (trabajador.invitacionesTaller.length > 0) {
      yaCompletados++;
      continue;
    }
    if (!trabajador.email) {
      sinCorreo++;
      continue;
    }

    const token = generarTokenInvitacion();
    await prisma.invitacionTaller.create({
      data: {
        empresaId,
        trabajadorId: trabajador.id,
        tokenHash: hashTokenInvitacion(token),
        expiresAt: new Date(Date.now() + DURACION_INVITACION_DIAS * 24 * 60 * 60 * 1000),
      },
    });

    const resultado = await enviarInvitacionTallerPorCorreo({
      paraEmail: trabajador.email,
      trabajadorNombre: trabajador.nombres,
      cargoNombre: trabajador.cargo.nombre,
      empresaNombre: empresa.nombre,
      url: `${origen}/t/${token}`,
    });

    if (resultado.ok) {
      enviados++;
    } else {
      fallidos.push(`${trabajador.nombres}: ${resultado.error}`);
    }
  }

  return { resultado: { enviados, yaCompletados, sinCorreo, fallidos } };
}
