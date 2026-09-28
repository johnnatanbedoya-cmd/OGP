"use client";

import { useActionState, useId } from "react";
import { guardarTallerAction, type TallerState } from "@/app/actions/talleres";
import { BLOQUES_TALLER } from "@/lib/taller-preguntas";

const initialState: TallerState = {};

export function TallerForm({
  cargoId,
  respuestasPrevias,
}: {
  cargoId: string;
  respuestasPrevias: Record<string, Record<string, string>>;
}) {
  const [state, formAction, pending] = useActionState(guardarTallerAction.bind(null, cargoId), initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="card grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
        <div>
          <label className="label-field" htmlFor="facilitador">
            ¿Quién aplicó el taller?
          </label>
          <input id="facilitador" name="facilitador" className="input-field" placeholder="Ej. Tu nombre" />
        </div>
        <div>
          <label className="label-field" htmlFor="fechaTaller">
            Fecha del taller
          </label>
          <input id="fechaTaller" name="fechaTaller" type="date" className="input-field" />
        </div>
      </div>

      {BLOQUES_TALLER.map(({ bloque, titulo, preguntas }) => (
        <Bloque key={bloque} numero={Number(bloque)} titulo={titulo}>
          <div className="flex flex-col gap-4">
            {preguntas.map((p) => (
              <div key={p.clave}>
                <label className="label-field" htmlFor={`taller_${bloque}_${p.clave}`}>
                  {p.texto}
                </label>
                <textarea
                  id={`taller_${bloque}_${p.clave}`}
                  name={`taller_${bloque}_${p.clave}`}
                  rows={2}
                  defaultValue={respuestasPrevias[bloque]?.[p.clave] ?? ""}
                  className="input-field"
                  placeholder="Escribe la respuesta tal como la dio la persona…"
                />
              </div>
            ))}
          </div>
        </Bloque>
      ))}

      {state.error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <div>
        <button type="submit" disabled={pending} className="btn-primary px-6 py-3">
          {pending ? "Guardando…" : "Guardar taller"}
        </button>
        <p className="mt-2 text-[12px] text-[var(--color-texto-suave)]">
          Esto no modifica el Perfil — solo queda guardado como referencia para redactarlo.
        </p>
      </div>
    </form>
  );
}

function Bloque({ numero, titulo, children }: { numero: number; titulo: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="card p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-marca)] text-[11px] font-bold text-white">
          {numero}
        </span>
        <h3 id={id} className="font-heading text-[15px] font-bold text-gray-900">
          {titulo}
        </h3>
      </div>
      <div className="pl-[34px]">{children}</div>
    </section>
  );
}
