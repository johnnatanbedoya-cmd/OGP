import Image from "next/image";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-1">
      {/* Panel izquierdo: foto de una reunión de trabajo, con movimiento — oculto en pantallas angostas */}
      <div className="relative flex flex-[1.05] flex-col justify-between overflow-hidden p-14 text-white max-[880px]:hidden">
        <div className="login-hero-foto absolute -inset-10">
          <Image src="/login-reunion.jpg" alt="" fill priority className="object-cover" style={{ objectPosition: "center 38%" }} />
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(8,12,14,0.62) 0%, rgba(8,12,14,0.18) 32%, rgba(8,12,14,0.3) 55%, rgba(6,9,10,0.93) 100%)",
          }}
        />

        <span className="font-mono absolute bottom-4 right-5 z-[2] rounded-md bg-black/30 px-2 py-1 text-[9.5px] text-white/55">
          Foto: Rawpixel Ltd · CC BY 2.0 · Wikimedia Commons
        </span>

        <div className="relative z-[2] flex items-center gap-3.5">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-marca)]"
            style={{ boxShadow: "0 6px 20px rgba(0,0,0,0.35)" }}
          >
            <span className="h-3 w-3 rounded-full bg-white" />
          </span>
          <span
            className="font-heading text-[36px] font-bold tracking-tight"
            style={{ textShadow: "0 2px 18px rgba(0,0,0,0.5)" }}
          >
            OGP
          </span>
        </div>

        <div className="relative z-[2] max-w-[460px]">
          <span
            className="login-hero-linea font-mono mb-4 block text-[12px] font-semibold uppercase tracking-[0.16em] text-[#E8B15C]"
            style={{ animationDelay: "0.1s" }}
          >
            OGP · Occupational Growth Platform
          </span>
          <h1
            className="login-hero-linea mb-3.5 font-heading text-[34px] font-bold leading-[1.2] tracking-tight"
            style={{ animationDelay: "0.32s" }}
          >
            La estructura de tu empresa, vista desde arriba.
          </h1>
          <p
            className="login-hero-linea text-[14.5px] leading-[1.65] text-white/80"
            style={{ animationDelay: "0.54s" }}
          >
            Departamentos, cargos y perfiles ocupacionales con historial de versiones, en un solo lugar — claro para
            tu equipo, sólido para auditoría.
          </p>
          <div className="login-hero-linea mt-6 flex gap-8 border-t border-white/15 pt-6" style={{ animationDelay: "0.76s" }}>
            <Estadistica valor="6" etiqueta="Bloques del perfil" />
            <Estadistica valor="∞" etiqueta="Versiones con historial" />
            <Estadistica valor="100%" etiqueta="Tuyo y de tu equipo" />
          </div>
        </div>
      </div>

      {/* Panel derecho: formulario */}
      <div className="flex flex-1 items-center justify-center bg-[var(--color-fondo)] p-8">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 hidden items-center gap-2 max-[880px]:flex">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-marca)]">
              <span className="h-2.5 w-2.5 rounded-full bg-white" />
            </span>
            <span className="font-heading text-[15px] font-bold text-gray-900">OGP</span>
          </div>

          <h2 className="mb-1.5 font-heading text-[23px] font-bold text-gray-900">Bienvenido de nuevo</h2>
          <p className="mb-8 text-sm text-[var(--color-texto-suave)]">Ingresa con tu usuario para continuar</p>

          <LoginForm />

          <p className="mt-6 text-center text-[12.5px] text-[var(--color-texto-suave)]">
            Acceso restringido · Uso profesional autorizado
          </p>
        </div>
      </div>
    </main>
  );
}

function Estadistica({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div>
      <b className="font-mono block text-[19px] font-bold text-white">{valor}</b>
      <span className="text-[12px] text-white/70">{etiqueta}</span>
    </div>
  );
}
