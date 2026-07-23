import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

type EstadoEmpleo = "BORRADOR" | "PUBLICADO" | "PAUSADO" | "CERRADO";
type ModalidadEmpleo = "PRESENCIAL" | "REMOTO" | "HIBRIDO";
type JornadaEmpleo =
  | "FULL_TIME"
  | "PART_TIME"
  | "TURNOS"
  | "FREELANCE"
  | "PRACTICA";

const ESTADOS_EMPLEO: EstadoEmpleo[] = [
  "BORRADOR",
  "PUBLICADO",
  "PAUSADO",
  "CERRADO",
];

const MODALIDADES_EMPLEO: ModalidadEmpleo[] = [
  "PRESENCIAL",
  "REMOTO",
  "HIBRIDO",
];

const JORNADAS_EMPLEO: JornadaEmpleo[] = [
  "FULL_TIME",
  "PART_TIME",
  "TURNOS",
  "FREELANCE",
  "PRACTICA",
];

const limpiarTexto = (valor: unknown): string | null => {
  if (valor === undefined || valor === null) return null;
  const texto = String(valor).trim();
  return texto.length > 0 ? texto : null;
};

const parseFecha = (valor: unknown): Date | null => {
  if (!valor) return null;

  const fecha = new Date(String(valor));

  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

const parseEntero = (valor: unknown, defecto = 1): number => {
  const numero = Number(valor);

  if (Number.isNaN(numero) || numero < 1) return defecto;

  return Math.floor(numero);
};

export const crearEmpleo = async (req: Request, res: Response) => {
  try {
    const {
      titulo,
      empresa,
      cargo,
      ubicacion,
      comuna,
      region,
      modalidad,
      jornada,
      sueldo,
      descripcion,
      requisitos,
      beneficios,
      vacantes,
      estado,
      fechaCierre,
    } = req.body;

    if (!titulo || !descripcion) {
      return res.status(400).json({
        ok: false,
        message: "Título y descripción son obligatorios",
      });
    }

    const estadoFinal = estado ? String(estado).trim() : "BORRADOR";

    if (!ESTADOS_EMPLEO.includes(estadoFinal as EstadoEmpleo)) {
      return res.status(400).json({
        ok: false,
        message: "Estado inválido",
        estadosPermitidos: ESTADOS_EMPLEO,
      });
    }

    if (
      modalidad &&
      !MODALIDADES_EMPLEO.includes(String(modalidad) as ModalidadEmpleo)
    ) {
      return res.status(400).json({
        ok: false,
        message: "Modalidad inválida",
        modalidadesPermitidas: MODALIDADES_EMPLEO,
      });
    }

    if (jornada && !JORNADAS_EMPLEO.includes(String(jornada) as JornadaEmpleo)) {
      return res.status(400).json({
        ok: false,
        message: "Jornada inválida",
        jornadasPermitidas: JORNADAS_EMPLEO,
      });
    }

    const empleo = await prisma.empleo.create({
      data: {
        titulo: String(titulo).trim(),
        empresa: limpiarTexto(empresa),
        cargo: limpiarTexto(cargo),
        ubicacion: limpiarTexto(ubicacion),
        comuna: limpiarTexto(comuna),
        region: limpiarTexto(region),
        modalidad: modalidad ? (String(modalidad) as ModalidadEmpleo) : null,
        jornada: jornada ? (String(jornada) as JornadaEmpleo) : null,
        sueldo: limpiarTexto(sueldo),
        descripcion: String(descripcion).trim(),
        requisitos: limpiarTexto(requisitos),
        beneficios: limpiarTexto(beneficios),
        vacantes: parseEntero(vacantes, 1),
        estado: estadoFinal as EstadoEmpleo,
        fechaCierre: parseFecha(fechaCierre),
        publicadoEn: estadoFinal === "PUBLICADO" ? new Date() : null,
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Empleo creado correctamente",
      empleo,
    });
  } catch (error) {
    console.error("ERROR CREAR EMPLEO:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al crear empleo",
    });
  }
};

export const listarEmpleos = async (_req: Request, res: Response) => {
  try {
    const empleos = await prisma.empleo.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      ok: true,
      empleos,
    });
  } catch (error) {
    console.error("ERROR LISTAR EMPLEOS:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al listar empleos",
    });
  }
};

export const listarEmpleosPublicos = async (_req: Request, res: Response) => {
  try {
    const empleos = await prisma.empleo.findMany({
      where: {
        estado: "PUBLICADO",
        OR: [{ fechaCierre: null }, { fechaCierre: { gte: new Date() } }],
      },
      orderBy: [{ publicadoEn: "desc" }, { createdAt: "desc" }],
    });

    return res.json({
      ok: true,
      empleos,
    });
  } catch (error) {
    console.error("ERROR LISTAR EMPLEOS PUBLICOS:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al listar empleos públicos",
    });
  }
};

export const obtenerEmpleo = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "ID inválido",
      });
    }

    const empleo = await prisma.empleo.findUnique({
      where: { id },
    });

    if (!empleo) {
      return res.status(404).json({
        ok: false,
        message: "Empleo no encontrado",
      });
    }

    return res.json({
      ok: true,
      empleo,
    });
  } catch (error) {
    console.error("ERROR OBTENER EMPLEO:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al obtener empleo",
    });
  }
};

export const actualizarEmpleo = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "ID inválido",
      });
    }

    const empleoExistente = await prisma.empleo.findUnique({
      where: { id },
    });

    if (!empleoExistente) {
      return res.status(404).json({
        ok: false,
        message: "Empleo no encontrado",
      });
    }

    const {
      titulo,
      empresa,
      cargo,
      ubicacion,
      comuna,
      region,
      modalidad,
      jornada,
      sueldo,
      descripcion,
      requisitos,
      beneficios,
      vacantes,
      estado,
      fechaCierre,
    } = req.body;

    if (estado && !ESTADOS_EMPLEO.includes(String(estado) as EstadoEmpleo)) {
      return res.status(400).json({
        ok: false,
        message: "Estado inválido",
        estadosPermitidos: ESTADOS_EMPLEO,
      });
    }

    if (
      modalidad &&
      !MODALIDADES_EMPLEO.includes(String(modalidad) as ModalidadEmpleo)
    ) {
      return res.status(400).json({
        ok: false,
        message: "Modalidad inválida",
        modalidadesPermitidas: MODALIDADES_EMPLEO,
      });
    }

    if (jornada && !JORNADAS_EMPLEO.includes(String(jornada) as JornadaEmpleo)) {
      return res.status(400).json({
        ok: false,
        message: "Jornada inválida",
        jornadasPermitidas: JORNADAS_EMPLEO,
      });
    }

    const dataActualizacion: Record<string, unknown> = {};

    if (titulo !== undefined) dataActualizacion.titulo = String(titulo).trim();
    if (empresa !== undefined) dataActualizacion.empresa = limpiarTexto(empresa);
    if (cargo !== undefined) dataActualizacion.cargo = limpiarTexto(cargo);
    if (ubicacion !== undefined)
      dataActualizacion.ubicacion = limpiarTexto(ubicacion);
    if (comuna !== undefined) dataActualizacion.comuna = limpiarTexto(comuna);
    if (region !== undefined) dataActualizacion.region = limpiarTexto(region);

    if (modalidad !== undefined) {
      dataActualizacion.modalidad = modalidad
        ? (String(modalidad) as ModalidadEmpleo)
        : null;
    }

    if (jornada !== undefined) {
      dataActualizacion.jornada = jornada
        ? (String(jornada) as JornadaEmpleo)
        : null;
    }

    if (sueldo !== undefined) dataActualizacion.sueldo = limpiarTexto(sueldo);

    if (descripcion !== undefined) {
      dataActualizacion.descripcion = String(descripcion).trim();
    }

    if (requisitos !== undefined) {
      dataActualizacion.requisitos = limpiarTexto(requisitos);
    }

    if (beneficios !== undefined) {
      dataActualizacion.beneficios = limpiarTexto(beneficios);
    }

    if (vacantes !== undefined) {
      dataActualizacion.vacantes = parseEntero(vacantes, 1);
    }

    if (fechaCierre !== undefined) {
      dataActualizacion.fechaCierre = parseFecha(fechaCierre);
    }

    if (estado !== undefined) {
      const nuevoEstado = String(estado) as EstadoEmpleo;

      dataActualizacion.estado = nuevoEstado;

      if (
        nuevoEstado === "PUBLICADO" &&
        empleoExistente.estado !== "PUBLICADO"
      ) {
        dataActualizacion.publicadoEn = new Date();
      }

      if (nuevoEstado === "BORRADOR") {
        dataActualizacion.publicadoEn = null;
      }
    }

    const empleo = await prisma.empleo.update({
      where: { id },
      data: dataActualizacion,
    });

    return res.json({
      ok: true,
      message: "Empleo actualizado correctamente",
      empleo,
    });
  } catch (error) {
    console.error("ERROR ACTUALIZAR EMPLEO:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al actualizar empleo",
    });
  }
};

export const publicarEmpleo = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "ID inválido",
      });
    }

    const empleoExistente = await prisma.empleo.findUnique({
      where: { id },
    });

    if (!empleoExistente) {
      return res.status(404).json({
        ok: false,
        message: "Empleo no encontrado",
      });
    }

    const empleo = await prisma.empleo.update({
      where: { id },
      data: {
        estado: "PUBLICADO",
        publicadoEn: new Date(),
      },
    });

    return res.json({
      ok: true,
      message: "Empleo publicado correctamente",
      empleo,
    });
  } catch (error) {
    console.error("ERROR PUBLICAR EMPLEO:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al publicar empleo",
    });
  }
};

export const pausarEmpleo = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "ID inválido",
      });
    }

    const empleoExistente = await prisma.empleo.findUnique({
      where: { id },
    });

    if (!empleoExistente) {
      return res.status(404).json({
        ok: false,
        message: "Empleo no encontrado",
      });
    }

    const empleo = await prisma.empleo.update({
      where: { id },
      data: {
        estado: "PAUSADO",
      },
    });

    return res.json({
      ok: true,
      message: "Empleo pausado correctamente",
      empleo,
    });
  } catch (error) {
    console.error("ERROR PAUSAR EMPLEO:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al pausar empleo",
    });
  }
};

export const cerrarEmpleo = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "ID inválido",
      });
    }

    const empleoExistente = await prisma.empleo.findUnique({
      where: { id },
    });

    if (!empleoExistente) {
      return res.status(404).json({
        ok: false,
        message: "Empleo no encontrado",
      });
    }

    const empleo = await prisma.empleo.update({
      where: { id },
      data: {
        estado: "CERRADO",
      },
    });

    return res.json({
      ok: true,
      message: "Empleo cerrado correctamente",
      empleo,
    });
  } catch (error) {
    console.error("ERROR CERRAR EMPLEO:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al cerrar empleo",
    });
  }
};

export const eliminarEmpleo = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "ID inválido",
      });
    }

    const empleoExistente = await prisma.empleo.findUnique({
      where: { id },
    });

    if (!empleoExistente) {
      return res.status(404).json({
        ok: false,
        message: "Empleo no encontrado",
      });
    }

    await prisma.empleo.delete({
      where: { id },
    });

    return res.json({
      ok: true,
      message: "Empleo eliminado correctamente",
    });
  } catch (error) {
    console.error("ERROR ELIMINAR EMPLEO:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al eliminar empleo",
    });
  }
};