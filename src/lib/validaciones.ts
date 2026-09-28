import { z } from "zod";

// Orden de mayor a menor rango — se reutiliza para ordenar selectores de
// "jefe inmediato" (los cargos más altos primero) y para elegir un jefe por
// defecto sensato al crear un cargo nuevo (ver rangoNivelJerarquico).
export const NIVELES_JERARQUICOS = [
  "directivo",
  "coordinacion",
  "profesional",
  "tecnico",
  "auxiliar",
  "operativo",
] as const;

/** Menor número = más alto en la jerarquía. Sin nivel asignado queda al final. */
export function rangoNivelJerarquico(nivel: string | null | undefined): number {
  const indice = nivel ? (NIVELES_JERARQUICOS as readonly string[]).indexOf(nivel) : -1;
  return indice === -1 ? NIVELES_JERARQUICOS.length : indice;
}

// A qué cargos aplica una función/competencia común de empresa: todos, o
// solo los de un nivel jerárquico puntual.
export const ALCANCES_COMUN = ["todos", ...NIVELES_JERARQUICOS] as const;

// 'D' = diaria, 'S' = semanal, 'M' = mensual, 'E' = eventual — mismas siglas
// que usa la Ficha de Descripción de Cargo (docs/plantillas).
export const FRECUENCIAS_FUNCION = ["diaria", "semanal", "mensual", "eventual"] as const;

export const TIPOS_FLUJO = ["insumo", "salida"] as const;

// Categorías GTC 45 tal como las pide la ficha (num. 11/9.11).
export const TIPOS_RIESGO = [
  "biologico",
  "fisico",
  "quimico",
  "psicosocial",
  "biomecanico",
  "seguridad",
  "fenomenos_naturales",
] as const;

export const NIVELES_RIESGO = ["bajo", "medio", "alto"] as const;

export const TIPOS_BARRERA = ["fisica", "sensorial", "comunicacion", "cognitiva"] as const;

// 3 tipos y 4 niveles — tal como los pide la ficha (num. 10/9.10) y el
// diccionario de competencias del Manual (num. 7.2).
export const TIPOS_COMPETENCIA = ["organizacional", "comportamental", "tecnica"] as const;

export const NIVELES_COMPETENCIA = ["basico", "intermedio", "avanzado", "experto"] as const;

export const NIVELES_ACCESO_EMPRESA = ["lectura", "gestion_perfiles", "control_total"] as const;

// --- Identificación del cargo (ficha num. 1/9.1) ---------------------------
export const MODALIDADES_TRABAJO = ["presencial", "trabajo_casa", "remoto", "teletrabajo", "hibrido"] as const;
export const JORNADAS = ["ordinaria", "direccion_confianza_manejo"] as const;
export const CLASES_RIESGO_ARL = ["I", "II", "III", "IV", "V"] as const;
export const TIPOS_VINCULACION = ["termino_indefinido", "termino_fijo", "obra_labor"] as const;

// --- Autoridad y toma de decisiones (ficha num. 6/9.6) ---------------------
export const NIVELES_AUTONOMIA = ["autonoma", "consulta_previa", "requiere_aprobacion"] as const;

// --- Responsabilidad por recursos (ficha num. 7/9.7) -----------------------
export const NIVELES_RECURSO = ["alta", "media", "baja"] as const;

// --- Roles especiales de SST (ficha num. 4/9.4, checkboxes) ----------------
export const ROLES_SST = [
  "responsable_sgsst",
  "copasst",
  "convivencia",
  "brigada",
  "alturas",
  "pesv",
] as const;

export const loginSchema = z.object({
  email: z.string().trim().email("Correo inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

const passwordSchema = z.string().min(8, "La contraseña debe tener al menos 8 caracteres");

export const empresaSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre de la empresa es obligatorio"),
  nivelAcceso: z.enum(NIVELES_ACCESO_EMPRESA, { message: "Selecciona el nivel de acceso" }),
  usuarioNombre: z.string().trim().min(2, "El nombre del usuario de acceso es obligatorio"),
  usuarioEmail: z.string().trim().email("Correo inválido"),
  usuarioPassword: passwordSchema,
});

export const editarEmpresaSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre de la empresa es obligatorio"),
  nivelAcceso: z.enum(NIVELES_ACCESO_EMPRESA, { message: "Selecciona el nivel de acceso" }),
});

export const resetearPasswordSchema = z.object({
  password: passwordSchema,
});

// Vacío ("") se usa para campos de selección opcionales sin elegir todavía —
// se normaliza a null antes de guardar (ver src/app/actions/*.ts).
const opcional = z.union([z.literal(""), z.string().trim()]).optional();

export const departamentoSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre del departamento es obligatorio"),
  descripcion: opcional,
});

export const cargoSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre del cargo es obligatorio"),
  codigo: opcional,
  departamentoId: z.string().trim().min(1, "Selecciona un departamento"),
  nivelJerarquico: z.union([z.literal(""), z.enum(NIVELES_JERARQUICOS)]).optional(),
  jefeInmediatoId: opcional,
});

// Vacío ("") también se acepta para los selects de enum opcionales del
// Perfil (modalidad, jornada, clase de riesgo ARL, tipo de vinculación) —
// se normaliza a null antes de guardar, igual que el resto de opcionales.
function enumOpcional<T extends readonly [string, ...string[]]>(valores: T) {
  return z.union([z.literal(""), z.enum(valores)]).optional();
}

const porcentajeOpcional = z
  .union([z.literal(""), z.coerce.number().int().min(0).max(100)])
  .optional();

const funcionSchema = z.object({
  descripcion: z.string().trim().min(1, "La función no puede estar vacía"),
  frecuencia: z.enum(FRECUENCIAS_FUNCION),
  criterioDesempeno: z.string().trim().optional().default(""),
  porcentajeTiempo: porcentajeOpcional,
});

const flujoSchema = z.object({
  tipo: z.enum(TIPOS_FLUJO),
  descripcion: z.string().trim().min(1, "El flujo no puede estar vacío"),
  contraparte: z.string().trim().optional().default(""),
  contraparteCargoId: z.string().trim().optional().default(""),
});

const riesgoSchema = z.object({
  tipo: z.enum(TIPOS_RIESGO, { message: "Selecciona el tipo de riesgo" }),
  descripcion: z.string().trim().min(1, "El riesgo no puede estar vacío"),
  nivel: z.enum(NIVELES_RIESGO, { message: "Selecciona el nivel del riesgo" }),
  controlesExistentes: z.string().trim().optional().default(""),
  eppRequerido: z.string().trim().optional().default(""),
});

const ajusteSchema = z.object({
  tipoBarrera: z.enum(TIPOS_BARRERA, { message: "Selecciona el tipo de barrera" }),
  descripcionBarrera: z.string().trim().min(1, "Describe la barrera identificada"),
  apoyoSugerido: z.string().trim().min(1, "Describe el apoyo sugerido"),
});

const competenciaSchema = z.object({
  nombre: z.string().trim().min(1, "La competencia no puede estar vacía"),
  tipo: z.enum(TIPOS_COMPETENCIA, { message: "Selecciona el tipo de competencia" }),
  nivelRequerido: z.enum(NIVELES_COMPETENCIA, { message: "Selecciona el nivel requerido" }),
});

const decisionAutonomiaSchema = z.object({
  descripcion: z.string().trim().min(1, "La decisión no puede estar vacía"),
  nivelAutonomia: z.enum(NIVELES_AUTONOMIA, { message: "Selecciona el nivel de autonomía" }),
});

const responsabilidadSstSchema = z.object({
  descripcion: z.string().trim().min(1, "La responsabilidad no puede estar vacía"),
});

const indicadorSchema = z.object({
  nombre: z.string().trim().min(1, "El indicador no puede estar vacío"),
  formula: z.string().trim().optional().default(""),
  meta: z.string().trim().optional().default(""),
  frecuencia: z.string().trim().optional().default(""),
});

export const perfilSchema = z.object({
  razonSer: opcional,
  criticidadAusencia: opcional,
  numeroPuestos: porcentajeOpcional, // reutiliza la misma validación numérica opcional
  sede: opcional,
  modalidadTrabajo: enumOpcional(MODALIDADES_TRABAJO),
  jornada: enumOpcional(JORNADAS),
  claseRiesgoArl: enumOpcional(CLASES_RIESGO_ARL),
  tipoVinculacion: enumOpcional(TIPOS_VINCULACION),

  autonomiaDecision: opcional,
  recursoPersonasNivel: enumOpcional(NIVELES_RECURSO),
  recursoPersonasDescripcion: opcional,
  recursoDineroNivel: enumOpcional(NIVELES_RECURSO),
  recursoDineroDescripcion: opcional,
  recursoEquiposNivel: enumOpcional(NIVELES_RECURSO),
  recursoEquiposDescripcion: opcional,
  recursoInfoConfidencialNivel: enumOpcional(NIVELES_RECURSO),
  recursoInfoConfidencialDescripcion: opcional,
  recursoMaterialesNivel: enumOpcional(NIVELES_RECURSO),
  recursoMaterialesDescripcion: opcional,

  participacionComites: opcional,

  eppRequerido: opcional,
  protocolosEmergencia: opcional,
  rolesSst: z.array(z.enum(ROLES_SST)).default([]),
  evaluacionPreocupacional: opcional,
  evaluacionPeriodica: opcional,
  evaluacionPostIncapacidad: opcional,
  evaluacionEgreso: opcional,
  respSistemaCalidad: opcional,
  respSistemaAmbiental: opcional,
  respSistemaSeguridadVial: opcional,
  respSistemaSeguridadInformacion: opcional,
  respSistemaSagrilaft: opcional,

  requisitoEducacionFormal: opcional,
  requisitoTarjetaProfesional: opcional,
  requisitoFormacionComplementaria: opcional,
  requisitoCertificaciones: opcional,
  requisitoExperienciaGeneral: opcional,
  requisitoExperienciaEspecifica: opcional,
  requisitoEquivalencias: opcional,
  requisitoOtros: opcional,
  dotacion: opcional,
  equiposHerramientas: opcional,

  evidenciaProducto: opcional,
  evidenciaDesempeno: opcional,
  evidenciaConocimiento: opcional,

  funciones: z.array(funcionSchema),
  flujos: z.array(flujoSchema),
  riesgos: z.array(riesgoSchema),
  ajustes: z.array(ajusteSchema),
  competencias: z.array(competenciaSchema),
  decisiones: z.array(decisionAutonomiaSchema),
  responsabilidadesSst: z.array(responsabilidadSstSchema),
  indicadores: z.array(indicadorSchema),
});

export type PerfilInput = z.infer<typeof perfilSchema>;

export const funcionComunSchema = z.object({
  alcance: z.enum(ALCANCES_COMUN, { message: "Selecciona a quién aplica" }),
  descripcion: z.string().trim().min(1, "La función no puede estar vacía"),
  frecuencia: z.enum(FRECUENCIAS_FUNCION),
  criterioDesempeno: z.string().trim().optional().default(""),
});

export const competenciaComunSchema = z.object({
  alcance: z.enum(ALCANCES_COMUN, { message: "Selecciona a quién aplica" }),
  nombre: z.string().trim().min(1, "La competencia no puede estar vacía"),
  nivelRequerido: z.enum(NIVELES_COMPETENCIA, { message: "Selecciona el nivel requerido" }),
});

export const responsabilidadSstComunSchema = z.object({
  alcance: z.enum(ALCANCES_COMUN, { message: "Selecciona a quién aplica" }),
  descripcion: z.string().trim().min(1, "La responsabilidad no puede estar vacía"),
});

export const trabajadorSchema = z.object({
  documento: z.string().trim().min(1, "El documento es obligatorio"),
  nombres: z.string().trim().min(2, "El nombre es obligatorio"),
  email: z.string().trim().email("Correo inválido"),
  estado: z.enum(["activo", "inactivo"], { message: "Selecciona un estado" }),
});
