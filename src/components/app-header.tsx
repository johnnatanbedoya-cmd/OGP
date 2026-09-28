import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";

export function AppHeader({ nombreUsuario, contexto }: { nombreUsuario: string; contexto?: string }) {
  return (
    <header className="no-imprimir sticky top-0 z-10 flex items-center justify-between bg-[#14161B] px-6 py-3.5">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-marca)] shadow-sm">
          <span className="h-2.5 w-2.5 rounded-full bg-white" />
        </span>
        <span className="font-heading text-[16px] font-bold tracking-tight text-white">OGP</span>
        <span className="hidden text-[13px] text-white/50 sm:inline">Perfiles Ocupacionales</span>
      </Link>
      <div className="flex items-center gap-4">
        {contexto && <span className="badge bg-white/10 text-white/80">{contexto}</span>}
        <span className="text-[13.5px] text-white/70">{nombreUsuario}</span>
        <form action={logoutAction}>
          <button type="submit" className="text-[13.5px] font-medium text-white/60 transition-colors hover:text-white">
            Cerrar sesión
          </button>
        </form>
      </div>
    </header>
  );
}
