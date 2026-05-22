import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes";
import empresaRoutes from "./routes/empresa.routes";
import cargoRoutes from "./routes/cargo.routes";
import tarifaRoutes from "./routes/tarifa.routes";
import sucursalRoutes from "./routes/sucursal.routes";
import trabajadorRoutes from "./routes/trabajador.routes";
import asignacionRoutes from "./routes/asignacion.routes";
import asistenciaRoutes from "./routes/asistencia.routes";
import holdingRoutes from "./routes/Holding.routes";
import usuarioRoutes from "./routes/Usuario.routes";
import mailingRoutes from "./routes/mailing.routes";
import incidenciasRoutes from "./routes/incidencias.routes";
import preliquidacionesRoutes from "./routes/preliquidaciones.routes";
import postulacionRoutes from "./routes/postulacion.routes";

const app = express();

const allowedOrigins = [
  "https://grupocolchaguarrhh.netlify.app",
  "https://grupcolchagua-frontend.netlify.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    console.log("[CORS] incoming origin =", origin);

    // Permitir requests sin origin (Postman, Railway health checks, server-to-server)
    if (!origin) {
      callback(null, true);
      return;
    }

    const cleanOrigin = origin.trim().replace(/\/+$/, "");

    if (allowedOrigins.includes(cleanOrigin)) {
      callback(null, true);
      return;
    }

    console.warn("[CORS] blocked origin =", cleanOrigin);
    callback(new Error(`Origen no permitido por CORS: ${cleanOrigin}`));
  },

  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Cache-Control",
    "Pragma",
    "Expires",
  ],
  exposedHeaders: ["Content-Length", "X-Request-Id"],
  optionsSuccessStatus: 204,
  preflightContinue: false,
};

// ✅ Manejo de preflight OPTIONS global — debe ir ANTES de cualquier ruta
app.options("/{*path}", cors(corsOptions));

// ✅ CORS para todas las rutas
app.use(cors(corsOptions));

app.use(express.json({ limit: "60mb" }));
app.use(express.urlencoded({ extended: true, limit: "60mb" }));

// Rutas base
app.get("/", (_req, res) => {
  res.json({ message: "API Grupo Colchagua funcionando" });
});

app.get("/health", (_req, res) => {
  res.status(200).send("ok");
});

// Rutas API
app.use("/api/auth", authRoutes);
app.use("/api/empresas", empresaRoutes);
app.use("/api/cargos", cargoRoutes);
app.use("/api/tarifas", tarifaRoutes);
app.use("/api/sucursales", sucursalRoutes);
app.use("/api/trabajadores", trabajadorRoutes);
app.use("/api/asignaciones", asignacionRoutes);
app.use("/api/asistencia", asistenciaRoutes);
app.use("/api/holdings", holdingRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/mailing", mailingRoutes);
app.use("/api/incidencias", incidenciasRoutes);
app.use("/api/preliquidaciones", preliquidacionesRoutes);
app.use("/api/postulaciones", postulacionRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    ok: false,
    error: "Not Found",
  });
});

export default app;