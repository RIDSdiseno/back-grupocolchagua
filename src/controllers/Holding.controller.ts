import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const listarHoldings = async (_req: Request, res: Response) => {
  try {
    const holdings = await prisma.holding.findMany({
      orderBy: { id: "asc" },
      include: {
        _count: {
          select: {
            empresas: true,
          },
        },
      },
    });

    return res.json({ ok: true, holdings });
  } catch (error) {
    console.error("ERROR LISTAR HOLDINGS:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al listar holdings",
    });
  }
};

export const obtenerHolding = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ ok: false, message: "ID inválido" });
    }

    const holding = await prisma.holding.findUnique({
      where: { id },
      include: {
        empresas: {
          include: {
            Empresa: {
              include: {
                Sucursal: {
                  orderBy: {
                    nombre: "asc",
                  },
                },
              },
            },
          },
          orderBy: {
            Empresa: {
              nombre: "asc",
            },
          },
        },
      },
    });

    if (!holding) {
      return res.status(404).json({
        ok: false,
        message: "Holding no encontrado",
      });
    }

    return res.json({ ok: true, holding });
  } catch (error) {
    console.error("ERROR OBTENER HOLDING:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al obtener holding",
    });
  }
};

export const crearHolding = async (req: Request, res: Response) => {
  try {
    const { nombre } = req.body;

    if (!nombre?.trim()) {
      return res.status(400).json({
        ok: false,
        message: "El nombre es obligatorio",
      });
    }

    const holding = await prisma.holding.create({
      data: {
        nombre: String(nombre).trim(),
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Holding creado correctamente",
      holding,
    });
  } catch (error: any) {
    console.error("ERROR CREAR HOLDING:", error);

    if (error?.code === "P2002") {
      return res.status(400).json({
        ok: false,
        message: "Ya existe un holding con ese nombre",
      });
    }

    return res.status(500).json({
      ok: false,
      message: "Error al crear holding",
    });
  }
};

export const actualizarHolding = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { nombre } = req.body;

    if (Number.isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "ID inválido",
      });
    }

    if (!nombre?.trim()) {
      return res.status(400).json({
        ok: false,
        message: "El nombre es obligatorio",
      });
    }

    const holdingExiste = await prisma.holding.findUnique({
      where: { id },
    });

    if (!holdingExiste) {
      return res.status(404).json({
        ok: false,
        message: "Holding no encontrado",
      });
    }

    const holding = await prisma.holding.update({
      where: { id },
      data: {
        nombre: String(nombre).trim(),
      },
    });

    return res.json({
      ok: true,
      message: "Holding actualizado correctamente",
      holding,
    });
  } catch (error: any) {
    console.error("ERROR ACTUALIZAR HOLDING:", error);

    if (error?.code === "P2002") {
      return res.status(400).json({
        ok: false,
        message: "Ya existe un holding con ese nombre",
      });
    }

    return res.status(500).json({
      ok: false,
      message: "Error al actualizar holding",
    });
  }
};

export const eliminarHolding = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "ID inválido",
      });
    }

    const holding = await prisma.holding.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            empresas: true,
          },
        },
      },
    });

    if (!holding) {
      return res.status(404).json({
        ok: false,
        message: "Holding no encontrado",
      });
    }

    if (holding._count.empresas > 0) {
      return res.status(400).json({
        ok: false,
        message: "No se puede eliminar un holding con empresas asociadas",
      });
    }

    await prisma.holding.delete({
      where: { id },
    });

    return res.json({
      ok: true,
      message: "Holding eliminado correctamente",
    });
  } catch (error) {
    console.error("ERROR ELIMINAR HOLDING:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al eliminar holding",
    });
  }
};