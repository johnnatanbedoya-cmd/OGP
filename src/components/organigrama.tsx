import type { NodoOrganigrama } from "@/lib/organigrama-data";
import { idsDeSubarbol } from "@/lib/organigrama-data";
import { ETIQUETAS_NIVEL_JERARQUICO, claseBadgeNivelJerarquico, etiqueta } from "@/lib/etiquetas";
import { CambiarJefeSelect } from "@/components/cambiar-jefe-select";
import { OrganigramaZoom } from "@/components/organigrama-zoom";

function NodoCargo({
  nodo,
  todosCargos,
  puedeGestionarEstructura,
}: {
  nodo: NodoOrganigrama;
  todosCargos: { id: string; nombre: string }[];
  puedeGestionarEstructura: boolean;
}) {
  // No puede ser su propio jefe, ni el jefe de uno de sus propios subordinados.
  const excluidos = new Set(idsDeSubarbol(nodo));
  const opciones = todosCargos.filter((c) => !excluidos.has(c.id));

  return (
    <li>
      <div className="org-node">
        <span className={`badge ${claseBadgeNivelJerarquico(nodo.nivelJerarquico)}`}>
          {etiqueta(ETIQUETAS_NIVEL_JERARQUICO, nodo.nivelJerarquico)}
        </span>
        <p className="font-heading text-[13.5px] font-bold leading-tight text-gray-900">{nodo.nombre}</p>
        <p className="text-[11px] text-[var(--color-texto-suave)]">{nodo.departamento}</p>
        <p className="text-[12px] text-gray-700">
          {nodo.trabajadores.length > 0 ? nodo.trabajadores.join(", ") : <span className="italic text-[var(--color-texto-suave)]">Vacante</span>}
        </p>
        {puedeGestionarEstructura && (
          <div className="no-imprimir">
            <CambiarJefeSelect cargoId={nodo.id} jefeActualId={nodo.jefeInmediatoId} opciones={opciones} />
          </div>
        )}
      </div>
      {nodo.hijos.length > 0 && (
        <ul>
          {nodo.hijos.map((hijo) => (
            <NodoCargo key={hijo.id} nodo={hijo} todosCargos={todosCargos} puedeGestionarEstructura={puedeGestionarEstructura} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function Organigrama({
  nombreEmpresa,
  raices,
  puedeGestionarEstructura,
}: {
  nombreEmpresa: string;
  raices: NodoOrganigrama[];
  puedeGestionarEstructura: boolean;
}) {
  if (raices.length === 0) {
    return (
      <div className="card px-6 py-16 text-center text-[var(--color-texto-suave)]">
        Todavía no hay cargos creados para dibujar un organigrama.
      </div>
    );
  }

  function recolectarNodos(nodos: NodoOrganigrama[]): { id: string; nombre: string }[] {
    return nodos.flatMap((n) => [{ id: n.id, nombre: n.nombre }, ...recolectarNodos(n.hijos)]);
  }
  const listaCargos = recolectarNodos(raices);

  return (
    <div className="card p-8">
      {puedeGestionarEstructura && (
        <p className="no-imprimir mb-4 text-[12.5px] text-[var(--color-texto-suave)]">
          Cambia el selector debajo de cualquier cargo para reasignar su jefe inmediato — se guarda al instante.
        </p>
      )}
      <OrganigramaZoom>
        <ul className="org-tree">
          <li>
            <div className="org-node org-node-root">
              <p className="font-heading text-[14px] font-bold">{nombreEmpresa}</p>
            </div>
            <ul>
              {raices.map((raiz) => (
                <NodoCargo key={raiz.id} nodo={raiz} todosCargos={listaCargos} puedeGestionarEstructura={puedeGestionarEstructura} />
              ))}
            </ul>
          </li>
        </ul>
      </OrganigramaZoom>
    </div>
  );
}
