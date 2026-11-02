import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import cloudinary from "../config/cloudinary";
import { subirImagenCloudinary } from "../utils/subirImagenCloudinary";
import { parsearBooleano } from "../utils/texto";
import { crearReordenar } from "../utils/reordenar";

const CARPETA_LOGOS = "grupo-colchagua/marcas-web";

// Pública: solo las marcas visibles, en el orden definido en la intranet.
export const listarMarcasPublicas = async (_req: Request, res: Response) => {
  try {
    const marcas = await prisma.marcaWeb.findMany({
      where: { activo: true },
      orderBy: [{ orden: "asc" }, { id: "asc" }],
      select: { id: true, nombre: true, logoUrl: true },
    });

    return res.json({ ok: true, marcas });
  } catch (error) {
    console.error("ERROR LISTAR MARCAS PUBLICAS:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al listar marcas",
    });
  }
};

export const listarMarcas = async (_req: Request, res: Response) => {
  try {
    const marcas = await prisma.marcaWeb.findMany({
      orderBy: [{ orden: "asc" }, { id: "asc" }],
    });

    return res.json({ ok: true, marcas });
  } catch (error) {
    console.error("ERROR LISTAR MARCAS:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al listar marcas",
    });
  }
};

export const crearMarca = async (req: Request, res: Response) => {
  try {
    const nombre = String(req.body.nombre ?? "").trim();

    if (!nombre) {
      return res.status(400).json({
        ok: false,
        message: "El nombre es obligatorio",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message: "El logo es obligatorio",
      });
    }

    const ultima = await prisma.marcaWeb.findFirst({
      orderBy: { orden: "desc" },
      select: { orden: true },
    });

    const upload = await subirImagenCloudinary(req.file.buffer, CARPETA_LOGOS);

    const marca = await prisma.marcaWeb.create({
      data: {
        nombre,
        logoUrl: upload.secure_url,
        logoPublicId: upload.public_id,
        orden: (ultima?.orden ?? -1) + 1,
        activo: parsearBooleano(req.body.activo) ?? true,
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Marca creada correctamente",
      marca,
    });
  } catch (error) {
    console.error("ERROR CREAR MARCA:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al crear marca",
    });
  }
};

export const actualizarMarca = async (req: Request, res: Response) => {
  try {
    const marcaId = Number(req.params.id);

    const marcaExistente = await prisma.marcaWeb.findUnique({
      where: { id: marcaId },
    });

    if (!marcaExistente) {
      return res.status(404).json({
        ok: false,
        message: "Marca no encontrada",
      });
    }

    const nombre =
      req.body.nombre !== undefined
        ? String(req.body.nombre).trim()
        : marcaExistente.nombre;

    if (!nombre) {
      return res.status(400).json({
        ok: false,
        message: "El nombre es obligatorio",
      });
    }

    let logoUrl = marcaExistente.logoUrl;
    let logoPublicId = marcaExistente.logoPublicId;

    if (req.file) {
      const upload = await subirImagenCloudinary(req.file.buffer, CARPETA_LOGOS);

      if (logoPublicId) {
        await cloudinary.uploader.destroy(logoPublicId);
      }

      logoUrl = upload.secure_url;
      logoPublicId = upload.public_id;
    }

    const marca = await prisma.marcaWeb.update({
      where: { id: marcaId },
      data: {
        nombre,
        logoUrl,
        logoPublicId,
        activo: parsearBooleano(req.body.activo) ?? marcaExistente.activo,
      },
    });

    return res.json({
      ok: true,
      message: "Marca actualizada correctamente",
      marca,
    });
  } catch (error) {
    console.error("ERROR ACTUALIZAR MARCA:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al actualizar marca",
    });
  }
};

export const reordenarMarcas = crearReordenar(
  (id, orden) => prisma.marcaWeb.update({ where: { id }, data: { orden } }),
  { error: "Error al reordenar marcas", log: "ERROR REORDENAR MARCAS:" }
);

export const eliminarMarca = async (req: Request, res: Response) => {
  try {
    const marcaId = Number(req.params.id);

    const marca = await prisma.marcaWeb.findUnique({
      where: { id: marcaId },
    });

    if (!marca) {
      return res.status(404).json({
        ok: false,
        message: "Marca no encontrada",
      });
    }

    if (marca.logoPublicId) {
      await cloudinary.uploader.destroy(marca.logoPublicId);
    }

    await prisma.marcaWeb.delete({
      where: { id: marcaId },
    });

    return res.json({
      ok: true,
      message: "Marca eliminada correctamente",
    });
  } catch (error) {
    console.error("ERROR ELIMINAR MARCA:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al eliminar marca",
    });
  }
};
