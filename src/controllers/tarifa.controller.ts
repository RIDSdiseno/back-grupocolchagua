import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

const obtenerNumero = (valor: unknown): number => {
  const numero = Number(valor ?? 0);
  return Number.isNaN(numero) ? 0 : numero;
};

const obtenerIdValido = (valor: unknown): number | null => {
  const numero = Number(valor);
  return Number.isNaN(numero) || numero <= 0 ? null : numero;
};

export const listarTarifasPorEmpresa = async (req: Request, res: Response) => {
  try {
    const empresaId = obtenerIdValido(req.params.empresaId);

    if (!empresaId) {
      return res.status(400).json({
        ok: false,
        message: "ID de empresa inválido",
      });
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      return res.status(404).json({
        ok: false,
        message: "Empresa no encontrada",
      });
    }

    const tarifas = await prisma.tarifa.findMany({
      where: { empresaId },
      include: {
        Cargo: true,
        Empresa: true,
        Sucursal: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    return res.json({
      ok: true,
      tarifas,
    });
  } catch (error) {
    console.error("ERROR LISTAR TARIFAS:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al listar tarifas",
    });
  }
};

export const crearTarifaEmpresa = async (req: Request, res: Response) => {
  try {
    const empresaId = obtenerIdValido(req.params.empresaId);

    const {
      sucursalId,
      cargoId,
      sueldoBase,
      bonoColacion,
      bonoLocomocion,
      bonoAsistencia,
      bonoNoche,
      otrosBonos,
      valorHoraExtra,
    } = req.body;

    const sucursalIdNumero = obtenerIdValido(sucursalId);
    const cargoIdNumero = obtenerIdValido(cargoId);

    if (!empresaId) {
      return res.status(400).json({
        ok: false,
        message: "ID de empresa inválido",
      });
    }

    if (!sucursalIdNumero) {
      return res.status(400).json({
        ok: false,
        message: "Debes seleccionar una sucursal válida",
      });
    }

    if (!cargoIdNumero) {
      return res.status(400).json({
        ok: false,
        message: "Debes seleccionar un cargo válido",
      });
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      return res.status(404).json({
        ok: false,
        message: "Empresa no encontrada",
      });
    }

    const sucursal = await prisma.sucursal.findFirst({
      where: {
        id: sucursalIdNumero,
        empresaId,
      },
    });

    if (!sucursal) {
      return res.status(404).json({
        ok: false,
        message: "Sucursal no encontrada o no pertenece a esta empresa",
      });
    }

    const cargo = await prisma.cargo.findUnique({
      where: { id: cargoIdNumero },
    });

    if (!cargo) {
      return res.status(404).json({
        ok: false,
        message: "Cargo no encontrado",
      });
    }

    const tarifaExistente = await prisma.tarifa.findUnique({
      where: {
        empresaId_sucursalId_cargoId: {
          empresaId,
          sucursalId: sucursalIdNumero,
          cargoId: cargoIdNumero,
        },
      },
    });

    if (tarifaExistente) {
      return res.status(400).json({
        ok: false,
        message:
          "Esta sucursal ya tiene una tarifa configurada para este cargo",
      });
    }

    const tarifa = await prisma.tarifa.create({
      data: {
        empresaId,
        sucursalId: sucursalIdNumero,
        cargoId: cargoIdNumero,
        sueldoBase: obtenerNumero(sueldoBase),
        bonoColacion: obtenerNumero(bonoColacion),
        bonoLocomocion: obtenerNumero(bonoLocomocion),
        bonoAsistencia: obtenerNumero(bonoAsistencia),
        bonoNoche: obtenerNumero(bonoNoche),
        otrosBonos: obtenerNumero(otrosBonos),
        valorHoraExtra: obtenerNumero(valorHoraExtra),
      },
      include: {
        Cargo: true,
        Empresa: true,
        Sucursal: true,
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Tarifa creada correctamente",
      tarifa,
    });
  } catch (error) {
    console.error("ERROR CREAR TARIFA:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al crear tarifa",
    });
  }
};

export const actualizarTarifa = async (req: Request, res: Response) => {
  try {
    const tarifaId = obtenerIdValido(req.params.id);

    const {
      sucursalId,
      cargoId,
      sueldoBase,
      bonoColacion,
      bonoLocomocion,
      bonoAsistencia,
      bonoNoche,
      otrosBonos,
      valorHoraExtra,
    } = req.body;

    const sucursalIdNumero = obtenerIdValido(sucursalId);
    const cargoIdNumero = obtenerIdValido(cargoId);

    if (!tarifaId) {
      return res.status(400).json({
        ok: false,
        message: "ID de tarifa inválido",
      });
    }

    if (!sucursalIdNumero) {
      return res.status(400).json({
        ok: false,
        message: "Debes seleccionar una sucursal válida",
      });
    }

    if (!cargoIdNumero) {
      return res.status(400).json({
        ok: false,
        message: "Debes seleccionar un cargo válido",
      });
    }

    const tarifaExistente = await prisma.tarifa.findUnique({
      where: { id: tarifaId },
    });

    if (!tarifaExistente) {
      return res.status(404).json({
        ok: false,
        message: "Tarifa no encontrada",
      });
    }

    const sucursal = await prisma.sucursal.findFirst({
      where: {
        id: sucursalIdNumero,
        empresaId: tarifaExistente.empresaId,
      },
    });

    if (!sucursal) {
      return res.status(404).json({
        ok: false,
        message: "Sucursal no encontrada o no pertenece a esta empresa",
      });
    }

    const cargo = await prisma.cargo.findUnique({
      where: { id: cargoIdNumero },
    });

    if (!cargo) {
      return res.status(404).json({
        ok: false,
        message: "Cargo no encontrado",
      });
    }

    const tarifaDuplicada = await prisma.tarifa.findFirst({
      where: {
        empresaId: tarifaExistente.empresaId,
        sucursalId: sucursalIdNumero,
        cargoId: cargoIdNumero,
        NOT: {
          id: tarifaId,
        },
      },
    });

    if (tarifaDuplicada) {
      return res.status(400).json({
        ok: false,
        message:
          "Esta sucursal ya tiene una tarifa configurada para este cargo",
      });
    }

    const tarifa = await prisma.tarifa.update({
      where: { id: tarifaId },
      data: {
        sucursalId: sucursalIdNumero,
        cargoId: cargoIdNumero,
        sueldoBase: obtenerNumero(sueldoBase),
        bonoColacion: obtenerNumero(bonoColacion),
        bonoLocomocion: obtenerNumero(bonoLocomocion),
        bonoAsistencia: obtenerNumero(bonoAsistencia),
        bonoNoche: obtenerNumero(bonoNoche),
        otrosBonos: obtenerNumero(otrosBonos),
        valorHoraExtra: obtenerNumero(valorHoraExtra),
      },
      include: {
        Cargo: true,
        Empresa: true,
        Sucursal: true,
      },
    });

    return res.json({
      ok: true,
      message: "Tarifa actualizada correctamente",
      tarifa,
    });
  } catch (error) {
    console.error("ERROR ACTUALIZAR TARIFA:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al actualizar tarifa",
    });
  }
};

export const eliminarTarifa = async (req: Request, res: Response) => {
  try {
    const tarifaId = obtenerIdValido(req.params.id);

    if (!tarifaId) {
      return res.status(400).json({
        ok: false,
        message: "ID de tarifa inválido",
      });
    }

    const tarifa = await prisma.tarifa.findUnique({
      where: { id: tarifaId },
    });

    if (!tarifa) {
      return res.status(404).json({
        ok: false,
        message: "Tarifa no encontrada",
      });
    }

    await prisma.tarifa.delete({
      where: { id: tarifaId },
    });

    return res.json({
      ok: true,
      message: "Tarifa eliminada correctamente",
    });
  } catch (error) {
    console.error("ERROR ELIMINAR TARIFA:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al eliminar tarifa",
    });
  }
};