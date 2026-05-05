// src/controllers/cargo.controller.ts
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

const normalizarNombreCargo = (valor: unknown): string => {
  return String(valor || "").trim();
};

export const listarCargos = async (_req: Request, res: Response) => {
  try {
    const cargos = await prisma.cargo.findMany({
      orderBy: { nombre: "asc" },
      include: {
        _count: {
          select: {
            Asignacion: true,
            Asistencia: true,
            Tarifa: true,
          },
        },
      },
    });

    return res.json({
      ok: true,
      cargos,
    });
  } catch (error) {
    console.error("ERROR LISTAR CARGOS:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al listar cargos",
    });
  }
};

export const crearCargo = async (req: Request, res: Response) => {
  try {
    const nombreNormalizado = normalizarNombreCargo(req.body.nombre);

    if (!nombreNormalizado) {
      return res.status(400).json({
        ok: false,
        message: "El nombre del cargo es obligatorio",
      });
    }

    const cargoExistente = await prisma.cargo.findFirst({
      where: {
        nombre: {
          equals: nombreNormalizado,
          mode: "insensitive",
        },
      },
    });

    if (cargoExistente) {
      return res.status(400).json({
        ok: false,
        message: "Ya existe un cargo con este nombre",
      });
    }

    const cargo = await prisma.cargo.create({
      data: {
        nombre: nombreNormalizado,
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Cargo creado correctamente",
      cargo,
    });
  } catch (error) {
    console.error("ERROR CREAR CARGO:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al crear cargo",
    });
  }
};

export const actualizarCargo = async (req: Request, res: Response) => {
  try {
    const cargoId = Number(req.params.id);
    const nombreNormalizado = normalizarNombreCargo(req.body.nombre);

    if (Number.isNaN(cargoId)) {
      return res.status(400).json({
        ok: false,
        message: "ID de cargo inválido",
      });
    }

    if (!nombreNormalizado) {
      return res.status(400).json({
        ok: false,
        message: "El nombre del cargo es obligatorio",
      });
    }

    const cargoExistente = await prisma.cargo.findUnique({
      where: { id: cargoId },
    });

    if (!cargoExistente) {
      return res.status(404).json({
        ok: false,
        message: "Cargo no encontrado",
      });
    }

    const otroCargo = await prisma.cargo.findFirst({
      where: {
        nombre: {
          equals: nombreNormalizado,
          mode: "insensitive",
        },
        NOT: {
          id: cargoId,
        },
      },
    });

    if (otroCargo) {
      return res.status(400).json({
        ok: false,
        message: "Ya existe otro cargo con este nombre",
      });
    }

    const cargo = await prisma.cargo.update({
      where: { id: cargoId },
      data: {
        nombre: nombreNormalizado,
      },
    });

    return res.json({
      ok: true,
      message: "Cargo actualizado correctamente",
      cargo,
    });
  } catch (error) {
    console.error("ERROR ACTUALIZAR CARGO:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al actualizar cargo",
    });
  }
};

export const eliminarCargo = async (req: Request, res: Response) => {
  try {
    const cargoId = Number(req.params.id);

    if (Number.isNaN(cargoId)) {
      return res.status(400).json({
        ok: false,
        message: "ID de cargo inválido",
      });
    }

    const cargo = await prisma.cargo.findUnique({
      where: { id: cargoId },
      include: {
        _count: {
          select: {
            Asignacion: true,
            Asistencia: true,
            Tarifa: true,
          },
        },
      },
    });

    if (!cargo) {
      return res.status(404).json({
        ok: false,
        message: "Cargo no encontrado",
      });
    }

    const tieneRelaciones =
      cargo._count.Asignacion > 0 ||
      cargo._count.Asistencia > 0 ||
      cargo._count.Tarifa > 0;

    if (tieneRelaciones) {
      return res.status(400).json({
        ok: false,
        message:
          "No se puede eliminar este cargo porque tiene asignaciones, asistencias o tarifas asociadas",
      });
    }

    await prisma.cargo.delete({
      where: { id: cargoId },
    });

    return res.json({
      ok: true,
      message: "Cargo eliminado correctamente",
    });
  } catch (error) {
    console.error("ERROR ELIMINAR CARGO:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al eliminar cargo",
    });
  }
};