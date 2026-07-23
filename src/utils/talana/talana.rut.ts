export function normalizarRut(rut: string): string {
  return rut
    .trim()
    .replace(/\./g, "")
    .replace(/-/g, "")
    .replace(/\s/g, "")
    .toUpperCase();
}

export function formatearRutParaTalana(
  rut: string,
): string {
  const rutNormalizado = normalizarRut(rut);

  if (rutNormalizado.length < 2) {
    throw new Error("El RUT ingresado no es válido");
  }

  const cuerpo = rutNormalizado.slice(0, -1);
  const digitoVerificador = rutNormalizado.slice(-1);

  return `${cuerpo}-${digitoVerificador}`;
}