import { Request, Response } from "express";
import axios from "axios";

import { probarConexionTalana } from "../../services/talana/talana.marcas.service";

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
      message: "Error conectando con Talana",
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
        : "Error desconocido conectando con Talana",
  });
}

export async function testConexionTalana(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const resultado =
      await probarConexionTalana();

    res.status(200).json({
      success: true,
      message:
        "Conexión con Talana exitosa",
      data: resultado,
    });
  } catch (error: unknown) {
    responderErrorTalana(res, error);
  }
}