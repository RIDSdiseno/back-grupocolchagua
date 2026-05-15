import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { enviarCorreo } from "../services/mail.service";

const prisma = new PrismaClient();

const normalizarEmailsPersonalizados = (emails: string) => {
  return String(emails || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
};

const esEmailValido = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const crearCampana = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { asunto, cuerpo, grupo, emailsPersonalizados, fechaProgramada } =
      req.body;

    if (!asunto || !cuerpo || !grupo) {
      return res.status(400).json({
        ok: false,
        message: "Asunto, cuerpo y grupo son obligatorios.",
      });
    }

    let destinatarios: { email: string; nombre?: string }[] = [];

    if (grupo === "Personalizado") {
      const emails = normalizarEmailsPersonalizados(emailsPersonalizados);

      const emailsInvalidos = emails.filter((email) => !esEmailValido(email));

      if (emailsInvalidos.length > 0) {
        return res.status(400).json({
          ok: false,
          message: `Hay correos inválidos: ${emailsInvalidos.join(", ")}`,
        });
      }

      destinatarios = Array.from(new Set(emails)).map((email) => ({ email }));
    }

    if (grupo === "Todos los trabajadores") {
      const trabajadores = await prisma.trabajador.findMany({
        where: {
          activo: true,
          email: {
            not: null,
          },
        },
        select: {
          nombre: true,
          apellido: true,
          email: true,
        },
      });

      destinatarios = trabajadores
        .filter((t) => t.email && esEmailValido(t.email))
        .map((t) => ({
          email: t.email as string,
          nombre: `${t.nombre} ${t.apellido}`,
        }));
    }

    if (destinatarios.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "No hay destinatarios válidos para esta campaña.",
      });
    }

    const campana = await prisma.mailingCampana.create({
      data: {
        asunto: String(asunto).trim(),
        cuerpo: String(cuerpo),
        grupo: String(grupo),
        estado: fechaProgramada ? "PROGRAMADA" : "BORRADOR",
        fechaProgramada: fechaProgramada ? new Date(fechaProgramada) : null,
        destinatarios: {
          create: destinatarios.map((d) => ({
            email: d.email,
            nombre: d.nombre,
          })),
        },
      },
      include: {
        destinatarios: true,
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Campaña creada correctamente.",
      campana,
    });
  } catch (error) {
    next(error);
  }
};

export const listarCampanas = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const campanas = await prisma.mailingCampana.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            destinatarios: true,
          },
        },
      },
    });

    return res.json({
      ok: true,
      campanas,
    });
  } catch (error) {
    next(error);
  }
};

export const enviarCampana = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const campanaId = Number(req.params.id);

    if (Number.isNaN(campanaId)) {
      return res.status(400).json({
        ok: false,
        message: "ID de campaña inválido.",
      });
    }

    const campana = await prisma.mailingCampana.findUnique({
      where: { id: campanaId },
      include: {
        destinatarios: true,
      },
    });

    if (!campana) {
      return res.status(404).json({
        ok: false,
        message: "Campaña no encontrada.",
      });
    }

    if (campana.estado === "ENVIADA") {
      return res.status(400).json({
        ok: false,
        message: "Esta campaña ya fue enviada.",
      });
    }

    console.log("INICIANDO ENVÍO DE CAMPAÑA:", {
      campanaId: campana.id,
      asunto: campana.asunto,
      grupo: campana.grupo,
      destinatarios: campana.destinatarios.length,
    });

    let enviados = 0;
    let errores = 0;

    for (const destinatario of campana.destinatarios) {
      try {
        console.log("Enviando correo a:", destinatario.email);

        const info = await enviarCorreo({
          to: destinatario.email,
          subject: campana.asunto,
          html: campana.cuerpo,
        });

        console.log("CORREO ENVIADO:", {
          destinatario: destinatario.email,
          messageId: info?.messageId,
          accepted: info?.accepted,
          rejected: info?.rejected,
          response: info?.response,
        });

        await prisma.mailingDestinatario.update({
          where: { id: destinatario.id },
          data: {
            estado: "ENVIADO",
            enviadoAt: new Date(),
            error: null,
          },
        });

        enviados++;
      } catch (error: any) {
        console.error("ERROR ENVIANDO CORREO:", {
          campanaId: campana.id,
          destinatario: destinatario.email,
          message: error?.message,
          code: error?.code,
          command: error?.command,
          response: error?.response,
          responseCode: error?.responseCode,
          stack: error?.stack,
        });

        await prisma.mailingDestinatario.update({
          where: { id: destinatario.id },
          data: {
            estado: "ERROR",
            error:
              error?.response ||
              error?.message ||
              "Error desconocido al enviar correo.",
          },
        });

        errores++;
      }
    }

    const campanaActualizada = await prisma.mailingCampana.update({
      where: { id: campanaId },
      data: {
        estado: errores === 0 ? "ENVIADA" : "ENVIADA_CON_ERRORES",
        enviados,
        errores,
      },
    });

    console.log("ENVÍO FINALIZADO:", {
      campanaId: campana.id,
      enviados,
      errores,
    });

    return res.json({
      ok: true,
      message: "Proceso de envío finalizado.",
      campana: campanaActualizada,
      enviados,
      errores,
    });
  } catch (error) {
    next(error);
  }
};

export const eliminarCampana = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const campanaId = Number(req.params.id);

    if (Number.isNaN(campanaId)) {
      return res.status(400).json({
        ok: false,
        message: "ID de campaña inválido.",
      });
    }

    await prisma.mailingCampana.delete({
      where: { id: campanaId },
    });

    return res.json({
      ok: true,
      message: "Campaña eliminada correctamente.",
    });
  } catch (error) {
    next(error);
  }
};