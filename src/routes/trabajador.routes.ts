import { Router } from "express";
import {
  listarTrabajadores,
  obtenerTrabajador,
  crearTrabajador,
  actualizarTrabajador,
  eliminarTrabajador,
} from "../controllers/trabajador.controller";
import { verificarToken } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", verificarToken, listarTrabajadores);
router.get("/:id", verificarToken, obtenerTrabajador);
router.post("/", verificarToken, crearTrabajador);
router.put("/:id", verificarToken, actualizarTrabajador);
router.delete("/:id", verificarToken, eliminarTrabajador);

export default router;
