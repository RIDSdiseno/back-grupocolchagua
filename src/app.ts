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

const app = express();

// 🔥 IMPORTANTE: permite múltiples orígenes (local + producción)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://grupocolchaguarrhh.netlify.app",
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // permitir requests sin origin (Postman, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("No permitido por CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// ✅ CORS antes de todo
app.use(cors(corsOptions));

// 🔥 CLAVE: manejar preflight explícitamente
app.options("*", cors(corsOptions));

app.use(express.json());

// test endpoint
app.get("/", (_req, res) => {
  res.json({ message: "API Grupo Colchagua funcionando" });
});

// rutas
app.use("/api/auth", authRoutes);
app.use("/api/empresas", empresaRoutes);
app.use("/api/cargos", cargoRoutes);
app.use("/api/tarifas", tarifaRoutes);
app.use("/api/sucursales", sucursalRoutes);
app.use("/api/trabajadores", trabajadorRoutes);
app.use("/api/asignaciones", asignacionRoutes);
app.use("/api/asistencia", asistenciaRoutes);

export default app;