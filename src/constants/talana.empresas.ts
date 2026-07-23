export const TALANA_EMPRESA_COLCHAGUA_ID = Number(
  process.env.TALANA_EMPRESA_COLCHAGUA_ID ?? 1408,
);

export const TALANA_EMPRESA_SANTA_CRUZ_ID = Number(
  process.env.TALANA_EMPRESA_SANTA_CRUZ_ID ?? 1570,
);

export const EMPRESAS_TALANA = {
  GRUPO_COLCHAGUA: TALANA_EMPRESA_COLCHAGUA_ID,
  GRUPO_SANTA_CRUZ: TALANA_EMPRESA_SANTA_CRUZ_ID,
} as const;

export const EMPRESAS_TALANA_PERMITIDAS: number[] = [
  EMPRESAS_TALANA.GRUPO_COLCHAGUA,
  EMPRESAS_TALANA.GRUPO_SANTA_CRUZ,
];

export function validarEmpresaTalana(
  empresaId: number,
): void {
  if (
    !Number.isInteger(empresaId) ||
    !EMPRESAS_TALANA_PERMITIDAS.includes(empresaId)
  ) {
    throw new Error(
      `Empresa Talana inválida. Valores permitidos: ${EMPRESAS_TALANA_PERMITIDAS.join(
        ", ",
      )}`,
    );
  }
}