import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { CargoConPerfil } from "@/lib/perfil-data";
import { construirFichaContenido, type BloqueContenido, type VersionResumen } from "@/lib/reportes/ficha-contenido";

// Réplica visual de docs/plantillas/Ficha_Base_Descripcion_de_Cargo.docx:
// misma página carta (8.5x11in, márgenes 0.79in ⇒ ancho de contenido
// 6.92in = 498pt), mismos anchos de columna (en pulgadas) y mismos colores
// de encabezado (E7E6E6 claro, 404040 oscuro, BFBFBF roles) que se
// extrajeron directamente del XML de la plantilla real.
const IN = 72;
const CONTENIDO_PT = 6.92 * IN;

const styles = StyleSheet.create({
  page: { paddingTop: 70, paddingBottom: 46, paddingHorizontal: 0.79 * IN, fontSize: 9, fontFamily: "Helvetica", color: "#000000" },
  headerFixed: {
    position: "absolute",
    top: 18,
    left: 0.79 * IN,
    right: 0.79 * IN,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 6,
  },
  headerLogoBox: {
    width: 90,
    height: 40,
    borderWidth: 0.5,
    borderColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  headerLogoTexto: { fontSize: 6, color: "#7F7F7F", textAlign: "center" },
  headerCentro: { flex: 1, justifyContent: "center" },
  headerEmpresa: { fontSize: 11, fontWeight: 700 },
  headerTitulo: { fontSize: 8, marginTop: 1 },
  headerDatos: { width: 130, fontSize: 6.5, color: "#333333" },
  footerFixed: {
    position: "absolute",
    bottom: 16,
    left: 0.79 * IN,
    right: 0.79 * IN,
    borderTopWidth: 0.5,
    borderTopColor: "#7F7F7F",
    paddingTop: 4,
    fontSize: 6.5,
    color: "#7F7F7F",
    textAlign: "center",
  },
  tituloBarra: {
    backgroundColor: "#000000",
    paddingVertical: 6,
    paddingHorizontal: 8,
    flexDirection: "row",
    marginBottom: 10,
  },
  tituloBarraTexto: { color: "#FFFFFF", fontSize: 11, fontWeight: 700 },
  tituloBarraTextoItalico: { color: "#FFFFFF", fontSize: 11, fontStyle: "italic" },
  seccionTitulo: {
    fontSize: 10,
    fontWeight: 700,
    color: "#262626",
    marginTop: 10,
    marginBottom: 4,
  },
  parrafo: { fontSize: 9, marginBottom: 5, lineHeight: 1.3 },
  parrafoEnfasis: { fontSize: 8, fontStyle: "italic", color: "#7F7F7F", marginBottom: 5 },
  fila: { flexDirection: "row" },
  celdaBase: { borderWidth: 0.5, borderColor: "#000000", padding: 3, fontSize: 8.5, justifyContent: "center" },
  celdaEncClaro: { backgroundColor: "#E7E6E6", fontWeight: 700 },
  celdaEncOscuro: { backgroundColor: "#404040" },
  celdaEncOscuroTexto: { color: "#FFFFFF", fontWeight: 700, textTransform: "uppercase", fontSize: 8 },
  celdaEtiqueta: { backgroundColor: "#E7E6E6", fontWeight: 700 },
  celdaEncBfBf: { backgroundColor: "#BFBFBF", fontWeight: 700, fontSize: 8 },
});

function Encabezado({ nombreEmpresa }: { nombreEmpresa: string }) {
  return (
    <View style={styles.headerFixed} fixed>
      <View style={styles.headerLogoBox}>
        <Text style={styles.headerLogoTexto}>Espacio para logo</Text>
      </View>
      <View style={styles.headerCentro}>
        <Text style={styles.headerEmpresa}>{nombreEmpresa}</Text>
        <Text style={styles.headerTitulo}>Ficha de Descripción de Cargo · Proceso: Gestión del Talento Humano</Text>
      </View>
      <View style={styles.headerDatos}>
        <Text>Versión: 01</Text>
        <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
      </View>
    </View>
  );
}

function Pie() {
  return (
    <Text style={styles.footerFixed} fixed>
      Documento controlado. Toda copia impresa o descargada se considera COPIA NO CONTROLADA; verifique la versión vigente en el
      listado maestro de documentos.
    </Text>
  );
}

function Tabla({
  encabezados,
  anchosIn,
  filas,
  colorEncabezado,
  columnaEtiqueta,
}: {
  encabezados: string[];
  anchosIn: number[];
  filas: string[][];
  colorEncabezado: "oscuro" | "claro";
  columnaEtiqueta?: boolean;
}) {
  const anchosPt = anchosIn.map((w) => (w / 6.92) * CONTENIDO_PT);
  return (
    <View style={{ marginBottom: 4 }}>
      <View style={styles.fila} wrap={false}>
        {encabezados.map((h, i) => (
          <View
            key={i}
            style={[styles.celdaBase, colorEncabezado === "oscuro" ? styles.celdaEncOscuro : styles.celdaEncClaro, { width: anchosPt[i] }]}
          >
            <Text style={colorEncabezado === "oscuro" ? styles.celdaEncOscuroTexto : undefined}>{h}</Text>
          </View>
        ))}
      </View>
      {filas.map((fila, fi) => (
        <View key={fi} style={styles.fila} wrap={false}>
          {fila.map((valor, ci) => (
            <View
              key={ci}
              style={[styles.celdaBase, { width: anchosPt[ci] }, columnaEtiqueta && ci === 0 ? styles.celdaEtiqueta : {}]}
            >
              <Text>{valor}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function Grid2({ filas }: { filas: [string, string, string, string][] }) {
  const anchoEtiqueta = (1.67 / 6.92) * CONTENIDO_PT;
  const anchoValor = (1.8 / 6.92) * CONTENIDO_PT;
  return (
    <View style={{ marginBottom: 4 }}>
      {filas.map((fila, i) => (
        <View key={i} style={styles.fila} wrap={false}>
          <View style={[styles.celdaBase, styles.celdaEtiqueta, { width: anchoEtiqueta }]}>
            <Text>{fila[0]}</Text>
          </View>
          <View style={[styles.celdaBase, { width: anchoValor }]}>
            <Text>{fila[1]}</Text>
          </View>
          <View style={[styles.celdaBase, styles.celdaEtiqueta, { width: anchoEtiqueta }]}>
            <Text>{fila[2]}</Text>
          </View>
          <View style={[styles.celdaBase, { width: anchoValor }]}>
            <Text>{fila[3]}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function Checkboxes({ encabezado, filas }: { encabezado: string; filas: [string, boolean][][] }) {
  const ancho = CONTENIDO_PT / 2;
  return (
    <View style={{ marginBottom: 4 }}>
      <View style={styles.fila} wrap={false}>
        <View style={[styles.celdaBase, styles.celdaEncBfBf, { width: CONTENIDO_PT }]}>
          <Text>{encabezado} (marque con X)</Text>
        </View>
      </View>
      {filas.map((fila, i) => (
        <View key={i} style={styles.fila} wrap={false}>
          {fila.map(([etiquetaTexto, marcado], j) => (
            <View key={j} style={[styles.celdaBase, { width: ancho }]}>
              <Text>
                ({marcado ? "X" : " "}) {etiquetaTexto}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function Constancia() {
  const filasFirma: [string, string, string, string][] = [
    ["Nombre", "", "", ""],
    ["Documento de identidad", "", "", ""],
    ["Firma", "", "", ""],
    ["Fecha", "", "", ""],
  ];
  const anchoEtiqueta = (1.53 / 6.92) * CONTENIDO_PT;
  const anchoValor = (1.8 / 6.92) * CONTENIDO_PT;
  return (
    <View>
      <View style={[styles.celdaBase, { backgroundColor: "#F2F2F2", width: CONTENIDO_PT, marginBottom: 4 }]}>
        <Text>
          Declaro que he recibido, leído y comprendido la presente ficha de cargo, incluidas las responsabilidades comunes del
          numeral 8 del Manual de Funciones y Competencias Laborales, y me comprometo a cumplirlas. Manifiesto que he tenido la
          oportunidad de resolver mis dudas sobre su contenido.
        </Text>
      </View>
      <View style={styles.fila} wrap={false}>
        <View style={[styles.celdaBase, styles.celdaEncOscuro, { width: anchoEtiqueta }]}>
          <Text> </Text>
        </View>
        {["Trabajador", "Jefe inmediato", "Talento humano"].map((h) => (
          <View key={h} style={[styles.celdaBase, styles.celdaEncOscuro, { width: anchoValor }]}>
            <Text style={styles.celdaEncOscuroTexto}>{h}</Text>
          </View>
        ))}
      </View>
      {filasFirma.map((fila, i) => (
        <View key={i} style={styles.fila} wrap={false}>
          <View style={[styles.celdaBase, styles.celdaEtiqueta, { width: anchoEtiqueta }]}>
            <Text>{fila[0]}</Text>
          </View>
          <View style={[styles.celdaBase, { width: anchoValor }]}>
            <Text> </Text>
          </View>
          <View style={[styles.celdaBase, { width: anchoValor }]}>
            <Text> </Text>
          </View>
          <View style={[styles.celdaBase, { width: anchoValor }]}>
            <Text> </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function Bloque({ bloque }: { bloque: BloqueContenido }) {
  switch (bloque.tipo) {
    case "parrafo":
      return <Text style={bloque.enfasis ? styles.parrafoEnfasis : styles.parrafo}>{bloque.texto}</Text>;
    case "grid2":
      return <Grid2 filas={bloque.filas} />;
    case "tabla":
      return (
        <Tabla
          encabezados={bloque.encabezados}
          anchosIn={bloque.anchosIn}
          filas={bloque.filas}
          colorEncabezado={bloque.colorEncabezado}
          columnaEtiqueta={bloque.columnaEtiqueta}
        />
      );
    case "checkboxes":
      return <Checkboxes encabezado={bloque.encabezado} filas={bloque.filas} />;
    case "constancia":
      return <Constancia />;
  }
}

export function PerfilPdf({ versiones, ...cargo }: CargoConPerfil & { versiones: VersionResumen[] }) {
  const contenido = construirFichaContenido(cargo, cargo.empresa.nombre, versiones);

  return (
    <Document title={`Ficha de cargo - ${cargo.nombre}`}>
      <Page size="LETTER" style={styles.page}>
        <Encabezado nombreEmpresa={contenido.nombreEmpresa} />
        <Pie />

        <View style={styles.tituloBarra}>
          <Text style={styles.tituloBarraTexto}>FICHA DE CARGO: </Text>
          <Text style={styles.tituloBarraTextoItalico}>{contenido.nombreCargo.toUpperCase()}</Text>
        </View>

        {contenido.secciones.map((seccion) => (
          <View key={seccion.numero}>
            <Text style={styles.seccionTitulo}>
              {seccion.numero}. {seccion.titulo}
            </Text>
            {seccion.bloques.map((bloque, i) => (
              <Bloque key={i} bloque={bloque} />
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}
