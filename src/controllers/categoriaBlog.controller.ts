import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { buscarSlugLibre, generarSlug, limpiarTexto } from "../utils/texto";
import { crearReordenar } from "../utils/reordenar";

const LARGO_MAXIMO_NOMBRE = 60;

// Devuelve un slug libre a partir del nombre, sin chocar con otra categoría.
const obtenerSlugDisponible = (nombre: string, idActual?: number) =>
  buscarSlugLibre(generarSlug(nombre) || "categoria", async (slug) =>
    Boolean(
      await prisma.categoriaBlog.findFirst({
        where: { slug, ...(idActual ? { NOT: { id: idActual } } : {}) },
        select: { id: true },
      })
    )
  );

const validarNombre = (nombre: string | null): string | null => {
  if (!nombre) return "El nombre de la categoría es obligatorio";

  if (nombre.length > LARGO_MAXIMO_NOMBRE) {
    return `El nombre no puede superar los ${LARGO_MAXIMO_NOMBRE} caracteres`;
  }

  return null;
};

export const listarCategorias = async (_req: Request, res: Response) => {
  try {
    const categorias = await prisma.categoriaBlog.findMany({
      orderBy: [{ orden: "asc" }, { id: "asc" }],
      include: { _count: { select: { publicaciones: true } } },
    });

    return res.json({
      ok: true,
      categorias: categorias.map(({ _count, ...categoria }) => ({
        ...categoria,
        totalPublicaciones: _count.publicaciones,
      })),
    });
  } catch (error) {
    console.error("ERROR LISTAR CATEGORIAS BLOG:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al listar las categorías",
    });
  }
};

export const crearCategoria = async (req: Request, res: Response) => {
  try {
    const nombre = limpiarTexto(req.body.nombre);
    const errorValidacion = validarNombre(nombre);

    if (errorValidacion) {
      return res.status(400).json({ ok: false, message: errorValidacion });
    }

    const ultima = await prisma.categoriaBlog.findFirst({
      orderBy: { orden: "desc" },
      select: { orden: true },
    });

    const categoria = await prisma.categoriaBlog.create({
      data: {
        nombre: nombre as string,
        slug: await obtenerSlugDisponible(nombre as string),
        orden: (ultima?.orden ?? -1) + 1,
        activo: req.body.activo !== false,
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Categoría creada correctamente",
      categoria,
    });
  } catch (error) {
    console.error("ERROR CREAR CATEGORIA BLOG:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al crear la categoría",
    });
  }
};

export const actualizarCategoria = async (req: Request, res: Response) => {
  try {
    const categoriaId = Number(req.params.id);

    const existente = await prisma.categoriaBlog.findUnique({
      where: { id: categoriaId },
    });

    if (!existente) {
      return res.status(404).json({
        ok: false,
        message: "Categoría no encontrada",
      });
    }

    const nombre =
      req.body.nombre !== undefined ? limpiarTexto(req.body.nombre) : existente.nombre;
    const errorValidacion = validarNombre(nombre);

    if (errorValidacion) {
      return res.status(400).json({ ok: false, message: errorValidacion });
    }

    const categoria = await prisma.categoriaBlog.update({
      where: { id: categoriaId },
      data: {
        nombre: nombre as string,
        slug:
          nombre === existente.nombre
            ? existente.slug
            : await obtenerSlugDisponible(nombre as string, categoriaId),
        activo:
          typeof req.body.activo === "boolean" ? req.body.activo : existente.activo,
      },
    });

    return res.json({
      ok: true,
      message: "Categoría actualizada correctamente",
      categoria,
    });
  } catch (error) {
    console.error("ERROR ACTUALIZAR CATEGORIA BLOG:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al actualizar la categoría",
    });
  }
};

export const reordenarCategorias = crearReordenar(
  (id, orden) => prisma.categoriaBlog.update({ where: { id }, data: { orden } }),
  { error: "Error al reordenar las categorías", log: "ERROR REORDENAR CATEGORIAS BLOG:" }
);

export const eliminarCategoria = async (req: Request, res: Response) => {
  try {
    const categoriaId = Number(req.params.id);

    const categoria = await prisma.categoriaBlog.findUnique({
      where: { id: categoriaId },
      include: { _count: { select: { publicaciones: true } } },
    });

    if (!categoria) {
      return res.status(404).json({
        ok: false,
        message: "Categoría no encontrada",
      });
    }

    if (categoria._count.publicaciones > 0) {
      return res.status(400).json({
        ok: false,
        message:
          "No se puede eliminar una categoría con artículos. Cámbialos de categoría o elimínalos primero.",
      });
    }

    await prisma.categoriaBlog.delete({
      where: { id: categoriaId },
    });

    return res.json({
      ok: true,
      message: "Categoría eliminada correctamente",
    });
  } catch (error) {
    console.error("ERROR ELIMINAR CATEGORIA BLOG:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al eliminar la categoría",
    });
  }
};

// Pública: categorías visibles, en el orden de la intranet (filtros del blog).
export const listarCategoriasPublicas = async (_req: Request, res: Response) => {
  try {
    const categorias = await prisma.categoriaBlog.findMany({
      where: { activo: true },
      orderBy: [{ orden: "asc" }, { id: "asc" }],
      select: { id: true, nombre: true, slug: true },
    });

    return res.json({ ok: true, categorias });
  } catch (error) {
    console.error("ERROR LISTAR CATEGORIAS BLOG PUBLICAS:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al listar las categorías",
    });
  }
};
