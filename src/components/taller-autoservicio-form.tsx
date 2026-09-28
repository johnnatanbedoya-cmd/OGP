"use client";

import { useActionState, useId } from "react";
import { guardarTallerAutoservicioAction, type TallerAutoservicioState } from "@/app/actions/talleres";
import { BLOQUES_TALLER } from "@/lib/taller-preguntas";

const initialState: TallerAutoservicioState = {};

export function TallerAutoservicioForm({
  token,
  trabajadorNombre,
  cargoNombre,
}: {
  token: string;
  trabajadorNombre: string;
  cargoNombre: string;
}) {
  const [state, formAction, pending] = useActionState(
    guardarTallerAutoservicioAction.bind(null, token),
    initialState
  );

  if (state.enviado) {
    return (
      <div className="card p-8 text-center">
        <h1 className="mb-2 font-heading text-[20px] font-bold text-gray-900">¡Gracias, {trabajadorNombre}!</h1>
        <p className="text-[13.5px] text-[var(--color-texto-suave)]">
          Tus respuestas quedaron guardadas. Ya puedes cerrar esta página.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="card p-5">
        <h1 className="mb-1 font-heading text-[18px] font-bold text-gray-900">Hola, {trabajadorNombre}</h1>
        <p className="text-[13.5px] text-[var(--color-texto-suave)]">
          Vas a responder algunas preguntas sobre tu cargo actual: <strong>{cargoNombre}</strong>. Responde en tus
          propias palabras — no hay respuestas correctas o incorrectas, esto ayuda a describir mejor tu trabajo.
        </p>
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
                  className="input-field"
                  placeholder="Escribe tu respuesta…"
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
          {pending ? "Enviando…" : "Enviar mis respuestas"}
        </button>
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
