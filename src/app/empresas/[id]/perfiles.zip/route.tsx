import { NextResponse } from "next/server";
import JSZip from "jszip";
import { renderToBuffer } from "@react-pdf/renderer";
import { requerirAccesoEmpresa } from "@/lib/auth";
import { obtenerCargosPublicadosParaExportar, obtenerVersiones } from "@/lib/perfil-data";
import { PerfilPdf } from "@/lib/pdf/perfil-pdf";
import { generarPerfilDocx } from "@/lib/reportes/perfil-docx";
import { slug } from "@/lib/slug";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: empresaId } = await params;
  const { empresa } = await requerirAccesoEmpresa(empresaId);

  const cargos = await obtenerCargosPublicadosParaExportar(empresaId);
  if (cargos.length === 0) {
    return NextResponse.json({ error: "Esta empresa todavía no tiene perfiles publicados para exportar." }, { status: 404 });
  }

  const zip = new JSZip();

  // Dos cargos pueden compartir el mismo nombre (esta app lo permite a
  // propósito — dos "Analista de Nómina" en el mismo departamento son dos
  // puestos válidos), así que el nombre de archivo solo, o con
  // departamento, todavía puede chocar: se desambigua con un contador.
  const nombresUsados = new Map<string, number>();
  function nombreArchivoUnico(cargo: (typeof cargos)[number]): string {
    const base = slug(`${cargo.nombre}-${cargo.departamento.nombre}`);
    const usos = nombresUsados.get(base) ?? 0;
    nombresUsados.set(base, usos + 1);
    return usos === 0 ? base : `${base}-${usos + 1}`;
  }

  await Promise.all(
    cargos.map(async (cargo) => {
      const versiones = await obtenerVersiones(cargo.perfil!.id, empresaId);
      const nombreArchivo = nombreArchivoUnico(cargo);
      const [pdfBuffer, docxBuffer] = await Promise.all([
        renderToBuffer(<PerfilPdf {...cargo} versiones={versiones} />),
        generarPerfilDocx(cargo, versiones),
      ]);
      zip.file(`${nombreArchivo}.pdf`, pdfBuffer);
      zip.file(`${nombreArchivo}.docx`, docxBuffer);
    })
  );

  const buffer = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="perfiles-${slug(empresa.nombre)}.zip"`,
    },
  });
}
