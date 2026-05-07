import { Router } from "express";
import {
  listarHoldings,
  obtenerHolding,
  crearHolding,
  actualizarHolding,
  eliminarHolding,
} from "../controllers/Holding.controller";
import { verificarToken } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", verificarToken, listarHoldings);
router.get("/:id", verificarToken, obtenerHolding);
router.post("/", verificarToken, crearHolding);
router.put("/:id", verificarToken, actualizarHolding);
router.delete("/:id", verificarToken, eliminarHolding);

export default router;