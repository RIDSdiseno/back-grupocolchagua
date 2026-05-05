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
const corsOptions = {
    origin: "https://grupocolchaguarrhh.netlify.app",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.get("/", (_req, res) => {
    res.json({ message: "API Grupo Colchagua funcionando" });
});
app.use("/api/auth", auth_routes_1.default);
app.use("/api/empresas", empresa_routes_1.default);
app.use("/api/cargos", cargo_routes_1.default);
app.use("/api/tarifas", tarifa_routes_1.default);
app.use("/api/sucursales", sucursal_routes_1.default);
app.use("/api/trabajadores", trabajador_routes_1.default);
app.use("/api/asignaciones", asignacion_routes_1.default);
app.use("/api/asistencia", asistencia_routes_1.default);
exports.default = app;
