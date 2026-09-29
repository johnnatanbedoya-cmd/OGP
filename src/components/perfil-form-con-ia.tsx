"use client";

import { useState, useTransition } from "react";
import { PerfilForm } from "@/components/perfil-form";
import { generarBorradorPerfilAction, copiarPerfilAction } from "@/app/actions/perfiles";
import { ETIQUETAS_ESTADO_PERFIL, etiqueta } from "@/lib/etiquetas";

type PerfilFormProps = React.ComponentProps<typeof PerfilForm>;
type CargoParaCopiar = { id: string; nombre: string; departamento: string; estado: string };

export function PerfilFormConIA({
  cargoId,
  tieneTaller,
  cargosParaCopiar,
  valoresIniciales,
  ...resto
}: PerfilFormProps & { cargoId: string; tieneTaller: boolean; cargosParaCopiar: CargoParaCopiar[] }) {
  const [valores, setValores] = useState(valoresIniciales);
  const [version, setVersion] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [generado, setGenerado] = useState(false);

  const [origenId, setOrigenId] = useState("");
  const [copiando, startCopia] = useTransition();
  const [errorCopia, setErrorCopia] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

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

  function copiar() {
    setErrorCopia(null);
    setCopiado(false);
    startCopia(async () => {
      const resultado = await copiarPerfilAction(cargoId, origenId);
      if (resultado.error) {
        setErrorCopia(resultado.error);
        return;
      }
      if (resultado.borrador) {
        setValores(resultado.borrador);
        setVersion((v) => v + 1);
        setCopiado(true);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {cargosParaCopiar.length > 0 && (
        <div className="card flex flex-col gap-3 p-4">
          <div>
            <p className="text-[13.5px] font-medium text-gray-800">Copiar de otro perfil</p>
            <p className="text-[12.5px] text-[var(--color-texto-suave)]">
              Completa con el contenido de un cargo parecido los campos que todavía estén vacíos. Nada se guarda
              hasta que revises y le des a &quot;Guardar perfil&quot;.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={origenId}
              onChange={(e) => setOrigenId(e.target.value)}
              className="min-w-[260px] flex-1 rounded-lg border border-[var(--color-borde)] px-3 py-2 text-[13px]"
            >
              <option value="">Selecciona un cargo…</option>
              {cargosParaCopiar.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} — {c.departamento} ({etiqueta(ETIQUETAS_ESTADO_PERFIL, c.estado)})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={copiar}
              disabled={copiando || !origenId}
              className="btn-secondary shrink-0 px-4 py-2"
            >
              {copiando ? "Copiando…" : "Copiar este perfil"}
            </button>
          </div>
          {errorCopia && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{errorCopia}</p>}
          {copiado && !errorCopia && (
            <p className="rounded-lg bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-800">
              Se completaron los campos vacíos con el contenido del perfil copiado — revisa cada uno antes de
              guardar.
            </p>
          )}
        </div>
      )}

      {tieneTaller && (
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
      )}
      {tieneTaller && error && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}
      {tieneTaller && generado && !error && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-800">
          Se completaron los campos vacíos con un borrador de IA — revisa cada uno antes de guardar.
        </p>
      )}
      <PerfilForm key={version} {...resto} valoresIniciales={valores} />
    </div>
  );
}
