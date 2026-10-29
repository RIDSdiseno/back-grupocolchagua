import { Request, Response, NextFunction } from "express";
import { enviarCorreo } from "../services/mail.service";

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ ok: false, message: "El email no es válido." });
      return;
    }

    const servicioTexto =
      servicio && SERVICIOS_VALIDOS.includes(servicio) ? servicio : "No especificado";

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1d1820">
        <h2 style="color:#5b1746;border-bottom:2px solid #5b1746;padding-bottom:8px">
          Nuevo mensaje de contacto – Grupo Colchagua
        </h2>
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:8px 0;font-weight:bold;width:160px">Nombre:</td>
            <td style="padding:8px 0">${String(nombre).trim()}</td>
          </tr>
          ${empresa ? `<tr><td style="padding:8px 0;font-weight:bold">Empresa:</td><td style="padding:8px 0">${String(empresa).trim()}</td></tr>` : ""}
          <tr>
            <td style="padding:8px 0;font-weight:bold">Email:</td>
            <td style="padding:8px 0"><a href="mailto:${String(email).trim()}">${String(email).trim()}</a></td>
          </tr>
          ${telefono ? `<tr><td style="padding:8px 0;font-weight:bold">Teléfono:</td><td style="padding:8px 0">${String(telefono).trim()}</td></tr>` : ""}
          <tr>
            <td style="padding:8px 0;font-weight:bold">Servicio:</td>
            <td style="padding:8px 0">${servicioTexto}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-weight:bold;vertical-align:top">Mensaje:</td>
            <td style="padding:8px 0;white-space:pre-wrap">${String(mensaje).trim()}</td>
          </tr>
        </table>
      </div>
    `;

    const asunto = `Contacto web – ${servicioTexto} – ${String(nombre).trim()}${empresa ? ` (${String(empresa).trim()})` : ""}`;

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
        <p>Hola ${String(nombre).trim()},</p>
        <p>Gracias por contactarte con Grupo Colchagua. Hemos recibido tu mensaje y nos pondremos en contacto contigo a la brevedad.</p>
        <p><strong>Servicio consultado:</strong> ${servicioTexto}</p>
        <p style="color:#888;font-size:13px;margin-top:24px">Este es un correo automático, por favor no respondas a este mensaje.</p>
      </div>
    `;

    await enviarCorreo({
      to: String(email).trim(),
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ ok: false, message: "El email no es válido." });
      return;
    }

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1d1820">
        <h2 style="color:#5b1746;border-bottom:2px solid #5b1746;padding-bottom:8px">
          Nueva solicitud de cotización – Grupo Colchagua
        </h2>
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:8px 0;font-weight:bold;width:160px">Empresa:</td>
            <td style="padding:8px 0">${String(companyName).trim()}</td>
          </tr>
          ${rut ? `<tr><td style="padding:8px 0;font-weight:bold">RUT:</td><td style="padding:8px 0">${String(rut).trim()}</td></tr>` : ""}
          <tr>
            <td style="padding:8px 0;font-weight:bold">Email:</td>
            <td style="padding:8px 0"><a href="mailto:${String(email).trim()}">${String(email).trim()}</a></td>
          </tr>
          ${message ? `<tr><td style="padding:8px 0;font-weight:bold;vertical-align:top">Mensaje:</td><td style="padding:8px 0;white-space:pre-wrap">${String(message).trim()}</td></tr>` : ""}
        </table>
      </div>
    `;

    await enviarCorreo({
      to: DESTINO,
      subject: `Cotización web – ${String(companyName).trim()}`,
      html,
    });

    res.status(200).json({ ok: true, message: "Cotización enviada correctamente." });
  } catch (error) {
    next(error);
  }
};
