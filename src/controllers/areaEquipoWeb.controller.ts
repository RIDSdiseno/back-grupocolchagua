import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { limpiarTexto } from "../utils/texto";
import { crearReordenar } from "../utils/reordenar";

const LARGO_MAXIMO_DESCRIPCION = 200;

const validarCampos = (datos: {
  nombre: string | null;
  descripcion: string | null;
}): string | null => {
  if (!datos.nombre) {
    return "El nombre del área es obligatorio";
  }

  if (datos.descripcion && datos.descripcion.length > LARGO_MAXIMO_DESCRIPCION) {
    return `La descripción no puede superar los ${LARGO_MAXIMO_DESCRIPCION} caracteres`;
  }

  return null;
};

export const listarAreas = async (_req: Request, res: Response) => {
  try {
    const areas = await prisma.areaEquipoWeb.findMany({
      orderBy: [{ orden: "asc" }, { id: "asc" }],
    });

    return res.json({ ok: true, areas });
  } catch (error) {
    console.error("ERROR LISTAR AREAS EQUIPO:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al listar las áreas",
    });
  }
};

export const crearArea = async (req: Request, res: Response) => {
  try {
    const datos = {
      nombre: limpiarTexto(req.body.nombre),
      descripcion: limpiarTexto(req.body.descripcion),
    };

    const errorValidacion = validarCampos(datos);

    if (errorValidacion) {
      return res.status(400).json({ ok: false, message: errorValidacion });
    }

    const ultima = await prisma.areaEquipoWeb.findFirst({
      orderBy: { orden: "desc" },
      select: { orden: true },
    });

    const area = await prisma.areaEquipoWeb.create({
      data: {
        nombre: datos.nombre as string,
        descripcion: datos.descripcion,
        orden: (ultima?.orden ?? -1) + 1,
        activo: req.body.activo !== false,
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Área creada correctamente",
      area,
    });
  } catch (error) {
    console.error("ERROR CREAR AREA EQUIPO:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al crear el área",
    });
  }
};

export const actualizarArea = async (req: Request, res: Response) => {
  try {
    const areaId = Number(req.params.id);

    const existente = await prisma.areaEquipoWeb.findUnique({
      where: { id: areaId },
    });

    if (!existente) {
      return res.status(404).json({
        ok: false,
        message: "Área no encontrada",
      });
    }

    const datos = {
      nombre:
        req.body.nombre !== undefined
          ? limpiarTexto(req.body.nombre)
          : existente.nombre,
      descripcion:
        req.body.descripcion !== undefined
          ? limpiarTexto(req.body.descripcion)
          : existente.descripcion,
    };

    const errorValidacion = validarCampos(datos);

    if (errorValidacion) {
      return res.status(400).json({ ok: false, message: errorValidacion });
    }

    const area = await prisma.areaEquipoWeb.update({
      where: { id: areaId },
      data: {
        nombre: datos.nombre as string,
        descripcion: datos.descripcion,
        activo:
          typeof req.body.activo === "boolean" ? req.body.activo : existente.activo,
      },
    });

    return res.json({
      ok: true,
      message: "Área actualizada correctamente",
      area,
    });
  } catch (error) {
    console.error("ERROR ACTUALIZAR AREA EQUIPO:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al actualizar el área",
    });
  }
};

export const reordenarAreas = crearReordenar(
  (id, orden) => prisma.areaEquipoWeb.update({ where: { id }, data: { orden } }),
  { error: "Error al reordenar las áreas", log: "ERROR REORDENAR AREAS EQUIPO:" }
);

export const eliminarArea = async (req: Request, res: Response) => {
  try {
    const areaId = Number(req.params.id);

    const area = await prisma.areaEquipoWeb.findUnique({
      where: { id: areaId },
      include: { _count: { select: { miembros: true } } },
    });

    if (!area) {
      return res.status(404).json({
        ok: false,
        message: "Área no encontrada",
      });
    }

    if (area._count.miembros > 0) {
      return res.status(400).json({
        ok: false,
        message:
          "No se puede eliminar un área con personas. Muévelas a otra área o elimínalas primero.",
      });
    }

    await prisma.areaEquipoWeb.delete({
      where: { id: areaId },
    });

    return res.json({
      ok: true,
      message: "Área eliminada correctamente",
    });
  } catch (error) {
    console.error("ERROR ELIMINAR AREA EQUIPO:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al eliminar el área",
    });
  }
};
