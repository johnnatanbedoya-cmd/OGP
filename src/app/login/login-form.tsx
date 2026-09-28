"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/actions/auth";
import { PasswordInput } from "@/components/password-input";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col">
      <div className="mb-[18px]">
        <label htmlFor="email" className="label-field">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          placeholder="tucorreo@empresa.com"
          className="input-field"
        />
      </div>
      <div className="mb-[18px]">
        <label htmlFor="password" className="label-field">
          Contraseña
        </label>
        <PasswordInput
          id="password"
          name="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="input-field"
        />
      </div>

      {state.error && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary mt-1.5 w-full py-3">
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
