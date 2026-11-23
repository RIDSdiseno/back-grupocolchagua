import cron from "node-cron";
import { prisma } from "../lib/prisma";
import cloudinary from "../config/cloudinary";

// Plazo de conservación de postulaciones (Ley 21.719). La Política de
// Privacidad del sitio informa este plazo: si cambia uno, cambiar el otro.
//
// ESTADO: DESACTIVADO. Este archivo no hace nada mientras la llamada a
// iniciarRetencionPostulaciones() siga comentada en src/server.ts.
//
// Cómo activarlo, en este orden:
//   1. Respaldar la base de datos (el borrado es irreversible).
//   2. Descomentar la llamada en src/server.ts y desplegar. Por defecto corre
//      en MODO SIMULACIÓN: solo cuenta y muestra en el log cuántas
//      postulaciones vencidas hay, sin borrar ni modificar nada.
//   3. Revisar el log. Si el número es el esperado, agregar en Railway la
//      variable RETENCION_POSTULACIONES_SIMULACION=false y reiniciar.
//
// Qué hace con cada postulación vencida (cuando ya no es simulación):
//   - Borra el currículum en Cloudinary.
//   - Anonimiza la fila en la tabla Postulacion (no la borra, no cambia la
//     estructura): quita nombre, RUT, email, teléfono y demás datos
//     personales, y conserva cargo, fecha, estado y empleo para estadísticas.
//
// Variables opcionales:
//   RETENCION_POSTULACIONES_MESES       plazo en meses (por defecto 12)
//   RETENCION_POSTULACIONES_SIMULACION  "false" para aplicar de verdad

const MESES_RETENCION = Number(process.env.RETENCION_POSTULACIONES_MESES) || 12;
const ES_SIMULACION = process.env.RETENCION_POSTULACIONES_SIMULACION !== "false";

// Todos los días a las 03:00, hora de Chile.
const HORARIO = "0 3 * * *";
const ZONA_HORARIA = "America/Santiago";

// Se procesa por lotes para no cargar miles de filas de una vez.
const TAMANO_LOTE = 100;
const MAX_LOTES_POR_EJECUCION = 50;

// Marca de las filas ya anonimizadas, para no volver a procesarlas.
const ANONIMIZADO = "Anonimizado";

const fechaLimite = (): Date => {
  const limite = new Date();
  limite.setMonth(limite.getMonth() - MESES_RETENCION);
  return limite;
};

// Los CV antiguos se subieron públicos ("upload"); los nuevos, privados
// ("authenticated"). Cloudinary necesita saber cuál es para borrarlo.
const tipoEntregaCv = (cvUrl: string): "upload" | "authenticated" =>
  cvUrl.includes("/raw/authenticated/") ? "authenticated" : "upload";

// true si el CV quedó borrado (o ya no existía).
const borrarCv = async (cvPublicId: string, cvUrl: string): Promise<boolean> => {
  const resultado = await cloudinary.uploader.destroy(cvPublicId, {
    resource_type: "raw",
    type: tipoEntregaCv(cvUrl),
    invalidate: true,
  });

  return resultado?.result === "ok" || resultado?.result === "not found";
};

export const aplicarRetencionPostulaciones = async () => {
  const limite = fechaLimite();
  const filtroVencidas = {
    createdAt: { lt: limite },
    NOT: { nombre: ANONIMIZADO },
  };

  if (ES_SIMULACION) {
    const total = await prisma.postulacion.count({ where: filtroVencidas });
    console.log(
      `[Retención] SIMULACIÓN: ${total} postulaciones anteriores al ${limite.toISOString().slice(0, 10)} ` +
        `serían anonimizadas y su CV borrado. No se modificó nada.`
    );
    return;
  }

  let anonimizadas = 0;
  let conError = 0;

  for (let lote = 0; lote < MAX_LOTES_POR_EJECUCION; lote++) {
    const vencidas = await prisma.postulacion.findMany({
      where: filtroVencidas,
      select: { id: true, cvUrl: true, cvPublicId: true },
      orderBy: { createdAt: "asc" },
      take: TAMANO_LOTE,
      // Las que fallaron en este mismo ciclo se saltan para no repetirlas.
      skip: conError,
    });

    if (vencidas.length === 0) break;

    for (const postulacion of vencidas) {
      try {
        // Primero el CV: si no se pudo borrar, la fila no se toca y se
        // reintenta al día siguiente.
        if (postulacion.cvPublicId) {
          const borrado = await borrarCv(postulacion.cvPublicId, postulacion.cvUrl);

          if (!borrado) {
            conError++;
            console.error(`[Retención] No se pudo borrar el CV de la postulación ${postulacion.id}`);
            continue;
          }
        }

        await prisma.postulacion.update({
          where: { id: postulacion.id },
          data: {
            nombre: ANONIMIZADO,
            apellido: ANONIMIZADO,
            rut: null,
            // email y telefono no aceptan nulos en el esquema.
            email: `anonimizado-${postulacion.id}@invalid.local`,
            telefono: "0",
            comuna: null,
            region: null,
            experiencia: null,
            disponibilidad: null,
            mensaje: null,
            cvUrl: "",
            cvPublicId: null,
          },
        });

        anonimizadas++;
      } catch (error) {
        conError++;
        console.error(`[Retención] Error con la postulación ${postulacion.id}:`, error);
      }
    }
  }

  console.log(
    `[Retención] ${anonimizadas} postulaciones anonimizadas, ${conError} con error ` +
      `(se reintentan mañana). Plazo: ${MESES_RETENCION} meses.`
  );
};

export const iniciarRetencionPostulaciones = () => {
  console.log(
    `[Retención] Programada a diario (${HORARIO}, ${ZONA_HORARIA}). ` +
      `Plazo: ${MESES_RETENCION} meses. Modo: ${ES_SIMULACION ? "SIMULACIÓN" : "APLICANDO"}.`
  );

  cron.schedule(
    HORARIO,
    async () => {
      try {
        await aplicarRetencionPostulaciones();
      } catch (error) {
        console.error("[Retención] Error general:", error);
      }
    },
    { timezone: ZONA_HORARIA }
  );
};
