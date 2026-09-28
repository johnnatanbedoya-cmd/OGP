"use client";

import { useActionState, useState } from "react";
import { crearEmpresaAction, type EmpresaState } from "@/app/actions/empresas";
import { PasswordInput } from "@/components/password-input";
import { NIVELES_ACCESO_EMPRESA } from "@/lib/validaciones";
import { ETIQUETAS_NIVEL_ACCESO, DESCRIPCIONES_NIVEL_ACCESO } from "@/lib/etiquetas";

const initialState: EmpresaState = {};

export function EmpresaForm() {
  const [state, formAction, pending] = useActionState(crearEmpresaAction, initialState);
  const [nivelAcceso, setNivelAcceso] = useState<string>("lectura");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="label-field" htmlFor="nombre">
          Nombre de la empresa
        </label>
        <input id="nombre" name="nombre" required className="input-field" placeholder="Ej. Acme S.A.S." />
      </div>

      <div>
        <label className="flex items-start gap-2 text-[13.5px] text-gray-700">
          <input
            type="checkbox"
            name="tieneJuntaDirectiva"
            defaultChecked
            className="mt-0.5 h-4 w-4 rounded border-gray-300"
          />
          <span>
            Crear automáticamente &ldquo;Junta Directiva&rdquo; como cargo raíz
            <span className="block text-[12px] text-[var(--color-texto-suave)]">
              Desmárcalo si esta empresa no tiene junta directiva y su jerarquía arranca directo en otro cargo (ej.
              Gerencia General) — la empresa nace sin departamentos ni cargos, para que armes la raíz a tu manera.
            </span>
          </span>
        </label>
      </div>

      <div>
        <label className="label-field" htmlFor="nivelAcceso">
          Nivel de acceso de su usuario
        </label>
        <select
          id="nivelAcceso"
          name="nivelAcceso"
          value={nivelAcceso}
          onChange={(e) => setNivelAcceso(e.target.value)}
          className="input-field"
        >
          {NIVELES_ACCESO_EMPRESA.map((v) => (
            <option key={v} value={v}>
              {ETIQUETAS_NIVEL_ACCESO[v]}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[12px] text-[var(--color-texto-suave)]">{DESCRIPCIONES_NIVEL_ACCESO[nivelAcceso]}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label-field" htmlFor="usuarioNombre">
            Nombre del usuario de acceso
          </label>
          <input id="usuarioNombre" name="usuarioNombre" required className="input-field" placeholder="Ej. María Pérez" />
        </div>
        <div>
          <label className="label-field" htmlFor="usuarioEmail">
            Correo del usuario de acceso
          </label>
          <input
            id="usuarioEmail"
            name="usuarioEmail"
            type="email"
            required
            className="input-field"
            placeholder="contacto@empresa.com"
          />
        </div>
      </div>

      <div>
        <label className="label-field" htmlFor="usuarioPassword">
          Contraseña inicial
        </label>
        <PasswordInput
          id="usuarioPassword"
          name="usuarioPassword"
          required
          minLength={8}
          className="input-field"
          placeholder="Mínimo 8 caracteres"
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <div>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Creando…" : "Crear empresa"}
        </button>
      </div>
    </form>
  );
}
