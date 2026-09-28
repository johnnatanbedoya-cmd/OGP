"use client";

import { useActionState } from "react";
import { importarTrabajadoresAction, type ImportacionState } from "@/app/actions/trabajadores";

const initialState: ImportacionState = {};

export function ImportarTrabajadoresForm({ empresaId }: { empresaId: string }) {
  const [state, formAction, pending] = useActionState(
    importarTrabajadoresAction.bind(null, empresaId),
    initialState
  );

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <a href={`/empresas/${empresaId}/trabajadores/plantilla`} className="link-quiet">
          Descargar plantilla
        </a>
        <span className="text-[12.5px] text-[var(--color-texto-suave)]">
          Completa la plantilla y súbela aquí — crea el departamento/cargo si no existen.
        </span>
      </div>
      <form action={formAction} className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          name="archivo"
          accept=".xlsx"
          required
          className="text-[13.5px] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--color-marca)] file:px-4 file:py-2 file:text-[13px] file:font-semibold file:text-white hover:file:bg-[var(--color-marca-suave)]"
        />
        <button type="submit" disabled={pending} className="btn-secondary">
          {pending ? "Importando…" : "Importar"}
        </button>
      </form>

      {state.error && (
        <p className="mt-3 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      {state.resultado && (
        <div className="mt-3 rounded-lg bg-emerald-50 px-4 py-3 text-[13.5px] text-emerald-800">
          <p>
            {state.resultado.creados} trabajador(es) importado(s)
            {state.resultado.departamentosCreados > 0 && `, ${state.resultado.departamentosCreados} departamento(s) nuevo(s)`}
            {state.resultado.cargosCreados > 0 && `, ${state.resultado.cargosCreados} cargo(s) nuevo(s)`}.
          </p>
          {state.resultado.errores.length > 0 && (
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-red-700">
              {state.resultado.errores.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
