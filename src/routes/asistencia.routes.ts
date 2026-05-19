import { Router } from "express";
import {
  listarAsistencia,
  registrarAsistencia,
  actualizarAsistencia,
  eliminarAsistencia,
  resumenAsistencia,
  registrarAsistenciaMasiva
} from "../controllers/asistencia.controller";
import { verificarToken } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", verificarToken, listarAsistencia);
router.get("/resumen", verificarToken, resumenAsistencia);
router.post("/", verificarToken, registrarAsistencia);
router.post("/bulk", registrarAsistenciaMasiva);
router.put("/:id", verificarToken, actualizarAsistencia);
router.delete("/:id", verificarToken, eliminarAsistencia);

export default router;
