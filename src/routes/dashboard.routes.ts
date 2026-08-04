// src/routes/dashboard.routes.ts
import { Router } from "express";
import { obtenerDashboardComercial, obtenerDashboardReclutamiento } from "../controllers/dashboard.controller";
import { verificarToken } from "../middlewares/auth.middleware";

const router = Router();

router.get("/reclutamiento", verificarToken, obtenerDashboardReclutamiento);
router.get("/comercial", verificarToken, obtenerDashboardComercial);

export default router;
