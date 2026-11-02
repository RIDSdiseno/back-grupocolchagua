import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import cloudinary from "../config/cloudinary";
import { subirImagenCloudinary } from "../utils/subirImagenCloudinary";
import { limpiarTexto, parsearBooleano, parsearId } from "../utils/texto";
import { crearReordenar } from "../utils/reordenar";

const CARPETA_FOTOS = "grupo-colchagua/equipo-web";
const LARGO_MAXIMO_RESUMEN = 400;
const PATRON_LINKEDIN = /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[^\s/]+\/?$/i;

// Devuelve un mensaje de error si algún campo de texto no es válido.
const validarCampos = (datos: {
  nombre: string | null;
  cargo: string | null;
  areaId: number | null;
  resumen: string | null;
  linkedinUrl: string | null;
}): string | null => {
  if (!datos.nombre || !datos.cargo) {
    return "Nombre y cargo son obligatorios";
  }

  if (!datos.areaId) {
    return "Debes elegir un área";
  }

  if (datos.resumen && datos.resumen.length > LARGO_MAXIMO_RESUMEN) {
    return `El resumen no puede superar los ${LARGO_MAXIMO_RESUMEN} caracteres`;
  }

  if (datos.linkedinUrl && !PATRON_LINKEDIN.test(datos.linkedinUrl)) {
    return "El enlace de LinkedIn debe ser como https://www.linkedin.com/in/usuario";
  }

  return null;
};

const areaExiste = async (areaId: number) =>
  (await prisma.areaEquipoWeb.count({ where: { id: areaId } })) > 0;

// Pública: áreas visibles con sus personas visibles, para "Nuestro equipo" en Nosotros.
export const listarEquipoPublico = async (_req: Request, res: Response) => {
  try {
    const areas = await prisma.areaEquipoWeb.findMany({
      where: { activo: true },
      orderBy: [{ orden: "asc" }, { id: "asc" }],
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        miembros: {
          where: { activo: true },
          orderBy: [{ orden: "asc" }, { id: "asc" }],
          select: {
            id: true,
            nombre: true,
            cargo: true,
            resumen: true,
            fotoUrl: true,
            linkedinUrl: true,
          },
        },
      },
    });

    return res.json({ ok: true, areas });
  } catch (error) {
    console.error("ERROR LISTAR EQUIPO PUBLICO:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al listar el equipo",
    });
  }
};

export const listarEquipo = async (_req: Request, res: Response) => {
  try {
    const miembros = await prisma.miembroEquipoWeb.findMany({
      orderBy: [{ orden: "asc" }, { id: "asc" }],
    });

    return res.json({ ok: true, miembros });
  } catch (error) {
    console.error("ERROR LISTAR EQUIPO:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al listar el equipo",
    });
  }
};

export const crearMiembro = async (req: Request, res: Response) => {
  try {
    const datos = {
      nombre: limpiarTexto(req.body.nombre),
      cargo: limpiarTexto(req.body.cargo),
      areaId: parsearId(req.body.areaId),
      resumen: limpiarTexto(req.body.resumen),
      linkedinUrl: limpiarTexto(req.body.linkedinUrl),
    };

    const errorValidacion = validarCampos(datos);

    if (errorValidacion) {
      return res.status(400).json({ ok: false, message: errorValidacion });
    }

    if (!(await areaExiste(datos.areaId as number))) {
      return res.status(400).json({ ok: false, message: "El área elegida no existe" });
    }

    const ultimo = await prisma.miembroEquipoWeb.findFirst({
      orderBy: { orden: "desc" },
      select: { orden: true },
    });

    const upload = req.file
      ? await subirImagenCloudinary(req.file.buffer, CARPETA_FOTOS)
      : null;

    const miembro = await prisma.miembroEquipoWeb.create({
      data: {
        nombre: datos.nombre as string,
        cargo: datos.cargo as string,
        areaId: datos.areaId,
        resumen: datos.resumen,
        linkedinUrl: datos.linkedinUrl,
        fotoUrl: upload?.secure_url ?? null,
        fotoPublicId: upload?.public_id ?? null,
        orden: (ultimo?.orden ?? -1) + 1,
        activo: parsearBooleano(req.body.activo) ?? true,
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Persona agregada correctamente",
      miembro,
    });
  } catch (error) {
    console.error("ERROR CREAR MIEMBRO EQUIPO:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al agregar la persona",
    });
  }
};

export const actualizarMiembro = async (req: Request, res: Response) => {
  try {
    const miembroId = Number(req.params.id);

    const existente = await prisma.miembroEquipoWeb.findUnique({
      where: { id: miembroId },
    });

    if (!existente) {
      return res.status(404).json({
        ok: false,
        message: "Persona no encontrada",
      });
    }

    const tomar = (campo: string, actual: string | null) =>
      req.body[campo] !== undefined ? limpiarTexto(req.body[campo]) : actual;

    const datos = {
      nombre: tomar("nombre", existente.nombre),
      cargo: tomar("cargo", existente.cargo),
      areaId:
        req.body.areaId !== undefined
          ? parsearId(req.body.areaId)
          : existente.areaId,
      resumen: tomar("resumen", existente.resumen),
      linkedinUrl: tomar("linkedinUrl", existente.linkedinUrl),
    };

    const errorValidacion = validarCampos(datos);

    if (errorValidacion) {
      return res.status(400).json({ ok: false, message: errorValidacion });
    }

    if (
      datos.areaId !== existente.areaId &&
      !(await areaExiste(datos.areaId as number))
    ) {
      return res.status(400).json({ ok: false, message: "El área elegida no existe" });
    }

    let fotoUrl = existente.fotoUrl;
    let fotoPublicId = existente.fotoPublicId;
    const quitarFoto = parsearBooleano(req.body.quitarFoto) === true;

    if (req.file || quitarFoto) {
      const upload = req.file
        ? await subirImagenCloudinary(req.file.buffer, CARPETA_FOTOS)
        : null;

      if (fotoPublicId) {
        await cloudinary.uploader.destroy(fotoPublicId);
      }

      fotoUrl = upload?.secure_url ?? null;
      fotoPublicId = upload?.public_id ?? null;
    }

    const miembro = await prisma.miembroEquipoWeb.update({
      where: { id: miembroId },
      data: {
        nombre: datos.nombre as string,
        cargo: datos.cargo as string,
        areaId: datos.areaId,
        resumen: datos.resumen,
        linkedinUrl: datos.linkedinUrl,
        fotoUrl,
        fotoPublicId,
        activo: parsearBooleano(req.body.activo) ?? existente.activo,
      },
    });

    return res.json({
      ok: true,
      message: "Persona actualizada correctamente",
      miembro,
    });
  } catch (error) {
    console.error("ERROR ACTUALIZAR MIEMBRO EQUIPO:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al actualizar la persona",
    });
  }
};

export const reordenarEquipo = crearReordenar(
  (id, orden) => prisma.miembroEquipoWeb.update({ where: { id }, data: { orden } }),
  { error: "Error al reordenar el equipo", log: "ERROR REORDENAR EQUIPO:" }
);

export const eliminarMiembro = async (req: Request, res: Response) => {
  try {
    const miembroId = Number(req.params.id);

    const miembro = await prisma.miembroEquipoWeb.findUnique({
      where: { id: miembroId },
    });

    if (!miembro) {
      return res.status(404).json({
        ok: false,
        message: "Persona no encontrada",
      });
    }

    if (miembro.fotoPublicId) {
      await cloudinary.uploader.destroy(miembro.fotoPublicId);
    }

    await prisma.miembroEquipoWeb.delete({
      where: { id: miembroId },
    });

    return res.json({
      ok: true,
      message: "Persona eliminada correctamente",
    });
  } catch (error) {
    console.error("ERROR ELIMINAR MIEMBRO EQUIPO:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al eliminar la persona",
    });
  }
};
