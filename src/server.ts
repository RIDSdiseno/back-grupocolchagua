import app from "./app";

// El envío programado de campañas de mailing está apagado mientras la intranet
// esté dada de baja (nadie puede revisar ni cancelar campañas). Para
// reactivarlo: import { iniciarMailingScheduler } from "./jobs/mailingScheduler";
// e iniciarMailingScheduler();

// Plazo de conservación de postulaciones (Ley 21.719): DESACTIVADO.
// Mientras estas dos líneas sigan comentadas no se toca la base de datos.
// Antes de activarlo, leer las instrucciones en src/jobs/retencionPostulaciones.ts.
// import { iniciarRetencionPostulaciones } from "./jobs/retencionPostulaciones";
// iniciarRetencionPostulaciones();

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
});

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});