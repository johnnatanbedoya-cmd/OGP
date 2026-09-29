"use client";

import { useActionState } from "react";
import { publicarPerfilAction, type PublicarPerfilState } from "@/app/actions/perfiles";

const initialState: PublicarPerfilState = {};

export function PublicarPerfilButton({ cargoId }: { cargoId: string }) {
  const [state, formAction, pending] = useActionState(publicarPerfilAction.bind(null, cargoId), initialState);

  if (state.solapamientos && state.solapamientos.length > 0) {
    return (
      <div className="w-full max-w-md rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-3 text-[12.5px]">
        <p className="mb-2 font-medium text-amber-900">
          Este perfil se parece mucho a {state.solapamientos.length === 1 ? "otro cargo" : "otros cargos"}:{" "}
          {state.solapamientos.map((s) => s.cargoNombre).join(", ")} — revisa el aviso más abajo antes de publicar.
        </p>
        <form action={formAction}>
          <input type="hidden" name="confirmar" value="1" />
          <button type="submit" disabled={pending} className="btn-secondary px-3 py-1.5 text-[12.5px]">
            {pending ? "Publicando…" : "Publicar de todas formas"}
          </button>
        </form>
      </div>
    );
  }

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
