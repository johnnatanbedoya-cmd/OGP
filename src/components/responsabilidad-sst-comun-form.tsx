"use client";

import { useActionState } from "react";
import type { ComunState } from "@/app/actions/comunes";
import { ALCANCES_COMUN } from "@/lib/validaciones";
import { ETIQUETAS_ALCANCE_COMUN } from "@/lib/etiquetas";

type FormAction = (prevState: ComunState, formData: FormData) => Promise<ComunState>;

export function ResponsabilidadSstComunForm({ action }: { action: FormAction }) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <label className="label-field" htmlFor="alcance-responsabilidad-sst">
          Aplica a
        </label>
        <select id="alcance-responsabilidad-sst" name="alcance" className="input-field">
          {ALCANCES_COMUN.map((v) => (
            <option key={v} value={v}>
              {ETIQUETAS_ALCANCE_COMUN[v]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label-field" htmlFor="descripcion-responsabilidad-sst">
          Responsabilidad en seguridad y salud en el trabajo
        </label>
        <input
          id="descripcion-responsabilidad-sst"
          name="descripcion"
          required
          className="input-field"
          placeholder="Ej. Utilizar y conservar en buen estado los elementos de protección personal suministrados"
        />
      </div>
      <div>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Guardando…" : "Agregar responsabilidad SST común"}
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
