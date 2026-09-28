"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requerirGestionEstructura } from "@/lib/auth";
import { importarTrabajadoresDesdeXlsx, type ResultadoImportacion } from "@/lib/importar-trabajadores";

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

export async function eliminarTrabajadorAction(trabajadorId: string): Promise<void> {
  const trabajador = await prisma.trabajador.findUnique({ where: { id: trabajadorId } });
  if (!trabajador) redirect("/empresas");
  await requerirGestionEstructura(trabajador.empresaId);

  await prisma.trabajador.delete({ where: { id: trabajadorId } });
  revalidatePath(`/empresas/${trabajador.empresaId}/trabajadores`);
  revalidatePath(`/empresas/${trabajador.empresaId}/organigrama`);
  redirect(`/empresas/${trabajador.empresaId}/trabajadores`);
}
