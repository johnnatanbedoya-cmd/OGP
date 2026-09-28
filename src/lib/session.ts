// Firma/verificación de la cookie de sesión (JWT, HS256).
// Sin dependencias de `next/headers` a propósito: este módulo se usa tanto en
// Server Actions/Componentes como en src/middleware.ts.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "session";

// Expiración por inactividad: si no hay ninguna petición en 15 min, la
// sesión se vence sola (ver src/middleware.ts, que renueva el JWT en cada
// petición mientras haya actividad). Tope absoluto: la sesión nunca dura más
// de 8h desde el login original, pase lo que pase.
export const SESSION_IDLE_TIMEOUT_SECONDS = 15 * 60;
export const SESSION_ABSOLUTE_MAX_SECONDS = 8 * 60 * 60;

// Sin maxAge/expires a propósito: cookie "de sesión de navegador", el
// navegador la borra al cerrarse — el JWT adentro es la única fuente de
// verdad sobre cuándo expira de verdad.
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export interface SessionPayload {
  sub: string;
  nombre: string;
  email: string;
  rol: string; // 'consultor' | 'empresa' | 'super_admin'
  // Set solo para 'consultor'/'super_admin'.
  cuentaId: string | null;
  // Set solo para 'empresa' — la única empresa a la que pertenece.
  empresaId: string | null;
  passwordTemporal: boolean;
  // Momento del login original (epoch ms) — fijo desde crearSesion() y
  // copiado sin cambios en cada renovación, para calcular el tope absoluto
  // de 8h sin importar cuántas veces se haya renovado la sesión.
  loginTimestamp: number;
  [key: string]: unknown;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Falta la variable de entorno SESSION_SECRET");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Próxima expiración (epoch, segundos) para un JWT de sesión: 15 min desde
 * ahora, pero nunca más allá de 8h desde el login original.
 */
export function calcularProximaExpiracion(loginTimestampMs: number): number {
  const ahoraSegundos = Math.floor(Date.now() / 1000);
  const limiteAbsolutoSegundos = Math.floor(loginTimestampMs / 1000) + SESSION_ABSOLUTE_MAX_SECONDS;
  return Math.min(ahoraSegundos + SESSION_IDLE_TIMEOUT_SECONDS, limiteAbsolutoSegundos);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(calcularProximaExpiracion(payload.loginTimestamp))
    .sign(getSecretKey());
}

/**
 * A dónde mandar a alguien recién logueado (o que visita "/" o "/login" ya
 * logueado) según su rol — usado tanto en src/proxy.ts (sin next/headers)
 * como en src/app/actions/auth.ts y src/app/page.tsx, para no desincronizar
 * los tres lugares.
 */
export function rutaInicioPara(session: Pick<SessionPayload, "rol" | "empresaId">): string {
  if (session.rol === "empresa" && session.empresaId) return `/empresas/${session.empresaId}/dashboard`;
  return "/empresas";
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as SessionPayload;
  } catch {
    return null;
  }
}
