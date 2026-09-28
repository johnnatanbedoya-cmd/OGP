"use client";

import { useState, useTransition } from "react";
import { PerfilForm } from "@/components/perfil-form";
import { generarBorradorPerfilAction } from "@/app/actions/perfiles";

type PerfilFormProps = React.ComponentProps<typeof PerfilForm>;

export function PerfilFormConIA({
  cargoId,
  tieneTaller,
  valoresIniciales,
  ...resto
}: PerfilFormProps & { cargoId: string; tieneTaller: boolean }) {
  const [valores, setValores] = useState(valoresIniciales);
  const [version, setVersion] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [generado, setGenerado] = useState(false);

  function generar() {
    setError(null);
    setGenerado(false);
    startTransition(async () => {
      const resultado = await generarBorradorPerfilAction(cargoId);
      if (resultado.error) {
        setError(resultado.error);
        return;
      }
      if (resultado.borrador) {
        setValores(resultado.borrador);
        setVersion((v) => v + 1);
        setGenerado(true);
      }
    });
  }

  if (!tieneTaller) {
    return <PerfilForm {...resto} valoresIniciales={valoresIniciales} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-[13.5px] font-medium text-gray-800">Generar borrador con IA</p>
          <p className="text-[12.5px] text-[var(--color-texto-suave)]">
            Completa con un borrador los campos que todavía estén vacíos, a partir de las respuestas del Taller.
            Nada se guarda hasta que revises y le des a &quot;Guardar perfil&quot;.
          </p>
        </div>
        <button type="button" onClick={generar} disabled={pending} className="btn-secondary shrink-0 px-4 py-2">
          {pending ? "Generando…" : "Generar borrador con IA"}
        </button>
      </div>
      {error && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}
      {generado && !error && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-800">
          Se completaron los campos vacíos con un borrador de IA — revisa cada uno antes de guardar.
        </p>
      )}
      <PerfilForm key={version} {...resto} valoresIniciales={valores} />
    </div>
  );
}
