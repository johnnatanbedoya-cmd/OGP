import Link from "next/link";
import { requerirAccesoEmpresa } from "@/lib/auth";
import { rutaEmpresaHomePara } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { ImportarTrabajadoresForm } from "@/components/importar-trabajadores-form";
import { TrabajadorRow } from "@/components/trabajador-row";
import { EnviarTallerMasivoButton } from "@/components/enviar-taller-masivo-button";
import { ETIQUETAS_NIVEL_ACCESO } from "@/lib/etiquetas";

export default async function TrabajadoresPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, empresa, esConsultor, puedeGestionarEstructura, puedeEditarPerfiles } = await requerirAccesoEmpresa(id);
  const contexto = session.rol === "empresa" ? ETIQUETAS_NIVEL_ACCESO[empresa.nivelAcceso] : undefined;

  const trabajadores = await prisma.trabajador.findMany({
    where: { empresaId: id },
    orderBy: { nombres: "asc" },
    include: { cargo: { select: { nombre: true, departamento: { select: { nombre: true } } } } },
  });

  // Informe de costo de IA — solo lo ve el consultor (es su propio gasto de
  // API, no algo que le corresponda ver a la empresa cliente).
  const generacionesIa = esConsultor
    ? await prisma.generacionIaPerfil.findMany({
        where: { empresaId: id },
        orderBy: { createdAt: "desc" },
        include: { cargo: { select: { nombre: true, trabajadores: { select: { nombres: true } } } } },
      })
    : [];
  const costoTotalIa = generacionesIa.reduce((suma, g) => suma + g.costoUsd, 0);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader nombreUsuario={session.nombre} contexto={contexto} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <Link href={rutaEmpresaHomePara(session, id)} className="link-quiet mb-4 inline-block">
          ← Volver a {empresa.nombre}
        </Link>
        <h1 className="mb-8 font-heading text-[24px] font-bold text-gray-900">Trabajadores</h1>

        {puedeGestionarEstructura && (
          <div className="card mb-8 p-6">
            <h2 className="mb-3 text-[14.5px] font-semibold text-gray-900">Cargar trabajadores</h2>
            <ImportarTrabajadoresForm empresaId={id} />
          </div>
        )}

        {puedeEditarPerfiles && trabajadores.length > 0 && (
          <div className="card mb-8 p-6">
            <h2 className="mb-1 text-[14.5px] font-semibold text-gray-900">Taller de campo</h2>
            <p className="mb-3 text-[12.5px] text-[var(--color-texto-suave)]">
              Envía por correo el enlace de autoservicio a todos los trabajadores activos que todavía no lo hayan
              completado — los que no tengan correo registrado quedan por fuera.
            </p>
            <EnviarTallerMasivoButton empresaId={id} />
          </div>
        )}

        {esConsultor && generacionesIa.length > 0 && (
          <div className="card mb-8 overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--color-borde)] px-6 py-4">
              <div>
                <h2 className="text-[14.5px] font-semibold text-gray-900">Costo de generación con IA</h2>
                <p className="text-[12px] text-[var(--color-texto-suave)]">
                  Gasto real de la API de Anthropic al generar borradores con IA para esta empresa — visible solo
                  para ti.
                </p>
              </div>
              <p className="font-mono text-[20px] font-bold text-[var(--color-marca)]">
                ${costoTotalIa.toFixed(4)}
              </p>
            </div>
            {generacionesIa.map((g) => (
              <div key={g.id} className="card-row">
                <div>
                  <p className="text-[13.5px] font-semibold text-gray-900">{g.cargo.nombre}</p>
                  <p className="text-[12px] text-[var(--color-texto-suave)]">
                    {g.cargo.trabajadores.length > 0
                      ? g.cargo.trabajadores.map((t) => t.nombres).join(", ")
                      : "Sin trabajador asignado"}
                    {" · "}
                    {g.tokensEntrada.toLocaleString("es-CO")} tokens entrada, {g.tokensSalida.toLocaleString("es-CO")}{" "}
                    tokens salida
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[13.5px] font-semibold text-gray-900">${g.costoUsd.toFixed(4)}</p>
                  <p className="text-[11.5px] text-[var(--color-texto-suave)]">
                    {g.createdAt.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {trabajadores.length === 0 ? (
          <div className="card px-6 py-16 text-center text-[var(--color-texto-suave)]">
            Esta empresa todavía no tiene trabajadores cargados.
          </div>
        ) : (
          <div className="card overflow-hidden">
            {trabajadores.map((t) => (
              <TrabajadorRow key={t.id} trabajador={t} puedeEditar={puedeGestionarEstructura} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
