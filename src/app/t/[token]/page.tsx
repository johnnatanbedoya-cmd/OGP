import { prisma } from "@/lib/prisma";
import { hashTokenInvitacion, invitacionVencida } from "@/lib/taller-invitaciones";
import { TallerAutoservicioForm } from "@/components/taller-autoservicio-form";

export default async function TallerAutoservicioPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const invitacion = await prisma.invitacionTaller.findUnique({
    where: { tokenHash: hashTokenInvitacion(token) },
    include: { trabajador: { include: { cargo: true } } },
  });
  const vencida = invitacion ? invitacionVencida(invitacion.expiresAt) : false;

  return (
    <div className="flex min-h-screen justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex justify-center">
          <span className="font-heading flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-marca)] text-[13px] font-bold text-white">
            OGP
          </span>
        </div>

        {!invitacion ? (
          <Mensaje
            titulo="Enlace inválido"
            texto="Este enlace no existe o ya no es válido. Pide uno nuevo a quien te lo compartió."
          />
        ) : vencida ? (
          <Mensaje
            titulo="Enlace vencido"
            texto="Este enlace ya venció. Pide uno nuevo a quien te lo compartió."
          />
        ) : invitacion.completadaEn ? (
          <Mensaje
            titulo="¡Gracias!"
            texto="Ya enviaste tus respuestas para este taller. Si necesitas corregir algo, pide un nuevo enlace."
          />
        ) : (
          <TallerAutoservicioForm
            token={token}
            trabajadorNombre={invitacion.trabajador.nombres}
            cargoNombre={invitacion.trabajador.cargo.nombre}
          />
        )}
      </div>
    </div>
  );
}

function Mensaje({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="card p-8 text-center">
      <h1 className="mb-2 font-heading text-[20px] font-bold text-gray-900">{titulo}</h1>
      <p className="text-[13.5px] text-[var(--color-texto-suave)]">{texto}</p>
    </div>
  );
}
