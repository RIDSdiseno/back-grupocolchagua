import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

// Crea el controlador PATCH .../orden. Recibe { ids: number[] } con todos los
// elementos en el nuevo orden y guarda la posición de cada uno.
export const crearReordenar = (
  actualizarOrden: (id: number, orden: number) => Prisma.PrismaPromise<unknown>,
  textos: { error: string; log: string }
) =>
  async (req: Request, res: Response) => {
    try {
      const ids: unknown = req.body.ids;

      if (
        !Array.isArray(ids) ||
        ids.some((id) => !Number.isInteger(id) || id <= 0)
      ) {
        return res.status(400).json({
          ok: false,
          message: "Debes enviar la lista de ids en el nuevo orden",
        });
      }

      await prisma.$transaction((ids as number[]).map((id, orden) => actualizarOrden(id, orden)));

      return res.json({
        ok: true,
        message: "Orden actualizado correctamente",
      });
    } catch (error) {
      console.error(textos.log, error);

      return res.status(500).json({
        ok: false,
        message: textos.error,
      });
    }
  };
