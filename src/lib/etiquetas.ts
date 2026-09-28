// Etiquetas legibles para los valores tipo-enum guardados como String
// (ver validaciones.ts) — usadas tanto en la UI como en los exports de
// PDF/Word, para no repetir el mapeo en cada lugar.

export const ETIQUETAS_NIVEL_JERARQUICO: Record<string, string> = {
  directivo: "Directivo",
  coordinacion: "Coordinación",
  profesional: "Profesional",
  tecnico: "Técnico",
  auxiliar: "Auxiliar",
  operativo: "Operativo",
};

export const ETIQUETAS_ALCANCE_COMUN: Record<string, string> = {
  todos: "Todos los cargos",
  ...ETIQUETAS_NIVEL_JERARQUICO,
};

export const ETIQUETAS_FRECUENCIA_FUNCION: Record<string, string> = {
  diaria: "Diaria",
  semanal: "Semanal",
  mensual: "Mensual",
  eventual: "Eventual",
};

export const ETIQUETAS_TIPO_FLUJO: Record<string, string> = {
  insumo: "Insumo (entrada)",
  salida: "Entregable (salida)",
};

export const ETIQUETAS_TIPO_RIESGO: Record<string, string> = {
  biologico: "Biológico",
  fisico: "Físico",
  quimico: "Químico",
  psicosocial: "Psicosocial",
  biomecanico: "Biomecánico",
  seguridad: "Condiciones de seguridad",
  fenomenos_naturales: "Fenómenos naturales",
};

export const ETIQUETAS_NIVEL_RIESGO: Record<string, string> = {
  bajo: "Bajo",
  medio: "Medio",
  alto: "Alto",
};

export const ETIQUETAS_TIPO_BARRERA: Record<string, string> = {
  fisica: "Física",
  sensorial: "Sensorial",
  comunicacion: "Comunicación",
  cognitiva: "Cognitiva",
};

export const ETIQUETAS_TIPO_COMPETENCIA: Record<string, string> = {
  organizacional: "Organizacional",
  comportamental: "Comportamental del cargo",
  tecnica: "Técnica / Conocimientos",
};

export const ETIQUETAS_NIVEL_COMPETENCIA: Record<string, string> = {
  basico: "1 · Básico",
  intermedio: "2 · Intermedio",
  avanzado: "3 · Avanzado",
  experto: "4 · Experto",
};

export const ETIQUETAS_MODALIDAD_TRABAJO: Record<string, string> = {
  presencial: "Presencial",
  trabajo_casa: "Trabajo en casa",
  remoto: "Remoto",
  teletrabajo: "Teletrabajo",
  hibrido: "Híbrido",
};

export const ETIQUETAS_JORNADA: Record<string, string> = {
  ordinaria: "Ordinaria (máx. 42 h/sem.)",
  direccion_confianza_manejo: "Dirección, confianza y manejo",
};

export const ETIQUETAS_TIPO_VINCULACION: Record<string, string> = {
  termino_indefinido: "Término indefinido",
  termino_fijo: "Término fijo",
  obra_labor: "Obra o labor",
};

export const ETIQUETAS_NIVEL_AUTONOMIA: Record<string, string> = {
  autonoma: "Autónoma",
  consulta_previa: "Consulta previa",
  requiere_aprobacion: "Requiere aprobación",
};

export const ETIQUETAS_NIVEL_RECURSO: Record<string, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

export const ETIQUETAS_ROL_SST: Record<string, string> = {
  responsable_sgsst: "Responsable del SG-SST",
  copasst: "Miembro del COPASST / Vigía de SST",
  convivencia: "Miembro del Comité de Convivencia Laboral",
  brigada: "Brigadista de emergencias",
  alturas: "Coordinador de trabajo en alturas",
  pesv: "Líder del PESV",
};

export const ETIQUETAS_ESTADO_PERFIL: Record<string, string> = {
  borrador: "Borrador",
  publicado: "Publicado",
};

export const ETIQUETAS_NIVEL_ACCESO: Record<string, string> = {
  lectura: "Solo lectura",
  gestion_perfiles: "Puede editar perfiles",
  control_total: "Control total",
};

export const DESCRIPCIONES_NIVEL_ACCESO: Record<string, string> = {
  lectura: "Ve toda su estructura (departamentos, cargos y perfiles) pero no puede modificar nada.",
  gestion_perfiles: "Además de ver, puede editar y publicar el contenido de perfiles ya existentes. No puede crear ni eliminar departamentos o cargos.",
  control_total: "Puede crear, editar y eliminar departamentos, cargos y perfiles — igual que el consultor, pero solo dentro de su propia empresa.",
};

export function etiqueta(mapa: Record<string, string>, valor: string | null | undefined): string {
  if (!valor) return "—";
  return mapa[valor] ?? valor;
}

const BADGE_NIVEL_JERARQUICO: Record<string, string> = {
  directivo: "badge-indigo",
  coordinacion: "badge-cyan",
  profesional: "badge-slate",
  tecnico: "badge-slate",
  auxiliar: "badge-slate",
  operativo: "badge-slate",
};

const BADGE_ESTADO_PERFIL: Record<string, string> = {
  borrador: "badge-amber",
  publicado: "badge-emerald",
};

const BADGE_NIVEL_RIESGO: Record<string, string> = {
  bajo: "badge-emerald",
  medio: "badge-amber",
  alto: "badge-rose",
};

export function claseBadgeNivelJerarquico(valor: string | null | undefined): string {
  return valor ? (BADGE_NIVEL_JERARQUICO[valor] ?? "badge-slate") : "badge-slate";
}

export function claseBadgeEstadoPerfil(valor: string | null | undefined): string {
  return valor ? (BADGE_ESTADO_PERFIL[valor] ?? "badge-slate") : "badge-slate";
}

export function claseBadgeNivelRiesgo(valor: string | null | undefined): string {
  return valor ? (BADGE_NIVEL_RIESGO[valor] ?? "badge-slate") : "badge-slate";
}

const BADGE_NIVEL_ACCESO: Record<string, string> = {
  lectura: "badge-slate",
  gestion_perfiles: "badge-cyan",
  control_total: "badge-indigo",
};

export function claseBadgeNivelAcceso(valor: string | null | undefined): string {
  return valor ? (BADGE_NIVEL_ACCESO[valor] ?? "badge-slate") : "badge-slate";
}
