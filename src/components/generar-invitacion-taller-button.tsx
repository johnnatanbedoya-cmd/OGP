"use client";

import { useActionState, useState } from "react";
import { generarInvitacionTallerAction, type InvitacionTallerState } from "@/app/actions/talleres";

const initialState: InvitacionTallerState = {};

export function GenerarInvitacionTallerButton({
  trabajadorId,
  trabajadorNombre,
  trabajadorEmail,
  cargoNombre,
}: {
  trabajadorId: string;
  trabajadorNombre: string;
  trabajadorEmail: string | null;
  cargoNombre: string;
}) {
  const [state, formAction, pending] = useActionState(
    generarInvitacionTallerAction.bind(null, trabajadorId),
    initialState
  );
  const [copiado, setCopiado] = useState(false);

  const url = state.token && typeof window !== "undefined" ? `${window.location.origin}/t/${state.token}` : null;

  const asunto = encodeURIComponent(`Taller de campo — ${cargoNombre}`);
  const cuerpo = url
    ? encodeURIComponent(
        `Hola ${trabajadorNombre},\n\nPor favor completa este breve cuestionario sobre tu cargo (${cargoNombre}), en tus propias palabras:\n${url}\n\nTe toma unos 15-20 minutos. El enlace es personal y vence en 7 días.\n\nGracias.`
      )
    : "";

  async function copiar() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // portapapeles no disponible — el enlace ya queda visible para copiar a mano
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {!url ? (
        <form action={formAction}>
          <button type="submit" disabled={pending} className="link-quiet text-[13px]">
            {pending ? "Generando…" : "Generar enlace de autoservicio"}
          </button>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-gray-50 px-3 py-2 text-[12.5px]">
          <code className="break-all text-gray-700">{url}</code>
          <button type="button" onClick={copiar} className="link-quiet shrink-0">
            {copiado ? "¡Copiado!" : "Copiar"}
          </button>
          {trabajadorEmail && (
            <a
              href={`mailto:${trabajadorEmail}?subject=${asunto}&body=${cuerpo}`}
              className="link-quiet shrink-0"
            >
              Abrir en tu correo
            </a>
          )}
        </div>
      )}
      {state.error && <p className="text-[12.5px] text-red-600">{state.error}</p>}
    </div>
  );
}
