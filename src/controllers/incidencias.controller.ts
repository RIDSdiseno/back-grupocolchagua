import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

const include = {
  Trabajador: {
    select: {
      id: true,
      nombre: true,
      apellido: true,
      rut: true,
    },
  },
  Empresa: {
    select: {
      id: true,
      nombre: true,
    },
  },
  Sucursal: {
    select: {
      id: true,
      nombre: true,
    },
  },
  Cargo: {
    select: {
      id: true,
      nombre: true,
    },
  },
};

const TIPOS_INCIDENCIA = [
  "ATRASO",
  "SALIDA_ANTICIPADA",
  "PERMISO_SIN_GOCE",
  "ANTICIPO",
  "DESCUENTO_MANUAL",
  "BONO_MANUAL",
];

function normalizarFecha(fechaStr: string): Date {
  const d = new Date(fechaStr);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function validarTipo(tipo: string) {
  return TIPOS_INCIDENCIA.includes(String(tipo).trim().toUpperCase());
}

export const listarIncidencias = async (req: Request, res: Response) => {
  try {
    const { empresaId, trabajadorId, sucursalId, tipo, mes, año } = req.query;

    const where: any = {};

    if (empresaId) where.empresaId = Number(empresaId);
    if (trabajadorId) where.trabajadorId = Number(trabajadorId);
    if (sucursalId) where.sucursalId = Number(sucursalId);

    if (tipo) {
      const tipoNormalizado = String(tipo).trim().toUpperCase();

      if (!validarTipo(tipoNormalizado)) {
        return res.status(400).json({
          ok: false,
          message: "Tipo de incidencia inválido",
          tiposPermitidos: TIPOS_INCIDENCIA,
        });
      }

      where.tipo = tipoNormalizado;
    }

    if (mes && año) {
      const mesNum = Number(mes);
      const añoNum = Number(año);

      if (
        Number.isNaN(mesNum) ||
        Number.isNaN(añoNum) ||
        mesNum < 1 ||
        mesNum > 12
      ) {
        return res.status(400).json({
          ok: false,
          message: "Mes o año inválido",
        });
      }

      const inicio = new Date(Date.UTC(añoNum, mesNum - 1, 1));
      const fin = new Date(Date.UTC(añoNum, mesNum, 0, 23, 59, 59, 999));
      where.fecha = { gte: inicio, lte: fin };
    }

    const incidencias = await prisma.incidenciaAsistencia.findMany({
      where,
      include,
      orderBy: [{ fecha: "desc" }, { id: "desc" }],
    });

    return res.json({
      ok: true,
      incidencias,
    });
  } catch (error) {
    console.error("ERROR LISTAR INCIDENCIAS:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al listar incidencias",
    });
  }
};

export const crearIncidencia = async (req: Request, res: Response) => {
  try {
    const {
      trabajadorId,
      empresaId,
      sucursalId,
      cargoId,
      fecha,
      tipo,
      minutos,
      monto,
      observacion,
    } = req.body;

    if (!trabajadorId || !empresaId || !fecha || !tipo) {
      return res.status(400).json({
        ok: false,
        message: "trabajadorId, empresaId, fecha y tipo son obligatorios",
      });
    }

    const tipoNormalizado = String(tipo).trim().toUpperCase();

    if (!validarTipo(tipoNormalizado)) {
      return res.status(400).json({
        ok: false,
        message: "Tipo de incidencia inválido",
        tiposPermitidos: TIPOS_INCIDENCIA,
      });
    }

    const incidencia = await prisma.incidenciaAsistencia.create({
      data: {
        trabajadorId: Number(trabajadorId),
        empresaId: Number(empresaId),
        sucursalId: sucursalId ? Number(sucursalId) : null,
        cargoId: cargoId ? Number(cargoId) : null,
        fecha: normalizarFecha(String(fecha)),
        tipo: tipoNormalizado,
        minutos: Number(minutos) || 0,
        monto: Number(monto) || 0,
        observacion: observacion ? String(observacion).trim() : null,
      },
      include,
    });

    return res.status(201).json({
      ok: true,
      message: "Incidencia registrada correctamente",
      incidencia,
    });
  } catch (error) {
    console.error("ERROR CREAR INCIDENCIA:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al crear incidencia",
    });
  }
};

export const actualizarIncidencia = async (req: Request, res: Response) => {
  try {
    const incidenciaId = Number(req.params.id);

    if (Number.isNaN(incidenciaId)) {
      return res.status(400).json({
        ok: false,
        message: "ID de incidencia inválido",
      });
    }

    const existente = await prisma.incidenciaAsistencia.findUnique({
      where: { id: incidenciaId },
    });

    if (!existente) {
      return res.status(404).json({
        ok: false,
        message: "Incidencia no encontrada",
      });
    }

    const {
      trabajadorId,
      empresaId,
      sucursalId,
      cargoId,
      fecha,
      tipo,
      minutos,
      monto,
      observacion,
    } = req.body;

    let tipoNormalizado = existente.tipo;

    if (tipo !== undefined) {
      tipoNormalizado = String(tipo).trim().toUpperCase();

      if (!validarTipo(tipoNormalizado)) {
        return res.status(400).json({
          ok: false,
          message: "Tipo de incidencia inválido",
          tiposPermitidos: TIPOS_INCIDENCIA,
        });
      }
    }

    const incidencia = await prisma.incidenciaAsistencia.update({
      where: { id: incidenciaId },
      data: {
        trabajadorId:
          trabajadorId !== undefined ? Number(trabajadorId) : existente.trabajadorId,
        empresaId: empresaId !== undefined ? Number(empresaId) : existente.empresaId,
        sucursalId:
          sucursalId !== undefined
            ? sucursalId
              ? Number(sucursalId)
              : null
            : existente.sucursalId,
        cargoId:
          cargoId !== undefined
            ? cargoId
              ? Number(cargoId)
              : null
            : existente.cargoId,
        fecha: fecha !== undefined ? normalizarFecha(String(fecha)) : existente.fecha,
        tipo: tipoNormalizado,
        minutos: minutos !== undefined ? Number(minutos) || 0 : existente.minutos,
        monto: monto !== undefined ? Number(monto) || 0 : existente.monto,
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
      message: "Incidencia actualizada correctamente",
      incidencia,
    });
  } catch (error) {
    console.error("ERROR ACTUALIZAR INCIDENCIA:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al actualizar incidencia",
    });
  }
};

export const eliminarIncidencia = async (req: Request, res: Response) => {
  try {
    const incidenciaId = Number(req.params.id);

    if (Number.isNaN(incidenciaId)) {
      return res.status(400).json({
        ok: false,
        message: "ID de incidencia inválido",
      });
    }

    const existente = await prisma.incidenciaAsistencia.findUnique({
      where: { id: incidenciaId },
    });

    if (!existente) {
      return res.status(404).json({
        ok: false,
        message: "Incidencia no encontrada",
      });
    }

    await prisma.incidenciaAsistencia.delete({
      where: { id: incidenciaId },
    });

    return res.json({
      ok: true,
      message: "Incidencia eliminada correctamente",
    });
  } catch (error) {
    console.error("ERROR ELIMINAR INCIDENCIA:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al eliminar incidencia",
    });
  }
};

export const resumenIncidencias = async (req: Request, res: Response) => {
  try {
    const { empresaId, mes, año, sucursalId } = req.query;

    if (!empresaId || !mes || !año) {
      return res.status(400).json({
        ok: false,
        message: "empresaId, mes y año son obligatorios",
      });
    }

    const mesNum = Number(mes);
    const añoNum = Number(año);

    if (
      Number.isNaN(mesNum) ||
      Number.isNaN(añoNum) ||
      mesNum < 1 ||
      mesNum > 12
    ) {
      return res.status(400).json({
        ok: false,
        message: "Mes o año inválido",
      });
    }

    const inicio = new Date(Date.UTC(añoNum, mesNum - 1, 1));
    const fin = new Date(Date.UTC(añoNum, mesNum, 0, 23, 59, 59, 999));

    const where: any = {
      empresaId: Number(empresaId),
      fecha: {
        gte: inicio,
        lte: fin,
      },
    };

    if (sucursalId) {
      where.sucursalId = Number(sucursalId);
    }

    const incidencias = await prisma.incidenciaAsistencia.findMany({
      where,
      include,
      orderBy: [{ trabajadorId: "asc" }, { fecha: "asc" }],
    });

    const porTrabajador = new Map<number, any>();

    for (const incidencia of incidencias) {
      const key = incidencia.trabajadorId;

      if (!porTrabajador.has(key)) {
        porTrabajador.set(key, {
          trabajador: incidencia.Trabajador,
          empresa: incidencia.Empresa,
          sucursal: incidencia.Sucursal,
          cargo: incidencia.Cargo,
          totalAtrasos: 0,
          totalSalidasAnticipadas: 0,
          totalPermisosSinGoce: 0,
          totalAnticipos: 0,
          totalDescuentosManuales: 0,
          totalBonosManuales: 0,
          totalMinutosAtraso: 0,
          totalMinutosSalidaAnticipada: 0,
          totalDescuentos: 0,
          totalBonos: 0,
          incidencias: [],
        });
      }

      const item = porTrabajador.get(key);
      const monto = Number(incidencia.monto) || 0;
      const minutos = Number(incidencia.minutos) || 0;

      if (incidencia.tipo === "ATRASO") {
        item.totalAtrasos += monto;
        item.totalMinutosAtraso += minutos;
        item.totalDescuentos += monto;
      }

      if (incidencia.tipo === "SALIDA_ANTICIPADA") {
        item.totalSalidasAnticipadas += monto;
        item.totalMinutosSalidaAnticipada += minutos;
        item.totalDescuentos += monto;
      }

      if (incidencia.tipo === "PERMISO_SIN_GOCE") {
        item.totalPermisosSinGoce += monto;
        item.totalDescuentos += monto;
      }

      if (incidencia.tipo === "ANTICIPO") {
        item.totalAnticipos += monto;
        item.totalDescuentos += monto;
      }

      if (incidencia.tipo === "DESCUENTO_MANUAL") {
        item.totalDescuentosManuales += monto;
        item.totalDescuentos += monto;
      }

      if (incidencia.tipo === "BONO_MANUAL") {
        item.totalBonosManuales += monto;
        item.totalBonos += monto;
      }

      item.incidencias.push(incidencia);
    }

    return res.json({
      ok: true,
      resumen: Array.from(porTrabajador.values()),
    });
  } catch (error) {
    console.error("ERROR RESUMEN INCIDENCIAS:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al generar resumen de incidencias",
    });
  }
};