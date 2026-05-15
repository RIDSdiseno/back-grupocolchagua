import { Router } from "express";
import {
  crearCampana,
  listarCampanas,
  enviarCampana,
  eliminarCampana,
} from "../controllers/mailing.controller";

const router = Router();

router.get("/", listarCampanas);
router.post("/", crearCampana);
router.post("/:id/enviar", enviarCampana);
router.delete("/:id", eliminarCampana);

export default router;