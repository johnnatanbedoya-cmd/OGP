"use client";

import { useActionState } from "react";
import type { DepartamentoState } from "@/app/actions/departamentos";

type FormAction = (prevState: DepartamentoState, formData: FormData) => Promise<DepartamentoState>;

export function DepartamentoForm({
  action,
  valoresIniciales = { nombre: "", descripcion: "" },
  etiquetaEnvio = "Crear",
}: {
  action: FormAction;
  valoresIniciales?: { nombre: string; descripcion: string };
  etiquetaEnvio?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="nombre" className="label-field">
          Nombre
        </label>
        <input id="nombre" name="nombre" required defaultValue={valoresIniciales.nombre} className="input-field" placeholder="Ej. Talento Humano" />
      </div>
      <div className="flex-1">
        <label htmlFor="descripcion" className="label-field">
          Descripción (opcional)
        </label>
        <input id="descripcion" name="descripcion" defaultValue={valoresIniciales.descripcion} className="input-field" />
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Guardando…" : etiquetaEnvio}
      </button>
      {state.error && (
        <p className="text-[13px] text-red-600 sm:basis-full" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
