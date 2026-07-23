export interface TalanaContrato {
  id?: number | string;

  empleado?: unknown;
  cargo?: unknown;

  empleadorRazonSocial?: unknown;
  sucursal?: unknown;
  unidadOrganizacional?: unknown;
  centroCosto?: unknown;

  fechaContratacion?: string | null;
  desde?: string | null;
  hasta?: string | null;

  [key: string]: unknown;
}

export interface ResultadoMuestraContratoTalana {
  empresaId: number;
  fechaConsulta?: string;

  totalContratos: number;
  contratoEncontrado: boolean;
  contrato: TalanaContrato | null;
}