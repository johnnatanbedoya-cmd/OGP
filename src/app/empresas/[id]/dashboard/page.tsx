import Link from "next/link";
import { requerirAccesoEmpresa } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { obtenerDatosDashboardEmpresa, type ConteoPorClave } from "@/lib/dashboard-empresa-data";
import {
  ETIQUETAS_NIVEL_ACCESO,
  ETIQUETAS_NIVEL_JERARQUICO,
  ETIQUETAS_JORNADA,
  ETIQUETAS_MODALIDAD_TRABAJO,
  ETIQUETAS_TIPO_VINCULACION,
} from "@/lib/etiquetas";

export default async function DashboardEmpresaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, empresa, esConsultor } = await requerirAccesoEmpresa(id);
  const contexto = session.rol === "empresa" ? ETIQUETAS_NIVEL_ACCESO[empresa.nivelAcceso] : undefined;

  const datos = await obtenerDatosDashboardEmpresa(id);

  const cargosPublicados = await prisma.cargo.findMany({
    where: { empresaId: id, perfil: { estado: "publicado" } },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, departamento: { select: { nombre: true } } },
  });

  const totalCargos = datos.cargos || 1; // evita división por cero en los porcentajes
  const porcentajePublicados = Math.round((datos.perfilesPublicados / totalCargos) * 100);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader nombreUsuario={session.nombre} contexto={contexto} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        {esConsultor && (
          <Link href={`/empresas/${id}`} className="link-quiet mb-4 inline-block">
            ← Volver a la gestión de {empresa.nombre}
          </Link>
        )}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="badge badge-slate mb-2 inline-block">Panel de la empresa</span>
            <h1 className="font-heading text-[26px] font-bold text-gray-900">{empresa.nombre}</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/empresas/${id}/organigrama`} className="btn-secondary">
              Ver organigrama
            </Link>
            {datos.perfilesPublicados > 0 && (
              <a href={`/empresas/${id}/perfiles.zip?formato=pdf`} className="btn-primary">
                Descargar todos los perfiles (PDF)
              </a>
            )}
          </div>
        </div>

        {/* KPIs principales */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Kpi valor={datos.departamentos} etiqueta="Departamentos" />
          <Kpi valor={datos.cargos} etiqueta="Cargos" />
          <Kpi valor={datos.trabajadoresActivos} etiqueta="Trabajadores activos" />
          <Kpi
            valor={datos.perfilesPublicados}
            etiqueta={`Perfiles publicados (${porcentajePublicados}%)`}
            acento
          />
        </div>

        {datos.antiguedadPromedioAnios !== null && (
          <p className="mb-8 text-[13.5px] text-[var(--color-texto-suave)]">
            Antigüedad promedio del equipo: <strong className="text-gray-900">{datos.antiguedadPromedioAnios} años</strong>
          </p>
        )}

        {/* Distribuciones */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TarjetaDistribucion
            titulo="Cargos por nivel jerárquico"
            datos={datos.porNivelJerarquico}
            etiquetas={ETIQUETAS_NIVEL_JERARQUICO}
          />
          <TarjetaDistribucion
            titulo="Perfiles por clase de riesgo ARL"
            datos={datos.porClaseRiesgoArl}
            etiquetas={{}}
            prefijo="Clase "
          />
          <TarjetaDistribucion titulo="Jornada laboral" datos={datos.porJornada} etiquetas={ETIQUETAS_JORNADA} />
          <TarjetaDistribucion
            titulo="Modalidad de trabajo"
            datos={datos.porModalidadTrabajo}
            etiquetas={ETIQUETAS_MODALIDAD_TRABAJO}
          />
          <TarjetaDistribucion
            titulo="Tipo de vinculación"
            datos={datos.porTipoVinculacion}
            etiquetas={ETIQUETAS_TIPO_VINCULACION}
          />
        </div>

        {/* Perfiles publicados, con descarga individual */}
        <h2 className="mb-4 font-heading text-[17px] font-bold text-gray-900">
          Perfiles publicados ({cargosPublicados.length})
        </h2>
        {cargosPublicados.length === 0 ? (
          <div className="card px-6 py-12 text-center text-[var(--color-texto-suave)]">
            Todavía no hay perfiles publicados para consultar.
          </div>
        ) : (
          <div className="card overflow-hidden">
            {cargosPublicados.map((c) => (
              <div key={c.id} className="card-row">
                <div>
                  <p className="text-[14px] font-semibold text-gray-900">{c.nombre}</p>
                  <p className="text-[12.5px] text-[var(--color-texto-suave)]">{c.departamento.nombre}</p>
                </div>
                <a href={`/cargos/${c.id}/pdf`} className="link-quiet text-[13px]">
                  Descargar PDF
                </a>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Kpi({ valor, etiqueta, acento }: { valor: number; etiqueta: string; acento?: boolean }) {
  return (
    <div className="card p-5">
      <p className={`font-mono text-[28px] font-bold ${acento ? "text-[var(--color-marca)]" : "text-gray-900"}`}>{valor}</p>
      <p className="mt-1 text-[12.5px] text-[var(--color-texto-suave)]">{etiqueta}</p>
    </div>
  );
}

function TarjetaDistribucion({
  titulo,
  datos,
  etiquetas,
  prefijo,
}: {
  titulo: string;
  datos: ConteoPorClave[];
  etiquetas: Record<string, string>;
  prefijo?: string;
}) {
  const total = datos.reduce((suma, d) => suma + d.total, 0);
  return (
    <div className="card p-5">
      <h3 className="mb-3 text-[13.5px] font-semibold text-gray-900">{titulo}</h3>
      {datos.length === 0 ? (
        <p className="text-[12.5px] text-[var(--color-texto-suave)]">Sin información registrada.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {datos.map((d) => {
            const porcentaje = total > 0 ? Math.round((d.total / total) * 100) : 0;
            const etiquetaTexto = `${prefijo ?? ""}${etiquetas[d.clave] ?? d.clave}`;
            return (
              <div key={d.clave}>
                <div className="mb-1 flex items-center justify-between text-[12.5px]">
                  <span className="text-gray-700">{etiquetaTexto}</span>
                  <span className="font-mono text-gray-500">{d.total}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-borde)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-marca)]"
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
