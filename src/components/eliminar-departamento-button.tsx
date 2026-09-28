"use client";

import { eliminarDepartamentoAction } from "@/app/actions/departamentos";

export function EliminarDepartamentoButton({ departamentoId }: { departamentoId: string }) {
  return (
    <form
      action={eliminarDepartamentoAction.bind(null, departamentoId)}
      onSubmit={(e) => {
        if (
          !confirm(
            "¿Eliminar este departamento? Se eliminarán también todos sus cargos y perfiles. Esta acción no se puede deshacer."
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="link-danger">
        Eliminar departamento
      </button>
    </form>
  );
}
