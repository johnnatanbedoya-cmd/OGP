import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requerirAccesoEmpresa } from "@/lib/auth";
import { obtenerCargoConPerfil, obtenerVersiones } from "@/lib/perfil-data";
import { PerfilPdf } from "@/lib/pdf/perfil-pdf";
import { slug } from "@/lib/slug";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const cargoBasico = await prisma.cargo.findUnique({ where: { id }, select: { empresaId: true } });
  if (!cargoBasico) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }
  await requerirAccesoEmpresa(cargoBasico.empresaId);

  const cargo = await obtenerCargoConPerfil(id, cargoBasico.empresaId);
  if (!cargo || !cargo.perfil) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  const versiones = await obtenerVersiones(cargo.perfil.id, cargoBasico.empresaId);
  const buffer = await renderToBuffer(<PerfilPdf {...cargo} versiones={versiones} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="perfil-${slug(cargo.nombre)}.pdf"`,
    },
  });
}
