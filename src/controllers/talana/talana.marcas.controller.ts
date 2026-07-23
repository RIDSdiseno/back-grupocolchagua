import { Request, Response } from "express";
import axios from "axios";

import {
  EMPRESAS_TALANA,
  EMPRESAS_TALANA_PERMITIDAS,
} from "../../constants/talana.empresas";

import { listarTrabajadoresQueMarcanTalana } from "../../services/talana/talana.marcas.service";

import {
  calcularDiasEntreFechas,
  convertirFechaIsoUtc,
  esFechaIsoValida,
} from "../../utils/talana/talana.validators";

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
        "Error obteniendo las marcaciones de Talana",
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
        : "Error desconocido obteniendo marcaciones",
  });
}

export async function obtenerTrabajadoresConMarcaciones(
  req: Request,
  res: Response,
): Promise<void> {
  const desde = obtenerQueryString(
    req.query.desde,
  );

  const hasta = obtenerQueryString(
    req.query.hasta,
  );

  const empresaId = Number(
    obtenerQueryString(
      req.query.empresa,
    ) ||
      EMPRESAS_TALANA.GRUPO_COLCHAGUA,
  );

  if (
    !esFechaIsoValida(desde) ||
    !esFechaIsoValida(hasta)
  ) {
    res.status(400).json({
      success: false,
      message:
        "Debes enviar desde y hasta en formato YYYY-MM-DD",
      ejemplo:
        "/api/talana/trabajadores-con-marcaciones" +
        "?desde=2026-07-20" +
        "&hasta=2026-07-21" +
        "&empresa=1408",
    });

    return;
  }

  if (
    convertirFechaIsoUtc(desde).getTime() >
    convertirFechaIsoUtc(hasta).getTime()
  ) {
    res.status(400).json({
      success: false,
      message:
        "La fecha desde no puede ser posterior a la fecha hasta",
    });

    return;
  }

  const diasConsultados =
    calcularDiasEntreFechas(desde, hasta);

  if (diasConsultados > 31) {
    res.status(400).json({
      success: false,
      message:
        "El período máximo permitido es de 31 días",
      diasConsultados,
    });

    return;
  }

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

  try {
    const resultado =
      await listarTrabajadoresQueMarcanTalana(
        desde,
        hasta,
        empresaId,
      );

    res.status(200).json({
      success: true,
      message:
        "Trabajadores con marcaciones obtenidos correctamente",
      data: resultado,
    });
  } catch (error: unknown) {
    responderErrorTalana(res, error);
  }
}