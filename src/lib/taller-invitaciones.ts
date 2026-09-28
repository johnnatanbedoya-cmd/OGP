import { randomBytes, createHash } from "crypto";

export const DURACION_INVITACION_DIAS = 7;

/** Token real que va en el link — nunca se guarda en la base de datos tal cual. */
export function generarTokenInvitacion(): string {
  return randomBytes(32).toString("base64url");
}

/** Lo que sí se guarda en InvitacionTaller.tokenHash — mismo patrón que un reset de contraseña. */
export function hashTokenInvitacion(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function invitacionVencida(expiresAt: Date): boolean {
  return expiresAt.getTime() <= Date.now();
}
