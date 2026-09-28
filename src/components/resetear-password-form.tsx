"use client";

import { useActionState, useState } from "react";
import { resetearPasswordEmpresaAction, type ResetearPasswordState } from "@/app/actions/empresas";
import { PasswordInput } from "@/components/password-input";

export function ResetearPasswordForm({ empresaId }: { empresaId: string }) {
  const [abierto, setAbierto] = useState(false);
  const [state, formAction, pending] = useActionState(resetearPasswordEmpresaAction.bind(null, empresaId), {
    error: undefined,
    success: undefined,
  } as ResetearPasswordState);

  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)} className="link-quiet">
        Resetear contraseña
      </button>
    );
  }

  return (
    <form action={formAction} className="flex items-end gap-2">
      <div className="flex-1">
        <label className="label-field" htmlFor="password">
          Nueva contraseña
        </label>
        <PasswordInput id="password" name="password" required minLength={8} className="input-field" placeholder="Mínimo 8 caracteres" />
      </div>
      <button type="submit" disabled={pending} className="btn-secondary">
        {pending ? "Guardando…" : "Confirmar"}
      </button>
      <button type="button" onClick={() => setAbierto(false)} className="link-quiet">
        Cancelar
      </button>
      {state.error && (
        <p className="text-[13px] text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-[13px] text-emerald-600" role="status">
          Contraseña actualizada.
        </p>
      )}
    </form>
  );
}
