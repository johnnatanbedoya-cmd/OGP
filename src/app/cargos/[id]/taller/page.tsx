import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requerirGestionPerfil } from "@/lib/auth";
import { obtenerUltimoTallerPorBloque } from "@/lib/taller-data";
import { AppHeader } from "@/components/app-header";
import { TallerForm } from "@/components/taller-form";
import { GenerarInvitacionTallerButton } from "@/components/generar-invitacion-taller-button";

export default async function TallerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const cargo = await prisma.cargo.findUnique({
    where: { id },
    include: { trabajadores: { where: { estado: "activo" }, orderBy: { nombres: "asc" } } },
  });
  if (!cargo) notFound();
  const { session } = await requerirGestionPerfil(cargo.empresaId);

  const respuestasPrevias = await obtenerUltimoTallerPorBloque(id);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader nombreUsuario={session.nombre} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <span className="badge badge-cyan mb-2">Taller de campo</span>
        <h1 className="mb-1 font-heading text-[22px] font-bold text-gray-900">{cargo.nombre}</h1>
        <p className="mb-6 text-[13.5px] text-[var(--color-texto-suave)]">
          Preguntas para entrevistar a quien ocupa (o va a ocupar) este cargo, en su propio lenguaje. Las respuestas
          quedan guardadas como referencia para redactar el Perfil — no lo modifican directamente.
        </p>

        {cargo.trabajadores.length > 0 && (
          <div className="card mb-6 p-5">
            <h2 className="mb-1 font-heading text-[14.5px] font-bold text-gray-900">
              O envíaselo para que lo diligencie por su cuenta
            </h2>
            <p className="mb-4 text-[13px] text-[var(--color-texto-suave)]">
              Genera un enlace personal (sin necesidad de cuenta) y compártelo con quien ocupa este cargo. Vence en 7
              días.
            </p>
            <div className="flex flex-col gap-3">
              {cargo.trabajadores.map((t) => (
                <div key={t.id} className="flex flex-col gap-1.5 border-t border-gray-100 pt-3 first:border-0 first:pt-0">
                  <span className="text-[13.5px] font-medium text-gray-800">{t.nombres}</span>
                  <GenerarInvitacionTallerButton
                    trabajadorId={t.id}
                    trabajadorNombre={t.nombres}
                    trabajadorEmail={t.email}
                    cargoNombre={cargo.nombre}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <TallerForm cargoId={cargo.id} respuestasPrevias={respuestasPrevias} />
      </main>
    </div>
  );
}
