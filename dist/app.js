"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const empresa_routes_1 = __importDefault(require("./routes/empresa.routes"));
const cargo_routes_1 = __importDefault(require("./routes/cargo.routes"));
const tarifa_routes_1 = __importDefault(require("./routes/tarifa.routes"));
const sucursal_routes_1 = __importDefault(require("./routes/sucursal.routes"));
const trabajador_routes_1 = __importDefault(require("./routes/trabajador.routes"));
const asignacion_routes_1 = __importDefault(require("./routes/asignacion.routes"));
const asistencia_routes_1 = __importDefault(require("./routes/asistencia.routes"));
const Holding_routes_1 = __importDefault(require("./routes/Holding.routes"));
const Usuario_routes_1 = __importDefault(require("./routes/Usuario.routes"));
const mailing_routes_1 = __importDefault(require("./routes/mailing.routes"));
const incidencias_routes_1 = __importDefault(require("./routes/incidencias.routes"));
const preliquidaciones_routes_1 = __importDefault(require("./routes/preliquidaciones.routes"));
const postulacion_routes_1 = __importDefault(require("./routes/postulacion.routes"));
const app = (0, express_1.default)();
const allowedOrigins = [
    "https://grupocolchaguarrhh.netlify.app",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
];
const corsOptions = {
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
app.options("/{*path}", (0, cors_1.default)(corsOptions));
// ✅ CORS para todas las rutas
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: "60mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "60mb" }));
// Rutas base
app.get("/", (_req, res) => {
    res.json({ message: "API Grupo Colchagua funcionando" });
});
app.get("/health", (_req, res) => {
    res.status(200).send("ok");
});
// Rutas API
app.use("/api/auth", auth_routes_1.default);
app.use("/api/empresas", empresa_routes_1.default);
app.use("/api/cargos", cargo_routes_1.default);
app.use("/api/tarifas", tarifa_routes_1.default);
app.use("/api/sucursales", sucursal_routes_1.default);
app.use("/api/trabajadores", trabajador_routes_1.default);
app.use("/api/asignaciones", asignacion_routes_1.default);
app.use("/api/asistencia", asistencia_routes_1.default);
app.use("/api/holdings", Holding_routes_1.default);
app.use("/api/usuarios", Usuario_routes_1.default);
app.use("/api/mailing", mailing_routes_1.default);
app.use("/api/incidencias", incidencias_routes_1.default);
app.use("/api/preliquidaciones", preliquidaciones_routes_1.default);
app.use("/api/postulaciones", postulacion_routes_1.default);
// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        ok: false,
        error: "Not Found",
    });
});
exports.default = app;
