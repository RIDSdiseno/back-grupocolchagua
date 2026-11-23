import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import cloudinary from "../config/cloudinary";
import {
  leerConsentimiento,
  MENSAJE_SIN_CONSENTIMIENTO,
  type EvidenciaConsentimiento,
} from "../utils/consentimiento";

// Minutos que dura el enlace firmado para ver un CV desde el panel.
const MINUTOS_ENLACE_CV = 5;

type EstadoPostulacion =
  | "PENDIENTE"
  | "POR_CONTACTAR"
  | "CONTACTADO"
  | "DESCARTADO";

type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
};

const ESTADOS_PERMITIDOS: EstadoPostulacion[] = [
  "PENDIENTE",
  "POR_CONTACTAR",
  "CONTACTADO",
  "DESCARTADO",
];

const limpiarTexto = (valor: unknown): string | null => {
  if (valor === undefined || valor === null) return null;

  const texto = String(valor).trim();

  return texto.length > 0 ? texto : null;
};

// Los CV se suben como "authenticated": no se pueden abrir con la URL directa,
// solo con un enlace firmado que genera obtenerUrlCv para usuarios del panel.
const subirCvCloudinary = (
  fileBuffer: Buffer,
  originalName: string,
  consentimiento: EvidenciaConsentimiento
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const nombreLimpio = originalName
      .replace(/\.[^/.]+$/, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-_]/g, "");

    const extension = (originalName.match(/\.([a-zA-Z0-9]+)$/)?.[1] ?? "")
      .toLowerCase();

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "grupo-colchagua/postulaciones/cv",
        resource_type: "raw",
        type: "authenticated",
        public_id: `${Date.now()}-${nombreLimpio}${extension ? `.${extension}` : ""}`,
        // Evidencia del consentimiento (Ley 21.719), guardada junto al CV.
        context: {
          consentimiento: "si",
          version_politica: consentimiento.versionPolitica,
          fecha_consentimiento: consentimiento.fecha,
          ip_consentimiento: consentimiento.ip,
        },
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

export const crearPostulacion = async (req: Request, res: Response) => {
  try {
    const {
      nombre,
      apellido,
      rut,
      email,
      telefono,
      cargoPostula,
      comuna,
      region,
      experiencia,
      disponibilidad,
      mensaje,
      empleoId,
    } = req.body;

    if (!nombre || !apellido || !email || !telefono || !cargoPostula) {
      return res.status(400).json({
        ok: false,
        message:
          "Nombre, apellido, email, teléfono y cargo postula son obligatorios",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message: "El CV es obligatorio",
      });
    }

    const consentimiento = leerConsentimiento(req);

    if (!consentimiento) {
      return res.status(400).json({
        ok: false,
        message: MENSAJE_SIN_CONSENTIMIENTO,
      });
    }

    let empleoIdNumber: number | null = null;

    if (empleoId !== undefined && empleoId !== null && String(empleoId).trim() !== "") {
        empleoIdNumber = Number(empleoId);

        if (!Number.isInteger(empleoIdNumber) || empleoIdNumber <= 0) {
          return res.status(400).json({
            ok: false,
            message: "ID de empleo inválido",
          });
        }

        const empleo = await prisma.empleo.findUnique({
          where: { id: empleoIdNumber },
        });

        if (!empleo) {
          return res.status(404).json({
            ok: false,
            message: "El empleo seleccionado no existe",
          });
        }

        if (empleo.estado !== "PUBLICADO") {
          return res.status(400).json({
            ok: false,
            message: "El empleo seleccionado no está disponible para postulación",
          });
        }

        if (empleo.fechaCierre && empleo.fechaCierre < new Date()) {
          return res.status(400).json({
            ok: false,
            message: "El empleo seleccionado ya cerró sus postulaciones",
          });
        }
      }

    const upload = await subirCvCloudinary(
      req.file.buffer,
      req.file.originalname,
      consentimiento
    );

    await prisma.postulacion.create({
      data: {
        nombre: String(nombre).trim(),
        apellido: String(apellido).trim(),
        rut: limpiarTexto(rut),
        email: String(email).trim().toLowerCase(),
        telefono: String(telefono).trim(),
        cargoPostula: String(cargoPostula).trim(),
        comuna: limpiarTexto(comuna),
        region: limpiarTexto(region),
        experiencia: limpiarTexto(experiencia),
        disponibilidad: limpiarTexto(disponibilidad),
        mensaje: limpiarTexto(mensaje),
        empleoId: empleoIdNumber,
        cvUrl: upload.secure_url,
        cvPublicId: upload.public_id,
        estado: "PENDIENTE",
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Postulación enviada correctamente",
    });
  } catch (error) {
    console.error("ERROR CREAR POSTULACION:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al enviar postulación",
    });
  }
};

export const listarPostulaciones = async (_req: Request, res: Response) => {
  try {
    const postulaciones = await prisma.postulacion.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        empleo: true,
      },
    });

    return res.json({
      ok: true,
      postulaciones,
    });
  } catch (error) {
    console.error("ERROR LISTAR POSTULACIONES:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al listar postulaciones",
    });
  }
};

export const obtenerPostulacion = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "ID inválido",
      });
    }

    const postulacion = await prisma.postulacion.findUnique({
      where: { id },
      include: {
        empleo: true,
      },
    });

    if (!postulacion) {
      return res.status(404).json({
        ok: false,
        message: "Postulación no encontrada",
      });
    }

    return res.json({
      ok: true,
      postulacion,
    });
  } catch (error) {
    console.error("ERROR OBTENER POSTULACION:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al obtener postulación",
    });
  }
};

// Entrega un enlace temporal para ver el CV. Los CV antiguos (subidos antes de
// pasar a "authenticated") siguen siendo públicos y se devuelve su URL tal cual.
export const obtenerUrlCv = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ ok: false, message: "ID inválido" });
    }

    const postulacion = await prisma.postulacion.findUnique({
      where: { id },
      select: { cvUrl: true, cvPublicId: true },
    });

    if (!postulacion) {
      return res.status(404).json({
        ok: false,
        message: "Postulación no encontrada",
      });
    }

    const { cvUrl, cvPublicId } = postulacion;

    const url =
      cvPublicId && cvUrl.includes("/raw/authenticated/")
        ? cloudinary.utils.private_download_url(cvPublicId, "", {
            resource_type: "raw",
            type: "authenticated",
            expires_at: Math.floor(Date.now() / 1000) + MINUTOS_ENLACE_CV * 60,
          })
        : cvUrl;

    return res.json({ ok: true, url });
  } catch (error) {
    console.error("ERROR OBTENER CV POSTULACION:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al obtener el CV",
    });
  }
};

export const actualizarEstadoPostulacion = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);
    const estado = String(req.body.estado).trim() as EstadoPostulacion;

    if (Number.isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "ID inválido",
      });
    }

    if (!ESTADOS_PERMITIDOS.includes(estado)) {
      return res.status(400).json({
        ok: false,
        message: "Estado inválido",
        estadosPermitidos: ESTADOS_PERMITIDOS,
      });
    }

    const postulacionExistente = await prisma.postulacion.findUnique({
      where: { id },
    });

    if (!postulacionExistente) {
      return res.status(404).json({
        ok: false,
        message: "Postulación no encontrada",
      });
    }

    const postulacion = await prisma.postulacion.update({
      where: { id },
      data: {
        estado,
      },
    });

    return res.json({
      ok: true,
      message: "Estado actualizado correctamente",
      postulacion,
    });
  } catch (error) {
    console.error("ERROR ACTUALIZAR ESTADO POSTULACION:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al actualizar estado",
    });
  }
};