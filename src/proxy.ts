import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  calcularProximaExpiracion,
  rutaInicioPara,
  signSession,
  verifySession,
} from "@/lib/session";

// /t/[token] es el enlace de autoservicio del Taller: el trabajador entra sin
// sesión, validado solo por el token del link (ver InvitacionTaller en
// prisma/schema.prisma y src/app/t/[token]/page.tsx). /login-reunion.jpg es
// la foto de fondo del propio login (en /public) — sin esto, cualquier
// petición sin sesión a ese archivo (incluida la del optimizador de
// next/image) cae en el redirect de abajo en vez de servir la imagen.
const RUTAS_PUBLICAS = ["/login", "/t", "/login-reunion.jpg"];

/**
 * Toda respuesta que pasa por acá es específica de la sesión de quien la
 * pidió — nunca debe quedar en una caché compartida (CDN/edge). Ver también
 * el `headers()` de next.config.ts, como respaldo por si alguna respuesta
 * llegara a saltarse este proxy.
 */
function sinCache<T extends NextResponse>(response: T): T {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}

/**
 * Protege rutas, evita que un usuario ya logueado vea /login de nuevo, y
 * renueva la cookie de sesión en cada petición mientras haya actividad
 * (expiración por inactividad de 15 min, ver session.ts).
 */
export async function proxy(request: NextRequest) {
  // Los Server Actions (login, logout, crear/editar/borrar un perfil) llegan
  // acá como POST a la misma ruta donde se invocan — nunca deben toparse con
  // la lógica de sesión de abajo, porque cada uno ya maneja su propia sesión.
  // Dejarlos pasar sin tocar nada evita una condición de carrera conocida:
  // que este proxy renueve/borre la cookie de la sesión ANTERIOR justo
  // cuando la Server Action está reemplazándola o destruyéndola.
  if (request.method !== "GET") {
    return sinCache(NextResponse.next());
  }

  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  const esRutaPublica = RUTAS_PUBLICAS.some(
    (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`)
  );

  if (!session && !esRutaPublica) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return sinCache(NextResponse.redirect(loginUrl));
  }

  if (session && pathname === "/login") {
    return sinCache(NextResponse.redirect(new URL(rutaInicioPara(session), request.url)));
  }

  if (!session || typeof session.loginTimestamp !== "number") {
    return sinCache(NextResponse.next());
  }

  // Tope absoluto de 8h desde el login, pase lo que pase.
  if (calcularProximaExpiracion(session.loginTimestamp) * 1000 <= Date.now()) {
    if (!esRutaPublica) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      const response = sinCache(NextResponse.redirect(loginUrl));
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }
    const response = sinCache(NextResponse.next());
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  // Sigue activo dentro de la ventana de 15 min: renueva la cookie.
  const response = sinCache(NextResponse.next());
  const tokenRenovado = await signSession(session);
  response.cookies.set(SESSION_COOKIE_NAME, tokenRenovado, SESSION_COOKIE_OPTIONS);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
