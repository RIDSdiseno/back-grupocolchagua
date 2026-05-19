import { Router } from "express";
import {
  listarPreLiquidaciones,
  generarPreLiquidaciones,
  obtenerPreLiquidacion,
  actualizarPreLiquidacion,
  aprobarPreLiquidacion,
  eliminarPreLiquidacion,
} from "../controllers/preliquidaciones.controller";

const router = Router();

router.get("/", listarPreLiquidaciones);
router.get("/:id", obtenerPreLiquidacion);
router.post("/generar", generarPreLiquidaciones);
router.put("/:id", actualizarPreLiquidacion);
router.patch("/:id/aprobar", aprobarPreLiquidacion);
router.delete("/:id", eliminarPreLiquidacion);

export default router;