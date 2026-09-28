"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requerirGestionEstructura } from "@/lib/auth";
import { importarTrabajadoresDesdeXlsx, type ResultadoImportacion } from "@/lib/importar-trabajadores";
import { trabajadorSchema } from "@/lib/validaciones";
import { textoOpcional } from "@/lib/form-utils";

export type ImportacionState = {
  error?: string;
  resultado?: ResultadoImportacion;
};

export async function importarTrabajadoresAction(
  empresaId: string,
  _prevState: ImportacionState,
  formData: FormData
): Promise<ImportacionState> {
  await requerirGestionEstructura(empresaId);

  const archivo = formData.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Selecciona un archivo para importar" };
  }
  if (!archivo.name.toLowerCase().endsWith(".xlsx")) {
    return { error: "El archivo debe ser .xlsx (descarga la plantilla si no la tienes)" };
  }

  const contenido = await archivo.arrayBuffer();
  const resultado = await importarTrabajadoresDesdeXlsx(empresaId, contenido);

  revalidatePath(`/empresas/${empresaId}`);
  revalidatePath(`/empresas/${empresaId}/trabajadores`);
  revalidatePath(`/empresas/${empresaId}/organigrama`);
  return { resultado };
}

export type TrabajadorState = { error?: string; guardado?: boolean };

export async function editarTrabajadorAction(
  trabajadorId: string,
  _prevState: TrabajadorState,
  formData: FormData
): Promise<TrabajadorState> {
  const trabajador = await prisma.trabajador.findUnique({ where: { id: trabajadorId } });
  if (!trabajador) redirect("/empresas");
  await requerirGestionEstructura(trabajador.empresaId);

  const parsed = trabajadorSchema.safeParse({
    documento: formData.get("documento"),
    nombres: formData.get("nombres"),
    email: formData.get("email"),
    estado: formData.get("estado"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const fechaIngresoRaw = textoOpcional(formData, "fechaIngreso");
  let fechaIngreso: Date | null = null;
  if (fechaIngresoRaw) {
    const fecha = new Date(fechaIngresoRaw);
    if (Number.isNaN(fecha.getTime())) {
      return { error: "Fecha de ingreso inválida" };
    }
    fechaIngreso = fecha;
  }

  const documentoDuplicado = await prisma.trabajador.findFirst({
    where: { empresaId: trabajador.empresaId, documento: parsed.data.documento, NOT: { id: trabajadorId } },
  });
  if (documentoDuplicado) {
    return { error: `Ya existe otro trabajador con documento ${parsed.data.documento} en esta empresa` };
  }

  await prisma.trabajador.update({
    where: { id: trabajadorId },
    data: {
      documento: parsed.data.documento,
      nombres: parsed.data.nombres,
      email: parsed.data.email,
      estado: parsed.data.estado,
      fechaIngreso,
    },
  });

  revalidatePath(`/empresas/${trabajador.empresaId}/trabajadores`);
  revalidatePath(`/empresas/${trabajador.empresaId}/organigrama`);
  return { guardado: true };
}

export async function eliminarTrabajadorAction(trabajadorId: string): Promise<void> {
  const trabajador = await prisma.trabajador.findUnique({ where: { id: trabajadorId } });
  if (!trabajador) redirect("/empresas");
  await requerirGestionEstructura(trabajador.empresaId);

  await prisma.trabajador.delete({ where: { id: trabajadorId } });
  revalidatePath(`/empresas/${trabajador.empresaId}/trabajadores`);
  revalidatePath(`/empresas/${trabajador.empresaId}/organigrama`);
  redirect(`/empresas/${trabajador.empresaId}/trabajadores`);
}
