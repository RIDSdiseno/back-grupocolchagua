import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// Ajustes conocidos de la página pública, con su valor por defecto.
// Una clave que no esté aquí no se puede leer ni modificar.
const AJUSTES_WEB = {
  blogVisible: false,
} as const;

type ClaveAjusteWeb = keyof typeof AJUSTES_WEB;

const esClaveAjusteWeb = (clave: string): clave is ClaveAjusteWeb =>
  Object.prototype.hasOwnProperty.call(AJUSTES_WEB, clave);

// Combina los valores por defecto con los guardados en la base.
const obtenerAjustes = async () => {
  const guardados = await prisma.ajusteWeb.findMany();
  const ajustes: Record<string, unknown> = { ...AJUSTES_WEB };

  for (const ajuste of guardados) {
    if (esClaveAjusteWeb(ajuste.clave)) {
      ajustes[ajuste.clave] = ajuste.valor;
    }
  }

  return ajustes;
};

// Pública: la consume la página web.
export const listarAjustesPublicos = async (_req: Request, res: Response) => {
  try {
    const ajustes = await obtenerAjustes();

    return res.json({ ok: true, ajustes });
  } catch (error) {
    console.error("ERROR LISTAR AJUSTES WEB:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al listar ajustes",
    });
  }
};

export const actualizarAjuste = async (req: Request, res: Response) => {
  try {
    const clave = String(req.params.clave);

    if (!esClaveAjusteWeb(clave)) {
      return res.status(404).json({
        ok: false,
        message: "Ajuste no encontrado",
      });
    }

    const valor = req.body?.valor;

    if (typeof valor !== typeof AJUSTES_WEB[clave]) {
      return res.status(400).json({
        ok: false,
        message: "Valor inválido para el ajuste",
      });
    }

    await prisma.ajusteWeb.upsert({
      where: { clave },
      create: { clave, valor },
      update: { valor },
    });

    const ajustes = await obtenerAjustes();

    return res.json({ ok: true, ajustes });
  } catch (error) {
    console.error("ERROR ACTUALIZAR AJUSTE WEB:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al actualizar ajuste",
    });
  }
};
