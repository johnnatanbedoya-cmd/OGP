import type { NIVELES_JERARQUICOS } from "@/lib/validaciones";

// Competencias comportamentales sugeridas por nivel jerárquico — adaptadas
// para empresa privada a partir de la Guía DAFP para Manuales de Funciones
// (Decreto 2539 de 2005, Anexo de competencias comportamentales). Se ofrecen
// como sugerencia editable, no como una lista cerrada: el consultor agrega,
// quita o cambia lo que no aplique al cargo real.
//
// Modelo de 3 capas que usa la guía:
// - Comunes: aplican a cualquier persona de la empresa, sin importar el nivel.
// - Por nivel jerárquico: varían según qué tanto el cargo decide, lidera o
//   ejecuta (ver NIVELES_JERARQUICOS en validaciones.ts).
// - Funcionales: específicas del cargo — esas ya se capturan a mano como
//   competencias "especifica" en el formulario, no van en esta tabla.

export const COMPETENCIAS_COMUNES: string[] = [
  "Orientación a resultados",
  "Orientación al cliente/usuario",
  "Compromiso con la organización",
  "Integridad",
];

export const COMPETENCIAS_POR_NIVEL: Record<(typeof NIVELES_JERARQUICOS)[number], string[]> = {
  directivo: [
    "Liderazgo",
    "Planeación",
    "Toma de decisiones",
    "Dirección y desarrollo de personal",
    "Visión estratégica del negocio",
  ],
  coordinacion: [
    "Liderazgo de grupos de trabajo",
    "Toma de decisiones",
    "Planeación",
    "Construcción de relaciones",
  ],
  profesional: [
    "Aprendizaje continuo",
    "Trabajo en equipo y colaboración",
    "Creatividad e innovación",
    "Experticia profesional",
  ],
  tecnico: [
    "Experticia técnica",
    "Manejo de la información",
    "Adaptación al cambio",
    "Trabajo en equipo",
  ],
  auxiliar: [
    "Manejo de la información",
    "Disciplina",
    "Adaptación al cambio",
    "Colaboración",
  ],
  operativo: [
    "Relaciones interpersonales",
    "Colaboración",
    "Disciplina",
    "Adaptación al cambio",
  ],
};

export function competenciasSugeridasPara(nivelJerarquico: string | null): string[] {
  const porNivel = nivelJerarquico ? COMPETENCIAS_POR_NIVEL[nivelJerarquico as keyof typeof COMPETENCIAS_POR_NIVEL] : undefined;
  return [...COMPETENCIAS_COMUNES, ...(porNivel ?? [])];
}
