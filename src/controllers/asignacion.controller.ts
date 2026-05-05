import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

const include = {
  Trabajador: { select: { id: true, nombre: true, apellido: true, rut: true } },
  Empresa: { select: { id: true, nombre: true } },
  Sucursal: { select: { id: true, nombre: true } },
  Cargo: { select: { id: true, nombre: true } },
};

// Verifica si dos rangos de fechas se solapan
// Rango actual: [fechaInicio, fechaFin | ∞]
// Rango candidato: [nuevaInicio, nuevaFin | ∞]
async function existeSolapamiento(
  trabajadorId: number,
  empresaId: number,
  cargoId: number,
  fechaInicio: Date,
  fechaFin: Date | null,
  excludeId?: number
): Promise<boolean> {
  const where: any = {
    trabajadorId,
    empresaId,
    cargoId,
    // La asignación existente termina después de que la nueva empieza (o es indefinida)
    OR: [{ fechaFin: null }, { fechaFin: { gte: fechaInicio } }],
  };

  // Si la nueva tiene fecha de término, la existente debe empezar antes de que termine
  if (fechaFin) {
    where.fechaInicio = { lte: fechaFin };
  }

  if (excludeId) {
    where.NOT = { id: excludeId };
  }

  const existente = await prisma.asignacion.findFirst({ where });
  return existente !== null;
}

export const listarAsignaciones = async (req: Request, res: Response) => {
  try {
    const { empresaId, trabajadorId } = req.query;

    const where: any = {};
    if (empresaId) where.empresaId = Number(empresaId);
    if (trabajadorId) where.trabajadorId = Number(trabajadorId);

    const asignaciones = await prisma.asignacion.findMany({
      where,
      include,
      orderBy: { fechaInicio: "desc" },
    });

    return res.json({ ok: true, asignaciones });
  } catch (error) {
    console.error("ERROR LISTAR ASIGNACIONES:", error);
    return res
      .status(500)
      .json({ ok: false, message: "Error al listar asignaciones" });
  }
};

export const crearAsignacion = async (req: Request, res: Response) => {
  try {
    const { trabajadorId, empresaId, sucursalId, cargoId, fechaInicio, fechaFin } =
      req.body;

    if (!trabajadorId || !empresaId || !cargoId || !fechaInicio) {
      return res.status(400).json({
        ok: false,
        message: "Trabajador, empresa, cargo y fecha de inicio son obligatorios",
      });
    }

    const inicio = new Date(fechaInicio);
    const fin = fechaFin ? new Date(fechaFin) : null;

    if (isNaN(inicio.getTime())) {
      return res
        .status(400)
        .json({ ok: false, message: "Fecha de inicio inválida" });
    }

    if (fin && isNaN(fin.getTime())) {
      return res
        .status(400)
        .json({ ok: false, message: "Fecha de término inválida" });
    }

    if (fin && fin <= inicio) {
      return res.status(400).json({
        ok: false,
        message: "La fecha de término debe ser posterior a la de inicio",
      });
    }

    const [trabajador, empresa, cargo] = await Promise.all([
      prisma.trabajador.findUnique({ where: { id: Number(trabajadorId) } }),
      prisma.empresa.findUnique({ where: { id: Number(empresaId) } }),
      prisma.cargo.findUnique({ where: { id: Number(cargoId) } }),
    ]);

    if (!trabajador)
      return res
        .status(404)
        .json({ ok: false, message: "Trabajador no encontrado" });
    if (!empresa)
      return res
        .status(404)
        .json({ ok: false, message: "Empresa no encontrada" });
    if (!cargo)
      return res
        .status(404)
        .json({ ok: false, message: "Cargo no encontrado" });

    if (sucursalId) {
      const sucursal = await prisma.sucursal.findFirst({
        where: { id: Number(sucursalId), empresaId: Number(empresaId) },
      });
      if (!sucursal)
        return res.status(404).json({
          ok: false,
          message: "Sucursal no encontrada o no pertenece a la empresa",
        });
    }

    const solapa = await existeSolapamiento(
      Number(trabajadorId),
      Number(empresaId),
      Number(cargoId),
      inicio,
      fin
    );

    if (solapa) {
      return res.status(400).json({
        ok: false,
        message:
          "Ya existe una asignación activa para este trabajador en el mismo cargo y empresa en ese período",
      });
    }

    const asignacion = await prisma.asignacion.create({
      data: {
        trabajadorId: Number(trabajadorId),
        empresaId: Number(empresaId),
        sucursalId: sucursalId ? Number(sucursalId) : null,
        cargoId: Number(cargoId),
        fechaInicio: inicio,
        fechaFin: fin,
      },
      include,
    });

    return res.status(201).json({
      ok: true,
      message: "Asignación creada correctamente",
      asignacion,
    });
  } catch (error) {
    console.error("ERROR CREAR ASIGNACION:", error);
    return res
      .status(500)
      .json({ ok: false, message: "Error al crear asignación" });
  }
};

export const actualizarAsignacion = async (req: Request, res: Response) => {
  try {
    const asignacionId = Number(req.params.id);

    if (Number.isNaN(asignacionId)) {
      return res
        .status(400)
        .json({ ok: false, message: "ID de asignación inválido" });
    }

    const existente = await prisma.asignacion.findUnique({
      where: { id: asignacionId },
    });

    if (!existente) {
      return res
        .status(404)
        .json({ ok: false, message: "Asignación no encontrada" });
    }

    const { trabajadorId, empresaId, sucursalId, cargoId, fechaInicio, fechaFin } =
      req.body;

    const nuevoTrabajadorId = trabajadorId
      ? Number(trabajadorId)
      : existente.trabajadorId;
    const nuevoEmpresaId = empresaId
      ? Number(empresaId)
      : existente.empresaId;
    const nuevoCargoId = cargoId ? Number(cargoId) : existente.cargoId;
    const nuevaFechaInicio = fechaInicio
      ? new Date(fechaInicio)
      : existente.fechaInicio;
    const nuevaFechaFin =
      fechaFin === null
        ? null
        : fechaFin
        ? new Date(fechaFin)
        : existente.fechaFin;

    if (nuevaFechaFin && nuevaFechaFin <= nuevaFechaInicio) {
      return res.status(400).json({
        ok: false,
        message: "La fecha de término debe ser posterior a la de inicio",
      });
    }

    if (sucursalId !== undefined && sucursalId !== null) {
      const sucursal = await prisma.sucursal.findFirst({
        where: { id: Number(sucursalId), empresaId: nuevoEmpresaId },
      });
      if (!sucursal)
        return res.status(404).json({
          ok: false,
          message: "Sucursal no encontrada o no pertenece a la empresa",
        });
    }

    const solapa = await existeSolapamiento(
      nuevoTrabajadorId,
      nuevoEmpresaId,
      nuevoCargoId,
      nuevaFechaInicio,
      nuevaFechaFin,
      asignacionId
    );

    if (solapa) {
      return res.status(400).json({
        ok: false,
        message:
          "Ya existe una asignación activa para este trabajador en el mismo cargo y empresa en ese período",
      });
    }

    const asignacion = await prisma.asignacion.update({
      where: { id: asignacionId },
      data: {
        trabajadorId: nuevoTrabajadorId,
        empresaId: nuevoEmpresaId,
        sucursalId:
          sucursalId === null ? null : sucursalId ? Number(sucursalId) : existente.sucursalId,
        cargoId: nuevoCargoId,
        fechaInicio: nuevaFechaInicio,
        fechaFin: nuevaFechaFin,
      },
      include,
    });

    return res.json({
      ok: true,
      message: "Asignación actualizada correctamente",
      asignacion,
    });
  } catch (error) {
    console.error("ERROR ACTUALIZAR ASIGNACION:", error);
    return res
      .status(500)
      .json({ ok: false, message: "Error al actualizar asignación" });
  }
};

export const eliminarAsignacion = async (req: Request, res: Response) => {
  try {
    const asignacionId = Number(req.params.id);

    if (Number.isNaN(asignacionId)) {
      return res
        .status(400)
        .json({ ok: false, message: "ID de asignación inválido" });
    }

    const asignacion = await prisma.asignacion.findUnique({
      where: { id: asignacionId },
    });

    if (!asignacion) {
      return res
        .status(404)
        .json({ ok: false, message: "Asignación no encontrada" });
    }

    await prisma.asignacion.delete({ where: { id: asignacionId } });

    return res.json({ ok: true, message: "Asignación eliminada correctamente" });
  } catch (error) {
    console.error("ERROR ELIMINAR ASIGNACION:", error);
    return res
      .status(500)
      .json({ ok: false, message: "Error al eliminar asignación" });
  }
};
