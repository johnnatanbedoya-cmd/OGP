"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/passwords";
import { crearSesion, destruirSesion } from "@/lib/auth";
import { rutaInicioPara } from "@/lib/session";
import { loginSchema } from "@/lib/validaciones";

export type LoginState = { error?: string };

// Diagnóstico temporal: algunos errores (p. ej. del driver de Neon) no son
// instancias de Error, así que un simple `${err}` imprime "[object Object]"
// sin decir nada útil en los logs de Vercel.
function describirError(err: unknown): string {
  if (err instanceof Error) return err.stack ?? err.message;
  try {
    return JSON.stringify(err, Object.getOwnPropertyNames(Object(err)));
  } catch {
    return String(err);
  }
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  let usuario;
  try {
    usuario = await prisma.usuario.findUnique({
      where: { email: parsed.data.email },
      include: { cuenta: true, empresa: true },
    });
  } catch (err) {
    console.error("[loginAction] fallo la consulta a la base de datos:", describirError(err));
    return { error: "No se pudo conectar con la base de datos. Intenta de nuevo en un momento." };
  }
  if (!usuario || !usuario.activo) {
    return { error: "Credenciales inválidas" };
  }

  const valido = await verifyPassword(parsed.data.password, usuario.passwordHash);
  if (!valido) {
    return { error: "Credenciales inválidas" };
  }

  // super_admin no tiene cuenta asociada (cuentaId null) — solo aplica a consultor.
  if (usuario.cuenta && usuario.cuenta.estado !== "activa") {
    return { error: "Esta cuenta está suspendida. Contacta al administrador." };
  }
  if (usuario.empresa && usuario.empresa.estado !== "activa") {
    return { error: "El acceso de esta empresa está suspendido. Contacta a tu consultor." };
  }

  try {
    await crearSesion(usuario);
  } catch (err) {
    console.error("[loginAction] fallo al crear la sesion:", describirError(err));
    return { error: "No se pudo iniciar sesión. Intenta de nuevo en un momento." };
  }
  redirect(rutaInicioPara(usuario));
}

export async function logoutAction(): Promise<void> {
  await destruirSesion();
  redirect("/login");
}
