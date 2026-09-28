"use client";

import { useActionState } from "react";
import type { CargoState } from "@/app/actions/cargos";
import { NIVELES_JERARQUICOS } from "@/lib/validaciones";
import { ETIQUETAS_NIVEL_JERARQUICO } from "@/lib/etiquetas";

type FormAction = (prevState: CargoState, formData: FormData) => Promise<CargoState>;

export type CargoDefaultValues = {
  nombre: string;
  codigo: string;
  departamentoId: string;
  nivelJerarquico: string;
  jefeInmediatoId: string;
};

export function CargoForm({
  action,
  departamentos,
  posiblesJefes,
  valoresIniciales,
  etiquetaEnvio = "Crear cargo",
}: {
  action: FormAction;
  departamentos: { id: string; nombre: string }[];
  posiblesJefes: { id: string; nombre: string }[];
  valoresIniciales?: CargoDefaultValues;
  etiquetaEnvio?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const valores = valoresIniciales ?? {
    nombre: "",
    codigo: "",
    departamentoId: departamentos[0]?.id ?? "",
    nivelJerarquico: "",
    jefeInmediatoId: "",
  };

  return (
    <form action={formAction} className="card flex flex-col gap-4 p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="label-field" htmlFor="nombre">
            Nombre del cargo *
          </label>
          <input
            id="nombre"
            name="nombre"
            required
            defaultValue={valores.nombre}
            className="input-field"
            placeholder="Ej. Analista de Nómina"
          />
        </div>
        <div>
          <label className="label-field" htmlFor="codigo">
            Código
          </label>
          <input id="codigo" name="codigo" defaultValue={valores.codigo} className="input-field" placeholder="Ej. AN-01" />
        </div>
      </div>

      <div>
        <label className="label-field" htmlFor="departamentoId">
          Departamento *
        </label>
        <select id="departamentoId" name="departamentoId" required defaultValue={valores.departamentoId} className="input-field">
          {departamentos.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label-field" htmlFor="nivelJerarquico">
          Nivel jerárquico
        </label>
        <select id="nivelJerarquico" name="nivelJerarquico" defaultValue={valores.nivelJerarquico} className="input-field">
          <option value="">Selecciona…</option>
          {NIVELES_JERARQUICOS.map((v) => (
            <option key={v} value={v}>
              {ETIQUETAS_NIVEL_JERARQUICO[v]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label-field" htmlFor="jefeInmediatoId">
          Jefe inmediato
        </label>
        <select id="jefeInmediatoId" name="jefeInmediatoId" defaultValue={valores.jefeInmediatoId} className="input-field">
          <option value="">Sin jefe inmediato registrado</option>
          {posiblesJefes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <div>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Guardando…" : etiquetaEnvio}
        </button>
      </div>
    </form>
  );
}
