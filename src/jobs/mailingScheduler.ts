import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { enviarCorreo } from "../services/mail.service";

const prisma = new PrismaClient();

export const iniciarMailingScheduler = () => {
  cron.schedule("* * * * *", async () => {
    console.log("Revisando campañas programadas...");

    const ahora = new Date();

    const campanas = await prisma.mailingCampana.findMany({
      where: {
        estado: "PROGRAMADA",
        fechaProgramada: {
          lte: ahora,
        },
      },
      include: {
        destinatarios: true,
        adjuntos: true,
      },
    });

    for (const campana of campanas) {
      let enviados = 0;
      let errores = 0;

      const attachments = campana.adjuntos.map((archivo) => ({
        filename: archivo.nombreOriginal,
        path: archivo.path,
        contentType: archivo.mimeType,
      }));

      for (const destinatario of campana.destinatarios) {
        try {
          await enviarCorreo({
            to: destinatario.email,
            subject: campana.asunto,
            html: campana.cuerpo,
            attachments,
          });

          enviados++;

          await prisma.mailingDestinatario.update({
            where: { id: destinatario.id },
            data: {
              estado: "ENVIADO",
              enviadoAt: new Date(),
              error: null,
            },
          });
        } catch (error: any) {
          errores++;

          await prisma.mailingDestinatario.update({
            where: { id: destinatario.id },
            data: {
              estado: "ERROR",
              error: error?.message || "Error al enviar",
            },
          });
        }
      }

      await prisma.mailingCampana.update({
        where: {
          id: campana.id,
        },
        data: {
          estado: errores === 0 ? "ENVIADA" : "ENVIADA_CON_ERRORES",
          enviados: {
            increment: enviados,
          },
          errores: {
            increment: errores,
          },
        },
      });
    }
  });
};