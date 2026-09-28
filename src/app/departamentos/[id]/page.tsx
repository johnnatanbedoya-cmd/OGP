import Link from "next/link";
import { notFound } from "next/navigation";
import { requerirAccesoEmpresa } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { DepartamentoForm } from "@/components/departamento-form";
import { EliminarDepartamentoButton } from "@/components/eliminar-departamento-button";
import { actualizarDepartamentoAction } from "@/app/actions/departamentos";
import {
  ETIQUETAS_NIVEL_JERARQUICO,
  ETIQUETAS_ESTADO_PERFIL,
  ETIQUETAS_NIVEL_ACCESO,
  claseBadgeNivelJerarquico,
  claseBadgeEstadoPerfil,
  etiqueta,
} from "@/lib/etiquetas";

export default async function DepartamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const departamentoBasico = await prisma.departamento.findUnique({ where: { id }, select: { empresaId: true } });
  if (!departamentoBasico) notFound();
  const { session, empresa, puedeGestionarEstructura } = await requerirAccesoEmpresa(departamentoBasico.empresaId);
  const contexto = session.rol === "empresa" ? ETIQUETAS_NIVEL_ACCESO[empresa.nivelAcceso] : undefined;

  const departamento = await prisma.departamento.findUnique({
    where: { id },
    include: {
      cargos: {
        orderBy: { nombre: "asc" },
        include: { perfil: { select: { estado: true } }, jefeInmediato: { select: { nombre: true } } },
      },
    },
  });
  if (!departamento) notFound();

  // Cuando hay más de un cargo con el mismo nombre en el departamento (ej.
  // dos "Auxiliar de Nómina" con funciones distintas), se distingue
  // mostrando quién es su jefe inmediato debajo del nombre.
  const conteoNombres = new Map<string, number>();
  for (const c of departamento.cargos) {
    conteoNombres.set(c.nombre, (conteoNombres.get(c.nombre) ?? 0) + 1);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader nombreUsuario={session.nombre} contexto={contexto} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <Link href={`/empresas/${empresa.id}`} className="link-quiet mb-4 inline-block">
          ← Volver a {empresa.nombre}
        </Link>

        {puedeGestionarEstructura ? (
          <div className="card mb-8 p-6">
            <h1 className="mb-4 font-heading text-[17px] font-bold text-gray-900">Editar departamento</h1>
            <DepartamentoForm
              action={actualizarDepartamentoAction.bind(null, departamento.id)}
              valoresIniciales={{ nombre: departamento.nombre, descripcion: departamento.descripcion ?? "" }}
              etiquetaEnvio="Guardar cambios"
            />
            <div className="mt-4 border-t border-[var(--color-borde)] pt-4">
              <EliminarDepartamentoButton departamentoId={departamento.id} />
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <h1 className="font-heading text-[22px] font-bold text-gray-900">{departamento.nombre}</h1>
            {departamento.descripcion && (
              <p className="mt-1 text-[13.5px] text-[var(--color-texto-suave)]">{departamento.descripcion}</p>
            )}
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-[18px] font-bold text-gray-900">Cargos ({departamento.cargos.length})</h2>
          {puedeGestionarEstructura && (
            <Link href={`/cargos/nuevo?empresaId=${empresa.id}&departamentoId=${departamento.id}`} className="btn-primary">
              + Nuevo cargo
            </Link>
          )}
        </div>

        {departamento.cargos.length === 0 ? (
          <div className="card px-6 py-16 text-center text-[var(--color-texto-suave)]">
            Este departamento todavía no tiene cargos.
          </div>
        ) : (
          <div className="card overflow-hidden">
            {departamento.cargos.map((c) => (
              <Link key={c.id} href={`/cargos/${c.id}`} className="card-row">
                <div>
                  <p className="text-[14.5px] font-semibold text-gray-900">{c.nombre}</p>
                  {(conteoNombres.get(c.nombre) ?? 0) > 1 && (
                    <p className="text-[12px] text-[var(--color-texto-suave)]">
                      {c.jefeInmediato ? `Reporta a ${c.jefeInmediato.nombre}` : "Sin jefe inmediato asignado"}
                    </p>
                  )}
                  <span className={`badge ${claseBadgeNivelJerarquico(c.nivelJerarquico)} mt-1`}>
                    {etiqueta(ETIQUETAS_NIVEL_JERARQUICO, c.nivelJerarquico)}
                  </span>
                </div>
                <span className={`badge ${c.perfil ? claseBadgeEstadoPerfil(c.perfil.estado) : "badge-slate"}`}>
                  {c.perfil ? etiqueta(ETIQUETAS_ESTADO_PERFIL, c.perfil.estado) : "Sin perfil"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
