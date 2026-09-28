"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requerirConsultor } from "@/lib/auth";
import { hashPassword } from "@/lib/passwords";
import { empresaSchema, editarEmpresaSchema, resetearPasswordSchema } from "@/lib/validaciones";
import { crearEstructuraInicial, sembrarResponsabilidadesSstComunes } from "@/lib/estructura-inicial";

export type EmpresaState = { error?: string };

export async function crearEmpresaAction(_prevState: EmpresaState, formData: FormData): Promise<EmpresaState> {
  const { cuentaId } = await requerirConsultor();

  const parsed = empresaSchema.safeParse({
    nombre: formData.get("nombre"),
    nivelAcceso: formData.get("nivelAcceso"),
    usuarioNombre: formData.get("usuarioNombre"),
    usuarioEmail: formData.get("usuarioEmail"),
    usuarioPassword: formData.get("usuarioPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const d = parsed.data;

  const nombreExistente = await prisma.empresa.findUnique({ where: { cuentaId_nombre: { cuentaId, nombre: d.nombre } } });
  if (nombreExistente) return { error: "Ya tienes una empresa con ese nombre" };

  const emailExistente = await prisma.usuario.findUnique({ where: { email: d.usuarioEmail } });
  if (emailExistente) return { error: "Ya existe un usuario con ese correo" };

  const passwordHash = await hashPassword(d.usuarioPassword);
  // Casilla marcada por defecto en el formulario — la mayoría de empresas sí
  // tienen una junta directiva como tope de su jerarquía. Si se desmarca
  // (empresas que arrancan directo en Gerencia General, por ejemplo), la
  // empresa nace sin departamento ni cargo alguno, para que el consultor
  // arme la raíz a su manera desde "Nuevo cargo".
  const tieneJuntaDirectiva = formData.get("tieneJuntaDirectiva") === "on";

  const empresa = await prisma.$transaction(async (tx) => {
    const empresaCreada = await tx.empresa.create({
      data: { cuentaId, nombre: d.nombre, nivelAcceso: d.nivelAcceso },
    });
    await tx.usuario.create({
      data: {
        nombre: d.usuarioNombre,
        email: d.usuarioEmail,
        passwordHash,
        rol: "empresa",
        empresaId: empresaCreada.id,
      },
    });
    if (tieneJuntaDirectiva) {
      await crearEstructuraInicial(tx, empresaCreada.id);
    }
    await sembrarResponsabilidadesSstComunes(tx, empresaCreada.id);
    return empresaCreada;
  });

  revalidatePath("/empresas");
  redirect(`/empresas/${empresa.id}`);
}

export async function actualizarEmpresaAction(
  empresaId: string,
  _prevState: EmpresaState,
  formData: FormData
): Promise<EmpresaState> {
  const { cuentaId } = await requerirConsultor();

  const parsed = editarEmpresaSchema.safeParse({
    nombre: formData.get("nombre"),
    nivelAcceso: formData.get("nivelAcceso"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const actual = await prisma.empresa.findUnique({ where: { id: empresaId, cuentaId } });
  if (!actual) return { error: "Empresa no encontrada" };

  const existente = await prisma.empresa.findUnique({
    where: { cuentaId_nombre: { cuentaId, nombre: parsed.data.nombre } },
  });
  if (existente && existente.id !== empresaId) return { error: "Ya tienes otra empresa con ese nombre" };

  await prisma.empresa.update({ where: { id: empresaId, cuentaId }, data: parsed.data });
  revalidatePath(`/empresas/${empresaId}`);
  revalidatePath("/empresas");
  return {};
}

export async function eliminarEmpresaAction(empresaId: string): Promise<void> {
  const { cuentaId } = await requerirConsultor();
  await prisma.empresa.delete({ where: { id: empresaId, cuentaId } });
  revalidatePath("/empresas");
  redirect("/empresas");
}

export type ResetearPasswordState = { error?: string; success?: true };

export async function resetearPasswordEmpresaAction(
  empresaId: string,
  _prevState: ResetearPasswordState,
  formData: FormData
): Promise<ResetearPasswordState> {
  const { cuentaId } = await requerirConsultor();

  const empresa = await prisma.empresa.findUnique({ where: { id: empresaId, cuentaId }, include: { usuario: true } });
  if (!empresa || !empresa.usuario) return { error: "Empresa no encontrada" };

  const parsed = resetearPasswordSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.usuario.update({
    where: { id: empresa.usuario.id },
    data: { passwordHash, passwordTemporal: true },
  });

  return { success: true };
}
