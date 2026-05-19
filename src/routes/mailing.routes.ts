import { Router } from "express";
import {
  crearCampana,
  listarCampanas,
  enviarCampana,
  eliminarCampana,
} from "../controllers/mailing.controller";
import { uploadMailing } from "../middlewares/upload.middleware";

const router = Router();

router.get("/", listarCampanas);

router.post(
  "/",
  uploadMailing.array("archivos", 10),
  crearCampana
);

router.post("/:id/enviar", enviarCampana);

router.delete("/:id", eliminarCampana);

export default router;