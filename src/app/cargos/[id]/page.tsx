import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requerirAccesoEmpresa } from "@/lib/auth";
import { obtenerCargoConPerfil } from "@/lib/perfil-data";
import { AppHeader } from "@/components/app-header";
import { EliminarCargoButton } from "@/components/eliminar-cargo-button";
import { PublicarPerfilButton } from "@/components/publicar-perfil-button";
import {
  ETIQUETAS_NIVEL_JERARQUICO,
  ETIQUETAS_ESTADO_PERFIL,
  ETIQUETAS_FRECUENCIA_FUNCION,
  ETIQUETAS_TIPO_FLUJO,
  ETIQUETAS_TIPO_RIESGO,
  ETIQUETAS_NIVEL_RIESGO,
  ETIQUETAS_TIPO_BARRERA,
  ETIQUETAS_TIPO_COMPETENCIA,
  ETIQUETAS_NIVEL_COMPETENCIA,
  ETIQUETAS_NIVEL_ACCESO,
  ETIQUETAS_MODALIDAD_TRABAJO,
  ETIQUETAS_JORNADA,
  ETIQUETAS_TIPO_VINCULACION,
  ETIQUETAS_NIVEL_AUTONOMIA,
  ETIQUETAS_NIVEL_RECURSO,
  ETIQUETAS_ROL_SST,
  claseBadgeNivelJerarquico,
  claseBadgeEstadoPerfil,
  claseBadgeNivelRiesgo,
  etiqueta,
} from "@/lib/etiquetas";

export default async function CargoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const cargoBasico = await prisma.cargo.findUnique({ where: { id }, select: { empresaId: true } });
  if (!cargoBasico) notFound();
  const { session, empresa, puedeEditarPerfiles, puedeGestionarEstructura } = await requerirAccesoEmpresa(
    cargoBasico.empresaId
  );

  const cargo = await obtenerCargoConPerfil(id, cargoBasico.empresaId);
  if (!cargo) notFound();

  const perfil = cargo.perfil;
  const contexto = session.rol === "empresa" ? ETIQUETAS_NIVEL_ACCESO[empresa.nivelAcceso] : undefined;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader nombreUsuario={session.nombre} contexto={contexto} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <Link href={`/departamentos/${cargo.departamentoId}`} className="link-quiet mb-4 inline-block">
          ← Volver a {cargo.departamento.nombre}
        </Link>

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className={`badge ${claseBadgeNivelJerarquico(cargo.nivelJerarquico)}`}>
                {etiqueta(ETIQUETAS_NIVEL_JERARQUICO, cargo.nivelJerarquico)}
              </span>
              {perfil && (
                <span className={`badge ${claseBadgeEstadoPerfil(perfil.estado)}`}>
                  {etiqueta(ETIQUETAS_ESTADO_PERFIL, perfil.estado)}
                </span>
              )}
            </div>
            <h1 className="font-heading text-[24px] font-bold text-gray-900">{cargo.nombre}</h1>
            <p className="text-[13.5px] text-[var(--color-texto-suave)]">
              {cargo.codigo && <>Código {cargo.codigo} · </>}
              {cargo.departamento.nombre}
              {cargo.jefeInmediato && <> · Reporta a {cargo.jefeInmediato.nombre}</>}
            </p>
            {cargo.subordinados.length > 0 && (
              <p className="text-[13.5px] text-[var(--color-texto-suave)]">
                {cargo.subordinados.length === 1 ? "1 persona a cargo" : `${cargo.subordinados.length} personas a cargo`}:{" "}
                {cargo.subordinados.map((s) => s.nombre).join(", ")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {perfil && (
              <>
                <a href={`/cargos/${cargo.id}/pdf`} className="link-quiet">
                  PDF
                </a>
                <a href={`/cargos/${cargo.id}/word`} className="link-quiet">
                  Word
                </a>
                <Link href={`/cargos/${cargo.id}/versiones`} className="link-quiet">
                  Historial
                </Link>
              </>
            )}
            {puedeEditarPerfiles && (
              <Link href={`/cargos/${cargo.id}/taller`} className="link-quiet">
                Taller
              </Link>
            )}
            {puedeGestionarEstructura && (
              <>
                <Link href={`/cargos/${cargo.id}/editar`} className="link-quiet">
                  Editar cargo
                </Link>
                <EliminarCargoButton cargoId={cargo.id} />
              </>
            )}
          </div>
        </div>

        {!perfil ? (
          <div className="card px-6 py-16 text-center">
            <p className="mb-4 text-[var(--color-texto-suave)]">Este cargo todavía no tiene un perfil ocupacional.</p>
            {puedeEditarPerfiles && (
              <div className="flex items-center justify-center gap-4">
                <Link href={`/cargos/${cargo.id}/perfil/editar`} className="btn-primary">
                  Completar perfil
                </Link>
                <Link href={`/cargos/${cargo.id}/taller`} className="link-quiet">
                  o aplicar un taller primero
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="card flex items-center justify-between px-5 py-3.5">
              <span className="text-[13.5px] text-gray-600">
                Estado: <strong>{etiqueta(ETIQUETAS_ESTADO_PERFIL, perfil.estado)}</strong>
              </span>
              {puedeEditarPerfiles && (
                <div className="flex items-center gap-3">
                  <Link href={`/cargos/${cargo.id}/perfil/editar`} className="link-quiet">
                    Editar perfil
                  </Link>
                  {perfil.estado !== "publicado" && <PublicarPerfilButton cargoId={cargo.id} />}
                </div>
              )}
            </div>

            <Bloque numero={1} titulo="Identificación y propósito">
              <Dato etiqueta="Razón de ser del cargo" valor={perfil.razonSer} />
              <Dato etiqueta="Criticidad si el cargo no existiera" valor={perfil.criticidadAusencia} />
              <Dato etiqueta="Número de puestos" valor={perfil.numeroPuestos != null ? String(perfil.numeroPuestos) : null} />
              <Dato etiqueta="Sede" valor={perfil.sede} />
              <Dato etiqueta="Modalidad de trabajo" valor={etiqueta(ETIQUETAS_MODALIDAD_TRABAJO, perfil.modalidadTrabajo)} />
              <Dato etiqueta="Jornada" valor={etiqueta(ETIQUETAS_JORNADA, perfil.jornada)} />
              <Dato etiqueta="Clase de riesgo ARL" valor={perfil.claseRiesgoArl ? `Clase ${perfil.claseRiesgoArl}` : null} />
              <Dato etiqueta="Tipo de vinculación" valor={etiqueta(ETIQUETAS_TIPO_VINCULACION, perfil.tipoVinculacion)} />
            </Bloque>

            <Bloque numero={2} titulo="Funciones esenciales">
              {perfil.funciones.length === 0 ? (
                <SinDatos />
              ) : (
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-[14px] text-gray-800">
                  {perfil.funciones.map((f) => (
                    <li key={f.id}>
                      {f.descripcion}{" "}
                      <span className="text-[12px] text-[var(--color-texto-suave)]">
                        ({etiqueta(ETIQUETAS_FRECUENCIA_FUNCION, f.frecuencia)}
                        {f.porcentajeTiempo != null ? ` · ${f.porcentajeTiempo}% del tiempo` : ""})
                      </span>
                      {f.criterioDesempeno && (
                        <p className="mt-0.5 text-[12.5px] italic text-[var(--color-texto-suave)]">
                          Criterio de desempeño: {f.criterioDesempeno}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </Bloque>

            <Bloque numero={3} titulo="Flujos de trabajo e interdependencias">
              <Dato etiqueta="Participación en comités" valor={perfil.participacionComites} />
              {perfil.flujos.length === 0 ? (
                <SinDatos />
              ) : (
                <ul className="mt-2 space-y-1.5 text-[14px] text-gray-800">
                  {perfil.flujos.map((f) => (
                    <li key={f.id}>
                      <span className={`badge ${f.tipo === "insumo" ? "badge-cyan" : "badge-indigo"} mr-1.5`}>
                        {etiqueta(ETIQUETAS_TIPO_FLUJO, f.tipo)}
                      </span>{" "}
                      {f.descripcion}
                      {(f.contraparteCargo || f.contraparte) && (
                        <span className="text-[var(--color-texto-suave)]"> — {f.contraparteCargo?.nombre ?? f.contraparte}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Bloque>

            <Bloque numero={4} titulo="Autoridad y toma de decisiones">
              <Dato etiqueta="Nivel de autonomía y toma de decisiones" valor={perfil.autonomiaDecision} />
              {perfil.decisiones.length === 0 ? (
                <SinDatos />
              ) : (
                <ul className="mt-2 space-y-1.5 text-[14px] text-gray-800">
                  {perfil.decisiones.map((d) => (
                    <li key={d.id}>
                      {d.descripcion}{" "}
                      <span className="text-[12px] text-[var(--color-texto-suave)]">
                        ({etiqueta(ETIQUETAS_NIVEL_AUTONOMIA, d.nivelAutonomia)})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Bloque>

            <Bloque numero={5} titulo="Responsabilidad por recursos a cargo">
              <RecursoDato titulo="Personas" nivel={perfil.recursoPersonasNivel} descripcion={perfil.recursoPersonasDescripcion} />
              <RecursoDato titulo="Dinero" nivel={perfil.recursoDineroNivel} descripcion={perfil.recursoDineroDescripcion} />
              <RecursoDato titulo="Equipos" nivel={perfil.recursoEquiposNivel} descripcion={perfil.recursoEquiposDescripcion} />
              <RecursoDato titulo="Información confidencial" nivel={perfil.recursoInfoConfidencialNivel} descripcion={perfil.recursoInfoConfidencialDescripcion} />
              <RecursoDato titulo="Materiales" nivel={perfil.recursoMaterialesNivel} descripcion={perfil.recursoMaterialesDescripcion} />
              {!perfil.recursoPersonasNivel &&
                !perfil.recursoDineroNivel &&
                !perfil.recursoEquiposNivel &&
                !perfil.recursoInfoConfidencialNivel &&
                !perfil.recursoMaterialesNivel && <SinDatos />}
            </Bloque>

            <Bloque numero={6} titulo="Seguridad y salud en el trabajo (SST)">
              <Dato etiqueta="EPP requerido" valor={perfil.eppRequerido} />
              <Dato etiqueta="Protocolos de reporte / emergencia" valor={perfil.protocolosEmergencia} />
              {perfil.rolesSst.length > 0 && (
                <p className="mb-2 flex flex-wrap gap-1.5">
                  {perfil.rolesSst.map((r) => (
                    <span key={r} className="badge badge-cyan mr-1">
                      {etiqueta(ETIQUETAS_ROL_SST, r)}
                    </span>
                  )).flatMap((nodo, i) => (i > 0 ? [" ", nodo] : [nodo]))}
                </p>
              )}
              {perfil.responsabilidadesSst.length > 0 && (
                <ul className="mb-2 list-disc space-y-1 pl-5 text-[14px] text-gray-800">
                  {perfil.responsabilidadesSst.map((r) => (
                    <li key={r.id}>{r.descripcion}</li>
                  ))}
                </ul>
              )}
              <Dato etiqueta="Evaluación médica preocupacional" valor={perfil.evaluacionPreocupacional} />
              <Dato etiqueta="Evaluación médica periódica" valor={perfil.evaluacionPeriodica} />
              <Dato etiqueta="Evaluación médica post-incapacidad" valor={perfil.evaluacionPostIncapacidad} />
              <Dato etiqueta="Evaluación médica de egreso" valor={perfil.evaluacionEgreso} />
              {perfil.riesgos.length === 0 ? (
                <SinDatos />
              ) : (
                <ul className="mt-2 space-y-1.5 text-[14px] text-gray-800">
                  {perfil.riesgos.map((r) => (
                    <li key={r.id}>
                      <span className={`badge ${claseBadgeNivelRiesgo(r.nivel)} mr-1.5`}>
                        {etiqueta(ETIQUETAS_NIVEL_RIESGO, r.nivel)}
                      </span>{" "}
                      <span className="font-medium">{etiqueta(ETIQUETAS_TIPO_RIESGO, r.tipo)}:</span> {r.descripcion}
                      {(r.controlesExistentes || r.eppRequerido) && (
                        <p className="mt-0.5 text-[12.5px] italic text-[var(--color-texto-suave)]">
                          {r.controlesExistentes && <>Controles: {r.controlesExistentes}. </>}
                          {r.eppRequerido && <>EPP: {r.eppRequerido}</>}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Bloque>

            <Bloque numero={7} titulo="Inclusión laboral y ajustes razonables">
              {perfil.ajustes.length === 0 ? (
                <SinDatos />
              ) : (
                <ul className="space-y-1.5 text-[14px] text-gray-800">
                  {perfil.ajustes.map((a) => (
                    <li key={a.id}>
                      <span className="font-medium">{etiqueta(ETIQUETAS_TIPO_BARRERA, a.tipoBarrera)}:</span>{" "}
                      {a.descripcionBarrera} — <span className="text-[var(--color-texto-suave)]">{a.apoyoSugerido}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Bloque>

            <Bloque numero={8} titulo="Responsabilidades en otros sistemas de gestión">
              <Dato etiqueta="Calidad" valor={perfil.respSistemaCalidad} />
              <Dato etiqueta="Ambiental" valor={perfil.respSistemaAmbiental} />
              <Dato etiqueta="Seguridad vial (PESV)" valor={perfil.respSistemaSeguridadVial} />
              <Dato etiqueta="Seguridad de la información" valor={perfil.respSistemaSeguridadInformacion} />
              <Dato etiqueta="SAGRILAFT" valor={perfil.respSistemaSagrilaft} />
            </Bloque>

            <Bloque numero={9} titulo="Requisitos del cargo">
              <Dato etiqueta="Educación formal" valor={perfil.requisitoEducacionFormal} />
              <Dato etiqueta="Tarjeta profesional" valor={perfil.requisitoTarjetaProfesional} />
              <Dato etiqueta="Formación complementaria" valor={perfil.requisitoFormacionComplementaria} />
              <Dato etiqueta="Certificaciones" valor={perfil.requisitoCertificaciones} />
              <Dato etiqueta="Experiencia general" valor={perfil.requisitoExperienciaGeneral} />
              <Dato etiqueta="Experiencia específica" valor={perfil.requisitoExperienciaEspecifica} />
              <Dato etiqueta="Equivalencias" valor={perfil.requisitoEquivalencias} />
              <Dato etiqueta="Otros requisitos" valor={perfil.requisitoOtros} />
            </Bloque>

            <Bloque numero={10} titulo="Dotación, equipos y herramientas">
              <Dato etiqueta="Dotación" valor={perfil.dotacion} />
              <Dato etiqueta="Equipos y herramientas" valor={perfil.equiposHerramientas} />
            </Bloque>

            <Bloque numero={11} titulo="Competencias">
              {perfil.competencias.length === 0 ? (
                <SinDatos />
              ) : (
                <ul className="space-y-1.5 text-[14px] text-gray-800">
                  {perfil.competencias.map((c) => (
                    <li key={c.id}>
                      <span className="font-medium">{c.nombre}</span> — {etiqueta(ETIQUETAS_TIPO_COMPETENCIA, c.tipo)},
                      nivel {etiqueta(ETIQUETAS_NIVEL_COMPETENCIA, c.nivelRequerido)}
                    </li>
                  ))}
                </ul>
              )}
            </Bloque>

            <Bloque numero={12} titulo="Indicadores de desempeño">
              {perfil.indicadores.length === 0 ? (
                <SinDatos />
              ) : (
                <ul className="space-y-1.5 text-[14px] text-gray-800">
                  {perfil.indicadores.map((i) => (
                    <li key={i.id}>
                      <span className="font-medium">{i.nombre}</span>
                      {i.formula && <> — {i.formula}</>}
                      {i.meta && <> · Meta: {i.meta}</>}
                      {i.frecuencia && <> · {i.frecuencia}</>}
                    </li>
                  ))}
                </ul>
              )}
            </Bloque>

            {(perfil.evidenciaProducto || perfil.evidenciaDesempeno || perfil.evidenciaConocimiento) && (
              <Bloque numero={13} titulo="Evidencias">
                <Dato etiqueta="De producto" valor={perfil.evidenciaProducto} />
                <Dato etiqueta="De desempeño" valor={perfil.evidenciaDesempeno} />
                <Dato etiqueta="De conocimiento" valor={perfil.evidenciaConocimiento} />
              </Bloque>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function Bloque({ numero, titulo, children }: { numero: number; titulo: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-marca)] text-[11px] font-bold text-white">
          {numero}
        </span>
        <h2 className="font-heading text-[15px] font-bold text-gray-900">{titulo}</h2>
      </div>
      <div className="pl-[34px]">{children}</div>
    </section>
  );
}

function Dato({ etiqueta: nombre, valor }: { etiqueta: string; valor: string | null }) {
  if (!valor || valor === "—") return null;
  return (
    <p className="mb-2 text-[14px] text-gray-800">
      <span className="font-medium">{nombre}:</span> {valor}
    </p>
  );
}

function RecursoDato({ titulo, nivel, descripcion }: { titulo: string; nivel: string | null; descripcion: string | null }) {
  if (!nivel && !descripcion) return null;
  return (
    <p className="mb-2 text-[14px] text-gray-800">
      <span className="font-medium">{titulo}:</span> {etiqueta(ETIQUETAS_NIVEL_RECURSO, nivel)}
      {descripcion && <> — {descripcion}</>}
    </p>
  );
}

function SinDatos() {
  return <p className="text-[13.5px] text-[var(--color-texto-suave)]">Sin información registrada.</p>;
}
