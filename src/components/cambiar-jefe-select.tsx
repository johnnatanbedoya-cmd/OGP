"use client";

import { useRef } from "react";
import { cambiarJefeInmediatoAction } from "@/app/actions/cargos";

export function CambiarJefeSelect({
  cargoId,
  jefeActualId,
  opciones,
}: {
  cargoId: string;
  jefeActualId: string | null;
  opciones: { id: string; nombre: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={cambiarJefeInmediatoAction.bind(null, cargoId)} className="mt-1 w-full">
      <select
        name="jefeInmediatoId"
        defaultValue={jefeActualId ?? ""}
        onChange={() => formRef.current?.requestSubmit()}
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-md border border-[var(--color-borde)] bg-white px-1.5 py-1 text-[11px] text-gray-700"
        aria-label="Cambiar jefe inmediato"
      >
        <option value="">Sin jefe inmediato</option>
        {opciones.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nombre}
          </option>
        ))}
      </select>
    </form>
  );
}
