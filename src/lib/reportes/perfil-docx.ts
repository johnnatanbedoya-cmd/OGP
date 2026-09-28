import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  BorderStyle,
  VerticalAlign,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  HeightRule,
} from "docx";
import type { CargoConPerfil } from "@/lib/perfil-data";
import { construirFichaContenido, type BloqueContenido, type VersionResumen } from "@/lib/reportes/ficha-contenido";

// Réplica de docs/plantillas/Ficha_Base_Descripcion_de_Cargo.docx: página
// carta (12240x15840 DXA), márgenes 0.79in (1138 DXA), Arial 10pt en el
// cuerpo, bordes simples negros sz=4, mismos colores de encabezado
// (E7E6E6 claro, 404040 oscuro, BFBFBF roles, F2F2F2 constancia) — extraídos
// directamente del XML de la plantilla real.
const DXA_POR_IN = 1440;
const ANCHO_CONTENIDO_IN = 6.92;
const ANCHO_CONTENIDO_DXA = Math.round(ANCHO_CONTENIDO_IN * DXA_POR_IN);
const FUENTE = "Arial";

const BORDE = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const BORDES_CELDA = { top: BORDE, bottom: BORDE, left: BORDE, right: BORDE };

function in2dxa(inches: number): number {
  return Math.round(inches * DXA_POR_IN);
}

function celda(
  texto: string,
  opciones: {
    anchoDxa: number;
    fill?: string;
    bold?: boolean;
    color?: string;
    caps?: boolean;
    italics?: boolean;
    size?: number;
    columnSpan?: number;
  }
): TableCell {
  return new TableCell({
    width: { size: opciones.anchoDxa, type: WidthType.DXA },
    borders: BORDES_CELDA,
    verticalAlign: VerticalAlign.CENTER,
    columnSpan: opciones.columnSpan,
    shading: opciones.fill ? { type: ShadingType.CLEAR, color: "auto", fill: opciones.fill } : undefined,
    margins: { top: 40, bottom: 40, left: 60, right: 60 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: texto,
            bold: opciones.bold,
            italics: opciones.italics,
            allCaps: opciones.caps,
            color: opciones.color,
            font: FUENTE,
            size: opciones.size ?? 18,
          }),
        ],
      }),
    ],
  });
}

function fila(celdas: TableCell[], opciones?: { alturaMin?: number }): TableRow {
  return new TableRow({
    cantSplit: true,
    height: opciones?.alturaMin ? { value: opciones.alturaMin, rule: HeightRule.ATLEAST } : undefined,
    children: celdas,
  });
}

function tablaDocx(anchosIn: number[], filas: TableRow[]): Table {
  const anchosDxa = anchosIn.map(in2dxa);
  return new Table({
    width: { size: ANCHO_CONTENIDO_DXA, type: WidthType.DXA },
    columnWidths: anchosDxa,
    rows: filas,
  });
}

function h2(numero: number, titulo: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: `${numero}. ${titulo}`, bold: true, font: FUENTE, size: 20, color: "262626" })],
    spacing: { before: 200, after: 80 },
  });
}

function parrafo(texto: string, enfasis?: boolean): Paragraph {
  return new Paragraph({
    children: texto.split("\n").flatMap((linea, i) => [
      ...(i > 0 ? [new TextRun({ text: "", break: 1 })] : []),
      new TextRun({ text: linea, font: FUENTE, size: enfasis ? 18 : 20, italics: enfasis, color: enfasis ? "7F7F7F" : undefined }),
    ]),
    spacing: { after: 100 },
  });
}

function tablaGenerica(bloque: Extract<BloqueContenido, { tipo: "tabla" }>): Table {
  const anchosDxa = bloque.anchosIn.map(in2dxa);
  const encabezadoFill = bloque.colorEncabezado === "oscuro" ? "404040" : "E7E6E6";
  const encabezadoColor = bloque.colorEncabezado === "oscuro" ? "FFFFFF" : "000000";
  const filaEncabezado = fila(
    bloque.encabezados.map((h, i) =>
      celda(h, { anchoDxa: anchosDxa[i], fill: encabezadoFill, bold: true, color: encabezadoColor, caps: bloque.colorEncabezado === "oscuro" })
    )
  );
  const filasDatos = bloque.filas.map((f) =>
    fila(
      f.map((valor, i) =>
        celda(valor, {
          anchoDxa: anchosDxa[i],
          fill: bloque.columnaEtiqueta && i === 0 ? "E7E6E6" : undefined,
          bold: bloque.columnaEtiqueta && i === 0,
        })
      )
    )
  );
  return tablaDocx(bloque.anchosIn, [filaEncabezado, ...filasDatos]);
}

function grid2Docx(bloque: Extract<BloqueContenido, { tipo: "grid2" }>): Table {
  const anchoEtiquetaIn = 1.67;
  const anchoValorIn = 1.8;
  const anchoEtiquetaDxa = in2dxa(anchoEtiquetaIn);
  const anchoValorDxa = in2dxa(anchoValorIn);
  const filas = bloque.filas.map((f) =>
    fila([
      celda(f[0], { anchoDxa: anchoEtiquetaDxa, fill: "E7E6E6", bold: true }),
      celda(f[1], { anchoDxa: anchoValorDxa }),
      celda(f[2], { anchoDxa: anchoEtiquetaDxa, fill: "E7E6E6", bold: true }),
      celda(f[3], { anchoDxa: anchoValorDxa }),
    ])
  );
  return tablaDocx([anchoEtiquetaIn, anchoValorIn, anchoEtiquetaIn, anchoValorIn], filas);
}

function checkboxesDocx(bloque: Extract<BloqueContenido, { tipo: "checkboxes" }>): Table {
  const anchoIn = ANCHO_CONTENIDO_IN / 2;
  const anchoDxa = in2dxa(anchoIn);
  const encabezado = fila([
    celda(`${bloque.encabezado} (marque con X)`, { anchoDxa: ANCHO_CONTENIDO_DXA, fill: "BFBFBF", bold: true, columnSpan: 2 }),
  ]);
  const filas = bloque.filas.map((f) =>
    fila(f.map(([texto, marcado]) => celda(`(${marcado ? "X" : " "}) ${texto}`, { anchoDxa })))
  );
  return tablaDocx([ANCHO_CONTENIDO_IN], [encabezado, ...filas]);
}

function constanciaDocx(): (Paragraph | Table)[] {
  const anchoEtiquetaIn = 1.53;
  const anchoValorIn = 1.8;
  const anchoEtiquetaDxa = in2dxa(anchoEtiquetaIn);
  const anchoValorDxa = in2dxa(anchoValorIn);
  const declaracion = tablaDocx(
    [ANCHO_CONTENIDO_IN],
    [
      fila([
        celda(
          "Declaro que he recibido, leído y comprendido la presente ficha de cargo, incluidas las responsabilidades comunes del numeral 8 del Manual de Funciones y Competencias Laborales, y me comprometo a cumplirlas. Manifiesto que he tenido la oportunidad de resolver mis dudas sobre su contenido.",
          { anchoDxa: ANCHO_CONTENIDO_DXA, fill: "F2F2F2" }
        ),
      ]),
    ]
  );
  const encabezado = fila([
    celda("", { anchoDxa: anchoEtiquetaDxa, fill: "404040" }),
    ...["Trabajador", "Jefe inmediato", "Talento humano"].map((h) =>
      celda(h, { anchoDxa: anchoValorDxa, fill: "404040", bold: true, color: "FFFFFF" })
    ),
  ]);
  const filasFirma = ["Nombre", "Documento de identidad", "Firma", "Fecha"].map((label) =>
    fila([
      celda(label, { anchoDxa: anchoEtiquetaDxa, fill: "E7E6E6", bold: true }),
      celda("", { anchoDxa: anchoValorDxa }),
      celda("", { anchoDxa: anchoValorDxa }),
      celda("", { anchoDxa: anchoValorDxa }),
    ])
  );
  const firmas = tablaDocx([anchoEtiquetaIn, anchoValorIn, anchoValorIn, anchoValorIn], [encabezado, ...filasFirma]);
  return [declaracion, new Paragraph({ text: "", spacing: { after: 60 } }), firmas];
}

function renderBloque(bloque: BloqueContenido): (Paragraph | Table)[] {
  switch (bloque.tipo) {
    case "parrafo":
      return [parrafo(bloque.texto, bloque.enfasis)];
    case "grid2":
      return [grid2Docx(bloque)];
    case "tabla":
      return [tablaGenerica(bloque)];
    case "checkboxes":
      return [checkboxesDocx(bloque)];
    case "constancia":
      return constanciaDocx();
  }
}

export async function generarPerfilDocx(cargo: CargoConPerfil, versiones: VersionResumen[]): Promise<Buffer> {
  const contenido = construirFichaContenido(cargo, cargo.empresa.nombre, versiones);

  const tituloBarra = new Table({
    width: { size: ANCHO_CONTENIDO_DXA, type: WidthType.DXA },
    columnWidths: [ANCHO_CONTENIDO_DXA],
    rows: [
      fila([
        new TableCell({
          width: { size: ANCHO_CONTENIDO_DXA, type: WidthType.DXA },
          borders: BORDES_CELDA,
          shading: { type: ShadingType.CLEAR, color: "auto", fill: "000000" },
          margins: { top: 80, bottom: 80, left: 100, right: 100 },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "FICHA DE CARGO: ", bold: true, color: "FFFFFF", font: FUENTE, size: 22 }),
                new TextRun({ text: contenido.nombreCargo.toUpperCase(), italics: true, color: "FFFFFF", font: FUENTE, size: 22 }),
              ],
            }),
          ],
        }),
      ]),
    ],
  });

  const cuerpo: (Paragraph | Table)[] = [tituloBarra, new Paragraph({ text: "", spacing: { after: 80 } })];
  for (const seccion of contenido.secciones) {
    cuerpo.push(h2(seccion.numero, seccion.titulo));
    for (const bloque of seccion.bloques) {
      cuerpo.push(...renderBloque(bloque));
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1138, bottom: 1138, left: 1138, right: 1138, header: 340, footer: 340 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000", space: 4 } },
                children: [
                  new TextRun({ text: `${contenido.nombreEmpresa}   `, bold: true, font: FUENTE, size: 22 }),
                  new TextRun({ text: "Ficha de Descripción de Cargo · Proceso: Gestión del Talento Humano", font: FUENTE, size: 16 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: "Página ", font: FUENTE, size: 14 }),
                  new TextRun({ children: [PageNumber.CURRENT], font: FUENTE, size: 14 }),
                  new TextRun({ text: " de ", font: FUENTE, size: 14 }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FUENTE, size: 14 }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: { top: { style: BorderStyle.SINGLE, size: 2, color: "7F7F7F", space: 4 } },
                children: [
                  new TextRun({
                    text: "Documento controlado. Toda copia impresa o descargada se considera COPIA NO CONTROLADA; verifique la versión vigente en el listado maestro de documentos.",
                    font: FUENTE,
                    size: 13,
                    color: "7F7F7F",
                  }),
                ],
              }),
            ],
          }),
        },
        children: cuerpo,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
