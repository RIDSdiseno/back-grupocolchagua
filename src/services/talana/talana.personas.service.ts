import type { AxiosResponse } from "axios";

import { talanaApi } from "../../config/talana/talana.client";

import {
  EMPRESAS_TALANA,
  validarEmpresaTalana,
} from "../../constants/talana.empresas";

import type { TalanaPaginatedResponse } from "../../types/talana/talana.common.types";

import type {
  ResultadoBusquedaTalana,
  TalanaPersona,
} from "../../types/talana/talana.personas.types";

import {
  formatearRutParaTalana,
  normalizarRut,
} from "../../utils/talana/talana.rut";

export async function buscarTrabajadorTalanaPorRut(
  rut: string,
  empresaId: number,
): Promise<ResultadoBusquedaTalana> {
  validarEmpresaTalana(empresaId);

  const rutNormalizado = normalizarRut(rut);
  const rutConsultado =
    formatearRutParaTalana(rut);

  const response: AxiosResponse<
    TalanaPaginatedResponse<TalanaPersona>
  > = await talanaApi.get<
    TalanaPaginatedResponse<TalanaPersona>
  >("/personas-paginadas/", {
    params: {
      empresa: empresaId,
      rut: rutConsultado,
      page: 1,
      page_size: 100,
    },
  });

  const resultados: TalanaPersona[] =
    Array.isArray(response.data.results)
      ? response.data.results
      : [];

  const persona =
    resultados.find((item: TalanaPersona) => {
      if (!item.rut) {
        return false;
      }

      return (
        normalizarRut(String(item.rut)) ===
        rutNormalizado
      );
    }) ?? null;

  return {
    persona,
    diagnostico: {
      empresaId,
      rutOriginal: rut,
      rutConsultado,
      totalTalana: Number(
        response.data.count ?? resultados.length,
      ),
      resultadosRecibidos: resultados.length,
      rutsDevueltos: resultados
        .slice(0, 10)
        .map((item: TalanaPersona) =>
          String(item.rut ?? ""),
        ),
    },
  };
}

export async function listarPersonasTalana(
  empresaId: number,
  page: number,
  pageSize: number,
): Promise<TalanaPaginatedResponse<TalanaPersona>> {
  validarEmpresaTalana(empresaId);

  const response: AxiosResponse<
    TalanaPaginatedResponse<TalanaPersona>
  > = await talanaApi.get<
    TalanaPaginatedResponse<TalanaPersona>
  >("/personas-paginadas/", {
    params: {
      empresa: empresaId,
      page,
      page_size: pageSize,
    },
  });

  return response.data;
}

export async function buscarTrabajadorTalanaEnAmbasEmpresas(
  rut: string,
): Promise<ResultadoBusquedaTalana[]> {
  const empresas: number[] = [
    EMPRESAS_TALANA.GRUPO_COLCHAGUA,
    EMPRESAS_TALANA.GRUPO_SANTA_CRUZ,
  ];

  const resultados: ResultadoBusquedaTalana[] = [];

  for (const empresaId of empresas) {
    const resultado =
      await buscarTrabajadorTalanaPorRut(
        rut,
        empresaId,
      );

    resultados.push(resultado);
  }

  return resultados;
}