import { Request, Response, NextFunction } from "express";
import { enviarCorreo } from "../services/mail.service";
import { escaparHtml } from "../utils/texto";
import {
  leerConsentimiento,
  MENSAJE_SIN_CONSENTIMIENTO,
  type EvidenciaConsentimiento,
} from "../utils/consentimiento";

const DESTINO = process.env.CONTACT_EMAIL || "contacto@grupocolchagua.cl";

const SERVICIOS_VALIDOS = [
  "Servicios Transitorios",
  "Outsourcing",
  "Reclutamiento y Selección",
  "Formación y Capacitación",
  "Payroll",
  "Reposición Multimarca",
  "Cotización general",
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Fila del correo interno que deja constancia del consentimiento (Ley 21.719).
const filaConsentimiento = (c: EvidenciaConsentimiento) => `
          <tr>
            <td style="padding:8px 0;font-weight:bold;vertical-align:top">Consentimiento:</td>
            <td style="padding:8px 0;color:#555;font-size:13px">
              Aceptó la Política de Privacidad (versión ${escaparHtml(c.versionPolitica)})
              el ${escaparHtml(c.fecha)} desde la IP ${escaparHtml(c.ip)}
            </td>
          </tr>`;

export const recibirContacto = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { nombre, empresa, email, telefono, servicio, mensaje } = req.body || {};

    if (!nombre || !email || !mensaje) {
      res.status(400).json({ ok: false, message: "Nombre, email y mensaje son obligatorios." });
      return;
    }

    if (!emailRegex.test(email)) {
      res.status(400).json({ ok: false, message: "El email no es válido." });
      return;
    }

    const consentimiento = leerConsentimiento(req);

    if (!consentimiento) {
      res.status(400).json({ ok: false, message: MENSAJE_SIN_CONSENTIMIENTO });
      return;
    }

    const servicioTexto =
      servicio && SERVICIOS_VALIDOS.includes(servicio) ? servicio : "No especificado";

    const nombreTxt = String(nombre).trim();
    const empresaTxt = empresa ? String(empresa).trim() : "";
    const emailTxt = String(email).trim();
    const telefonoTxt = telefono ? String(telefono).trim() : "";
    const mensajeTxt = String(mensaje).trim();

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1d1820">
        <h2 style="color:#5b1746;border-bottom:2px solid #5b1746;padding-bottom:8px">
          Nuevo mensaje de contacto – Grupo Colchagua
        </h2>
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:8px 0;font-weight:bold;width:160px">Nombre:</td>
            <td style="padding:8px 0">${escaparHtml(nombreTxt)}</td>
          </tr>
          ${empresaTxt ? `<tr><td style="padding:8px 0;font-weight:bold">Empresa:</td><td style="padding:8px 0">${escaparHtml(empresaTxt)}</td></tr>` : ""}
          <tr>
            <td style="padding:8px 0;font-weight:bold">Email:</td>
            <td style="padding:8px 0"><a href="mailto:${escaparHtml(emailTxt)}">${escaparHtml(emailTxt)}</a></td>
          </tr>
          ${telefonoTxt ? `<tr><td style="padding:8px 0;font-weight:bold">Teléfono:</td><td style="padding:8px 0">${escaparHtml(telefonoTxt)}</td></tr>` : ""}
          <tr>
            <td style="padding:8px 0;font-weight:bold">Servicio:</td>
            <td style="padding:8px 0">${escaparHtml(servicioTexto)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-weight:bold;vertical-align:top">Mensaje:</td>
            <td style="padding:8px 0;white-space:pre-wrap">${escaparHtml(mensajeTxt)}</td>
          </tr>
          ${filaConsentimiento(consentimiento)}
        </table>
      </div>
    `;

    const asunto = `Contacto web – ${servicioTexto} – ${nombreTxt}${empresaTxt ? ` (${empresaTxt})` : ""}`;

    await enviarCorreo({
      to: DESTINO,
      cc: "rtapia@grupocolchagua.cl",
      subject: asunto,
      html,
    });

    const htmlConfirmacion = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1d1820">
        <h2 style="color:#5b1746;border-bottom:2px solid #5b1746;padding-bottom:8px">
          Hemos recibido tu mensaje
        </h2>
        <p>Hola ${escaparHtml(nombreTxt)},</p>
        <p>Gracias por contactarte con Grupo Colchagua. Hemos recibido tu mensaje y nos pondremos en contacto contigo a la brevedad.</p>
        <p><strong>Servicio consultado:</strong> ${escaparHtml(servicioTexto)}</p>
        <p style="color:#888;font-size:13px;margin-top:24px">Este es un correo automático, por favor no respondas a este mensaje.</p>
      </div>
    `;

    await enviarCorreo({
      to: emailTxt,
      subject: "Hemos recibido tu mensaje – Grupo Colchagua",
      html: htmlConfirmacion,
    });

    res.status(200).json({ ok: true, message: "Mensaje enviado correctamente." });
  } catch (error) {
    next(error);
  }
};

export const recibirCotizacion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { companyName, rut, email, message } = req.body || {};

    if (!companyName || !email) {
      res.status(400).json({ ok: false, message: "Nombre empresa y email son obligatorios." });
      return;
    }

    if (!emailRegex.test(email)) {
      res.status(400).json({ ok: false, message: "El email no es válido." });
      return;
    }

    const consentimiento = leerConsentimiento(req);

    if (!consentimiento) {
      res.status(400).json({ ok: false, message: MENSAJE_SIN_CONSENTIMIENTO });
      return;
    }

    const empresaTxt = String(companyName).trim();
    const rutTxt = rut ? String(rut).trim() : "";
    const emailTxt = String(email).trim();
    const mensajeTxt = message ? String(message).trim() : "";

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1d1820">
        <h2 style="color:#5b1746;border-bottom:2px solid #5b1746;padding-bottom:8px">
          Nueva solicitud de cotización – Grupo Colchagua
        </h2>
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:8px 0;font-weight:bold;width:160px">Empresa:</td>
            <td style="padding:8px 0">${escaparHtml(empresaTxt)}</td>
          </tr>
          ${rutTxt ? `<tr><td style="padding:8px 0;font-weight:bold">RUT:</td><td style="padding:8px 0">${escaparHtml(rutTxt)}</td></tr>` : ""}
          <tr>
            <td style="padding:8px 0;font-weight:bold">Email:</td>
            <td style="padding:8px 0"><a href="mailto:${escaparHtml(emailTxt)}">${escaparHtml(emailTxt)}</a></td>
          </tr>
          ${mensajeTxt ? `<tr><td style="padding:8px 0;font-weight:bold;vertical-align:top">Mensaje:</td><td style="padding:8px 0;white-space:pre-wrap">${escaparHtml(mensajeTxt)}</td></tr>` : ""}
          ${filaConsentimiento(consentimiento)}
        </table>
      </div>
    `;

    await enviarCorreo({
      to: DESTINO,
      subject: `Cotización web – ${empresaTxt}`,
      html,
    });

    res.status(200).json({ ok: true, message: "Cotización enviada correctamente." });
  } catch (error) {
    next(error);
  }
};
