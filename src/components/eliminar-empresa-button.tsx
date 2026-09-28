"use client";

import { eliminarEmpresaAction } from "@/app/actions/empresas";

export function EliminarEmpresaButton({ empresaId }: { empresaId: string }) {
  return (
    <form
      action={eliminarEmpresaAction.bind(null, empresaId)}
      onSubmit={(e) => {
        if (
          !confirm(
            "¿Eliminar esta empresa? Se eliminarán también todos sus departamentos, cargos, perfiles y su usuario de acceso. Esta acción no se puede deshacer."
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="link-danger">
        Eliminar empresa
      </button>
    </form>
  );
}
