import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import cloudinary from "../config/cloudinary";
import { formatearRut, validarRut } from "../utils/validarRut";

type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
};

const subirImagenCloudinary = (
  fileBuffer: Buffer
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "grupo-colchagua/empresas",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary no retornó resultado"));
          return;
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    stream.end(fileBuffer);
  });
};

const limpiarTexto = (valor: unknown): string | null => {
  if (valor === undefined || valor === null) return null;

  const texto = String(valor).trim();

  return texto.length > 0 ? texto : null;
};

export const listarEmpresas = async (_req: Request, res: Response) => {
  try {
    const empresas = await prisma.empresa.findMany({
      orderBy: { id: "desc" },
    });

    return res.json({
      ok: true,
      empresas,
    });
  } catch (error) {
    console.error("ERROR LISTAR EMPRESAS:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al listar empresas",
    });
  }
};

export const crearEmpresa = async (req: Request, res: Response) => {
  try {
    const {
      razonSocial,
      alias,
      rut,
      encargadoNombre,
      encargadoCorreo,
      encargadoTelefono,
    } = req.body;

    if (!razonSocial || !alias || !rut) {
      return res.status(400).json({
        ok: false,
        message: "Razón social, alias y RUT son obligatorios",
      });
    }

    const rutLimpio = String(rut).trim();

    if (!validarRut(rutLimpio)) {
      return res.status(400).json({
        ok: false,
        message: "El RUT ingresado no es válido",
      });
    }

    const rutFormateado = formatearRut(rutLimpio);

    const empresaExistente = await prisma.empresa.findFirst({
      where: {
        rut: rutFormateado,
      },
    });

    if (empresaExistente) {
      return res.status(400).json({
        ok: false,
        message: "Ya existe una empresa registrada con este RUT",
      });
    }

    let logoUrl: string | null = null;
    let logoPublicId: string | null = null;

    if (req.file) {
      const upload = await subirImagenCloudinary(req.file.buffer);
      logoUrl = upload.secure_url;
      logoPublicId = upload.public_id;
    }

    const empresa = await prisma.empresa.create({
      data: {
        razonSocial: String(razonSocial).trim(),
        nombre: String(alias).trim(),
        rut: rutFormateado,
        logoUrl,
        logoPublicId,
        encargadoNombre: limpiarTexto(encargadoNombre),
        encargadoCorreo: limpiarTexto(encargadoCorreo),
        encargadoTelefono: limpiarTexto(encargadoTelefono),
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Empresa creada correctamente",
      empresa,
    });
  } catch (error) {
    console.error("ERROR CREAR EMPRESA:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al crear empresa",
    });
  }
};

export const actualizarEmpresa = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const {
      razonSocial,
      alias,
      rut,
      encargadoNombre,
      encargadoCorreo,
      encargadoTelefono,
    } = req.body;

    const empresaId = Number(id);

    if (Number.isNaN(empresaId)) {
      return res.status(400).json({
        ok: false,
        message: "ID de empresa inválido",
      });
    }

    const empresaExistente = await prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresaExistente) {
      return res.status(404).json({
        ok: false,
        message: "Empresa no encontrada",
      });
    }

    let rutFinal = empresaExistente.rut;

    if (rut) {
      const rutLimpio = String(rut).trim();

      if (!validarRut(rutLimpio)) {
        return res.status(400).json({
          ok: false,
          message: "El RUT ingresado no es válido",
        });
      }

      rutFinal = formatearRut(rutLimpio);

      const otraEmpresaConRut = await prisma.empresa.findFirst({
        where: {
          rut: rutFinal,
          NOT: {
            id: empresaId,
          },
        },
      });

      if (otraEmpresaConRut) {
        return res.status(400).json({
          ok: false,
          message: "Ya existe otra empresa registrada con este RUT",
        });
      }
    }

    let logoUrl = empresaExistente.logoUrl;
    let logoPublicId = empresaExistente.logoPublicId;

    if (req.file) {
      if (logoPublicId) {
        await cloudinary.uploader.destroy(logoPublicId);
      }

      const upload = await subirImagenCloudinary(req.file.buffer);
      logoUrl = upload.secure_url;
      logoPublicId = upload.public_id;
    }

    const empresa = await prisma.empresa.update({
      where: { id: empresaId },
      data: {
        razonSocial: razonSocial
          ? String(razonSocial).trim()
          : empresaExistente.razonSocial,

        nombre: alias ? String(alias).trim() : empresaExistente.nombre,

        rut: rutFinal,
        logoUrl,
        logoPublicId,

        encargadoNombre:
          encargadoNombre !== undefined
            ? limpiarTexto(encargadoNombre)
            : empresaExistente.encargadoNombre,

        encargadoCorreo:
          encargadoCorreo !== undefined
            ? limpiarTexto(encargadoCorreo)
            : empresaExistente.encargadoCorreo,

        encargadoTelefono:
          encargadoTelefono !== undefined
            ? limpiarTexto(encargadoTelefono)
            : empresaExistente.encargadoTelefono,
      },
    });

    return res.json({
      ok: true,
      message: "Empresa actualizada correctamente",
      empresa,
    });
  } catch (error) {
    console.error("ERROR ACTUALIZAR EMPRESA:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al actualizar empresa",
    });
  }
};

export const eliminarEmpresa = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const empresaId = Number(id);

    if (Number.isNaN(empresaId)) {
      return res.status(400).json({
        ok: false,
        message: "ID de empresa inválido",
      });
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      include: {
        _count: {
          select: {
            Sucursal: true,
            Asignacion: true,
            Asistencia: true,
            Tarifa: true,
          },
        },
      },
    });

    if (!empresa) {
      return res.status(404).json({
        ok: false,
        message: "Empresa no encontrada",
      });
    }

    const tieneRelaciones =
      empresa._count.Sucursal > 0 ||
      empresa._count.Asignacion > 0 ||
      empresa._count.Asistencia > 0 ||
      empresa._count.Tarifa > 0;

    if (tieneRelaciones) {
      return res.status(400).json({
        ok: false,
        message:
          "No se puede eliminar esta empresa porque tiene sucursales, asignaciones, asistencias o tarifas asociadas",
      });
    }

    if (empresa.logoPublicId) {
      await cloudinary.uploader.destroy(empresa.logoPublicId);
    }

    await prisma.empresa.delete({
      where: { id: empresaId },
    });

    return res.json({
      ok: true,
      message: "Empresa eliminada correctamente",
    });
  } catch (error) {
    console.error("ERROR ELIMINAR EMPRESA:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al eliminar empresa",
    });
  }
};