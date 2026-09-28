import { NextResponse } from "next/server";
import { requerirAccesoEmpresa } from "@/lib/auth";
import { generarPlantillaTrabajadoresXlsx } from "@/lib/importar-trabajadores";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requerirAccesoEmpresa(id);

  const buffer = await generarPlantillaTrabajadoresXlsx();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="plantilla-trabajadores.xlsx"`,
    },
  });
}
