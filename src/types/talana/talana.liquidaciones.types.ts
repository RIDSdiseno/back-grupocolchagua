export const TIPOS_LIQUIDACION_TALANA = [
  "sueldo",
  "anticipo",
  "finiquito",
  "histórica",
  "reliquidacion",
  "sueldo reprocesada",
] as const;

export type TipoLiquidacionTalana =
  (typeof TIPOS_LIQUIDACION_TALANA)[number];

export interface FiltrosLiquidacionesTalana {
  empleado?: number;
  tipoLiquidacion?: TipoLiquidacionTalana;
  periodo?: string;
  codigoDeProceso?: string;
  periodoMes?: number;
  periodoAno?: number;
  cursor?: string;
  pageSize?: number;
  rut?: string;
}

export interface FiltrosLiquidacionesVistaAnchaTalana {
  ano?: number;
  mes?: number;
  centroCosto?: number;
  rut?: string;
  personaId?: number;
  tipoLiquidacion?: TipoLiquidacionTalana;
}

export interface TalanaLiquidacion {
  id?: number | string;
  empleado?: number | string;
  contrato?: number | string;
  rut?: string;
  tipoLiquidacion?: string;
  periodo?: unknown;
  totalHaberes?: number;
  totalDescuentos?: number;
  liquido?: number;

  /*
   * Dejamos abierta la interfaz hasta observar
   * una respuesta real de producción.
   */
  [key: string]: unknown;
}

export interface TalanaComprobanteLiquidacion {
  id: number | string;
  rut?: string;
  contrato?: number | string;
  uuid?: string;
  periodo_desde?: string;
  periodo_hasta?: string;
  url?: string;

  [key: string]: unknown;
}

export interface TalanaRespuestaPaginadaCursor<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];

  [key: string]: unknown;
}

export type TalanaRespuestaListado<T> =
  | TalanaRespuestaPaginadaCursor<T>
  | T[];