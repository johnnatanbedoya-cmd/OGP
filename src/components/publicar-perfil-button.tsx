"use client";

import { useActionState } from "react";
import { publicarPerfilAction, type PublicarPerfilState } from "@/app/actions/perfiles";

const initialState: PublicarPerfilState = {};

export function PublicarPerfilButton({ cargoId }: { cargoId: string }) {
  const [state, formAction, pending] = useActionState(publicarPerfilAction.bind(null, cargoId), initialState);

  return (
    <div>
      <form action={formAction}>
        <button type="submit" disabled={pending} className="btn-primary px-4 py-1.5 text-[13px]">
          {pending ? "Publicando…" : "Publicar"}
        </button>
      </form>
      {state.error && (
        <div className="mt-2 rounded-lg bg-red-50 px-3 py-2.5 text-[12.5px] text-red-700" role="alert">
          <p className="font-medium">{state.error}</p>
          {state.camposFaltantes && state.camposFaltantes.length > 0 && (
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {state.camposFaltantes.map((campo) => (
                <li key={campo}>{campo}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
