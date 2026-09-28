import Link from "next/link";
import { requerirConsultor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { EmpresaForm } from "@/components/empresa-form";
import { ETIQUETAS_NIVEL_ACCESO, claseBadgeNivelAcceso } from "@/lib/etiquetas";

export default async function EmpresasPage() {
  const session = await requerirConsultor();

  const empresas = await prisma.empresa.findMany({
    where: { cuentaId: session.cuentaId },
    orderBy: { nombre: "asc" },
    include: { _count: { select: { departamentos: true } }, usuario: { select: { email: true } } },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader nombreUsuario={session.nombre} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <span className="badge badge-indigo mb-2">Panel del consultor</span>
        <h1 className="mb-8 font-heading text-[24px] font-bold text-gray-900">Empresas</h1>

        <div className="card mb-8 p-6">
          <h2 className="mb-4 text-[14.5px] font-semibold text-gray-900">Nueva empresa</h2>
          <EmpresaForm />
        </div>

        {empresas.length === 0 ? (
          <div className="card px-6 py-16 text-center text-[var(--color-texto-suave)]">
            Todavía no has creado ninguna empresa.
          </div>
        ) : (
          <div className="card overflow-hidden">
            {empresas.map((e) => (
              <Link key={e.id} href={`/empresas/${e.id}`} className="card-row">
                <div>
                  <p className="text-[14.5px] font-semibold text-gray-900">{e.nombre}</p>
                  <p className="text-[13px] text-[var(--color-texto-suave)]">
                    {e.usuario?.email ?? "Sin usuario de acceso"} · {e._count.departamentos}{" "}
                    {e._count.departamentos === 1 ? "departamento" : "departamentos"}
                  </p>
                </div>
                <span className={`badge ${claseBadgeNivelAcceso(e.nivelAcceso)}`}>
                  {ETIQUETAS_NIVEL_ACCESO[e.nivelAcceso] ?? e.nivelAcceso}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
