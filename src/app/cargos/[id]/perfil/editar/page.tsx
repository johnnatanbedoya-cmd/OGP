import { notFound } from "next/navigation";
import { requerirGestionPerfil } from "@/lib/auth";
import {
  obtenerCargoConPerfil,
  contarCargosConMismoNombre,
  mapearPerfilAValoresFormulario,
  listarCargosParaCopiarPerfil,
} from "@/lib/perfil-data";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { type PerfilDefaultValues, perfilVacio } from "@/lib/perfil-defaults";
import { PerfilFormConIA } from "@/components/perfil-form-con-ia";
import { TallerReferencia } from "@/components/taller-referencia";
import { guardarPerfilAction } from "@/app/actions/perfiles";
import { obtenerUltimoTallerPorBloque } from "@/lib/taller-data";
import { obtenerComunesParaCargo } from "@/lib/comunes-data";

export default async function EditarPerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const cargoBasico = await prisma.cargo.findUnique({ where: { id }, select: { empresaId: true } });
  if (!cargoBasico) notFound();
  const { session } = await requerirGestionPerfil(cargoBasico.empresaId);

  const cargo = await obtenerCargoConPerfil(id, cargoBasico.empresaId);
  if (!cargo) notFound();

  const otrosCargos = await prisma.cargo.findMany({
    where: { empresaId: cargoBasico.empresaId, id: { not: cargo.id } },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true },
  });

  const {
    funciones: funcionesComunes,
    competencias: competenciasComunes,
    responsabilidadesSst: responsabilidadesSstComunes,
  } = await obtenerComunesParaCargo(cargoBasico.empresaId, cargo.nivelJerarquico);

  const sugerenciaNumeroPuestos = await contarCargosConMismoNombre(cargoBasico.empresaId, cargo.departamentoId, cargo.nombre);

  const perfil = cargo.perfil;
  // Cargo sin Perfil todavía: se pre-llena de una vez con las funciones y
  // competencias comunes que apliquen (alcance "todos" o su nivel
  // jerárquico) — no hay nada que sobreescribir porque no existía Perfil.
  // Si el Perfil ya existía, no se auto-inyecta nada (se respeta lo que el
  // consultor ya escribió o quitó); el botón "Aplicar..." del formulario
  // sigue disponible para agregarlas a mano si hace falta.
  const valoresIniciales: PerfilDefaultValues = perfil
    ? {
        ...mapearPerfilAValoresFormulario(perfil),
        numeroPuestos: perfil.numeroPuestos != null ? String(perfil.numeroPuestos) : String(sugerenciaNumeroPuestos),
      }
    : {
        ...perfilVacio,
        numeroPuestos: String(sugerenciaNumeroPuestos),
        funciones: funcionesComunes.map((f) => ({
          descripcion: f.descripcion,
          frecuencia: f.frecuencia ?? "diaria",
          criterioDesempeno: f.criterioDesempeno ?? "",
          porcentajeTiempo: "",
        })),
        competencias: competenciasComunes.map((c) => ({
          nombre: c.nombre,
          tipo: "organizacional",
          nivelRequerido: c.nivelRequerido,
        })),
        responsabilidadesSst: responsabilidadesSstComunes.map((r) => ({ descripcion: r.descripcion })),
      };

  const respuestasTaller = await obtenerUltimoTallerPorBloque(id);
  const cargosParaCopiar = await listarCargosParaCopiarPerfil(cargoBasico.empresaId, cargo.id, cargo.nombre);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader nombreUsuario={session.nombre} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <span className="badge badge-indigo mb-2">Perfil ocupacional</span>
        <h1 className="mb-1 font-heading text-[22px] font-bold text-gray-900">{cargo.nombre}</h1>
        <p className="mb-6 text-[13.5px] text-[var(--color-texto-suave)]">
          Cada vez que guardes se crea una nueva versión en el historial.
        </p>
        <div className="mb-6">
          <TallerReferencia cargoId={cargo.id} respuestas={respuestasTaller} />
        </div>
        <PerfilFormConIA
          cargoId={cargo.id}
          tieneTaller={Object.keys(respuestasTaller).length > 0}
          cargosParaCopiar={cargosParaCopiar}
          action={guardarPerfilAction.bind(null, cargo.id)}
          otrosCargos={otrosCargos}
          valoresIniciales={valoresIniciales}
          nivelJerarquico={cargo.nivelJerarquico}
          funcionesComunes={funcionesComunes.map((f) => ({
            descripcion: f.descripcion,
            frecuencia: f.frecuencia ?? "diaria",
            criterioDesempeno: f.criterioDesempeno ?? "",
          }))}
          competenciasComunes={competenciasComunes.map((c) => ({ nombre: c.nombre, nivelRequerido: c.nivelRequerido }))}
          responsabilidadesSstComunes={responsabilidadesSstComunes.map((r) => ({ descripcion: r.descripcion }))}
          sugerenciaNumeroPuestos={sugerenciaNumeroPuestos}
        />
      </main>
    </div>
  );
}
