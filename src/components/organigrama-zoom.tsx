"use client";

import { useEffect, useRef, useState } from "react";

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 1.5;
const ZOOM_PASO = 0.1;

// Área imprimible en px CSS (96px/pulgada) para el @page de globals.css:
// "landscape" + márgenes de 12mm sobre A4 (297x210mm) => 273x186mm útiles.
const PX_POR_MM = 96 / 25.4;
const ANCHO_IMPRIMIBLE_PX = (297 - 24) * PX_POR_MM;
const ALTO_IMPRIMIBLE_PX = (210 - 24) * PX_POR_MM;

export function OrganigramaZoom({ children }: { children: React.ReactNode }) {
  const [zoom, setZoom] = useState(1);
  const contenidoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // El tamaño natural del árbol (scrollWidth/Height) no lo afecta el zoom
    // en pantalla — un transform:scale no cambia el tamaño de layout del
    // elemento, solo su pintado — así que sirve tal cual para calcular cuánto
    // hay que encoger el organigrama para que quepa en una sola hoja impresa.
    function ajustarEscalaDeImpresion() {
      const el = contenidoRef.current;
      if (!el) return;
      const escala = Math.min(1, ANCHO_IMPRIMIBLE_PX / el.scrollWidth, ALTO_IMPRIMIBLE_PX / el.scrollHeight);
      el.style.setProperty("--print-zoom", String(escala));
    }
    window.addEventListener("beforeprint", ajustarEscalaDeImpresion);
    return () => window.removeEventListener("beforeprint", ajustarEscalaDeImpresion);
  }, []);

  return (
    <div>
      <div className="no-imprimir mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_PASO) * 100) / 100))}
          disabled={zoom <= ZOOM_MIN}
          aria-label="Alejar"
          className="btn-secondary px-3 py-1.5 text-[15px] leading-none"
        >
          −
        </button>
        <span className="w-12 text-center font-mono text-[13px] text-[var(--color-texto-suave)]">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_PASO) * 100) / 100))}
          disabled={zoom >= ZOOM_MAX}
          aria-label="Acercar"
          className="btn-secondary px-3 py-1.5 text-[15px] leading-none"
        >
          +
        </button>
        {zoom !== 1 && (
          <button type="button" onClick={() => setZoom(1)} className="link-quiet text-[13px]">
            Restablecer
          </button>
        )}
      </div>
      <div className="org-zoom-scroll overflow-auto">
        <div
          ref={contenidoRef}
          className="org-zoom-inner"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top left", width: "fit-content" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
