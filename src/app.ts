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

const corsOptions = {
  origin: "https://grupocolchaguarrhh.netlify.app",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.options("/(.*)", cors(corsOptions));
app.use(cors(corsOptions));
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