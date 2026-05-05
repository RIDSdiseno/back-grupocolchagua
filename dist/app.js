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
        if (!origin) {
            return callback(null, true);
        }
        const cleanOrigin = origin.trim().replace(/\/+$/, "");
        if (allowedOrigins.includes(cleanOrigin)) {
            return callback(null, true);
        }
        console.warn("[CORS] blocked origin =", origin);
        return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Cache-Control",
        "Pragma",
        "Expires",
    ],
    optionsSuccessStatus: 204,
};
app.use((0, cors_1.default)(corsOptions));
app.options(/.*/, (0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: "60mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "60mb" }));
app.get("/", (_req, res) => {
    res.json({ message: "API Grupo Colchagua funcionando" });
});
app.get("/health", (_req, res) => {
    res.status(200).send("ok");
});
app.use("/api/auth", auth_routes_1.default);
app.use("/api/empresas", empresa_routes_1.default);
app.use("/api/cargos", cargo_routes_1.default);
app.use("/api/tarifas", tarifa_routes_1.default);
app.use("/api/sucursales", sucursal_routes_1.default);
app.use("/api/trabajadores", trabajador_routes_1.default);
app.use("/api/asignaciones", asignacion_routes_1.default);
app.use("/api/asistencia", asistencia_routes_1.default);
app.use((_req, res) => {
    res.status(404).json({
        ok: false,
        error: "Not Found",
    });
});
exports.default = app;
