import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requerirAccesoEmpresa } from "@/lib/auth";
import { obtenerCargoConPerfil, obtenerVersiones } from "@/lib/perfil-data";
import { AppHeader } from "@/components/app-header";

export default async function VersionesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const cargoBasico = await prisma.cargo.findUnique({ where: { id }, select: { empresaId: true } });
  if (!cargoBasico) notFound();
  const { session } = await requerirAccesoEmpresa(cargoBasico.empresaId);

  const cargo = await obtenerCargoConPerfil(id, cargoBasico.empresaId);
  if (!cargo || !cargo.perfil) notFound();

  const versiones = await obtenerVersiones(cargo.perfil.id, cargoBasico.empresaId);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader nombreUsuario={session.nombre} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <Link href={`/cargos/${cargo.id}`} className="link-quiet mb-4 inline-block">
          ← Volver al cargo
        </Link>
        <h1 className="mb-6 font-heading text-[22px] font-bold text-gray-900">Historial de versiones — {cargo.nombre}</h1>

        <div className="card overflow-hidden">
          {versiones.map((v) => (
            <div key={v.id} className="card-row">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-marca)] font-mono text-[12px] font-bold text-white">
                  {v.numero}
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-gray-900">Versión {v.numero}</p>
                  <p className="text-[12.5px] text-[var(--color-texto-suave)]">
                    {v.autorNombre} ·{" "}
                    {new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(v.createdAt)}
                  </p>
                </div>
              </div>
              {v.motivoCambio && <span className="badge badge-slate">{v.motivoCambio}</span>}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
