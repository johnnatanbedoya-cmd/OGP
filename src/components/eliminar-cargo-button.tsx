"use client";

import { eliminarCargoAction } from "@/app/actions/cargos";

export function EliminarCargoButton({ cargoId }: { cargoId: string }) {
  return (
    <form
      action={eliminarCargoAction.bind(null, cargoId)}
      onSubmit={(e) => {
        if (!confirm("¿Eliminar este cargo y su perfil? Esta acción no se puede deshacer.")) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="link-danger">
        Eliminar
      </button>
    </form>
  );
}
