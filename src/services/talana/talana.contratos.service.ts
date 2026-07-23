import type { AxiosResponse } from "axios";

import { talanaApi } from "../../config/talana/talana.client";

import { validarEmpresaTalana } from "../../constants/talana.empresas";

import type { TalanaPaginatedResponse } from "../../types/talana/talana.common.types";

import type {
  ResultadoMuestraContratoTalana,
  TalanaContrato,
} from "../../types/talana/talana.contratos.types";

export async function obtenerMuestraContratoTalana(
  empresaId: number,
  activeOn?: string,
): Promise<ResultadoMuestraContratoTalana> {
  validarEmpresaTalana(empresaId);

  const params: Record<
    string,
    string | number
  > = {
    empresa: empresaId,
    type_status_search: "actives",
    page: 1,
    page_size: 1,
  };

  if (activeOn) {
    params.active_on = activeOn;
  }

  const response: AxiosResponse<
    TalanaPaginatedResponse<TalanaContrato>
  > = await talanaApi.get<
    TalanaPaginatedResponse<TalanaContrato>
  >("/contrato-paginado/", {
    params,
  });

  const resultados: TalanaContrato[] =
    Array.isArray(response.data.results)
      ? response.data.results
      : [];

  return {
    empresaId,
    fechaConsulta: activeOn,

    totalContratos: Number(
      response.data.count ?? resultados.length,
    ),

    contratoEncontrado:
      resultados.length > 0,

    contrato: resultados[0] ?? null,
  };
}