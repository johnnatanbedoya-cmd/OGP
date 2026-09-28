import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Toda página de la app depende de la cookie de sesión (quién sos decide
  // qué ves) — nunca debe quedar en una caché compartida (CDN/edge). Respaldo
  // del mismo header que ya pone src/proxy.ts en cada respuesta, por si
  // alguna ruta llegara a saltarse el proxy.
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
