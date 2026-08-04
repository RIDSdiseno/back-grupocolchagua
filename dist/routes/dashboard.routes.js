"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/dashboard.routes.ts
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get("/reclutamiento", auth_middleware_1.verificarToken, dashboard_controller_1.obtenerDashboardReclutamiento);
router.get("/comercial", auth_middleware_1.verificarToken, dashboard_controller_1.obtenerDashboardComercial);
exports.default = router;
