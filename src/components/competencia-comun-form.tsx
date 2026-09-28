"use client";

import { useActionState } from "react";
import type { ComunState } from "@/app/actions/comunes";
import { ALCANCES_COMUN, NIVELES_COMPETENCIA } from "@/lib/validaciones";
import { ETIQUETAS_ALCANCE_COMUN, ETIQUETAS_NIVEL_COMPETENCIA } from "@/lib/etiquetas";

type FormAction = (prevState: ComunState, formData: FormData) => Promise<ComunState>;

export function CompetenciaComunForm({ action }: { action: FormAction }) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="label-field" htmlFor="alcance-competencia">
            Aplica a
          </label>
          <select id="alcance-competencia" name="alcance" className="input-field">
            {ALCANCES_COMUN.map((v) => (
              <option key={v} value={v}>
                {ETIQUETAS_ALCANCE_COMUN[v]}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-1">
          <label className="label-field" htmlFor="nombre-competencia">
            Competencia
          </label>
          <input
            id="nombre-competencia"
            name="nombre"
            required
            className="input-field"
            placeholder="Ej. Orientación al servicio"
          />
        </div>
        <div>
          <label className="label-field" htmlFor="nivelRequerido-competencia">
            Nivel requerido
          </label>
          <select id="nivelRequerido-competencia" name="nivelRequerido" defaultValue="intermedio" className="input-field">
            {NIVELES_COMPETENCIA.map((v) => (
              <option key={v} value={v}>
                {ETIQUETAS_NIVEL_COMPETENCIA[v]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Guardando…" : "Agregar competencia común"}
        </button>
      </div>
      {state.error && (
        <p className="text-[13px] text-red-600" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
