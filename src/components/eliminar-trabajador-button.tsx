"use client";

import { eliminarTrabajadorAction } from "@/app/actions/trabajadores";

export function EliminarTrabajadorButton({ trabajadorId }: { trabajadorId: string }) {
  return (
    <form
      action={eliminarTrabajadorAction.bind(null, trabajadorId)}
      onSubmit={(e) => {
        if (!confirm("¿Eliminar este trabajador?")) e.preventDefault();
      }}
    >
      <button type="submit" className="link-danger text-[12.5px]">
        Eliminar
      </button>
    </form>
  );
}
