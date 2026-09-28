import type { CargoConPerfil } from "@/lib/perfil-data";

/**
 * Antes de publicar un Perfil, exige lo mínimo para que la ficha tenga
 * sentido como documento formal — no todos los ~30 campos (muchos son
 * legítimamente opcionales según el cargo: ajustes de inclusión, otros
 * sistemas de gestión, evaluaciones médicas, roles de SST, etc.), solo lo
 * que ningún cargo real debería publicar sin tener: para qué existe, qué
 * hace, qué competencias exige, y con qué formación o experiencia se cubre.
 */
export function camposFaltantesParaPublicar(cargo: CargoConPerfil): string[] {
  const perfil = cargo.perfil;
  if (!perfil) return ["El cargo todavía no tiene un Perfil"];

  const faltantes: string[] = [];

  if (!perfil.razonSer?.trim()) faltantes.push("Razón de ser del cargo (numeral 1/2)");
  if (perfil.funciones.length === 0) faltantes.push("Al menos una función esencial (numeral 3)");
  if (perfil.competencias.length === 0) faltantes.push("Al menos una competencia requerida (numeral 10)");
  if (!perfil.requisitoEducacionFormal?.trim() && !perfil.requisitoExperienciaGeneral?.trim()) {
    faltantes.push("Educación formal o experiencia general (numeral 9)");
  }

  return faltantes;
}
