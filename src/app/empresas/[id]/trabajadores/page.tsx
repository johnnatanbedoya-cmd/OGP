import Link from "next/link";
import { requerirAccesoEmpresa } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { ImportarTrabajadoresForm } from "@/components/importar-trabajadores-form";
import { EliminarTrabajadorButton } from "@/components/eliminar-trabajador-button";
import { EnviarTallerMasivoButton } from "@/components/enviar-taller-masivo-button";
import { ETIQUETAS_NIVEL_ACCESO, etiqueta } from "@/lib/etiquetas";

export default async function TrabajadoresPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, empresa, puedeGestionarEstructura, puedeEditarPerfiles } = await requerirAccesoEmpresa(id);
  const contexto = session.rol === "empresa" ? ETIQUETAS_NIVEL_ACCESO[empresa.nivelAcceso] : undefined;

  const trabajadores = await prisma.trabajador.findMany({
    where: { empresaId: id },
    orderBy: { nombres: "asc" },
    include: { cargo: { select: { nombre: true, departamento: { select: { nombre: true } } } } },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader nombreUsuario={session.nombre} contexto={contexto} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <Link href={`/empresas/${id}`} className="link-quiet mb-4 inline-block">
          ← Volver a {empresa.nombre}
        </Link>
        <h1 className="mb-8 font-heading text-[24px] font-bold text-gray-900">Trabajadores</h1>

        {puedeGestionarEstructura && (
          <div className="card mb-8 p-6">
            <h2 className="mb-3 text-[14.5px] font-semibold text-gray-900">Cargar trabajadores</h2>
            <ImportarTrabajadoresForm empresaId={id} />
          </div>
        )}

        {puedeEditarPerfiles && trabajadores.length > 0 && (
          <div className="card mb-8 p-6">
            <h2 className="mb-1 text-[14.5px] font-semibold text-gray-900">Taller de campo</h2>
            <p className="mb-3 text-[12.5px] text-[var(--color-texto-suave)]">
              Envía por correo el enlace de autoservicio a todos los trabajadores activos que todavía no lo hayan
              completado — los que no tengan correo registrado quedan por fuera.
            </p>
            <EnviarTallerMasivoButton empresaId={id} />
          </div>
        )}

        {trabajadores.length === 0 ? (
          <div className="card px-6 py-16 text-center text-[var(--color-texto-suave)]">
            Esta empresa todavía no tiene trabajadores cargados.
          </div>
        ) : (
          <div className="card overflow-hidden">
            {trabajadores.map((t) => (
              <div key={t.id} className="card-row">
                <div>
                  <p className="text-[14.5px] font-semibold text-gray-900">{t.nombres}</p>
                  <p className="text-[13px] text-[var(--color-texto-suave)]">
                    {t.documento} · {t.cargo.nombre} · {t.cargo.departamento.nombre}
                  </p>
                  <p className="text-[13px] text-[var(--color-texto-suave)]">
                    {t.email ?? <span className="text-amber-700">Sin correo — no se le puede enviar el taller</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${t.estado === "activo" ? "badge-emerald" : "badge-slate"}`}>
                    {etiqueta({ activo: "Activo", inactivo: "Inactivo" }, t.estado)}
                  </span>
                  {puedeGestionarEstructura && <EliminarTrabajadorButton trabajadorId={t.id} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
