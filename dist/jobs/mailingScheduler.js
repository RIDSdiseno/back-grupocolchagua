"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.iniciarMailingScheduler = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const client_1 = require("@prisma/client");
const mail_service_1 = require("../services/mail.service");
const prisma = new client_1.PrismaClient();
const iniciarMailingScheduler = () => {
    node_cron_1.default.schedule("* * * * *", async () => {
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
                    await (0, mail_service_1.enviarCorreo)({
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
                }
                catch (error) {
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
exports.iniciarMailingScheduler = iniciarMailingScheduler;
