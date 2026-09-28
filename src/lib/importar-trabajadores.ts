import ExcelJS from "exceljs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { NIVELES_JERARQUICOS } from "@/lib/validaciones";
import { ETIQUETAS_NIVEL_JERARQUICO } from "@/lib/etiquetas";
import { NOMBRE_CARGO_JUNTA_DIRECTIVA } from "@/lib/estructura-inicial";

const FILA_EJEMPLO = [
  "1020304050",
  "María Fernanda López",
  "Talento Humano",
  "Analista de Nómina",
  "Coordinador de Talento Humano",
  ETIQUETAS_NIVEL_JERARQUICO.profesional,
  "maria.lopez@empresa.com",
  "2022-03-15",
];

const COLOR_ENCABEZADO = "FF1E1B4B"; // --color-marca-oscuro, ARGB
const COLOR_TEXTO_ENCABEZADO = "FFFFFFFF";
const FILAS_CON_VALIDACION = 500;

// ---------------------------------------------------------------------------
// Generación de la plantilla (.xlsx real: encabezado con formato, lista
// desplegable de nivel jerárquico, hoja de instrucciones aparte) — mismo
// patrón que bateria-riesgo-psicosocial (src/lib/importar-trabajadores.ts).
// ---------------------------------------------------------------------------

export async function generarPlantillaTrabajadoresXlsx(): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "OGP";
  workbook.created = new Date();

  const hoja = workbook.addWorksheet("Trabajadores");
  hoja.columns = [
    { header: "documento", key: "documento", width: 16 },
    { header: "nombres", key: "nombres", width: 28 },
    { header: "departamento", key: "departamento", width: 22 },
    { header: "cargo", key: "cargo", width: 24 },
    { header: "jefe_cargo", key: "jefe_cargo", width: 28 },
    { header: "nivel_cargo", key: "nivel_cargo", width: 18 },
    { header: "email", key: "email", width: 26 },
    { header: "fecha_ingreso", key: "fecha_ingreso", width: 16 },
  ];

  const filaEncabezado = hoja.getRow(1);
  filaEncabezado.eachCell((celda) => {
    celda.font = { bold: true, color: { argb: COLOR_TEXTO_ENCABEZADO } };
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_ENCABEZADO } };
    celda.alignment = { vertical: "middle", horizontal: "left" };
  });
  filaEncabezado.commit();

  hoja.addRow(FILA_EJEMPLO);

  const listas = workbook.addWorksheet("Listas");
  listas.state = "veryHidden";
  const etiquetasNivel = NIVELES_JERARQUICOS.map((n) => ETIQUETAS_NIVEL_JERARQUICO[n]);
  etiquetasNivel.forEach((etiqueta, i) => {
    listas.getCell(i + 1, 1).value = etiqueta;
  });
  const rangoNivel = `Listas!$A$1:$A$${etiquetasNivel.length}`;

  const COL_NIVEL_CARGO = 6;
  for (let fila = 2; fila <= FILAS_CON_VALIDACION + 1; fila++) {
    hoja.getCell(fila, COL_NIVEL_CARGO).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [rangoNivel],
      showErrorMessage: true,
      errorTitle: "Nivel de cargo inválido",
      error: "Selecciona un valor de la lista: " + etiquetasNivel.join(" / "),
    };
  }

  const instrucciones = workbook.addWorksheet("Instrucciones");
  instrucciones.columns = [
    { key: "campo", width: 20 },
    { key: "explicacion", width: 75 },
  ];
  const filas: [string, string][] = [
    ["Campo", "Qué va en esta columna"],
    ["documento", "Número de documento del trabajador. Debe ser único dentro de la empresa."],
    ["nombres", "Nombres y apellidos completos."],
    ["departamento", "Departamento/área al que pertenece. Si no existe todavía en la empresa, se crea automáticamente."],
    ["cargo", "Nombre del cargo dentro de ese departamento. Si no existe, se crea automáticamente."],
    [
      "jefe_cargo",
      `Nombre del cargo que es su jefe inmediato (ej. "${NOMBRE_CARGO_JUNTA_DIRECTIVA}", que toda empresa ya tiene por defecto). Puede ser un cargo ya existente o uno que también estés creando en este mismo archivo. Déjalo vacío si no quieres definirlo ahora — lo puedes asignar después desde "Editar cargo". Opcional.`,
    ],
    [
      "nivel_cargo",
      "Selecciona de la lista: " +
        etiquetasNivel.join(" / ") +
        ". Solo se usa si el cargo es nuevo (si ya existe, se conserva su nivel actual). Opcional.",
    ],
    ["email", "Correo del trabajador. Obligatorio — a este correo se le enviará el enlace del taller de campo."],
    ["fecha_ingreso", "Fecha de ingreso a la empresa, formato AAAA-MM-DD (opcional)."],
  ];
  for (const fila of filas) instrucciones.addRow(fila);
  instrucciones.getRow(1).font = { bold: true };
  instrucciones.addRow([]);
  instrucciones.addRow(["Si el departamento y el cargo ya existen, el trabajador se asocia a ellos sin duplicarlos."]);
  instrucciones.addRow([
    `Toda empresa nace con el cargo "${NOMBRE_CARGO_JUNTA_DIRECTIVA}" (sin jefe) — úsalo como "jefe_cargo" para tus cargos de más alto nivel.`,
  ]);
  instrucciones.addRow([]);
  instrucciones.addRow(["Ejemplo:"]).font = { bold: true };
  instrucciones.addRow([FILA_EJEMPLO.join(" | ")]);

  return workbook.xlsx.writeBuffer();
}

// ---------------------------------------------------------------------------
// Validación e importación
// ---------------------------------------------------------------------------

function normalizarEncabezado(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "_");
}

function normalizarNivelJerarquico(valor: string): string | null {
  const limpio = valor.trim().toLowerCase();
  if (!limpio) return "";
  if ((NIVELES_JERARQUICOS as readonly string[]).includes(limpio)) return limpio;
  const porEtiqueta = NIVELES_JERARQUICOS.find(
    (n) => ETIQUETAS_NIVEL_JERARQUICO[n].toLowerCase() === limpio
  );
  return porEtiqueta ?? null;
}

type FilaValida = {
  documento: string;
  nombres: string;
  departamento: string;
  cargo: string;
  jefeCargo: string | null;
  nivelCargo: string | null;
  email: string;
  fechaIngreso: Date | null;
};

function validarFila(valores: Record<string, string>, numeroFila: number): { data: FilaValida } | { error: string } {
  const documento = (valores.documento ?? "").trim();
  const nombres = (valores.nombres ?? "").trim();
  const departamento = (valores.departamento ?? "").trim();
  const cargo = (valores.cargo ?? "").trim();
  const jefeCargo = (valores.jefe_cargo ?? "").trim();
  const email = (valores.email ?? "").trim();
  const fechaIngresoRaw = (valores.fecha_ingreso ?? "").trim();

  if (!documento) return { error: `Fila ${numeroFila}: falta el campo "documento"` };
  if (!nombres) return { error: `Fila ${numeroFila}: falta el campo "nombres"` };
  if (!departamento) return { error: `Fila ${numeroFila}: falta el campo "departamento"` };
  if (!cargo) return { error: `Fila ${numeroFila}: falta el campo "cargo"` };
  if (!email) return { error: `Fila ${numeroFila}: falta el campo "email" (obligatorio, se usa para enviar el taller)` };
  if (!z.string().email().safeParse(email).success) {
    return { error: `Fila ${numeroFila}, columna "email": "${email}" no es un correo válido` };
  }

  const nivelCargo = normalizarNivelJerarquico(valores.nivel_cargo ?? "");
  if (nivelCargo === null) {
    return {
      error: `Fila ${numeroFila}, columna "nivel_cargo": valor "${valores.nivel_cargo ?? ""}" inválido (usar ${NIVELES_JERARQUICOS.map((n) => ETIQUETAS_NIVEL_JERARQUICO[n]).join(" / ")})`,
    };
  }

  let fechaIngreso: Date | null = null;
  if (fechaIngresoRaw) {
    const fecha = new Date(fechaIngresoRaw);
    if (Number.isNaN(fecha.getTime())) {
      return { error: `Fila ${numeroFila}, columna "fecha_ingreso": valor "${fechaIngresoRaw}" inválido (usar AAAA-MM-DD)` };
    }
    fechaIngreso = fecha;
  }

  return {
    data: {
      documento,
      nombres,
      departamento,
      cargo,
      jefeCargo: jefeCargo || null,
      nivelCargo: nivelCargo || null,
      email,
      fechaIngreso,
    },
  };
}

function celdaATexto(valor: ExcelJS.CellValue): string {
  if (valor === null || valor === undefined) return "";
  if (valor instanceof Date) {
    const y = valor.getFullYear();
    const m = String(valor.getMonth() + 1).padStart(2, "0");
    const d = String(valor.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof valor === "object") {
    if ("text" in valor && typeof valor.text === "string") return valor.text;
    if ("richText" in valor && Array.isArray(valor.richText)) {
      return valor.richText.map((parte) => parte.text).join("");
    }
    if ("result" in valor) return celdaATexto(valor.result as ExcelJS.CellValue);
  }
  return String(valor);
}

export type ResultadoImportacion = {
  creados: number;
  departamentosCreados: number;
  cargosCreados: number;
  errores: string[];
};

export async function importarTrabajadoresDesdeXlsx(
  empresaId: string,
  contenido: ArrayBuffer
): Promise<ResultadoImportacion> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(contenido);
  } catch {
    return { creados: 0, departamentosCreados: 0, cargosCreados: 0, errores: ["No se pudo leer el archivo. Verifica que sea un .xlsx válido."] };
  }

  const hoja = workbook.worksheets[0];
  if (!hoja || hoja.rowCount < 1) {
    return { creados: 0, departamentosCreados: 0, cargosCreados: 0, errores: ["El archivo está vacío"] };
  }

  const encabezados: string[] = [];
  hoja.getRow(1).eachCell({ includeEmpty: true }, (celda, colNumero) => {
    encabezados[colNumero - 1] = normalizarEncabezado(celdaATexto(celda.value));
  });

  const documentosExistentes = new Set(
    (await prisma.trabajador.findMany({ where: { empresaId }, select: { documento: true } })).map((t) => t.documento)
  );

  const errores: string[] = [];
  const validas: { numeroFila: number; data: FilaValida }[] = [];
  const documentosEnArchivo = new Set<string>();

  for (let numeroFila = 2; numeroFila <= hoja.rowCount; numeroFila++) {
    const fila = hoja.getRow(numeroFila);
    if (fila.cellCount === 0) continue;

    const valores: Record<string, string> = {};
    let filaVacia = true;
    fila.eachCell({ includeEmpty: true }, (celda, colNumero) => {
      const encabezado = encabezados[colNumero - 1];
      if (!encabezado) return;
      const texto = celdaATexto(celda.value);
      if (texto.trim() !== "") filaVacia = false;
      valores[encabezado] = texto;
    });
    if (filaVacia) continue;

    const resultado = validarFila(valores, numeroFila);
    if ("error" in resultado) {
      errores.push(resultado.error);
      continue;
    }
    if (documentosExistentes.has(resultado.data.documento) || documentosEnArchivo.has(resultado.data.documento)) {
      errores.push(`Fila ${numeroFila}: ya existe un trabajador con documento ${resultado.data.documento} en esta empresa o en el archivo`);
      continue;
    }

    documentosEnArchivo.add(resultado.data.documento);
    validas.push({ numeroFila, data: resultado.data });
  }

  let creados = 0;
  let departamentosCreados = 0;
  let cargosCreados = 0;
  // Cachés locales para no repetir consultas cuando varias filas comparten
  // departamento/cargo (caso típico: muchos trabajadores del mismo cargo).
  const cacheDepartamentos = new Map<string, string>();
  const cacheCargos = new Map<string, string>();
  // Mismo criterio que el formulario "Nuevo cargo": un cargo nuevo sin
  // jefe_cargo explícito reporta a Junta Directiva por defecto, para no
  // volver a crear cargos huérfanos sueltos al mismo nivel que ella.
  const juntaDirectiva = await prisma.cargo.findFirst({
    where: { empresaId, nombre: NOMBRE_CARGO_JUNTA_DIRECTIVA },
    select: { id: true },
  });
  // jefe_cargo se resuelve en una segunda pasada, al final: el jefe puede
  // ser un cargo que otra fila de este mismo archivo todavía no ha creado.
  const pendientesJefe: { numeroFila: number; cargoId: string; jefeCargoTexto: string }[] = [];

  for (const { numeroFila, data: fila } of validas) {
    try {
      const claveDept = fila.departamento.toLowerCase();
      let departamentoId = cacheDepartamentos.get(claveDept);
      if (!departamentoId) {
        const departamentoExistente = await prisma.departamento.findUnique({
          where: { empresaId_nombre: { empresaId, nombre: fila.departamento } },
        });
        if (departamentoExistente) {
          departamentoId = departamentoExistente.id;
        } else {
          const departamentoNuevo = await prisma.departamento.create({
            data: { empresaId, nombre: fila.departamento },
          });
          departamentoId = departamentoNuevo.id;
          departamentosCreados++;
        }
        cacheDepartamentos.set(claveDept, departamentoId);
      }

      const claveCargo = `${departamentoId}::${fila.cargo.toLowerCase()}`;
      let cargoId = cacheCargos.get(claveCargo);
      if (!cargoId) {
        // findFirst (no findUnique): el nombre ya no es único por
        // departamento, pero la carga masiva sigue asumiendo "mismo nombre
        // = mismo cargo" para no crear duplicados al reimportar el mismo
        // archivo — un segundo cargo con el mismo nombre solo se crea a
        // mano desde "Nuevo cargo" cuando de verdad hace falta.
        const cargoExistente = await prisma.cargo.findFirst({
          where: { departamentoId, nombre: fila.cargo },
        });
        if (cargoExistente) {
          cargoId = cargoExistente.id;
        } else {
          const esJuntaDirectiva = fila.cargo.toLowerCase() === NOMBRE_CARGO_JUNTA_DIRECTIVA.toLowerCase();
          const cargoNuevo = await prisma.cargo.create({
            data: {
              empresaId,
              departamentoId,
              nombre: fila.cargo,
              nivelJerarquico: fila.nivelCargo,
              // jefe_cargo (si viene) se resuelve después, en la segunda
              // pasada — acá solo se aplica el default cuando la fila no
              // pidió ningún jefe explícito.
              jefeInmediatoId: !fila.jefeCargo && !esJuntaDirectiva ? juntaDirectiva?.id ?? null : null,
            },
          });
          cargoId = cargoNuevo.id;
          cargosCreados++;
        }
        cacheCargos.set(claveCargo, cargoId);
      }

      if (fila.jefeCargo) {
        pendientesJefe.push({ numeroFila, cargoId, jefeCargoTexto: fila.jefeCargo });
      }

      await prisma.trabajador.create({
        data: {
          empresaId,
          cargoId,
          documento: fila.documento,
          nombres: fila.nombres,
          email: fila.email,
          fechaIngreso: fila.fechaIngreso,
        },
      });
      creados++;
    } catch {
      errores.push(`Fila ${numeroFila}: error inesperado al guardar, se omitió`);
    }
  }

  if (pendientesJefe.length > 0) {
    // Todos los cargos de la empresa, ya con los recién creados en este
    // archivo — agrupados por nombre en minúscula para resolver jefe_cargo.
    // Cargo.nombre solo es único por departamento, así que un mismo nombre
    // repetido en dos departamentos distintos es ambiguo y se reporta.
    const todosLosCargos = await prisma.cargo.findMany({ where: { empresaId }, select: { id: true, nombre: true } });
    const porNombre = new Map<string, string[]>();
    for (const c of todosLosCargos) {
      const clave = c.nombre.toLowerCase();
      porNombre.set(clave, [...(porNombre.get(clave) ?? []), c.id]);
    }

    for (const { numeroFila, cargoId, jefeCargoTexto } of pendientesJefe) {
      const candidatos = porNombre.get(jefeCargoTexto.toLowerCase()) ?? [];
      if (candidatos.length === 0) {
        errores.push(`Fila ${numeroFila}: no se encontró un cargo llamado "${jefeCargoTexto}" para asignarlo como jefe inmediato`);
        continue;
      }
      if (candidatos.length > 1) {
        errores.push(`Fila ${numeroFila}: hay más de un cargo llamado "${jefeCargoTexto}" en la empresa, no se pudo asignar como jefe inmediato (asígnalo a mano desde "Editar cargo")`);
        continue;
      }
      const jefeId = candidatos[0];
      if (jefeId === cargoId) {
        errores.push(`Fila ${numeroFila}: un cargo no puede ser su propio jefe inmediato`);
        continue;
      }
      await prisma.cargo.update({ where: { id: cargoId }, data: { jefeInmediatoId: jefeId } });
    }
  }

  return { creados, departamentosCreados, cargosCreados, errores };
}
