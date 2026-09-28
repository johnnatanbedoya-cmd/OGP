import Link from "next/link";
import { requerirAccesoEmpresa } from "@/lib/auth";
import { rutaEmpresaHomePara } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { FuncionComunForm } from "@/components/funcion-comun-form";
import { CompetenciaComunForm } from "@/components/competencia-comun-form";
import { ResponsabilidadSstComunForm } from "@/components/responsabilidad-sst-comun-form";
import { EliminarComunButton } from "@/components/eliminar-comun-button";
import {
  crearFuncionComunAction,
  eliminarFuncionComunAction,
  crearCompetenciaComunAction,
  eliminarCompetenciaComunAction,
  crearResponsabilidadSstComunAction,
  eliminarResponsabilidadSstComunAction,
} from "@/app/actions/comunes";
import { ETIQUETAS_ALCANCE_COMUN, ETIQUETAS_FRECUENCIA_FUNCION, ETIQUETAS_NIVEL_COMPETENCIA, etiqueta } from "@/lib/etiquetas";

export default async function ComunesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, empresa, puedeGestionarEstructura } = await requerirAccesoEmpresa(id);

  if (!puedeGestionarEstructura) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader nombreUsuario={session.nombre} />
        <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
          <p className="text-[13.5px] text-[var(--color-texto-suave)]">
            No tienes permiso para ver esta página.
          </p>
        </main>
      </div>
    );
  }

  const [funcionesComunes, competenciasComunes, responsabilidadesSstComunes] = await Promise.all([
    prisma.funcionComunEmpresa.findMany({ where: { empresaId: id }, orderBy: { createdAt: "asc" } }),
    prisma.competenciaComunEmpresa.findMany({ where: { empresaId: id }, orderBy: { createdAt: "asc" } }),
    prisma.responsabilidadSstComunEmpresa.findMany({ where: { empresaId: id }, orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader nombreUsuario={session.nombre} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <Link href={rutaEmpresaHomePara(session, id)} className="link-quiet mb-4 inline-block">
          ← Volver a {empresa.nombre}
        </Link>

        <h1 className="mb-1 font-heading text-[22px] font-bold text-gray-900">Funciones y competencias comunes</h1>
        <p className="mb-8 text-[13.5px] text-[var(--color-texto-suave)]">
          Defínelas una sola vez aquí — para &quot;todos los cargos&quot; o solo para un nivel jerárquico — y se ofrecen
          automáticamente al crear o revisar el Perfil de cada cargo que corresponda. No se escriben dentro de un
          Taller ni de un cargo puntual, viven a nivel de toda la empresa.
        </p>

        <section className="card mb-10 p-6">
          <h2 className="mb-4 font-heading text-[15px] font-bold text-gray-900">Funciones comunes</h2>
          <FuncionComunForm key={funcionesComunes.length} action={crearFuncionComunAction.bind(null, id)} />

          {funcionesComunes.length > 0 && (
            <div className="mt-6 flex flex-col gap-2 border-t border-[var(--color-borde)] pt-4">
              {funcionesComunes.map((f) => (
                <div key={f.id} className="flex items-start justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
                  <div>
                    <span className="badge badge-slate mb-1">{ETIQUETAS_ALCANCE_COMUN[f.alcance] ?? f.alcance}</span>
                    <p className="text-[13.5px] text-gray-800">
                      {f.descripcion}{" "}
                      <span className="text-[12px] text-[var(--color-texto-suave)]">
                        ({etiqueta(ETIQUETAS_FRECUENCIA_FUNCION, f.frecuencia)})
                      </span>
                    </p>
                    {f.criterioDesempeno && (
                      <p className="mt-0.5 text-[12px] italic text-[var(--color-texto-suave)]">
                        Criterio de desempeño: {f.criterioDesempeno}
                      </p>
                    )}
                  </div>
                  <EliminarComunButton action={eliminarFuncionComunAction} id={f.id} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card mb-10 p-6">
          <h2 className="mb-4 font-heading text-[15px] font-bold text-gray-900">Competencias comunes</h2>
          <CompetenciaComunForm key={competenciasComunes.length} action={crearCompetenciaComunAction.bind(null, id)} />

          {competenciasComunes.length > 0 && (
            <div className="mt-6 flex flex-col gap-2 border-t border-[var(--color-borde)] pt-4">
              {competenciasComunes.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
                  <p className="text-[13.5px] text-gray-800">
                    <span className="badge badge-slate mr-2">{ETIQUETAS_ALCANCE_COMUN[c.alcance] ?? c.alcance}</span>
                    <span className="font-medium">{c.nombre}</span> — nivel{" "}
                    {etiqueta(ETIQUETAS_NIVEL_COMPETENCIA, c.nivelRequerido)}
                  </p>
                  <EliminarComunButton action={eliminarCompetenciaComunAction} id={c.id} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card p-6">
          <h2 className="mb-1 font-heading text-[15px] font-bold text-gray-900">Responsabilidades SST comunes</h2>
          <p className="mb-4 text-[12.5px] text-[var(--color-texto-suave)]">
            Van al numeral &quot;Responsabilidades específicas en el SG-SST&quot; de la ficha de cada cargo — distinto
            de las funciones esenciales del numeral 3.
          </p>
          <ResponsabilidadSstComunForm
            key={responsabilidadesSstComunes.length}
            action={crearResponsabilidadSstComunAction.bind(null, id)}
          />

          {responsabilidadesSstComunes.length > 0 && (
            <div className="mt-6 flex flex-col gap-2 border-t border-[var(--color-borde)] pt-4">
              {responsabilidadesSstComunes.map((r) => (
                <div key={r.id} className="flex items-start justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
                  <p className="text-[13.5px] text-gray-800">
                    <span className="badge badge-slate mr-2">{ETIQUETAS_ALCANCE_COMUN[r.alcance] ?? r.alcance}</span>
                    {r.descripcion}
                  </p>
                  <EliminarComunButton action={eliminarResponsabilidadSstComunAction} id={r.id} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
