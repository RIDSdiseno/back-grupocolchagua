import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

const normalizarId = (valor: unknown): number | null => {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const listarTodasSucursales = async (_req: Request, res: Response) => {
  try {
    const sucursales = await prisma.sucursal.findMany({
      include: {
        Holding: true,
        Empresa: {
          select: {
            id: true,
            nombre: true,
            holdings: {
              include: {
                Holding: true,
              },
            },
          },
        },
      },
      orderBy: [
        { Holding: { nombre: "asc" } },
        { Empresa: { nombre: "asc" } },
        { nombre: "asc" },
      ],
    });

    return res.json({ ok: true, sucursales });
  } catch (error) {
    console.error("ERROR LISTAR SUCURSALES:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al listar sucursales",
    });
  }
};

export const listarSucursalesPorEmpresa = async (req: Request, res: Response) => {
  try {
    const empresaId = Number(req.params.empresaId);
    const holdingId = req.query.holdingId
      ? normalizarId(req.query.holdingId)
      : null;

    if (Number.isNaN(empresaId)) {
      return res.status(400).json({
        ok: false,
        message: "ID de empresa inválido",
      });
    }

    const sucursales = await prisma.sucursal.findMany({
      where: {
        empresaId,
        ...(holdingId ? { holdingId } : {}),
      },
      include: {
        Holding: true,
        Empresa: {
          select: {
            id: true,
            nombre: true,
            holdings: {
              include: {
                Holding: true,
              },
            },
          },
        },
      },
      orderBy: { id: "desc" },
    });

    return res.json({ ok: true, sucursales });
  } catch (error) {
    console.error("ERROR LISTAR SUCURSALES:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al listar sucursales",
    });
  }
};

export const crearSucursal = async (req: Request, res: Response) => {
  try {
    const empresaId = Number(req.params.empresaId);
    const { nombre, direccion, comuna, ciudad, holdingId } = req.body;

    if (Number.isNaN(empresaId)) {
      return res.status(400).json({
        ok: false,
        message: "ID de empresa inválido",
      });
    }

    const holdingIdNumber = normalizarId(holdingId);

    if (!holdingIdNumber) {
      return res.status(400).json({
        ok: false,
        message: "Debes seleccionar un holding para la sucursal",
      });
    }

    if (!nombre || !String(nombre).trim()) {
      return res.status(400).json({
        ok: false,
        message: "El nombre de la sucursal es obligatorio",
      });
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      include: {
        holdings: true,
      },
    });

    if (!empresa) {
      return res.status(404).json({
        ok: false,
        message: "Empresa no encontrada",
      });
    }

    const empresaPerteneceAlHolding = empresa.holdings.some(
      (relacion) => relacion.holdingId === holdingIdNumber
    );

    if (!empresaPerteneceAlHolding) {
      return res.status(400).json({
        ok: false,
        message: "La empresa no pertenece al holding seleccionado",
      });
    }

    const holding = await prisma.holding.findUnique({
      where: { id: holdingIdNumber },
    });

    if (!holding) {
      return res.status(404).json({
        ok: false,
        message: "Holding no encontrado",
      });
    }

    const sucursalExistente = await prisma.sucursal.findFirst({
      where: {
        empresaId,
        holdingId: holdingIdNumber,
        nombre: {
          equals: String(nombre).trim(),
          mode: "insensitive",
        },
      },
    });

    if (sucursalExistente) {
      return res.status(400).json({
        ok: false,
        message: "Esta empresa ya tiene una sucursal con ese nombre en este holding",
      });
    }

    const sucursal = await prisma.sucursal.create({
      data: {
        empresaId,
        holdingId: holdingIdNumber,
        nombre: String(nombre).trim(),
        direccion: direccion ? String(direccion).trim() : null,
        comuna: comuna ? String(comuna).trim() : null,
        ciudad: ciudad ? String(ciudad).trim() : null,
      },
      include: {
        Holding: true,
        Empresa: {
          select: {
            id: true,
            nombre: true,
            holdings: {
              include: {
                Holding: true,
              },
            },
          },
        },
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Sucursal creada correctamente",
      sucursal,
    });
  } catch (error) {
    console.error("ERROR CREAR SUCURSAL:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al crear sucursal",
    });
  }
};

export const actualizarSucursal = async (req: Request, res: Response) => {
  try {
    const sucursalId = Number(req.params.id);
    const { nombre, direccion, comuna, ciudad, activo, holdingId } = req.body;

    if (Number.isNaN(sucursalId)) {
      return res.status(400).json({
        ok: false,
        message: "ID de sucursal inválido",
      });
    }

    const sucursalExistente = await prisma.sucursal.findUnique({
      where: { id: sucursalId },
      include: {
        Empresa: {
          include: {
            holdings: true,
          },
        },
      },
    });

    if (!sucursalExistente) {
      return res.status(404).json({
        ok: false,
        message: "Sucursal no encontrada",
      });
    }

    const nuevoHoldingId =
      holdingId !== undefined ? normalizarId(holdingId) : sucursalExistente.holdingId;

    if (!nuevoHoldingId) {
      return res.status(400).json({
        ok: false,
        message: "Holding inválido",
      });
    }

    const empresaPerteneceAlHolding = sucursalExistente.Empresa.holdings.some(
      (relacion) => relacion.holdingId === nuevoHoldingId
    );

    if (!empresaPerteneceAlHolding) {
      return res.status(400).json({
        ok: false,
        message: "La empresa no pertenece al holding seleccionado",
      });
    }

    const sucursal = await prisma.sucursal.update({
      where: { id: sucursalId },
      data: {
        holdingId: nuevoHoldingId,
        nombre: nombre ? String(nombre).trim() : sucursalExistente.nombre,
        direccion:
          direccion !== undefined
            ? String(direccion).trim()
            : sucursalExistente.direccion,
        comuna:
          comuna !== undefined
            ? String(comuna).trim()
            : sucursalExistente.comuna,
        ciudad:
          ciudad !== undefined
            ? String(ciudad).trim()
            : sucursalExistente.ciudad,
        activo:
          activo !== undefined ? Boolean(activo) : sucursalExistente.activo,
      },
      include: {
        Holding: true,
        Empresa: {
          select: {
            id: true,
            nombre: true,
            holdings: {
              include: {
                Holding: true,
              },
            },
          },
        },
      },
    });

    return res.json({
      ok: true,
      message: "Sucursal actualizada correctamente",
      sucursal,
    });
  } catch (error) {
    console.error("ERROR ACTUALIZAR SUCURSAL:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al actualizar sucursal",
    });
  }
};

export const eliminarSucursal = async (req: Request, res: Response) => {
  try {
    const sucursalId = Number(req.params.id);

    if (Number.isNaN(sucursalId)) {
      return res.status(400).json({
        ok: false,
        message: "ID de sucursal inválido",
      });
    }

    const sucursal = await prisma.sucursal.findUnique({
      where: { id: sucursalId },
      include: {
        Tarifa: true,
        Asignacion: true,
        Asistencia: true,
      },
    });

    if (!sucursal) {
      return res.status(404).json({
        ok: false,
        message: "Sucursal no encontrada",
      });
    }

    if (
      sucursal.Tarifa.length > 0 ||
      sucursal.Asignacion.length > 0 ||
      sucursal.Asistencia.length > 0
    ) {
      return res.status(400).json({
        ok: false,
        message: "No se puede eliminar esta sucursal porque tiene datos asociados",
      });
    }

    await prisma.sucursal.delete({
      where: { id: sucursalId },
    });

    return res.json({
      ok: true,
      message: "Sucursal eliminada correctamente",
    });
  } catch (error) {
    console.error("ERROR ELIMINAR SUCURSAL:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al eliminar sucursal",
    });
  }
};