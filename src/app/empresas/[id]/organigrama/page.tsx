import Link from "next/link";
import { requerirAccesoEmpresa } from "@/lib/auth";
import { rutaEmpresaHomePara } from "@/lib/session";
import { obtenerCargosParaOrganigrama, construirArbol } from "@/lib/organigrama-data";
import { AppHeader } from "@/components/app-header";
import { Organigrama } from "@/components/organigrama";
import { ImprimirOrganigramaButton } from "@/components/imprimir-organigrama-button";
import { ETIQUETAS_NIVEL_ACCESO } from "@/lib/etiquetas";

export default async function OrganigramaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, empresa, puedeGestionarEstructura } = await requerirAccesoEmpresa(id);
  const contexto = session.rol === "empresa" ? ETIQUETAS_NIVEL_ACCESO[empresa.nivelAcceso] : undefined;

  const cargos = await obtenerCargosParaOrganigrama(id);
  const raices = construirArbol(cargos);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader nombreUsuario={session.nombre} contexto={contexto} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <Link href={rutaEmpresaHomePara(session, id)} className="no-imprimir link-quiet mb-4 inline-block">
          ← Volver a {empresa.nombre}
        </Link>
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="font-heading text-[24px] font-bold text-gray-900">Organigrama</h1>
          <div className="no-imprimir">
            <ImprimirOrganigramaButton />
          </div>
        </div>
        <Organigrama nombreEmpresa={empresa.nombre} raices={raices} puedeGestionarEstructura={puedeGestionarEstructura} />
      </main>
    </div>
  );
}
