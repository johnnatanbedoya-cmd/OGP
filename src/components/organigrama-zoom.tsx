"use client";

import { useState } from "react";

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 1.5;
const ZOOM_PASO = 0.1;

export function OrganigramaZoom({ children }: { children: React.ReactNode }) {
  const [zoom, setZoom] = useState(1);

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
      <div className="overflow-auto">
        <div className="org-zoom-inner" style={{ transform: `scale(${zoom})`, transformOrigin: "top left", width: "fit-content" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
