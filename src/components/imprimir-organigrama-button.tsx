"use client";

export function ImprimirOrganigramaButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-secondary px-4 py-2 text-[13.5px]">
      Imprimir / Exportar PDF
    </button>
  );
}
