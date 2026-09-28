import Link from "next/link";
import { requerirAccesoEmpresa } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { DepartamentoForm } from "@/components/departamento-form";
import { EditarEmpresaForm } from "@/components/editar-empresa-form";
import { ResetearPasswordForm } from "@/components/resetear-password-form";
import { EliminarEmpresaButton } from "@/components/eliminar-empresa-button";
import { crearDepartamentoAction } from "@/app/actions/departamentos";
import {
  ETIQUETAS_ESTADO_PERFIL,
  ETIQUETAS_NIVEL_ACCESO,
  claseBadgeNivelJerarquico,
  claseBadgeNivelAcceso,
  etiqueta,
} from "@/lib/etiquetas";

export default async function EmpresaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, empresa, esConsultor, puedeGestionarEstructura } = await requerirAccesoEmpresa(id);
  const contexto = esConsultor ? undefined : ETIQUETAS_NIVEL_ACCESO[empresa.nivelAcceso] ?? empresa.nivelAcceso;

  const departamentos = await prisma.departamento.findMany({
    where: { empresaId: id },
    orderBy: { nombre: "asc" },
    include: { cargos: { select: { id: true, nombre: true, nivelJerarquico: true, perfil: { select: { estado: true } } } } },
  });

  const perfilesPublicados = departamentos
    .flatMap((d) => d.cargos)
    .filter((c) => c.perfil?.estado === "publicado").length;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader nombreUsuario={session.nombre} contexto={contexto} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        {esConsultor && (
          <Link href="/empresas" className="link-quiet mb-4 inline-block">
            ← Volver a empresas
          </Link>
        )}

        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className={`badge ${claseBadgeNivelAcceso(empresa.nivelAcceso)}`}>
            {ETIQUETAS_NIVEL_ACCESO[empresa.nivelAcceso] ?? empresa.nivelAcceso}
          </span>
        </div>
        <h1 className="mb-4 font-heading text-[24px] font-bold text-gray-900">{empresa.nombre}</h1>

        <div className="mb-8 flex flex-wrap gap-3">
          <Link href={`/empresas/${id}/organigrama`} className="btn-secondary">
            Ver organigrama
          </Link>
          <Link href={`/empresas/${id}/trabajadores`} className="btn-secondary">
            Trabajadores
          </Link>
          {puedeGestionarEstructura && (
            <Link href={`/empresas/${id}/comunes`} className="btn-secondary">
              Funciones y competencias comunes
            </Link>
          )}
          {perfilesPublicados > 0 && (
            <a href={`/empresas/${id}/perfiles.zip`} className="btn-secondary">
              Descargar todos los perfiles (.zip)
            </a>
          )}
        </div>

        {esConsultor && (
          <div className="card mb-8 p-6">
            <h2 className="mb-4 font-heading text-[15px] font-bold text-gray-900">Administrar empresa</h2>
            <EditarEmpresaForm empresaId={empresa.id} nombreInicial={empresa.nombre} nivelAccesoInicial={empresa.nivelAcceso} />
            <div className="mt-5 flex items-center gap-4 border-t border-[var(--color-borde)] pt-4">
              <ResetearPasswordForm empresaId={empresa.id} />
              <EliminarEmpresaButton empresaId={empresa.id} />
            </div>
          </div>
        )}

        {puedeGestionarEstructura && (
          <div className="card mb-8 p-6">
            <h2 className="mb-4 text-[14.5px] font-semibold text-gray-900">Nuevo departamento</h2>
            <DepartamentoForm action={crearDepartamentoAction.bind(null, id)} />
          </div>
        )}

        <h2 className="mb-4 font-heading text-[18px] font-bold text-gray-900">Departamentos ({departamentos.length})</h2>

        {departamentos.length === 0 ? (
          <div className="card px-6 py-16 text-center text-[var(--color-texto-suave)]">
            Esta empresa todavía no tiene departamentos.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {departamentos.map((d) => (
              <Link key={d.id} href={`/departamentos/${d.id}`} className="card block p-5 hover:bg-gray-50">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-heading text-[15px] font-bold text-gray-900">{d.nombre}</p>
                  <span className="badge badge-cyan">
                    {d.cargos.length} {d.cargos.length === 1 ? "cargo" : "cargos"}
                  </span>
                </div>
                {d.cargos.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {d.cargos.map((c) => (
                      <span key={c.id} className={`badge ${claseBadgeNivelJerarquico(c.nivelJerarquico)}`}>
                        {c.nombre} · {c.perfil ? etiqueta(ETIQUETAS_ESTADO_PERFIL, c.perfil.estado) : "Sin perfil"}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
