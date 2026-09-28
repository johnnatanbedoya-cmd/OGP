"use client";

export function EliminarComunButton({ action, id }: { action: (id: string) => Promise<void>; id: string }) {
  return (
    <form
      action={action.bind(null, id)}
      onSubmit={(e) => {
        if (!confirm("¿Quitar este elemento común? Ya no se ofrecerá para los perfiles.")) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" aria-label="Quitar" className="link-danger text-[12.5px]">
        Quitar
      </button>
    </form>
  );
}
