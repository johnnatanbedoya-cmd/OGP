import { notFound } from "next/navigation";
import { requerirGestionEstructura } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { CargoForm } from "@/components/cargo-form";
import { actualizarCargoAction } from "@/app/actions/cargos";
import { rangoNivelJerarquico } from "@/lib/validaciones";

export default async function EditarCargoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const cargo = await prisma.cargo.findUnique({ where: { id } });
  if (!cargo) notFound();
  const { session } = await requerirGestionEstructura(cargo.empresaId);

  const [departamentos, cargosExistentes] = await Promise.all([
    prisma.departamento.findMany({ where: { empresaId: cargo.empresaId }, orderBy: { nombre: "asc" } }),
    prisma.cargo.findMany({
      where: { empresaId: cargo.empresaId, id: { not: cargo.id } },
      select: { id: true, nombre: true, nivelJerarquico: true },
    }),
  ]);
  const posiblesJefes = [...cargosExistentes].sort(
    (a, b) => rangoNivelJerarquico(a.nivelJerarquico) - rangoNivelJerarquico(b.nivelJerarquico)
  );

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader nombreUsuario={session.nombre} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <h1 className="mb-6 font-heading text-[22px] font-bold text-gray-900">Editar cargo</h1>
        <CargoForm
          action={actualizarCargoAction.bind(null, cargo.id)}
          departamentos={departamentos}
          posiblesJefes={posiblesJefes}
          valoresIniciales={{
            nombre: cargo.nombre,
            codigo: cargo.codigo ?? "",
            departamentoId: cargo.departamentoId,
            nivelJerarquico: cargo.nivelJerarquico ?? "",
            jefeInmediatoId: cargo.jefeInmediatoId ?? "",
          }}
          etiquetaEnvio="Guardar cambios"
        />
      </main>
    </div>
  );
}
