"use client";

import { useActionState, useState } from "react";
import { actualizarEmpresaAction, type EmpresaState } from "@/app/actions/empresas";
import { NIVELES_ACCESO_EMPRESA } from "@/lib/validaciones";
import { ETIQUETAS_NIVEL_ACCESO, DESCRIPCIONES_NIVEL_ACCESO } from "@/lib/etiquetas";

export function EditarEmpresaForm({
  empresaId,
  nombreInicial,
  nivelAccesoInicial,
}: {
  empresaId: string;
  nombreInicial: string;
  nivelAccesoInicial: string;
}) {
  const [state, formAction, pending] = useActionState(actualizarEmpresaAction.bind(null, empresaId), {} as EmpresaState);
  const [nivelAcceso, setNivelAcceso] = useState(nivelAccesoInicial);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="label-field" htmlFor="nombre">
          Nombre de la empresa
        </label>
        <input id="nombre" name="nombre" required defaultValue={nombreInicial} className="input-field" />
      </div>

      <div>
        <label className="label-field" htmlFor="nivelAcceso">
          Nivel de acceso de su usuario
        </label>
        <select
          id="nivelAcceso"
          name="nivelAcceso"
          value={nivelAcceso}
          onChange={(e) => setNivelAcceso(e.target.value)}
          className="input-field"
        >
          {NIVELES_ACCESO_EMPRESA.map((v) => (
            <option key={v} value={v}>
              {ETIQUETAS_NIVEL_ACCESO[v]}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[12px] text-[var(--color-texto-suave)]">{DESCRIPCIONES_NIVEL_ACCESO[nivelAcceso]}</p>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <div>
        <button type="submit" disabled={pending} className="btn-secondary">
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
