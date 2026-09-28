export function textoOpcional(formData: FormData, campo: string): string | null {
  const valor = formData.get(campo);
  if (typeof valor !== "string") return null;
  const limpio = valor.trim();
  return limpio === "" ? null : limpio;
}

/**
 * Lee varias listas paralelas (mismo `name` repetido por cada fila del
 * formulario, ver PerfilCargoForm) y las combina en un array de objetos,
 * emparejando por índice. Filas totalmente vacías se descartan.
 */
export function listasParalelas<T extends Record<string, string>>(
  formData: FormData,
  campos: { [K in keyof T]: string }
): T[] {
  const claves = Object.keys(campos) as (keyof T)[];
  const valores = claves.map((clave) => formData.getAll(campos[clave]).map((v) => String(v)));
  const longitud = Math.max(0, ...valores.map((v) => v.length));

  const filas: T[] = [];
  for (let i = 0; i < longitud; i++) {
    const fila = {} as T;
    let vacia = true;
    claves.forEach((clave, idx) => {
      const valor = (valores[idx][i] ?? "").trim();
      fila[clave] = valor as T[typeof clave];
      if (valor !== "") vacia = false;
    });
    if (!vacia) filas.push(fila);
  }
  return filas;
}
