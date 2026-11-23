import { Router } from "express";
import {
  actualizarEstadoPostulacion,
  crearPostulacion,
  listarPostulaciones,
  obtenerPostulacion,
  obtenerUrlCv,
} from "../controllers/postulacion.controller";
import { verificarToken } from "../middlewares/auth.middleware";
import { uploadPostulacion } from "../middlewares/postulacion-upload.middleware";

const router = Router();

router.get("/", verificarToken, listarPostulaciones);
router.get("/:id", verificarToken, obtenerPostulacion);
router.get("/:id/cv", verificarToken, obtenerUrlCv);
router.post("/", uploadPostulacion.single("cv"), crearPostulacion);
router.patch("/:id/estado", verificarToken, actualizarEstadoPostulacion);

export default router;