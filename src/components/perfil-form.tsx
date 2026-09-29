"use client";

import { useActionState, useId, useRef, useState } from "react";
import { Plus, Trash2, Sparkles } from "lucide-react";
import type { PerfilState } from "@/app/actions/perfiles";
import {
  FRECUENCIAS_FUNCION,
  TIPOS_FLUJO,
  TIPOS_RIESGO,
  NIVELES_RIESGO,
  TIPOS_BARRERA,
  TIPOS_COMPETENCIA,
  NIVELES_COMPETENCIA,
  MODALIDADES_TRABAJO,
  JORNADAS,
  CLASES_RIESGO_ARL,
  TIPOS_VINCULACION,
  NIVELES_AUTONOMIA,
  NIVELES_RECURSO,
  ROLES_SST,
} from "@/lib/validaciones";
import { competenciasSugeridasPara } from "@/lib/competencias-comportamentales";
import { type PerfilDefaultValues, perfilVacio } from "@/lib/perfil-defaults";
import {
  ETIQUETAS_FRECUENCIA_FUNCION,
  ETIQUETAS_TIPO_FLUJO,
  ETIQUETAS_TIPO_RIESGO,
  ETIQUETAS_NIVEL_RIESGO,
  ETIQUETAS_TIPO_BARRERA,
  ETIQUETAS_TIPO_COMPETENCIA,
  ETIQUETAS_NIVEL_COMPETENCIA,
  ETIQUETAS_MODALIDAD_TRABAJO,
  ETIQUETAS_JORNADA,
  ETIQUETAS_TIPO_VINCULACION,
  ETIQUETAS_NIVEL_AUTONOMIA,
  ETIQUETAS_NIVEL_RECURSO,
  ETIQUETAS_ROL_SST,
} from "@/lib/etiquetas";

type FormAction = (prevState: PerfilState, formData: FormData) => Promise<PerfilState>;

export type { PerfilDefaultValues };

function useFilas<T>(inicial: T[]) {
  const [filas, setFilas] = useState(() => inicial.map((valor) => ({ id: crypto.randomUUID(), valor })));
  return {
    filas,
    agregar: (valor: T) => setFilas((f) => [...f, { id: crypto.randomUUID(), valor }]),
    quitar: (id: string) => setFilas((f) => f.filter((fila) => fila.id !== id)),
  };
}

function BotonQuitar({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Quitar fila"
      className="rounded-md p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
    >
      <Trash2 size={16} />
    </button>
  );
}

function BotonAgregar({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-1 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--color-marca)] hover:text-[var(--color-marca-suave)]"
    >
      <Plus size={15} /> {children}
    </button>
  );
}

function Campo({
  id,
  label,
  defaultValue,
  placeholder,
  rows = 2,
}: {
  id: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="label-field" htmlFor={id}>
        {label}
      </label>
      <textarea id={id} name={id} rows={rows} defaultValue={defaultValue} className="input-field" placeholder={placeholder} />
    </div>
  );
}

function RecursoFila({
  titulo,
  nivelId,
  nivelDefault,
  descripcionId,
  descripcionDefault,
}: {
  titulo: string;
  nivelId: string;
  nivelDefault: string;
  descripcionId: string;
  descripcionDefault: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-2.5 w-32 shrink-0 text-[13.5px] font-medium text-gray-700">{titulo}</span>
      <select name={nivelId} defaultValue={nivelDefault} className="input-field sm:w-32">
        <option value="">Sin definir</option>
        {NIVELES_RECURSO.map((v) => (
          <option key={v} value={v}>
            {ETIQUETAS_NIVEL_RECURSO[v]}
          </option>
        ))}
      </select>
      <input
        name={descripcionId}
        defaultValue={descripcionDefault}
        className="input-field"
        placeholder="Descripción del recurso a cargo"
      />
    </div>
  );
}

export function PerfilForm({
  action,
  otrosCargos,
  valoresIniciales = perfilVacio,
  nivelJerarquico = null,
  funcionesComunes = [],
  competenciasComunes = [],
  responsabilidadesSstComunes = [],
  catalogoCompetencias = [],
  sugerenciaNumeroPuestos,
}: {
  action: FormAction;
  otrosCargos: { id: string; nombre: string }[];
  valoresIniciales?: PerfilDefaultValues;
  nivelJerarquico?: string | null;
  funcionesComunes?: { descripcion: string; frecuencia: string; criterioDesempeno: string }[];
  competenciasComunes?: { nombre: string; nivelRequerido: string }[];
  responsabilidadesSstComunes?: { descripcion: string }[];
  catalogoCompetencias?: string[];
  sugerenciaNumeroPuestos?: number;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const numeroPuestosRef = useRef<HTMLInputElement>(null);
  const idListaCompetencias = useId();

  const funciones = useFilas(valoresIniciales.funciones);
  const flujos = useFilas(valoresIniciales.flujos);
  const decisiones = useFilas(valoresIniciales.decisiones);
  const riesgos = useFilas(valoresIniciales.riesgos);
  const responsabilidadesSst = useFilas(valoresIniciales.responsabilidadesSst);
  const ajustes = useFilas(valoresIniciales.ajustes);
  const competencias = useFilas(valoresIniciales.competencias);
  const indicadores = useFilas(valoresIniciales.indicadores);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Seccion numero={1} titulo="Identificación, ubicación y propósito del cargo">
        <Campo id="razonSer" label="Razón de ser del cargo" defaultValue={valoresIniciales.razonSer} placeholder="Ej. Garantizar que la nómina se pague completa y a tiempo cada quincena." />
        <div className="mt-4">
          <Campo
            id="criticidadAusencia"
            label="¿Qué pasaría si el cargo no existiera? (criticidad)"
            defaultValue={valoresIniciales.criticidadAusencia}
            placeholder="Ej. Se atrasarían los pagos a empleados y proveedores, y aumentarían los errores en las cuentas."
          />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field" htmlFor="numeroPuestos">
              Número de puestos con este perfil
            </label>
            <input
              ref={numeroPuestosRef}
              id="numeroPuestos"
              name="numeroPuestos"
              type="number"
              min={0}
              defaultValue={valoresIniciales.numeroPuestos}
              className="input-field"
              placeholder="Ej. 3"
            />
            {sugerenciaNumeroPuestos != null && (
              <button
                type="button"
                onClick={() => {
                  if (numeroPuestosRef.current) numeroPuestosRef.current.value = String(sugerenciaNumeroPuestos);
                }}
                className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-marca)] hover:text-[var(--color-marca-suave)]"
              >
                <Sparkles size={13} /> Usar {sugerenciaNumeroPuestos} — hay {sugerenciaNumeroPuestos}{" "}
                {sugerenciaNumeroPuestos === 1 ? "cargo" : "cargos"} con este mismo nombre en este departamento
              </button>
            )}
          </div>
          <div>
            <label className="label-field" htmlFor="sede">
              Sede / ubicación
            </label>
            <input id="sede" name="sede" defaultValue={valoresIniciales.sede} className="input-field" placeholder="Ej. Bogotá — sede principal" />
          </div>
          <div>
            <label className="label-field" htmlFor="modalidadTrabajo">
              Modalidad de trabajo
            </label>
            <select id="modalidadTrabajo" name="modalidadTrabajo" defaultValue={valoresIniciales.modalidadTrabajo} className="input-field">
              <option value="">Selecciona…</option>
              {MODALIDADES_TRABAJO.map((v) => (
                <option key={v} value={v}>
                  {ETIQUETAS_MODALIDAD_TRABAJO[v]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field" htmlFor="jornada">
              Jornada
            </label>
            <select id="jornada" name="jornada" defaultValue={valoresIniciales.jornada} className="input-field">
              <option value="">Selecciona…</option>
              {JORNADAS.map((v) => (
                <option key={v} value={v}>
                  {ETIQUETAS_JORNADA[v]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field" htmlFor="claseRiesgoArl">
              Clase de riesgo ARL
            </label>
            <select id="claseRiesgoArl" name="claseRiesgoArl" defaultValue={valoresIniciales.claseRiesgoArl} className="input-field">
              <option value="">Selecciona…</option>
              {CLASES_RIESGO_ARL.map((v) => (
                <option key={v} value={v}>
                  Clase {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field" htmlFor="tipoVinculacion">
              Tipo de vinculación
            </label>
            <select id="tipoVinculacion" name="tipoVinculacion" defaultValue={valoresIniciales.tipoVinculacion} className="input-field">
              <option value="">Selecciona…</option>
              {TIPOS_VINCULACION.map((v) => (
                <option key={v} value={v}>
                  {ETIQUETAS_TIPO_VINCULACION[v]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Seccion>

      <Seccion numero={2} titulo="Funciones esenciales" subtitulo="Qué hace la persona en este cargo día a día.">
        <div className="flex flex-col gap-3">
          {funciones.filas.map((fila, i) => (
            <div key={fila.id} className="flex flex-col gap-1.5 rounded-lg border border-[var(--color-borde)] p-2.5">
              <div className="flex items-start gap-2">
                <span className="mt-2.5 text-[13px] text-gray-400">{i + 1}.</span>
                <input
                  name="funcionDescripcion"
                  defaultValue={fila.valor.descripcion}
                  className="input-field"
                  placeholder="Describe una tarea o actividad del cargo"
                />
                <select name="funcionFrecuencia" defaultValue={fila.valor.frecuencia || "diaria"} className="input-field sm:w-32">
                  {FRECUENCIAS_FUNCION.map((v) => (
                    <option key={v} value={v}>
                      {ETIQUETAS_FRECUENCIA_FUNCION[v]}
                    </option>
                  ))}
                </select>
                <input
                  name="funcionPorcentajeTiempo"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={fila.valor.porcentajeTiempo}
                  className="input-field sm:w-24"
                  placeholder="% tiempo"
                />
                <BotonQuitar onClick={() => funciones.quitar(fila.id)} />
              </div>
              <input
                name="funcionCriterioDesempeno"
                defaultValue={fila.valor.criterioDesempeno}
                className="input-field ml-5"
                placeholder="Criterio de desempeño (opcional): ¿cómo se sabe que esta función se cumplió bien?"
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <BotonAgregar onClick={() => funciones.agregar({ descripcion: "", frecuencia: "diaria", criterioDesempeno: "", porcentajeTiempo: "" })}>
            Agregar función
          </BotonAgregar>
          {funcionesComunes.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const existentes = new Set(funciones.filas.map((f) => f.valor.descripcion.trim().toLowerCase()));
                for (const f of funcionesComunes) {
                  if (existentes.has(f.descripcion.trim().toLowerCase())) continue;
                  funciones.agregar({ ...f, porcentajeTiempo: "" });
                  existentes.add(f.descripcion.trim().toLowerCase());
                }
              }}
              className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--color-marca)] hover:text-[var(--color-marca-suave)]"
            >
              <Sparkles size={15} /> Aplicar funciones comunes de la empresa
            </button>
          )}
        </div>
      </Seccion>

      <Seccion
        numero={3}
        titulo="Flujos de trabajo e interdependencias"
        subtitulo="Con quién intercambia información, documentos o entregables este cargo, dentro o fuera de la empresa."
      >
        <Campo id="participacionComites" label="Participación en comités" defaultValue={valoresIniciales.participacionComites} placeholder="Ej. Comité de Convivencia Laboral, Comité de Compras" />
        <p className="mt-4 text-[12.5px] text-[var(--color-texto-suave)]">
          <strong>Insumo</strong> = algo que este cargo recibe de otro para poder trabajar. <strong>Salida</strong> =
          algo que este cargo entrega a otro ya terminado.
        </p>
        <div className="mt-2 flex flex-col gap-2">
          {flujos.filas.map((fila) => (
            <div key={fila.id} className="flex items-start gap-2">
              <select name="flujoTipo" defaultValue={fila.valor.tipo || "insumo"} className="input-field sm:w-36">
                {TIPOS_FLUJO.map((v) => (
                  <option key={v} value={v}>
                    {ETIQUETAS_TIPO_FLUJO[v]}
                  </option>
                ))}
              </select>
              <input
                name="flujoDescripcion"
                defaultValue={fila.valor.descripcion}
                className="input-field"
                placeholder="Ej. Reporte de nómina quincenal"
              />
              <select name="flujoContraparteCargoId" defaultValue={fila.valor.contraparteCargoId} className="input-field sm:w-44">
                <option value="">Otra persona/área externa…</option>
                {otrosCargos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              <input
                name="flujoContraparte"
                defaultValue={fila.valor.contraparte}
                className="input-field sm:w-40"
                placeholder="Ej. Cliente, proveedor…"
              />
              <BotonQuitar onClick={() => flujos.quitar(fila.id)} />
            </div>
          ))}
        </div>
        <BotonAgregar onClick={() => flujos.agregar({ tipo: "insumo", descripcion: "", contraparte: "", contraparteCargoId: "" })}>
          Agregar flujo
        </BotonAgregar>
      </Seccion>

      <Seccion
        numero={4}
        titulo="Autoridad y toma de decisiones"
        subtitulo="Qué tanto puede decidir por sí misma la persona en este cargo, sin pedir autorización."
      >
        <Campo
          id="autonomiaDecision"
          label="Nivel de autonomía y toma de decisiones"
          defaultValue={valoresIniciales.autonomiaDecision}
          placeholder="Ej. Decide el orden de sus tareas diarias; necesita aprobación de su jefe para cambios de presupuesto o contratos."
        />
        <div className="mt-4 flex flex-col gap-2">
          {decisiones.filas.map((fila) => (
            <div key={fila.id} className="flex items-start gap-2">
              <input
                name="decisionDescripcion"
                defaultValue={fila.valor.descripcion}
                className="input-field"
                placeholder="Ej. Aprobar horas extra del equipo a su cargo"
              />
              <select name="decisionNivelAutonomia" defaultValue={fila.valor.nivelAutonomia || "autonoma"} className="input-field sm:w-44">
                {NIVELES_AUTONOMIA.map((v) => (
                  <option key={v} value={v}>
                    {ETIQUETAS_NIVEL_AUTONOMIA[v]}
                  </option>
                ))}
              </select>
              <BotonQuitar onClick={() => decisiones.quitar(fila.id)} />
            </div>
          ))}
        </div>
        <BotonAgregar onClick={() => decisiones.agregar({ descripcion: "", nivelAutonomia: "autonoma" })}>
          Agregar decisión
        </BotonAgregar>
      </Seccion>

      <Seccion numero={5} titulo="Responsabilidad por recursos a cargo">
        <div className="flex flex-col gap-2">
          <RecursoFila titulo="Personas" nivelId="recursoPersonasNivel" nivelDefault={valoresIniciales.recursoPersonasNivel} descripcionId="recursoPersonasDescripcion" descripcionDefault={valoresIniciales.recursoPersonasDescripcion} />
          <RecursoFila titulo="Dinero" nivelId="recursoDineroNivel" nivelDefault={valoresIniciales.recursoDineroNivel} descripcionId="recursoDineroDescripcion" descripcionDefault={valoresIniciales.recursoDineroDescripcion} />
          <RecursoFila titulo="Equipos" nivelId="recursoEquiposNivel" nivelDefault={valoresIniciales.recursoEquiposNivel} descripcionId="recursoEquiposDescripcion" descripcionDefault={valoresIniciales.recursoEquiposDescripcion} />
          <RecursoFila titulo="Información confidencial" nivelId="recursoInfoConfidencialNivel" nivelDefault={valoresIniciales.recursoInfoConfidencialNivel} descripcionId="recursoInfoConfidencialDescripcion" descripcionDefault={valoresIniciales.recursoInfoConfidencialDescripcion} />
          <RecursoFila titulo="Materiales" nivelId="recursoMaterialesNivel" nivelDefault={valoresIniciales.recursoMaterialesNivel} descripcionId="recursoMaterialesDescripcion" descripcionDefault={valoresIniciales.recursoMaterialesDescripcion} />
        </div>
      </Seccion>

      <Seccion numero={6} titulo="Seguridad, salud en el trabajo y entorno (SST)">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo id="eppRequerido" label="EPP (Elementos de Protección Personal) y autocuidado requerido" defaultValue={valoresIniciales.eppRequerido} placeholder="Ej. Guantes de seguridad, tapabocas, protector auditivo" />
          <Campo id="protocolosEmergencia" label="Protocolos de reporte de incidentes / emergencias" defaultValue={valoresIniciales.protocolosEmergencia} placeholder="Ej. Reportar cualquier accidente al jefe inmediato y a Talento Humano en menos de 24 horas" />
        </div>

        <div className="mt-4">
          <p className="label-field">Roles especiales de SST que ejerce este cargo</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {ROLES_SST.map((v) => (
              <label key={v} className="flex items-center gap-1.5 text-[13.5px] text-gray-700">
                <input type="checkbox" name="rolesSst" value={v} defaultChecked={valoresIniciales.rolesSst.includes(v)} className="h-4 w-4 rounded border-gray-300" />
                {ETIQUETAS_ROL_SST[v]}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {responsabilidadesSst.filas.map((fila) => (
            <div key={fila.id} className="flex items-start gap-2">
              <input
                name="responsabilidadSstDescripcion"
                defaultValue={fila.valor.descripcion}
                className="input-field"
                placeholder="Ej. Reportar condiciones inseguras al COPASST"
              />
              <BotonQuitar onClick={() => responsabilidadesSst.quitar(fila.id)} />
            </div>
          ))}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <BotonAgregar onClick={() => responsabilidadesSst.agregar({ descripcion: "" })}>
            Agregar responsabilidad SST específica
          </BotonAgregar>
          {responsabilidadesSstComunes.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const existentes = new Set(
                  responsabilidadesSst.filas.map((f) => f.valor.descripcion.trim().toLowerCase())
                );
                for (const r of responsabilidadesSstComunes) {
                  if (existentes.has(r.descripcion.trim().toLowerCase())) continue;
                  responsabilidadesSst.agregar({ descripcion: r.descripcion });
                  existentes.add(r.descripcion.trim().toLowerCase());
                }
              }}
              className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--color-marca)] hover:text-[var(--color-marca-suave)]"
            >
              <Sparkles size={15} /> Aplicar responsabilidades SST comunes de la empresa
            </button>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field" htmlFor="evaluacionPreocupacional">
              Evaluación médica preocupacional
            </label>
            <input id="evaluacionPreocupacional" name="evaluacionPreocupacional" defaultValue={valoresIniciales.evaluacionPreocupacional} className="input-field" placeholder="Ej. Examen osteomuscular" />
          </div>
          <div>
            <label className="label-field" htmlFor="evaluacionPeriodica">
              Evaluación médica periódica
            </label>
            <input id="evaluacionPeriodica" name="evaluacionPeriodica" defaultValue={valoresIniciales.evaluacionPeriodica} className="input-field" placeholder="Ej. Anual" />
          </div>
          <div>
            <label className="label-field" htmlFor="evaluacionPostIncapacidad">
              Evaluación médica post-incapacidad
            </label>
            <input id="evaluacionPostIncapacidad" name="evaluacionPostIncapacidad" defaultValue={valoresIniciales.evaluacionPostIncapacidad} className="input-field" />
          </div>
          <div>
            <label className="label-field" htmlFor="evaluacionEgreso">
              Evaluación médica de egreso
            </label>
            <input id="evaluacionEgreso" name="evaluacionEgreso" defaultValue={valoresIniciales.evaluacionEgreso} className="input-field" />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          {riesgos.filas.map((fila) => (
            <div key={fila.id} className="flex flex-col gap-1.5 rounded-lg border border-[var(--color-borde)] p-2.5">
              <div className="flex items-start gap-2">
                <select name="riesgoTipo" defaultValue={fila.valor.tipo || "fisico"} className="input-field sm:w-40">
                  {TIPOS_RIESGO.map((v) => (
                    <option key={v} value={v}>
                      {ETIQUETAS_TIPO_RIESGO[v]}
                    </option>
                  ))}
                </select>
                <input
                  name="riesgoDescripcion"
                  defaultValue={fila.valor.descripcion}
                  className="input-field"
                  placeholder="Ej. Ruido excesivo de maquinaria"
                />
                <select name="riesgoNivel" defaultValue={fila.valor.nivel || "medio"} className="input-field sm:w-28">
                  {NIVELES_RIESGO.map((v) => (
                    <option key={v} value={v}>
                      {ETIQUETAS_NIVEL_RIESGO[v]}
                    </option>
                  ))}
                </select>
                <BotonQuitar onClick={() => riesgos.quitar(fila.id)} />
              </div>
              <div className="ml-0 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                <input
                  name="riesgoControlesExistentes"
                  defaultValue={fila.valor.controlesExistentes}
                  className="input-field"
                  placeholder="Controles existentes (opcional)"
                />
                <input
                  name="riesgoEppRequerido"
                  defaultValue={fila.valor.eppRequerido}
                  className="input-field"
                  placeholder="EPP específico para este riesgo (opcional)"
                />
              </div>
            </div>
          ))}
        </div>
        <BotonAgregar onClick={() => riesgos.agregar({ tipo: "fisico", descripcion: "", nivel: "medio", controlesExistentes: "", eppRequerido: "" })}>
          Agregar riesgo
        </BotonAgregar>
      </Seccion>

      <Seccion
        numero={7}
        titulo="Inclusión laboral y ajustes razonables"
        subtitulo="Piensa en el cargo en general, no en una persona en particular: ¿qué podría dificultarle a alguien con una discapacidad desempeñar este cargo, y qué ajuste lo resolvería? Si no aplica, puedes dejarlo vacío."
      >
        <div className="flex flex-col gap-2">
          {ajustes.filas.map((fila) => (
            <div key={fila.id} className="flex items-start gap-2">
              <select name="ajusteTipoBarrera" defaultValue={fila.valor.tipoBarrera || "fisica"} className="input-field sm:w-36">
                {TIPOS_BARRERA.map((v) => (
                  <option key={v} value={v}>
                    {ETIQUETAS_TIPO_BARRERA[v]}
                  </option>
                ))}
              </select>
              <input
                name="ajusteDescripcionBarrera"
                defaultValue={fila.valor.descripcionBarrera}
                className="input-field"
                placeholder="Ej. Instrucciones de la máquina solo en texto pequeño"
              />
              <input
                name="ajusteApoyoSugerido"
                defaultValue={fila.valor.apoyoSugerido}
                className="input-field"
                placeholder="Ej. Etiquetas con íconos grandes o en braille"
              />
              <BotonQuitar onClick={() => ajustes.quitar(fila.id)} />
            </div>
          ))}
        </div>
        <BotonAgregar onClick={() => ajustes.agregar({ tipoBarrera: "fisica", descripcionBarrera: "", apoyoSugerido: "" })}>
          Agregar ajuste razonable
        </BotonAgregar>
      </Seccion>

      <Seccion numero={8} titulo="Responsabilidades en otros sistemas de gestión">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo id="respSistemaCalidad" label="Sistema de gestión de calidad" defaultValue={valoresIniciales.respSistemaCalidad} />
          <Campo id="respSistemaAmbiental" label="Sistema de gestión ambiental" defaultValue={valoresIniciales.respSistemaAmbiental} />
          <Campo id="respSistemaSeguridadVial" label="Plan Estratégico de Seguridad Vial (PESV)" defaultValue={valoresIniciales.respSistemaSeguridadVial} />
          <Campo id="respSistemaSeguridadInformacion" label="Seguridad de la información" defaultValue={valoresIniciales.respSistemaSeguridadInformacion} />
          <Campo id="respSistemaSagrilaft" label="SAGRILAFT" defaultValue={valoresIniciales.respSistemaSagrilaft} />
        </div>
      </Seccion>

      <Seccion numero={9} titulo="Requisitos del cargo">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo id="requisitoEducacionFormal" label="Educación formal" defaultValue={valoresIniciales.requisitoEducacionFormal} placeholder="Ej. Tecnólogo en Contabilidad" />
          <Campo id="requisitoTarjetaProfesional" label="Tarjeta profesional" defaultValue={valoresIniciales.requisitoTarjetaProfesional} placeholder="Ej. No aplica" rows={1} />
          <Campo id="requisitoFormacionComplementaria" label="Formación complementaria" defaultValue={valoresIniciales.requisitoFormacionComplementaria} placeholder="Ej. Curso de Excel avanzado" />
          <Campo id="requisitoCertificaciones" label="Certificaciones" defaultValue={valoresIniciales.requisitoCertificaciones} />
          <Campo id="requisitoExperienciaGeneral" label="Experiencia general" defaultValue={valoresIniciales.requisitoExperienciaGeneral} placeholder="Ej. 2 años en cargos administrativos" rows={1} />
          <Campo id="requisitoExperienciaEspecifica" label="Experiencia específica" defaultValue={valoresIniciales.requisitoExperienciaEspecifica} placeholder="Ej. 1 año en procesos de nómina" rows={1} />
          <Campo id="requisitoEquivalencias" label="Equivalencias" defaultValue={valoresIniciales.requisitoEquivalencias} placeholder="Ej. 4 años de experiencia certificada equivalen al título" />
          <Campo id="requisitoOtros" label="Otros requisitos" defaultValue={valoresIniciales.requisitoOtros} />
        </div>
      </Seccion>

      <Seccion numero={10} titulo="Dotación, equipos y herramientas">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo id="dotacion" label="Dotación" defaultValue={valoresIniciales.dotacion} placeholder="Ej. Uniforme, botas de seguridad" />
          <Campo id="equiposHerramientas" label="Equipos y herramientas de trabajo" defaultValue={valoresIniciales.equiposHerramientas} placeholder="Ej. Computador, sistema de nómina, calculadora" />
        </div>
      </Seccion>

      <Seccion
        numero={11}
        titulo="Competencias"
        subtitulo="Nivel requerido — básico: la aplica en tareas simples y supervisadas. Intermedio: la aplica de forma autónoma en el día a día. Avanzado: la domina y puede orientar a otros. Experto: referente para casos complejos."
      >
        <div className="flex flex-col gap-2">
          {competencias.filas.map((fila) => (
            <div key={fila.id} className="flex items-start gap-2">
              <input
                name="competenciaNombre"
                defaultValue={fila.valor.nombre}
                className="input-field"
                placeholder="Ej. Trabajo en equipo"
                list={idListaCompetencias}
                autoComplete="off"
              />
              <select name="competenciaTipo" defaultValue={fila.valor.tipo || "organizacional"} className="input-field sm:w-44">
                {TIPOS_COMPETENCIA.map((v) => (
                  <option key={v} value={v}>
                    {ETIQUETAS_TIPO_COMPETENCIA[v]}
                  </option>
                ))}
              </select>
              <select name="competenciaNivel" defaultValue={fila.valor.nivelRequerido || "intermedio"} className="input-field sm:w-32">
                {NIVELES_COMPETENCIA.map((v) => (
                  <option key={v} value={v}>
                    {ETIQUETAS_NIVEL_COMPETENCIA[v]}
                  </option>
                ))}
              </select>
              <BotonQuitar onClick={() => competencias.quitar(fila.id)} />
            </div>
          ))}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <BotonAgregar
            onClick={() => competencias.agregar({ nombre: "", tipo: "organizacional", nivelRequerido: "intermedio" })}
          >
            Agregar competencia
          </BotonAgregar>
          <button
            type="button"
            onClick={() => {
              const existentes = new Set(competencias.filas.map((f) => f.valor.nombre.trim().toLowerCase()));
              for (const nombre of competenciasSugeridasPara(nivelJerarquico)) {
                if (existentes.has(nombre.toLowerCase())) continue;
                competencias.agregar({ nombre, tipo: "organizacional", nivelRequerido: "intermedio" });
                existentes.add(nombre.toLowerCase());
              }
            }}
            className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--color-marca)] hover:text-[var(--color-marca-suave)]"
          >
            <Sparkles size={15} /> Sugerir competencias comportamentales
          </button>
          {competenciasComunes.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const existentes = new Set(competencias.filas.map((f) => f.valor.nombre.trim().toLowerCase()));
                for (const c of competenciasComunes) {
                  if (existentes.has(c.nombre.trim().toLowerCase())) continue;
                  competencias.agregar({ nombre: c.nombre, tipo: "organizacional", nivelRequerido: c.nivelRequerido });
                  existentes.add(c.nombre.trim().toLowerCase());
                }
              }}
              className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--color-marca)] hover:text-[var(--color-marca-suave)]"
            >
              <Sparkles size={15} /> Aplicar competencias comunes de la empresa
            </button>
          )}
        </div>
        {catalogoCompetencias.length > 0 && (
          <datalist id={idListaCompetencias}>
            {catalogoCompetencias.map((nombre) => (
              <option key={nombre} value={nombre} />
            ))}
          </datalist>
        )}
      </Seccion>

      <Seccion numero={12} titulo="Indicadores de desempeño">
        <div className="flex flex-col gap-2">
          {indicadores.filas.map((fila) => (
            <div key={fila.id} className="flex items-start gap-2">
              <input name="indicadorNombre" defaultValue={fila.valor.nombre} className="input-field" placeholder="Ej. % de nóminas pagadas a tiempo" />
              <input name="indicadorFormula" defaultValue={fila.valor.formula} className="input-field" placeholder="Fórmula (opcional)" />
              <input name="indicadorMeta" defaultValue={fila.valor.meta} className="input-field sm:w-32" placeholder="Meta" />
              <input name="indicadorFrecuencia" defaultValue={fila.valor.frecuencia} className="input-field sm:w-32" placeholder="Frecuencia" />
              <BotonQuitar onClick={() => indicadores.quitar(fila.id)} />
            </div>
          ))}
        </div>
        <BotonAgregar onClick={() => indicadores.agregar({ nombre: "", formula: "", meta: "", frecuencia: "" })}>
          Agregar indicador
        </BotonAgregar>
      </Seccion>

      <Seccion numero={13} titulo="Evidencias" subtitulo="Cómo se comprueba que alguien realmente cumple con este perfil — útil para selección e inducción.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Campo id="evidenciaProducto" label="De producto" defaultValue={valoresIniciales.evidenciaProducto} placeholder="Ej. Reporte de nómina del mes, entregado a tiempo" />
          <Campo id="evidenciaDesempeno" label="De desempeño" defaultValue={valoresIniciales.evidenciaDesempeno} placeholder="Ej. Observación directa en el puesto de trabajo" />
          <Campo id="evidenciaConocimiento" label="De conocimiento" defaultValue={valoresIniciales.evidenciaConocimiento} placeholder="Ej. Prueba escrita sobre el manejo del sistema" />
        </div>
      </Seccion>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <div>
        <button type="submit" disabled={pending} className="btn-primary px-6 py-3">
          {pending ? "Guardando…" : "Guardar perfil"}
        </button>
      </div>
    </form>
  );
}

function Seccion({
  numero,
  titulo,
  subtitulo,
  children,
}: {
  numero: number;
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="card p-5">
      <div className="mb-1 flex items-center gap-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-marca)] text-[11px] font-bold text-white">
          {numero}
        </span>
        <h3 id={id} className="font-heading text-[15px] font-bold text-gray-900">
          {titulo}
        </h3>
      </div>
      {subtitulo && <p className="mb-4 mt-0.5 pl-[34px] text-[13px] text-[var(--color-texto-suave)]">{subtitulo}</p>}
      <div className={subtitulo ? "pl-[34px]" : "mt-4 pl-[34px]"}>{children}</div>
    </section>
  );
}
