"use client";

import { useActionState } from "react";
import { enviarInvitacionesTallerMasivoAction, type EnvioMasivoTallerState } from "@/app/actions/talleres";

const initialState: EnvioMasivoTallerState = {};

export function EnviarTallerMasivoButton({ empresaId }: { empresaId: string }) {
  const [state, formAction, pending] = useActionState(
    enviarInvitacionesTallerMasivoAction.bind(null, empresaId),
    initialState
  );

  return (
    <div>
      <form action={formAction}>
        <button type="submit" disabled={pending} className="btn-secondary">
          {pending ? "Enviando…" : "Enviar taller a todos por correo"}
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
            {state.resultado.enviados} correo(s) enviado(s)
            {state.resultado.yaCompletados > 0 && `, ${state.resultado.yaCompletados} ya habían completado el taller`}
            {state.resultado.sinCorreo > 0 && `, ${state.resultado.sinCorreo} sin correo registrado`}.
          </p>
          {state.resultado.fallidos.length > 0 && (
            <>
              <p className="mt-2 font-medium text-red-700">No se pudieron enviar:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-red-700">
                {state.resultado.fallidos.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
