import "server-only";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  signSession,
  verifySession,
  type SessionPayload,
} from "@/lib/session";
import { prisma } from "@/lib/prisma";

type UsuarioParaSesion = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  cuentaId: string | null;
  empresaId: string | null;
  passwordTemporal: boolean;
};

export async function crearSesion(usuario: UsuarioParaSesion): Promise<void> {
  const token = await signSession({
    sub: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    cuentaId: usuario.cuentaId,
    empresaId: usuario.empresaId,
    passwordTemporal: usuario.passwordTemporal,
    loginTimestamp: Date.now(),
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
}

export async function destruirSesion(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function obtenerSesion(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requerirSesion(): Promise<SessionPayload> {
  const session = await obtenerSesion();
  if (!session) redirect("/login");
  return session;
}

export async function requerirSuperAdmin(): Promise<SessionPayload> {
  const session = await requerirSesion();
  if (session.rol !== "super_admin") redirect("/empresas");
  return session;
}

/** Para /empresas: solo el consultor administra la lista de sus empresas. */
export async function requerirConsultor(): Promise<SessionPayload & { cuentaId: string }> {
  const session = await requerirSesion();
  if (session.rol !== "consultor" || !session.cuentaId) redirect("/login");
  return session as SessionPayload & { cuentaId: string };
}

export type NivelAcceso = "lectura" | "gestion_perfiles" | "control_total";

export type AccesoEmpresa = {
  session: SessionPayload;
  empresa: { id: string; nombre: string; estado: string; nivelAcceso: string };
  /**
   * true solo para el consultor dueño de la cuenta — NUNCA para un Usuario
   * de rol 'empresa', sin importar su nivelAcceso. Controla la gestión de la
   * EMPRESA misma (renombrarla, cambiar su nivel de acceso, resetear su
   * contraseña, eliminarla) — algo que ni siquiera un nivel 'control_total'
   * le da al usuario de esa empresa, que solo controla SU estructura
   * (departamentos/cargos/perfiles), no la ficha de la empresa en sí.
   */
  esConsultor: boolean;
  /** Puede editar/publicar contenido de perfiles ya existentes. */
  puedeEditarPerfiles: boolean;
  /** Puede crear/editar/eliminar departamentos y cargos (estructura). */
  puedeGestionarEstructura: boolean;
};

/**
 * Para toda página que MUESTRA la estructura de una empresa (departamentos,
 * cargos, perfiles, versiones, exports). Permite al consultor dueño (control
 * total siempre) o al Usuario de esa misma empresa (permisos según
 * `Empresa.nivelAcceso` — ver el comentario en prisma/schema.prisma).
 */
export async function requerirAccesoEmpresa(empresaId: string): Promise<AccesoEmpresa> {
  const session = await requerirSesion();

  if (session.rol === "consultor" && session.cuentaId) {
    const empresa = await prisma.empresa.findUnique({ where: { id: empresaId, cuentaId: session.cuentaId } });
    if (!empresa) notFound();
    return { session, empresa, esConsultor: true, puedeEditarPerfiles: true, puedeGestionarEstructura: true };
  }

  if (session.rol === "empresa" && session.empresaId === empresaId) {
    const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
    if (!empresa) notFound();
    const nivel = empresa.nivelAcceso as NivelAcceso;
    return {
      session,
      empresa,
      esConsultor: false,
      puedeEditarPerfiles: nivel === "gestion_perfiles" || nivel === "control_total",
      puedeGestionarEstructura: nivel === "control_total",
    };
  }

  redirect("/login");
}

/**
 * Para toda Server Action que crea/edita/elimina departamentos o cargos
 * (estructura organizacional). Redirige en vez de ejecutar si quien llama no
 * tiene permiso — así un usuario 'empresa' sin control total no puede mutar
 * nada aunque invoque la action directamente, no solo se le ocultan botones.
 */
export async function requerirGestionEstructura(empresaId: string): Promise<AccesoEmpresa> {
  const acceso = await requerirAccesoEmpresa(empresaId);
  if (!acceso.puedeGestionarEstructura) redirect(`/empresas/${empresaId}`);
  return acceso;
}

/** Para Server Actions que editan/publican el contenido de un Perfil. */
export async function requerirGestionPerfil(empresaId: string): Promise<AccesoEmpresa> {
  const acceso = await requerirAccesoEmpresa(empresaId);
  if (!acceso.puedeEditarPerfiles) redirect(`/empresas/${empresaId}`);
  return acceso;
}
