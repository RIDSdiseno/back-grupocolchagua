import { Router } from "express";
import {
  actualizarTarifa,
  crearTarifaEmpresa,
  eliminarTarifa,
  listarTarifasPorEmpresa,
} from "../controllers/tarifa.controller";
import { verificarToken } from "../middlewares/auth.middleware";

const router = Router();

router.get("/empresa/:empresaId", verificarToken, listarTarifasPorEmpresa);
router.post("/empresa/:empresaId", verificarToken, crearTarifaEmpresa);
router.put("/:id", verificarToken, actualizarTarifa);
router.delete("/:id", verificarToken, eliminarTarifa);

export default router;