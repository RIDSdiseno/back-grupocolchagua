import type { AxiosResponse } from "axios";

import { talanaApi } from "../../config/talana/talana.client";

import type {
  FiltrosLiquidacionesTalana,
  FiltrosLiquidacionesVistaAnchaTalana,
  TalanaComprobanteLiquidacion,
  TalanaLiquidacion,
  TalanaRespuestaListado,
} from "../../types/talana/talana.liquidaciones.types";

import { formatearRutParaTalana } from "../../utils/talana/talana.rut";

function limpiarParametros(
  parametros: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(parametros).filter(
      ([, valor]) =>
        valor !== undefined &&
        valor !== null &&
        valor !== "",
    ),
  );
}

function construirParametrosListado(
  filtros: FiltrosLiquidacionesTalana,
): Record<string, unknown> {
  return limpiarParametros({
    empleado: filtros.empleado,
    tipoLiquidacion: filtros.tipoLiquidacion,
    periodo: filtros.periodo,
    codigoDeProceso: filtros.codigoDeProceso,
    periodo__mes: filtros.periodoMes,
    periodo__ano: filtros.periodoAno,
    cursor: filtros.cursor,
    page_size: filtros.pageSize,
    rut: filtros.rut
      ? formatearRutParaTalana(filtros.rut)
      : undefined,
  });
}

/**
 * Lista liquidaciones con desglose por ítem de pago.
 */
export async function listarLiquidacionesTalana(
  filtros: FiltrosLiquidacionesTalana,
): Promise<TalanaRespuestaListado<TalanaLiquidacion>> {
  const response: AxiosResponse<
    TalanaRespuestaListado<TalanaLiquidacion>
  > = await talanaApi.get<
    TalanaRespuestaListado<TalanaLiquidacion>
  >("/liquidaciones/", {
    params: construirParametrosListado(filtros),
  });

  return response.data;
}

/**
 * Obtiene el detalle completo de una liquidación.
 */
export async function obtenerLiquidacionTalana(
  liquidacionId: string,
): Promise<TalanaLiquidacion> {
  const id = encodeURIComponent(liquidacionId);

  const response: AxiosResponse<TalanaLiquidacion> =
    await talanaApi.get<TalanaLiquidacion>(
      `/liquidaciones/${id}/`,
    );

  return response.data;
}

/**
 * Lista comprobantes y URL de los PDF.
 */
export async function listarComprobantesLiquidacionesTalana(
  filtros: FiltrosLiquidacionesTalana,
): Promise<
  TalanaRespuestaListado<TalanaComprobanteLiquidacion>
> {
  const response: AxiosResponse<
    TalanaRespuestaListado<TalanaComprobanteLiquidacion>
  > = await talanaApi.get<
    TalanaRespuestaListado<TalanaComprobanteLiquidacion>
  >("/liquidaciones/comprobantes/", {
    params: construirParametrosListado(filtros),
  });

  return response.data;
}

/**
 * Obtiene la URL del PDF correspondiente
 * a una liquidación concreta.
 */
export async function obtenerComprobanteLiquidacionTalana(
  liquidacionId: string,
): Promise<TalanaComprobanteLiquidacion> {
  const id = encodeURIComponent(liquidacionId);

  const response: AxiosResponse<TalanaComprobanteLiquidacion> =
    await talanaApi.get<TalanaComprobanteLiquidacion>(
      `/liquidaciones/comprobantes/${id}/`,
    );

  return response.data;
}

/**
 * Vista ancha para reportería, BI y cruces
 * entre trabajador, contrato y liquidación.
 */
export async function listarLiquidacionesVistaAnchaTalana(
  filtros: FiltrosLiquidacionesVistaAnchaTalana,
): Promise<unknown> {
  const params = limpiarParametros({
    ano: filtros.ano,
    mes: filtros.mes,
    centro_costo: filtros.centroCosto,
    rut: filtros.rut
      ? formatearRutParaTalana(filtros.rut)
      : undefined,
    persona_id: filtros.personaId,
    tipo_liquidacion: filtros.tipoLiquidacion,
  });

  const response: AxiosResponse<unknown> =
    await talanaApi.get<unknown>(
      "/payslips-wide-view",
      {
        params,
      },
    );

  return response.data;
}