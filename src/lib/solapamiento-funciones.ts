/**
 * Detección de solapamiento entre las funciones esenciales de distintos
 * cargos de una misma empresa — promesa de valor original de la plataforma:
 * avisar cuando dos cargos terminan describiendo, en el fondo, el mismo
 * trabajo, para que el asesor y la empresa puedan revisar si conviene
 * rediseñar la estructura (fusionar cargos, delimitar mejor sus funciones).
 *
 * Es un heurístico de texto (similitud de Jaccard por palabras), no IA — no
 * tiene costo, corre al instante en cada carga de página, y es determinista.
 * No pretende "entender" las funciones, solo detectar redacciones que
 * comparten demasiado vocabulario de contenido como para ser casualidad.
 */

const PALABRAS_VACIAS = new Set([
  "de", "la", "el", "los", "las", "y", "a", "en", "para", "con", "del", "al", "su", "sus", "que",
  "un", "una", "unos", "unas", "por", "o", "se", "lo", "como", "más", "segun", "según", "cada",
  "este", "esta", "estos", "estas", "ese", "esa", "esos", "esas", "es", "son", "ser", "sobre",
  "entre", "sin", "no", "si", "también", "tambien", "u", "e", "todo", "toda", "todos", "todas",
  "cuando", "donde", "dentro", "fuera", "otros", "otras", "otro", "otra", "les", "le",
]);

function normalizar(texto: string): Set<string> {
  const sinAcentos = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  const palabras = sinAcentos.split(/[^a-z0-9]+/).filter((p) => p.length > 2 && !PALABRAS_VACIAS.has(p));
  return new Set(palabras);
}

function similitudJaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let interseccion = 0;
  for (const palabra of a) {
    if (b.has(palabra)) interseccion++;
  }
  const union = a.size + b.size - interseccion;
  return union === 0 ? 0 : interseccion / union;
}

// A partir de este punto, dos funciones comparten tanto vocabulario de
// contenido que vale la pena mostrarlas como "parecidas" — calibrado para
// marcar duplicados reales (mismo objeto + misma condición) sin marcar dos
// funciones distintas que solo comparten palabras genéricas del área.
export const UMBRAL_FUNCION_PARECIDA = 0.45;

export type FuncionParecida = { descripcionA: string; descripcionB: string; similitud: number };

function compararFunciones(
  funcionesA: { descripcion: string }[],
  funcionesB: { descripcion: string }[]
): FuncionParecida[] {
  const bolsasA = funcionesA.map((f) => ({ descripcion: f.descripcion, palabras: normalizar(f.descripcion) }));
  const bolsasB = funcionesB.map((f) => ({ descripcion: f.descripcion, palabras: normalizar(f.descripcion) }));

  const encontradas: FuncionParecida[] = [];
  for (const a of bolsasA) {
    for (const b of bolsasB) {
      const similitud = similitudJaccard(a.palabras, b.palabras);
      if (similitud >= UMBRAL_FUNCION_PARECIDA) {
        encontradas.push({ descripcionA: a.descripcion, descripcionB: b.descripcion, similitud });
      }
    }
  }
  return encontradas.sort((x, y) => y.similitud - x.similitud);
}

export type CargoParaComparar = {
  id: string;
  nombre: string;
  departamento: string;
  funciones: { descripcion: string }[];
};

export type SolapamientoCargo = {
  cargoId: string;
  cargoNombre: string;
  departamento: string;
  funcionesParecidas: FuncionParecida[];
};

/** Para la página de un cargo puntual: con qué otros cargos de la empresa se parece. */
export function obtenerSolapamientosDeCargo(
  objetivo: CargoParaComparar,
  otrosCargos: CargoParaComparar[]
): SolapamientoCargo[] {
  if (objetivo.funciones.length === 0) return [];

  const resultados: SolapamientoCargo[] = [];
  for (const otro of otrosCargos) {
    if (otro.id === objetivo.id || otro.funciones.length === 0) continue;
    const funcionesParecidas = compararFunciones(objetivo.funciones, otro.funciones);
    if (funcionesParecidas.length > 0) {
      resultados.push({ cargoId: otro.id, cargoNombre: otro.nombre, departamento: otro.departamento, funcionesParecidas });
    }
  }
  return resultados.sort((a, b) => b.funcionesParecidas[0].similitud - a.funcionesParecidas[0].similitud);
}

export type SolapamientoPar = {
  cargoA: { id: string; nombre: string; departamento: string };
  cargoB: { id: string; nombre: string; departamento: string };
  funcionesParecidas: FuncionParecida[];
};

/** Para el dashboard de la empresa: todos los pares de cargos con solapamiento, sin repetir el mismo par dos veces. */
export function obtenerSolapamientosDeEmpresa(cargos: CargoParaComparar[]): SolapamientoPar[] {
  const pares: SolapamientoPar[] = [];
  for (let i = 0; i < cargos.length; i++) {
    if (cargos[i].funciones.length === 0) continue;
    for (let j = i + 1; j < cargos.length; j++) {
      if (cargos[j].funciones.length === 0) continue;
      const funcionesParecidas = compararFunciones(cargos[i].funciones, cargos[j].funciones);
      if (funcionesParecidas.length > 0) {
        pares.push({
          cargoA: { id: cargos[i].id, nombre: cargos[i].nombre, departamento: cargos[i].departamento },
          cargoB: { id: cargos[j].id, nombre: cargos[j].nombre, departamento: cargos[j].departamento },
          funcionesParecidas,
        });
      }
    }
  }
  return pares.sort((a, b) => b.funcionesParecidas[0].similitud - a.funcionesParecidas[0].similitud);
}
