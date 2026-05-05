import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

const include = {
  Trabajador: { select: { id: true, nombre: true, apellido: true, rut: true } },
  Cargo: { select: { id: true, nombre: true } },
  Empresa: { select: { id: true, nombre: true } },
  Sucursal: { select: { id: true, nombre: true } },
};

// Normaliza fecha a medianoche UTC para evitar desfases de zona horaria
function normalizarFecha(fechaStr: string): Date {
  const d = new Date(fechaStr);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export const listarAsistencia = async (req: Request, res: Response) => {
  try {
    const { empresaId, mes, año } = req.query;

    if (!empresaId) {
      return res
        .status(400)
        .json({ ok: false, message: "empresaId es obligatorio" });
    }

    const where: any = { empresaId: Number(empresaId) };

    if (mes && año) {
      const mesNum = Number(mes);
      const añoNum = Number(año);
      const inicio = new Date(Date.UTC(añoNum, mesNum - 1, 1));
      const fin = new Date(Date.UTC(añoNum, mesNum, 0, 23, 59, 59, 999));
      where.fecha = { gte: inicio, lte: fin };
    }

    const registros = await prisma.asistencia.findMany({
      where,
      include,
      orderBy: [{ fecha: "asc" }, { trabajadorId: "asc" }],
    });

    return res.json({ ok: true, registros });
  } catch (error) {
    console.error("ERROR LISTAR ASISTENCIA:", error);
    return res
      .status(500)
      .json({ ok: false, message: "Error al listar asistencia" });
  }
};

export const registrarAsistencia = async (req: Request, res: Response) => {
  try {
    const {
      trabajadorId,
      fecha,
      estado,
      horasExtras,
      turno,
      cargoId,
      empresaId,
      sucursalId,
      observacion,
    } = req.body;

    if (!trabajadorId || !fecha || !cargoId || !empresaId) {
      return res.status(400).json({
        ok: false,
        message: "trabajadorId, fecha, cargoId y empresaId son obligatorios",
      });
    }

    const estadoValido = ["A", "L", "F"].includes(estado) ? estado : "A";
    const turnoValido = ["diurno", "nocturno"].includes(turno) ? turno : "diurno";
    const fechaNorm = normalizarFecha(String(fecha));

    const registro = await prisma.asistencia.upsert({
      where: {
        trabajadorId_fecha_empresaId: {
          trabajadorId: Number(trabajadorId),
          fecha: fechaNorm,
          empresaId: Number(empresaId),
        },
      },
      create: {
        trabajadorId: Number(trabajadorId),
        fecha: fechaNorm,
        estado: estadoValido,
        horasExtras: Number(horasExtras) || 0,
        turno: turnoValido,
        cargoId: Number(cargoId),
        empresaId: Number(empresaId),
        sucursalId: sucursalId ? Number(sucursalId) : null,
        observacion: observacion ? String(observacion).trim() : null,
      },
      update: {
        estado: estadoValido,
        horasExtras: Number(horasExtras) || 0,
        turno: turnoValido,
        cargoId: Number(cargoId),
        sucursalId: sucursalId ? Number(sucursalId) : null,
        observacion: observacion ? String(observacion).trim() : null,
      },
      include,
    });

    return res.status(201).json({
      ok: true,
      message: "Asistencia registrada correctamente",
      registro,
    });
  } catch (error) {
    console.error("ERROR REGISTRAR ASISTENCIA:", error);
    return res
      .status(500)
      .json({ ok: false, message: "Error al registrar asistencia" });
  }
};

export const actualizarAsistencia = async (req: Request, res: Response) => {
  try {
    const asistenciaId = Number(req.params.id);

    if (Number.isNaN(asistenciaId)) {
      return res
        .status(400)
        .json({ ok: false, message: "ID de asistencia inválido" });
    }

    const existente = await prisma.asistencia.findUnique({
      where: { id: asistenciaId },
    });

    if (!existente) {
      return res
        .status(404)
        .json({ ok: false, message: "Registro de asistencia no encontrado" });
    }

    const { estado, horasExtras, turno, observacion } = req.body;

    const registro = await prisma.asistencia.update({
      where: { id: asistenciaId },
      data: {
        estado: ["A", "L", "F"].includes(estado) ? estado : existente.estado,
        horasExtras:
          horasExtras !== undefined ? Number(horasExtras) : existente.horasExtras,
        turno: ["diurno", "nocturno"].includes(turno) ? turno : existente.turno,
        observacion:
          observacion !== undefined
            ? observacion
              ? String(observacion).trim()
              : null
            : existente.observacion,
      },
      include,
    });

    return res.json({
      ok: true,
      message: "Asistencia actualizada correctamente",
      registro,
    });
  } catch (error) {
    console.error("ERROR ACTUALIZAR ASISTENCIA:", error);
    return res
      .status(500)
      .json({ ok: false, message: "Error al actualizar asistencia" });
  }
};

export const eliminarAsistencia = async (req: Request, res: Response) => {
  try {
    const asistenciaId = Number(req.params.id);

    if (Number.isNaN(asistenciaId)) {
      return res
        .status(400)
        .json({ ok: false, message: "ID de asistencia inválido" });
    }

    const existente = await prisma.asistencia.findUnique({
      where: { id: asistenciaId },
    });

    if (!existente) {
      return res
        .status(404)
        .json({ ok: false, message: "Registro de asistencia no encontrado" });
    }

    await prisma.asistencia.delete({ where: { id: asistenciaId } });

    return res.json({ ok: true, message: "Registro eliminado correctamente" });
  } catch (error) {
    console.error("ERROR ELIMINAR ASISTENCIA:", error);
    return res
      .status(500)
      .json({ ok: false, message: "Error al eliminar asistencia" });
  }
};

export const resumenAsistencia = async (req: Request, res: Response) => {
  try {
    const { empresaId, mes, año } = req.query;

    if (!empresaId || !mes || !año) {
      return res.status(400).json({
        ok: false,
        message: "empresaId, mes y año son obligatorios",
      });
    }

    const mesNum = Number(mes);
    const añoNum = Number(año);
    const inicio = new Date(Date.UTC(añoNum, mesNum - 1, 1));
    const fin = new Date(Date.UTC(añoNum, mesNum, 0, 23, 59, 59, 999));

    const registros = await prisma.asistencia.findMany({
      where: {
        empresaId: Number(empresaId),
        fecha: { gte: inicio, lte: fin },
      },
      include: {
        Trabajador: { select: { id: true, nombre: true, apellido: true, rut: true } },
        Cargo: { select: { id: true, nombre: true } },
      },
    });

    // Agrupar por trabajador
    const porTrabajador = new Map<number, any>();

    for (const r of registros) {
      const key = r.trabajadorId;
      if (!porTrabajador.has(key)) {
        porTrabajador.set(key, {
          trabajador: r.Trabajador,
          cargo: r.Cargo,
          diasAsistio: 0,
          diasLibre: 0,
          diasFalta: 0,
          totalHorasExtras: 0,
        });
      }
      const entry = porTrabajador.get(key);
      if (r.estado === "A") entry.diasAsistio++;
      if (r.estado === "L") entry.diasLibre++;
      if (r.estado === "F") entry.diasFalta++;
      entry.totalHorasExtras += r.horasExtras;
    }

    return res.json({
      ok: true,
      resumen: Array.from(porTrabajador.values()),
    });
  } catch (error) {
    console.error("ERROR RESUMEN ASISTENCIA:", error);
    return res
      .status(500)
      .json({ ok: false, message: "Error al generar resumen" });
  }
};
