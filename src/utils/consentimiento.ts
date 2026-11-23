import type { Request } from "express";

// Evidencia del consentimiento que el titular dio en un formulario público
// (Ley 21.719). No se guarda en la base de datos: queda en los metadatos del CV
// en Cloudinary (postulaciones) y en el correo interno (contacto y cotización).
export type EvidenciaConsentimiento = {
  versionPolitica: string;
  fecha: string;
  ip: string;
};

const VERSION_POR_DEFECTO =
  process.env.POLITICA_PRIVACIDAD_VERSION || "sin-version";

const obtenerIp = (req: Request): string => {
  const reenviada = req.headers["x-forwarded-for"];
  const primera = Array.isArray(reenviada) ? reenviada[0] : reenviada;
  return (primera?.split(",")[0] || req.ip || "desconocida").trim();
};

// Devuelve la evidencia si el formulario trae consentimiento=true; si no, null.
export const leerConsentimiento = (
  req: Request
): EvidenciaConsentimiento | null => {
  const { consentimiento, versionPolitica } = req.body || {};

  if (consentimiento !== true && consentimiento !== "true") return null;

  const version = String(versionPolitica ?? "")
    .trim()
    .replace(/[^\w.-]/g, "")
    .slice(0, 40);

  return {
    versionPolitica: version || VERSION_POR_DEFECTO,
    fecha: new Date().toISOString(),
    ip: obtenerIp(req),
  };
};

export const MENSAJE_SIN_CONSENTIMIENTO =
  "Debes aceptar la Política de Privacidad para enviar el formulario.";
