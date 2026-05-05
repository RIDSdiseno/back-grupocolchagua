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

const allowedOrigins = [
  "https://grupocolchaguarrhh.netlify.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "API Grupo Colchagua funcionando" });
});

app.use("/api/auth", authRoutes);
app.use("/api/empresas", empresaRoutes);
app.use("/api/cargos", cargoRoutes);
app.use("/api/tarifas", tarifaRoutes);
app.use("/api/sucursales", sucursalRoutes);
app.use("/api/trabajadores", trabajadorRoutes);
app.use("/api/asignaciones", asignacionRoutes);
app.use("/api/asistencia", asistenciaRoutes);

export default app;