import { redirect } from "next/navigation";
import { requerirGestionEstructura } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { CargoForm } from "@/components/cargo-form";
import { crearCargoAction } from "@/app/actions/cargos";
import { rangoNivelJerarquico } from "@/lib/validaciones";
import { NOMBRE_CARGO_JUNTA_DIRECTIVA } from "@/lib/estructura-inicial";

export default async function NuevoCargoPage({
  searchParams,
}: {
  searchParams: Promise<{ empresaId?: string; departamentoId?: string }>;
}) {
  const { empresaId, departamentoId } = await searchParams;
  if (!empresaId) redirect("/empresas");

  const { session } = await requerirGestionEstructura(empresaId);

  const [departamentos, cargosExistentes] = await Promise.all([
    prisma.departamento.findMany({ where: { empresaId }, orderBy: { nombre: "asc" } }),
    prisma.cargo.findMany({ where: { empresaId }, select: { id: true, nombre: true, nivelJerarquico: true } }),
  ]);

  if (departamentos.length === 0) redirect(`/empresas/${empresaId}`);

  // Los cargos de mayor rango primero — más fácil elegir el jefe correcto.
  const posiblesJefes = [...cargosExistentes].sort(
    (a, b) => rangoNivelJerarquico(a.nivelJerarquico) - rangoNivelJerarquico(b.nivelJerarquico)
  );
  // Sugerencia por defecto: "Junta Directiva" si ya existe (la crea
  // automáticamente cada empresa nueva) — evita que los cargos nazcan
  // huérfanos y guía a construir el organigrama de arriba hacia abajo.
  const juntaDirectiva = cargosExistentes.find((c) => c.nombre === NOMBRE_CARGO_JUNTA_DIRECTIVA);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader nombreUsuario={session.nombre} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <h1 className="mb-1.5 font-heading text-[22px] font-bold text-gray-900">Nuevo cargo</h1>
        <p className="mb-6 text-[13px] text-[var(--color-texto-suave)]">
          Para que el organigrama tenga sentido, crea primero los cargos de mayor nivel (ya tienes &ldquo;Junta
          Directiva&rdquo; por defecto) y ve bajando: Gerencia/Dirección → Coordinación → cargos técnicos y operativos.
        </p>
        <CargoForm
          action={crearCargoAction.bind(null, empresaId)}
          departamentos={departamentos}
          posiblesJefes={posiblesJefes}
          valoresIniciales={{
            nombre: "",
            codigo: "",
            departamentoId: departamentoId ?? departamentos[0].id,
            nivelJerarquico: "",
            jefeInmediatoId: juntaDirectiva?.id ?? "",
          }}
        />
      </main>
    </div>
  );
}
