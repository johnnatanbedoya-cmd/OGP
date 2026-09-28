"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requerirGestionEstructura } from "@/lib/auth";
import { departamentoSchema } from "@/lib/validaciones";
import { textoOpcional } from "@/lib/form-utils";

export type DepartamentoState = { error?: string };

function leerDatosDepartamento(formData: FormData) {
  const parsed = departamentoSchema.safeParse({
    nombre: formData.get("nombre"),
    descripcion: formData.get("descripcion") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" } as const;
  }
  return {
    data: {
      nombre: parsed.data.nombre,
      descripcion: textoOpcional(formData, "descripcion"),
    },
  } as const;
}

export async function crearDepartamentoAction(
  empresaId: string,
  _prevState: DepartamentoState,
  formData: FormData
): Promise<DepartamentoState> {
  await requerirGestionEstructura(empresaId);

  const leido = leerDatosDepartamento(formData);
  if ("error" in leido) return { error: leido.error };

  const existente = await prisma.departamento.findUnique({
    where: { empresaId_nombre: { empresaId, nombre: leido.data.nombre } },
  });
  if (existente) return { error: "Ya existe un departamento con ese nombre" };

  const departamento = await prisma.departamento.create({ data: { ...leido.data, empresaId } });
  revalidatePath(`/empresas/${empresaId}`);
  redirect(`/departamentos/${departamento.id}`);
}

export async function actualizarDepartamentoAction(
  departamentoId: string,
  _prevState: DepartamentoState,
  formData: FormData
): Promise<DepartamentoState> {
  const actual = await prisma.departamento.findUnique({ where: { id: departamentoId } });
  if (!actual) return { error: "Departamento no encontrado" };
  await requerirGestionEstructura(actual.empresaId);

  const leido = leerDatosDepartamento(formData);
  if ("error" in leido) return { error: leido.error };

  const existente = await prisma.departamento.findUnique({
    where: { empresaId_nombre: { empresaId: actual.empresaId, nombre: leido.data.nombre } },
  });
  if (existente && existente.id !== departamentoId) {
    return { error: "Ya existe otro departamento con ese nombre" };
  }

  await prisma.departamento.update({ where: { id: departamentoId }, data: leido.data });
  revalidatePath(`/departamentos/${departamentoId}`);
  revalidatePath(`/empresas/${actual.empresaId}`);
  return {};
}

export async function eliminarDepartamentoAction(departamentoId: string): Promise<void> {
  const actual = await prisma.departamento.findUnique({ where: { id: departamentoId } });
  if (!actual) redirect("/empresas");
  await requerirGestionEstructura(actual.empresaId);

  await prisma.departamento.delete({ where: { id: departamentoId } });
  revalidatePath(`/empresas/${actual.empresaId}`);
  redirect(`/empresas/${actual.empresaId}`);
}
