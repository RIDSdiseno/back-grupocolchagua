import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

const include = {
  Trabajador: { select: { id: true, nombre: true, apellido: true, rut: true } },
  Empresa: { select: { id: true, nombre: true } },
  Sucursal: { select: { id: true, nombre: true } },
  Cargo: { select: { id: true, nombre: true } },
};

function rangoMes(mes: number, anio: number) {
  const inicio = new Date(Date.UTC(anio, mes - 1, 1));
  const fin = new Date(Date.UTC(anio, mes, 0, 23, 59, 59, 999));
  return { inicio, fin };
}

function validarMesAnio(mes: number, anio: number) {
  return !Number.isNaN(mes) && !Number.isNaN(anio) && mes >= 1 && mes <= 12;
}

function normalizarTexto(valor?: string | null) {
  return String(valor || "").trim().toUpperCase();
}

function redondear(valor: number) {
  return Math.round(Number(valor) || 0);
}

function esDomingo(fecha: Date) {
  return fecha.getUTCDay() === 0;
}

function obtenerEstadoAsistencia(fecha: Date, estado?: string | null) {
  const estadoNormalizado = normalizarTexto(estado);

  if (!estadoNormalizado && esDomingo(fecha)) {
    return "L";
  }

  return estadoNormalizado || "A";
}

export const listarPreLiquidaciones = async (req: Request, res: Response) => {
  try {
    const { empresaId, sucursalId, trabajadorId, mes, anio, estado } = req.query;

    const where: any = {};

    if (empresaId) where.empresaId = Number(empresaId);
    if (sucursalId) where.sucursalId = Number(sucursalId);
    if (trabajadorId) where.trabajadorId = Number(trabajadorId);
    if (mes) where.mes = Number(mes);
    if (anio) where.anio = Number(anio);
    if (estado) where.estado = String(estado).trim().toUpperCase();

    const preliquidaciones = await prisma.preLiquidacion.findMany({
      where,
      include,
      orderBy: [{ anio: "desc" }, { mes: "desc" }, { trabajadorId: "asc" }],
    });

    return res.json({ ok: true, preliquidaciones });
  } catch (error) {
    console.error("ERROR LISTAR PRELIQUIDACIONES:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al listar preliquidaciones",
    });
  }
};

export const generarPreLiquidaciones = async (req: Request, res: Response) => {
  try {
    const { empresaId, sucursalId, mes, anio } = req.body;

    if (!empresaId || !mes || !anio) {
      return res.status(400).json({
        ok: false,
        message: "empresaId, mes y anio son obligatorios",
      });
    }

    const empresaIdNum = Number(empresaId);
    const sucursalIdNum = sucursalId ? Number(sucursalId) : undefined;
    const mesNum = Number(mes);
    const anioNum = Number(anio);

    if (!validarMesAnio(mesNum, anioNum)) {
      return res.status(400).json({
        ok: false,
        message: "Mes o año inválido",
      });
    }

    const { inicio, fin } = rangoMes(mesNum, anioNum);

    const whereAsistencia: any = {
      empresaId: empresaIdNum,
      fecha: { gte: inicio, lte: fin },
    };

    if (sucursalIdNum) {
      whereAsistencia.sucursalId = sucursalIdNum;
    }

    const asistencias = await prisma.asistencia.findMany({
      where: whereAsistencia,
      include: {
        Trabajador: true,
        Cargo: true,
        Empresa: true,
        Sucursal: true,
      },
      orderBy: [{ trabajadorId: "asc" }, { fecha: "asc" }],
    });

    if (asistencias.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "No hay asistencias registradas para el periodo seleccionado",
      });
    }

    const porTrabajador = new Map<number, any>();

    for (const asistencia of asistencias) {
      const key = asistencia.trabajadorId;

      if (!porTrabajador.has(key)) {
        porTrabajador.set(key, {
          trabajadorId: asistencia.trabajadorId,
          empresaId: asistencia.empresaId,
          sucursalId: asistencia.sucursalId,
          cargoId: asistencia.cargoId,
          diasTrabajados: 0,
          diasLibres: 0,
          diasFalta: 0,
          domingosLibres: 0,
          cantidadHorasExtras: 0,
          ultimaFecha: asistencia.fecha,
        });
      }

      const item = porTrabajador.get(key);
      const estado = obtenerEstadoAsistencia(asistencia.fecha, asistencia.estado);

      if (estado === "A") {
        item.diasTrabajados++;
      }

      if (estado === "L") {
        item.diasLibres++;

        if (esDomingo(asistencia.fecha)) {
          item.domingosLibres++;
        }
      }

      if (estado === "F") {
        item.diasFalta++;
      }

      item.cantidadHorasExtras += Number(asistencia.horasExtras) || 0;

      if (!item.ultimaFecha || asistencia.fecha >= item.ultimaFecha) {
        item.cargoId = asistencia.cargoId;
        item.sucursalId = asistencia.sucursalId;
        item.ultimaFecha = asistencia.fecha;
      }
    }

    const generadas = [];
    const omitidas = [];

    for (const item of porTrabajador.values()) {
      if (!item.sucursalId) {
        omitidas.push({
          trabajadorId: item.trabajadorId,
          motivo: "El trabajador no tiene sucursal en asistencia. No se puede buscar tarifa.",
        });
        continue;
      }

      const tarifa = await prisma.tarifa.findUnique({
        where: {
          empresaId_sucursalId_cargoId: {
            empresaId: item.empresaId,
            sucursalId: item.sucursalId,
            cargoId: item.cargoId,
          },
        },
      });

      if (!tarifa) {
        omitidas.push({
          trabajadorId: item.trabajadorId,
          empresaId: item.empresaId,
          sucursalId: item.sucursalId,
          cargoId: item.cargoId,
          motivo: "No existe tarifa para empresa, sucursal y cargo.",
        });
        continue;
      }

      const incidencias = await prisma.incidenciaAsistencia.findMany({
        where: {
          trabajadorId: item.trabajadorId,
          empresaId: item.empresaId,
          sucursalId: item.sucursalId,
          fecha: { gte: inicio, lte: fin },
        },
      });

      const sueldoBase = Number(tarifa.sueldoBase) || 0;
      const valorHoraExtra = Number(tarifa.valorHoraExtra) || 0;

      const colacion = Number(tarifa.bonoColacion) || 0;
      const movilizacion = Number(tarifa.bonoLocomocion) || 0;
      const bonoTurnoNocturno = Number(tarifa.bonoNoche) || 0;
      const bonoImponible1 = Number(tarifa.bonoAsistencia) || 0;
      const bonoImponible2 = Number(tarifa.otrosBonos) || 0;

      const valorDia = sueldoBase / 30;
      const descuentoFaltas = redondear(valorDia * item.diasFalta);

      let totalDescuentos = descuentoFaltas;
      let totalBonosManuales = 0;
      let anticipo = 0;

      for (const incidencia of incidencias) {
        const tipo = normalizarTexto(incidencia.tipo);
        const monto = Number(incidencia.monto) || 0;

        if (
          tipo === "ATRASO" ||
          tipo === "SALIDA_ANTICIPADA" ||
          tipo === "PERMISO_SIN_GOCE" ||
          tipo === "DESCUENTO_MANUAL"
        ) {
          totalDescuentos += monto;
        }

        if (tipo === "ANTICIPO") {
          anticipo += monto;
          totalDescuentos += monto;
        }

        if (tipo === "BONO_MANUAL") {
          totalBonosManuales += monto;
        }
      }

      const montoDiasTrabajados = redondear(sueldoBase);
      const montoHorasExtras = redondear(valorHoraExtra * item.cantidadHorasExtras);

      const totalHaberes = redondear(
        sueldoBase +
          montoHorasExtras +
          colacion +
          movilizacion +
          bonoTurnoNocturno +
          bonoImponible1 +
          bonoImponible2 +
          totalBonosManuales
      );

      totalDescuentos = redondear(totalDescuentos);
      anticipo = redondear(anticipo);

      const montoInformar = redondear(totalHaberes - totalDescuentos);

      const preliquidacion = await prisma.preLiquidacion.upsert({
        where: {
          trabajadorId_empresaId_sucursalId_mes_anio: {
            trabajadorId: item.trabajadorId,
            empresaId: item.empresaId,
            sucursalId: item.sucursalId,
            mes: mesNum,
            anio: anioNum,
          },
        },
        create: {
          trabajadorId: item.trabajadorId,
          empresaId: item.empresaId,
          sucursalId: item.sucursalId,
          cargoId: item.cargoId,
          mes: mesNum,
          anio: anioNum,

          sueldoBase,
          diasTrabajados: item.diasTrabajados,
          diasLibres: item.diasLibres,
          diasFalta: item.diasFalta,

          cantidadHorasExtras: item.cantidadHorasExtras,
          montoDiasTrabajados,
          montoHorasExtras,

          colacion,
          movilizacion,
          bonoTurnoNocturno,
          bonoImponible1,
          bonoImponible2,

          totalHaberes,
          totalDescuentos,
          anticipo,
          montoInformar,
          estado: "BORRADOR",
        },
        update: {
          cargoId: item.cargoId,

          sueldoBase,
          diasTrabajados: item.diasTrabajados,
          diasLibres: item.diasLibres,
          diasFalta: item.diasFalta,

          cantidadHorasExtras: item.cantidadHorasExtras,
          montoDiasTrabajados,
          montoHorasExtras,

          colacion,
          movilizacion,
          bonoTurnoNocturno,
          bonoImponible1,
          bonoImponible2,

          totalHaberes,
          totalDescuentos,
          anticipo,
          montoInformar,
        },
        include,
      });

      generadas.push(preliquidacion);
    }

    return res.status(201).json({
      ok: true,
      message: "Preliquidaciones generadas correctamente",
      total: generadas.length,
      omitidas,
      preliquidaciones: generadas,
    });
  } catch (error) {
    console.error("ERROR GENERAR PRELIQUIDACIONES:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al generar preliquidaciones",
    });
  }
};

export const obtenerPreLiquidacion = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "ID inválido",
      });
    }

    const preliquidacion = await prisma.preLiquidacion.findUnique({
      where: { id },
      include,
    });

    if (!preliquidacion) {
      return res.status(404).json({
        ok: false,
        message: "Preliquidación no encontrada",
      });
    }

    return res.json({ ok: true, preliquidacion });
  } catch (error) {
    console.error("ERROR OBTENER PRELIQUIDACION:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al obtener preliquidación",
    });
  }
};

export const actualizarPreLiquidacion = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "ID inválido",
      });
    }

    const existente = await prisma.preLiquidacion.findUnique({
      where: { id },
    });

    if (!existente) {
      return res.status(404).json({
        ok: false,
        message: "Preliquidación no encontrada",
      });
    }

    if (existente.estado === "APROBADA") {
      return res.status(400).json({
        ok: false,
        message: "No se puede modificar una preliquidación aprobada",
      });
    }

    const camposEditables = [
      "difRem",
      "difRem2",
      "difLiq",
      "asignacionPerdidaCaja",
      "colacion",
      "movilizacion",
      "viatico",
      "bonoImponible1",
      "bonoImponible2",
      "bonoImponible3",
      "colacionExtraNoImponible",
      "bonoTurnoNocturno",
      "cantidadHorasExtrasPendientes",
      "montoHorasExtrasPendientes",
      "anticipo",
      "observacion",
    ];

    const data: any = {};

    for (const campo of camposEditables) {
      if (req.body[campo] !== undefined) {
        data[campo] =
          campo === "observacion"
            ? req.body[campo]
              ? String(req.body[campo]).trim()
              : null
            : Number(req.body[campo]) || 0;
      }
    }

    const base = { ...existente, ...data };

    const totalHaberes = redondear(
      Number(base.montoDiasTrabajados) +
        Number(base.montoHorasExtras) +
        Number(base.montoHorasExtrasPendientes) +
        Number(base.difRem) +
        Number(base.difRem2) +
        Number(base.asignacionPerdidaCaja) +
        Number(base.colacion) +
        Number(base.movilizacion) +
        Number(base.viatico) +
        Number(base.bonoImponible1) +
        Number(base.bonoImponible2) +
        Number(base.bonoImponible3) +
        Number(base.colacionExtraNoImponible) +
        Number(base.bonoTurnoNocturno) +
        Number(base.difLiq)
    );

    const totalDescuentos = redondear(
      Number(base.totalDescuentos) - Number(existente.anticipo) + Number(base.anticipo)
    );

    data.totalHaberes = totalHaberes;
    data.totalDescuentos = totalDescuentos;
    data.montoInformar = redondear(totalHaberes - totalDescuentos);

    const preliquidacion = await prisma.preLiquidacion.update({
      where: { id },
      data,
      include,
    });

    return res.json({
      ok: true,
      message: "Preliquidación actualizada correctamente",
      preliquidacion,
    });
  } catch (error) {
    console.error("ERROR ACTUALIZAR PRELIQUIDACION:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al actualizar preliquidación",
    });
  }
};

export const aprobarPreLiquidacion = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "ID inválido",
      });
    }

    const preliquidacion = await prisma.preLiquidacion.update({
      where: { id },
      data: { estado: "APROBADA" },
      include,
    });

    return res.json({
      ok: true,
      message: "Preliquidación aprobada correctamente",
      preliquidacion,
    });
  } catch (error) {
    console.error("ERROR APROBAR PRELIQUIDACION:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al aprobar preliquidación",
    });
  }
};

export const eliminarPreLiquidacion = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "ID inválido",
      });
    }

    const existente = await prisma.preLiquidacion.findUnique({
      where: { id },
    });

    if (!existente) {
      return res.status(404).json({
        ok: false,
        message: "Preliquidación no encontrada",
      });
    }

    if (existente.estado === "APROBADA") {
      return res.status(400).json({
        ok: false,
        message: "No se puede eliminar una preliquidación aprobada",
      });
    }

    await prisma.preLiquidacion.delete({
      where: { id },
    });

    return res.json({
      ok: true,
      message: "Preliquidación eliminada correctamente",
    });
  } catch (error) {
    console.error("ERROR ELIMINAR PRELIQUIDACION:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al eliminar preliquidación",
    });
  }
};