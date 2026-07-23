import { Request, Response } from "express";
import axios from "axios";

import {
  EMPRESAS_TALANA,
  EMPRESAS_TALANA_PERMITIDAS,
} from "../../constants/talana.empresas";

import { obtenerMuestraContratoTalana } from "../../services/talana/talana.contratos.service";

import { esFechaCompactaValida } from "../../utils/talana/talana.validators";

function obtenerQueryString(
  valor: unknown,
): string {
  return typeof valor === "string"
    ? valor.trim()
    : "";
}

function responderErrorTalana(
  res: Response,
  error: unknown,
): void {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    res.status(
      error.response?.status ?? 500,
    ).json({
      success: false,
      message:
        "Error obteniendo el contrato desde Talana",
      talanaStatus:
        error.response?.status ?? null,
      talanaError:
        typeof data === "string"
          ? data.slice(0, 1500)
          : data ?? error.message,
    });

    return;
  }

  res.status(500).json({
    success: false,
    message:
      error instanceof Error
        ? error.message
        : "Error desconocido obteniendo el contrato",
  });
}

export async function obtenerMuestraContrato(
  req: Request,
  res: Response,
): Promise<void> {
  const empresaId = Number(
    obtenerQueryString(
      req.query.empresa,
    ) ||
      EMPRESAS_TALANA.GRUPO_COLCHAGUA,
  );

  const fecha = obtenerQueryString(
    req.query.fecha,
  );

  if (
    !Number.isInteger(empresaId) ||
    !EMPRESAS_TALANA_PERMITIDAS.includes(
      empresaId,
    )
  ) {
    res.status(400).json({
      success: false,
      message:
        "La empresa Talana no es válida",
      empresasPermitidas:
        EMPRESAS_TALANA_PERMITIDAS,
    });

    return;
  }

  if (
    fecha &&
    !esFechaCompactaValida(fecha)
  ) {
    res.status(400).json({
      success: false,
      message:
        "La fecha debe tener el formato YYYYMMDD",
      ejemplo: "20260721",
    });

    return;
  }

  try {
    const resultado =
      await obtenerMuestraContratoTalana(
        empresaId,
        fecha || undefined,
      );

    if (!resultado.contratoEncontrado) {
      res.status(404).json({
        success: false,
        message:
          "No se encontraron contratos activos",
        data: resultado,
      });

      return;
    }

    res.status(200).json({
      success: true,
      message:
        "Contrato activo obtenido correctamente",
      data: resultado,
    });
  } catch (error: unknown) {
    responderErrorTalana(res, error);
  }
}