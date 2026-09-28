"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requerirGestionEstructura } from "@/lib/auth";
import { funcionComunSchema, competenciaComunSchema, responsabilidadSstComunSchema } from "@/lib/validaciones";

export type ComunState = { error?: string };

export async function crearFuncionComunAction(
  empresaId: string,
  _prevState: ComunState,
  formData: FormData
): Promise<ComunState> {
  await requerirGestionEstructura(empresaId);

  const parsed = funcionComunSchema.safeParse({
    alcance: formData.get("alcance"),
    descripcion: formData.get("descripcion"),
    frecuencia: formData.get("frecuencia"),
    criterioDesempeno: formData.get("criterioDesempeno") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await prisma.funcionComunEmpresa.create({
    data: {
      empresaId,
      alcance: parsed.data.alcance,
      descripcion: parsed.data.descripcion,
      frecuencia: parsed.data.frecuencia,
      criterioDesempeno: parsed.data.criterioDesempeno || null,
    },
  });

  revalidatePath(`/empresas/${empresaId}/comunes`);
  return {};
}

export async function eliminarFuncionComunAction(id: string): Promise<void> {
  const fila = await prisma.funcionComunEmpresa.findUnique({ where: { id } });
  if (!fila) redirect("/empresas");
  await requerirGestionEstructura(fila.empresaId);

  await prisma.funcionComunEmpresa.delete({ where: { id } });
  revalidatePath(`/empresas/${fila.empresaId}/comunes`);
  redirect(`/empresas/${fila.empresaId}/comunes`);
}

export async function crearCompetenciaComunAction(
  empresaId: string,
  _prevState: ComunState,
  formData: FormData
): Promise<ComunState> {
  await requerirGestionEstructura(empresaId);

  const parsed = competenciaComunSchema.safeParse({
    alcance: formData.get("alcance"),
    nombre: formData.get("nombre"),
    nivelRequerido: formData.get("nivelRequerido"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await prisma.competenciaComunEmpresa.create({
    data: {
      empresaId,
      alcance: parsed.data.alcance,
      nombre: parsed.data.nombre,
      nivelRequerido: parsed.data.nivelRequerido,
    },
  });

  revalidatePath(`/empresas/${empresaId}/comunes`);
  return {};
}

export async function eliminarCompetenciaComunAction(id: string): Promise<void> {
  const fila = await prisma.competenciaComunEmpresa.findUnique({ where: { id } });
  if (!fila) redirect("/empresas");
  await requerirGestionEstructura(fila.empresaId);

  await prisma.competenciaComunEmpresa.delete({ where: { id } });
  revalidatePath(`/empresas/${fila.empresaId}/comunes`);
  redirect(`/empresas/${fila.empresaId}/comunes`);
}

export async function crearResponsabilidadSstComunAction(
  empresaId: string,
  _prevState: ComunState,
  formData: FormData
): Promise<ComunState> {
  await requerirGestionEstructura(empresaId);

  const parsed = responsabilidadSstComunSchema.safeParse({
    alcance: formData.get("alcance"),
    descripcion: formData.get("descripcion"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await prisma.responsabilidadSstComunEmpresa.create({
    data: { empresaId, alcance: parsed.data.alcance, descripcion: parsed.data.descripcion },
  });

  revalidatePath(`/empresas/${empresaId}/comunes`);
  return {};
}

export async function eliminarResponsabilidadSstComunAction(id: string): Promise<void> {
  const fila = await prisma.responsabilidadSstComunEmpresa.findUnique({ where: { id } });
  if (!fila) redirect("/empresas");
  await requerirGestionEstructura(fila.empresaId);

  await prisma.responsabilidadSstComunEmpresa.delete({ where: { id } });
  revalidatePath(`/empresas/${fila.empresaId}/comunes`);
  redirect(`/empresas/${fila.empresaId}/comunes`);
}
