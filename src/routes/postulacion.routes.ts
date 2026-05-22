import { Router } from "express";
import {
  actualizarEstadoPostulacion,
  crearPostulacion,
  listarPostulaciones,
  obtenerPostulacion,
} from "../controllers/postulacion.controller";
import { uploadPostulacion } from "../middlewares/postulacion-upload.middleware";

const router = Router();

router.get("/", listarPostulaciones);
router.get("/:id", obtenerPostulacion);
router.post("/", uploadPostulacion.single("cv"), crearPostulacion);
router.patch("/:id/estado", actualizarEstadoPostulacion);

export default router;