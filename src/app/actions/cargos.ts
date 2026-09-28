"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requerirGestionEstructura } from "@/lib/auth";
import { cargoSchema } from "@/lib/validaciones";
import { sembrarFuncionesCoordinadorSstSiAplica } from "@/lib/estructura-inicial";

export type CargoState = { error?: string };

async function leerDatosCargo(formData: FormData, empresaId: string, cargoActualId?: string) {
  const parsed = cargoSchema.safeParse({
    nombre: formData.get("nombre"),
    codigo: formData.get("codigo") ?? "",
    departamentoId: formData.get("departamentoId"),
    nivelJerarquico: formData.get("nivelJerarquico") ?? "",
    jefeInmediatoId: formData.get("jefeInmediatoId") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" } as const;
  }

  const departamento = await prisma.departamento.findUnique({
    where: { id: parsed.data.departamentoId, empresaId },
  });
  if (!departamento) return { error: "Departamento no válido" } as const;

  const jefeInmediatoId = parsed.data.jefeInmediatoId || null;
  if (jefeInmediatoId) {
    if (jefeInmediatoId === cargoActualId) {
      return { error: "Un cargo no puede ser jefe inmediato de sí mismo" } as const;
    }
    const jefe = await prisma.cargo.findUnique({ where: { id: jefeInmediatoId, empresaId } });
    if (!jefe) return { error: "El jefe inmediato seleccionado no es válido" } as const;
  }

  return {
    data: {
      nombre: parsed.data.nombre,
      codigo: parsed.data.codigo || null,
      departamentoId: parsed.data.departamentoId,
      nivelJerarquico: parsed.data.nivelJerarquico || null,
      jefeInmediatoId,
    },
  } as const;
}

export async function crearCargoAction(
  empresaId: string,
  _prevState: CargoState,
  formData: FormData
): Promise<CargoState> {
  await requerirGestionEstructura(empresaId);

  const leido = await leerDatosCargo(formData, empresaId);
  if ("error" in leido) return { error: leido.error };

  // El nombre ya no tiene que ser único dentro del departamento: puede haber
  // varios cargos con el mismo nombre y nivel pero funciones propias
  // distintas (ver prisma/schema.prisma, modelo Cargo).
  const cargo = await prisma.cargo.create({ data: { ...leido.data, empresaId } });
  await sembrarFuncionesCoordinadorSstSiAplica(prisma, cargo.id, cargo.nombre);
  revalidatePath(`/departamentos/${leido.data.departamentoId}`);
  redirect(`/cargos/${cargo.id}`);
}

export async function actualizarCargoAction(
  cargoId: string,
  _prevState: CargoState,
  formData: FormData
): Promise<CargoState> {
  const actual = await prisma.cargo.findUnique({ where: { id: cargoId } });
  if (!actual) return { error: "Cargo no encontrado" };
  await requerirGestionEstructura(actual.empresaId);

  const leido = await leerDatosCargo(formData, actual.empresaId, cargoId);
  if ("error" in leido) return { error: leido.error };

  await prisma.cargo.update({ where: { id: cargoId }, data: leido.data });
  revalidatePath(`/cargos/${cargoId}`);
  revalidatePath(`/departamentos/${leido.data.departamentoId}`);
  if (actual.departamentoId !== leido.data.departamentoId) {
    revalidatePath(`/departamentos/${actual.departamentoId}`);
  }
  redirect(`/cargos/${cargoId}`);
}

export async function eliminarCargoAction(cargoId: string): Promise<void> {
  const actual = await prisma.cargo.findUnique({ where: { id: cargoId } });
  if (!actual) redirect("/empresas");
  await requerirGestionEstructura(actual.empresaId);

  await prisma.cargo.delete({ where: { id: cargoId } });
  revalidatePath(`/departamentos/${actual.departamentoId}`);
  redirect(`/departamentos/${actual.departamentoId}`);
}

/** true si asignar `propuestoJefeId` como jefe de `cargoId` cerraría un
 * ciclo (o sea, `propuestoJefeId` es hoy un descendiente de `cargoId`). El
 * select del organigrama ya excluye esos casos de las opciones, así que esto
 * es defensa en profundidad ante una petición manipulada, no el camino
 * normal de uso. */
async function formariaCiclo(cargoId: string, propuestoJefeId: string): Promise<boolean> {
  let actualId: string | null = propuestoJefeId;
  while (actualId) {
    if (actualId === cargoId) return true;
    const actual: { jefeInmediatoId: string | null } | null = await prisma.cargo.findUnique({
      where: { id: actualId },
      select: { jefeInmediatoId: true },
    });
    actualId = actual?.jefeInmediatoId ?? null;
  }
  return false;
}

/** Reasignación en vivo desde el organigrama — cambia solo el jefe
 * inmediato, sin pasar por el formulario completo de "Editar cargo". */
export async function cambiarJefeInmediatoAction(cargoId: string, formData: FormData): Promise<void> {
  const cargo = await prisma.cargo.findUnique({ where: { id: cargoId } });
  if (!cargo) redirect("/empresas");
  await requerirGestionEstructura(cargo.empresaId);

  const nuevoJefeId = (formData.get("jefeInmediatoId") as string) || null;

  if (nuevoJefeId && (nuevoJefeId === cargoId || (await formariaCiclo(cargoId, nuevoJefeId)))) {
    redirect(`/empresas/${cargo.empresaId}/organigrama`);
  }

  await prisma.cargo.update({ where: { id: cargoId }, data: { jefeInmediatoId: nuevoJefeId } });
  revalidatePath(`/empresas/${cargo.empresaId}/organigrama`);
  revalidatePath(`/departamentos/${cargo.departamentoId}`);
  revalidatePath(`/cargos/${cargoId}`);
  if (cargo.jefeInmediatoId) revalidatePath(`/cargos/${cargo.jefeInmediatoId}`);
  if (nuevoJefeId) revalidatePath(`/cargos/${nuevoJefeId}`);
  redirect(`/empresas/${cargo.empresaId}/organigrama`);
}
