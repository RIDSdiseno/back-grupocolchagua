import { Router } from "express";
import {
  listarAsignaciones,
  crearAsignacion,
  actualizarAsignacion,
  eliminarAsignacion,
} from "../controllers/asignacion.controller";
import { verificarToken } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", verificarToken, listarAsignaciones);
router.post("/", verificarToken, crearAsignacion);
router.put("/:id", verificarToken, actualizarAsignacion);
router.delete("/:id", verificarToken, eliminarAsignacion);

export default router;
