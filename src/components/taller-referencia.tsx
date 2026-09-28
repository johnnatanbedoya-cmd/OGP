import { BLOQUES_TALLER } from "@/lib/taller-preguntas";

/** Referencia de solo lectura de lo que respondió el taller — para consultar
 * mientras se redacta el Perfil, sin que nada se copie automáticamente
 * todavía (eso es la Fase 3, motor de estandarización con IA). */
export function TallerReferencia({
  cargoId,
  respuestas,
}: {
  cargoId: string;
  respuestas: Record<string, Record<string, string>>;
}) {
  const tieneAlgo = Object.keys(respuestas).length > 0;
  if (!tieneAlgo) return null;

  return (
    <details className="card p-5">
      <summary className="cursor-pointer font-heading text-[14.5px] font-bold text-gray-900">
        Ver respuestas del taller (referencia)
      </summary>
      <div className="mt-4 flex flex-col gap-4 pl-1">
        {BLOQUES_TALLER.map(({ bloque, titulo, preguntas }) => {
          const datos = respuestas[bloque];
          if (!datos || Object.keys(datos).length === 0) return null;
          return (
            <div key={bloque}>
              <p className="mb-1.5 text-[12.5px] font-semibold uppercase tracking-wide text-[var(--color-texto-suave)]">
                Bloque {bloque} · {titulo}
              </p>
              <ul className="space-y-2">
                {preguntas.map((p) => {
                  const respuesta = datos[p.clave];
                  if (!respuesta) return null;
                  return (
                    <li key={p.clave} className="text-[13.5px]">
                      <span className="text-[var(--color-texto-suave)]">{p.texto}</span>
                      <br />
                      {respuesta}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
      <a href={`/cargos/${cargoId}/taller`} className="link-quiet mt-4 inline-block">
        Actualizar respuestas del taller
      </a>
    </details>
  );
}
