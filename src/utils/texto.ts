// Recorta espacios; un texto vacío se guarda como null.
export const limpiarTexto = (valor: unknown): string | null => {
  if (valor === undefined || valor === null) return null;
  const texto = String(valor).trim();
  return texto.length > 0 ? texto : null;
};

// Interpreta "true"/"false" de formularios multipart. Vacío = no informado.
export const parsearBooleano = (valor: unknown): boolean | undefined => {
  if (valor === undefined || valor === null || valor === "") return undefined;
  return valor === true || valor === "true";
};

export const parsearId = (valor: unknown): number | null => {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// "Prevención de Riesgos!" → "prevencion-de-riesgos"
export const generarSlug = (texto: string): string =>
  texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");

// Agrega "-2", "-3"... al slug hasta que `estaOcupado` diga que está libre.
export const buscarSlugLibre = async (
  base: string,
  estaOcupado: (slug: string) => Promise<boolean>
): Promise<string> => {
  let slug = base;
  let intento = 2;

  while (await estaOcupado(slug)) {
    slug = `${base}-${intento}`;
    intento++;
  }

  return slug;
};
