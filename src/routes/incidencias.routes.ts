import { Router } from "express";
import {
  listarIncidencias,
  crearIncidencia,
  actualizarIncidencia,
  eliminarIncidencia,
  resumenIncidencias,
} from "../controllers/incidencias.controller";

const router = Router();

router.get("/", listarIncidencias);
router.get("/resumen", resumenIncidencias);
router.post("/", crearIncidencia);
router.put("/:id", actualizarIncidencia);
router.delete("/:id", eliminarIncidencia);

export default router;