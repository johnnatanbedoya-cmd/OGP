"use client";

import { useActionState, useState } from "react";
import { editarTrabajadorAction, type TrabajadorState } from "@/app/actions/trabajadores";
import { EliminarTrabajadorButton } from "@/components/eliminar-trabajador-button";
import { etiqueta } from "@/lib/etiquetas";

const ETIQUETAS_ESTADO_TRABAJADOR: Record<string, string> = { activo: "Activo", inactivo: "Inactivo" };

type Trabajador = {
  id: string;
  documento: string;
  nombres: string;
  email: string | null;
  estado: string;
  fechaIngreso: Date | null;
  cargo: { nombre: string; departamento: { nombre: string } };
};

const initialState: TrabajadorState = {};

export function TrabajadorRow({ trabajador, puedeEditar }: { trabajador: Trabajador; puedeEditar: boolean }) {
  const [editando, setEditando] = useState(false);
  const [state, formAction, pending] = useActionState(editarTrabajadorAction.bind(null, trabajador.id), initialState);

  // Cierra el formulario cuando el guardado tiene éxito — ajustando el estado
  // durante el render (no en un efecto) para no disparar un render extra.
  const [ultimoGuardado, setUltimoGuardado] = useState(state.guardado);
  if (state.guardado !== ultimoGuardado) {
    setUltimoGuardado(state.guardado);
    if (state.guardado) setEditando(false);
  }

  if (editando) {
    const fechaIngresoValor = trabajador.fechaIngreso ? trabajador.fechaIngreso.toISOString().slice(0, 10) : "";
    return (
      <form action={formAction} className="flex flex-col gap-3 border-b border-[var(--color-borde)] p-4 last:border-b-0">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label-field" htmlFor={`documento-${trabajador.id}`}>
              Documento
            </label>
            <input
              id={`documento-${trabajador.id}`}
              name="documento"
              required
              defaultValue={trabajador.documento}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field" htmlFor={`nombres-${trabajador.id}`}>
              Nombres
            </label>
            <input
              id={`nombres-${trabajador.id}`}
              name="nombres"
              required
              defaultValue={trabajador.nombres}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field" htmlFor={`email-${trabajador.id}`}>
              Correo
            </label>
            <input
              id={`email-${trabajador.id}`}
              name="email"
              type="email"
              required
              defaultValue={trabajador.email ?? ""}
              placeholder="correo@empresa.com"
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field" htmlFor={`fechaIngreso-${trabajador.id}`}>
              Fecha de ingreso (opcional)
            </label>
            <input
              id={`fechaIngreso-${trabajador.id}`}
              name="fechaIngreso"
              type="date"
              defaultValue={fechaIngresoValor}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field" htmlFor={`estado-${trabajador.id}`}>
              Estado
            </label>
            <select id={`estado-${trabajador.id}`} name="estado" defaultValue={trabajador.estado} className="input-field">
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        {state.error && (
          <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700" role="alert">
            {state.error}
          </p>
        )}

        <div className="flex gap-4">
          <button type="submit" disabled={pending} className="btn-secondary">
            {pending ? "Guardando…" : "Guardar cambios"}
          </button>
          <button type="button" onClick={() => setEditando(false)} className="link-quiet">
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="card-row">
      <div>
        <p className="text-[14.5px] font-semibold text-gray-900">{trabajador.nombres}</p>
        <p className="text-[13px] text-[var(--color-texto-suave)]">
          {trabajador.documento} · {trabajador.cargo.nombre} · {trabajador.cargo.departamento.nombre}
        </p>
        <p className="text-[13px] text-[var(--color-texto-suave)]">
          {trabajador.email ?? <span className="text-amber-700">Sin correo — no se le puede enviar el taller</span>}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className={`badge ${trabajador.estado === "activo" ? "badge-emerald" : "badge-slate"}`}>
          {etiqueta(ETIQUETAS_ESTADO_TRABAJADOR, trabajador.estado)}
        </span>
        {puedeEditar && (
          <button type="button" onClick={() => setEditando(true)} className="link-quiet text-[12.5px]">
            Editar
          </button>
        )}
        {puedeEditar && <EliminarTrabajadorButton trabajadorId={trabajador.id} />}
      </div>
    </div>
  );
}
