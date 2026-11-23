import { Router } from "express";
import {
  listarPreLiquidaciones,
  generarPreLiquidaciones,
  obtenerPreLiquidacion,
  actualizarPreLiquidacion,
  aprobarPreLiquidacion,
  eliminarPreLiquidacion,
} from "../controllers/preliquidaciones.controller";

import { verificarToken } from "../middlewares/auth.middleware";

const router = Router();

// Todas las rutas requieren sesión de administrador.
router.use(verificarToken);

router.get("/", listarPreLiquidaciones);
router.get("/:id", obtenerPreLiquidacion);
router.post("/generar", generarPreLiquidaciones);
router.put("/:id", actualizarPreLiquidacion);
router.patch("/:id/aprobar", aprobarPreLiquidacion);
router.delete("/:id", eliminarPreLiquidacion);

export default router;