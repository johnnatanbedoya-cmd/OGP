"use client";

import { useActionState } from "react";
import type { ComunState } from "@/app/actions/comunes";
import { ALCANCES_COMUN, FRECUENCIAS_FUNCION } from "@/lib/validaciones";
import { ETIQUETAS_ALCANCE_COMUN, ETIQUETAS_FRECUENCIA_FUNCION } from "@/lib/etiquetas";

type FormAction = (prevState: ComunState, formData: FormData) => Promise<ComunState>;

export function FuncionComunForm({ action }: { action: FormAction }) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label-field" htmlFor="alcance-funcion">
            Aplica a
          </label>
          <select id="alcance-funcion" name="alcance" className="input-field">
            {ALCANCES_COMUN.map((v) => (
              <option key={v} value={v}>
                {ETIQUETAS_ALCANCE_COMUN[v]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-field" htmlFor="frecuencia-funcion">
            Frecuencia
          </label>
          <select id="frecuencia-funcion" name="frecuencia" defaultValue="diaria" className="input-field">
            {FRECUENCIAS_FUNCION.map((v) => (
              <option key={v} value={v}>
                {ETIQUETAS_FRECUENCIA_FUNCION[v]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label-field" htmlFor="descripcion-funcion">
          Descripción de la función
        </label>
        <input
          id="descripcion-funcion"
          name="descripcion"
          required
          className="input-field"
          placeholder="Ej. Cumplir el reglamento interno de trabajo y las políticas de la empresa"
        />
      </div>
      <div>
        <label className="label-field" htmlFor="criterioDesempeno-funcion">
          Criterio de desempeño (opcional)
        </label>
        <input
          id="criterioDesempeno-funcion"
          name="criterioDesempeno"
          className="input-field"
          placeholder="Ej. El reglamento interno se cumple sin novedades disciplinarias"
        />
      </div>
      <div>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Guardando…" : "Agregar función común"}
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
