import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth";
import { rutaInicioPara } from "@/lib/session";

export default async function Home() {
  const session = await obtenerSesion();
  redirect(session ? rutaInicioPara(session) : "/login");
}
